import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createDecisionLab } from '@decision-lab/sdk';
import { createNodeExecutor } from '@decision-lab/sdk/node';
import {
  buildCase, cents, formatMinutes, formatPosition, readTimingPolicy, summarizeRun, toDraft,
} from '../src/gifting.js';

const data = new URL('../public/data/', import.meta.url);
const config = JSON.parse(await readFile(new URL('config.json', data)));
const appPackage = JSON.parse(await readFile(new URL(config.appUrl, data)));
const cases = await Promise.all(config.cases.map(async entry => (
  JSON.parse(await readFile(new URL(entry.url, data)))
)));

test('forms round trip complete cases and preserve separate record scopes', () => {
  for (const inputs of cases) {
    assert.deepEqual(buildCase(inputs, toDraft(inputs, config), config), inputs);
  }
  const source = structuredClone(cases[1]);
  const draft = toDraft(source, config);
  draft.quotes[0].totalCost = '19.95';
  const prepared = buildCase(source, draft, config);
  assert.equal(prepared.tables.packages[0].repairCostMinor, 1995);
  assert.equal(prepared.parameters.insertRevision, 'insert-4');
  assert.equal(prepared.tables.confirmations[0].insertRevision, 'insert-3');
  for (const table of ['permissions', 'scenarios', 'people', 'resources', 'calendars', 'bookings']) {
    assert.deepEqual(prepared.tables[table], source.tables[table]);
  }
  for (const [index, row] of prepared.tables.packages.entries()) {
    for (const flag of ['fixes0', 'fixes1', 'fixes2']) {
      assert.equal(row[flag], source.tables.packages[index][flag]);
    }
  }
  assert.deepEqual(source, cases[1], 'mapping never mutates the imported case');
});

test('missing or negative bookings never become positive evidence', () => {
  const source = structuredClone(cases[0]);
  source.tables.confirmations = [];
  const draft = toDraft(source, config);
  assert.equal(draft.confirmation.status, 'none');
  assert.equal(draft.confirmation.insertRevision, '');
  assert.equal(draft.confirmation.recordedBy, '');
  assert.deepEqual(buildCase(source, draft, config).tables.confirmations, []);
  draft.confirmation.status = 'positive';
  assert.throws(() => buildCase(source, draft, config), error => (
    error.issues.some(issue => issue.path === 'confirmation.source')
  ));

  const negative = structuredClone(cases[0]);
  negative.tables.confirmations[0].confirmed = false;
  const negativeDraft = toDraft(negative, config);
  assert.equal(negativeDraft.confirmation.status, 'negative');
  assert.deepEqual(buildCase(negative, negativeDraft, config), negative);
});

test('money and elapsed minutes have explicit units and reject coercion', () => {
  assert.equal(cents('0.01'), 1);
  assert.equal(cents('400'), 40000);
  assert.equal(formatMinutes(20), '20 min');
  assert.equal(formatMinutes(1440), '24 hr');
  assert.equal(formatMinutes(1385), '23 hr 5 min');
  assert.equal(formatMinutes(-80), '-1 hr 20 min');
  assert.equal(formatPosition(1440), 'T+24 hr');
  assert.equal(formatPosition(-5), 'T-5 min');
  assert.equal(formatMinutes(null), 'Not established');
  for (const value of ['', '-1', '0.001', '4,000', ' 100', '1e3']) {
    assert.throws(() => cents(value));
  }
  for (const [field, value] of [['repairMinutes', '1.5'], ['quantity', '']]) {
    const draft = toDraft(cases[0], config);
    draft.quotes[0][field] = value;
    assert.throws(() => buildCase(cases[0], draft, config), error => error.issues.length > 0);
  }
  const draft = toDraft(cases[0], config);
  draft.quotes[0].currency = 'EUR';
  assert.throws(() => buildCase(cases[0], draft, config), error => (
    error.issues.some(issue => /USD/.test(issue.message))
  ));
  draft.quotes[0].currency = 'USD';
  draft.quotes.push({ ...draft.quotes[0] });
  assert.throws(() => buildCase(cases[0], draft, config), error => (
    error.issues.some(issue => issue.path === 'quotes')
  ));
});

test('the rehearsal minimum comes from the published rule, with no inferred fallback', () => {
  assert.deepEqual(readTimingPolicy(appPackage), { minimumRehearsalMinutes: 5 });
  const changed = structuredClone(appPackage);
  const rule = changed.app.model.module.constraints.find(row => row.id === 'minimum-rehearsal');
  rule.predicate.args[1].literal = 10;
  assert.deepEqual(readTimingPolicy(changed), { minimumRehearsalMinutes: 10 });
  rule.predicate.op = 'eq';
  assert.throws(() => readTimingPolicy(changed), { name: 'IncompatibleProfileError' });
  assert.throws(() => readTimingPolicy({}), /incompatible rehearsal policy/);
});

test('review setup edits do not renew availability, permission or confirmation records', () => {
  const source = structuredClone(cases[0]);
  source.tables.bookings = [{ id: 'OTHER-WORK', resource: 'production-team', start: 90, end: 100, amount: 1 }];
  const before = structuredClone(source);
  const draft = toDraft(source, config);
  draft.setup = {
    nowMinute: '1380', handoffDeadlineMinute: '1440',
    rehearsalMinutes: '10', handoffMinutes: '5', startOptions: '1380, 1400',
  };
  const prepared = buildCase(source, draft, config);
  assert.deepEqual(prepared.parameters.startOptions, [1380, 1400]);
  assert.equal(prepared.parameters.handoffDeadlineMinute, 1440);
  assert.equal(prepared.parameters.rehearsalMinutes, 10);
  for (const name of ['calendars', 'bookings', 'permissions', 'confirmations']) {
    assert.deepEqual(prepared.tables[name], source.tables[name]);
  }

  draft.availability.calendars[0].end = '1440';
  draft.availability.bookings[0].start = '1380';
  draft.availability.bookings[0].end = '1400';
  draft.availability.bookings[0].amount = '2';
  draft.availability.permissions[0].validThrough = '1440';
  const updated = buildCase(source, draft, config);
  assert.equal(updated.tables.calendars[0].end, 1440);
  assert.deepEqual(updated.tables.bookings[0], {
    id: 'OTHER-WORK', resource: 'production-team', start: 1380, end: 1400, amount: 2,
  });
  assert.deepEqual(updated.tables.permissions[0], { ...source.tables.permissions[0], validThrough: 1440 });
  assert.deepEqual(updated.tables.confirmations, source.tables.confirmations);
  assert.deepEqual(source, before, 'neither setup nor record edits mutate the imported case');

  draft.availability.permissions[0].insertRevision = 'silently-upgraded';
  assert.throws(() => buildCase(source, draft, config), error => (
    error.issues.some(issue => issue.path === 'availability.permissions.0')
  ));
  draft.availability.permissions[0].insertRevision = source.tables.permissions[0].insertRevision;
  draft.availability.bookings = [];
  assert.throws(() => buildCase(source, draft, config), error => (
    error.issues.some(issue => issue.path === 'availability.bookings')
  ));
});

test('candidate starts and editable intervals accept exact whole minutes only', () => {
  for (const value of ['', '0,', '0, 1.5', '0, 0', '-1', '1e3', '01', '9007199254740992']) {
    const draft = toDraft(cases[0], config);
    draft.setup.startOptions = value;
    assert.throws(() => buildCase(cases[0], draft, config), error => (
      error.issues.some(issue => issue.path === 'setup.startOptions')
    ));
  }
  for (const field of ['nowMinute', 'handoffDeadlineMinute', 'rehearsalMinutes', 'handoffMinutes']) {
    const draft = toDraft(cases[0], config);
    draft.setup[field] = '1.5';
    assert.throws(() => buildCase(cases[0], draft, config), error => (
      error.issues.some(issue => issue.path === `setup.${field}`)
    ));
  }
  const draft = toDraft(cases[0], config);
  draft.availability.calendars[0].end = '1440.5';
  assert.throws(() => buildCase(cases[0], draft, config), error => (
    error.issues.some(issue => issue.path === 'availability.calendars.0.end')
  ));
});

// These are actual SDK assessments in a Node worker, not a replacement engine.
// The browser worker must produce the same native conclusions for these inputs.
test('native SDK chooses the fastest authorized package across all eight scenarios', async () => {
  const executor = createNodeExecutor();
  const lab = createDecisionLab({ executor });
  const app = lab.apps.open(appPackage);
  try {
    const expected = {
      confirmed: ['external-replace-and-repair', 20],
      stale: ['replace-and-repair', 35],
      permissions: [null, null],
      'one-day-confirmed': ['external-replace-and-repair', 25],
      'one-day-stale': ['replace-and-repair', 40],
      'one-day-expired': [null, null],
      'one-day-late': ['external-replace-and-repair', 1405],
    };
    for (const [index, inputs] of cases.entries()) {
      const bound = lab.cases.create({ app, inputs });
      assert.equal(lab.cases.validate({ app, case: bound }).valid, true);
      const run = await lab.run({ app, case: bound, reportOptions: { scope: 'all', locale: 'en-US' } });
      const result = summarizeRun(run, config);
      assert.equal(result.available, true);
      const [packageId, finishMinute] = expected[config.cases[index].id];
      assert.deepEqual(result.preferredIds, packageId ? [packageId] : []);
      if (packageId) assert.equal(result.preferred[0].finishMinute, finishMinute);
      assert.equal(result.plans.length, 5);
      assert.equal(result.scenarioCount, 8);
      assert.deepEqual(run.input.inputs.tables.scenarios, inputs.tables.scenarios);
      if (index === 0) {
        assert.equal(result.preferred[0].expense, 40000);
        assert.equal(result.preferred[0].finishMinute, 20);
        assert.equal(result.preferred[0].deadlineSlackMinute, 40);
        assert.deepEqual(result.timing, {
          nowMinute: 0, handoffDeadlineMinute: 60, rehearsalMinutes: 5, handoffMinutes: 5, startOptions: [0],
        });
      }
      if (index === 1) {
        assert.equal(result.preferred[0].expense, 30000);
        assert.equal(result.preferred[0].finishMinute, 35);
        const external = result.plans.find(plan => plan.packageId === 'external-replace-and-repair');
        assert.ok(external.blockers.some(blocker => blocker.id === 'scoped-package-confirmation'));
      }
      if (index === 2) {
        assert.equal(result.status, 'blocked');
        assert.equal(result.finding, 'no_feasible_plan');
        assert.ok(result.plans.every(plan => !plan.feasible));
      }
    }

    // Recording a newer booking does not renew old package permissions.
    for (const index of [1, 2]) {
      const draft = toDraft(cases[index], config);
      draft.confirmation.id = `NEW-BOOKING-${cases[index].id}`;
      draft.confirmation.insertRevision = 'insert-4';
      const inputs = buildCase(cases[index], draft, config);
      const bound = lab.cases.create({ app, inputs });
      const run = await lab.run({ app, case: bound, reportOptions: { scope: 'all' } });
      const result = summarizeRun(run, config);
      assert.deepEqual(result.preferredIds, index === 1 ? ['external-replace-and-repair'] : []);
      assert.deepEqual(run.input.inputs.tables.permissions, cases[index].tables.permissions);
    }
  } finally {
    await executor.close();
  }
});

test('native timing distinguishes rehearsal duration, candidate starts and genuinely current records', async () => {
  const executor = createNodeExecutor();
  const lab = createDecisionLab({ executor });
  const app = lab.apps.open(appPackage);
  async function review(inputs) {
    const bound = lab.cases.create({ app, inputs });
    assert.equal(lab.cases.validate({ app, case: bound }).valid, true);
    const run = await lab.run({ app, case: bound, reportOptions: { scope: 'all' } });
    return summarizeRun(run, config);
  }
  try {
    const draft = toDraft(cases[0], config);
    draft.setup.handoffDeadlineMinute = '1440';
    const fiveMinutes = await review(buildCase(cases[0], draft, config));
    assert.deepEqual(fiveMinutes.preferredIds, ['external-replace-and-repair']);
    assert.equal(fiveMinutes.preferred[0].finishMinute, 20);
    assert.equal(fiveMinutes.preferred[0].deadlineSlackMinute, 1420);

    draft.setup.rehearsalMinutes = '10';
    const tenMinutes = await review(buildCase(cases[0], draft, config));
    assert.equal(tenMinutes.preferred[0].finishMinute, 25);
    assert.equal(tenMinutes.preferred[0].deadlineSlackMinute, 1415);
    assert.equal(tenMinutes.scenarioCount, 8);
    const stale = toDraft(cases[1], config);
    stale.setup.handoffDeadlineMinute = '1440';
    stale.setup.rehearsalMinutes = '10';
    const inHouse = await review(buildCase(cases[1], stale, config));
    assert.deepEqual(inHouse.preferredIds, ['replace-and-repair']);
    assert.equal(inHouse.preferred[0].finishMinute, 40);

    draft.setup.rehearsalMinutes = '4';
    const belowMinimum = await review(buildCase(cases[0], draft, config));
    assert.equal(belowMinimum.status, 'blocked');
    assert.ok(belowMinimum.plans.every(plan => plan.blockers.some(row => row.id === 'minimum-rehearsal')));

    draft.setup.rehearsalMinutes = '10';
    draft.setup.nowMinute = '1380';
    const startsInPast = await review(buildCase(cases[0], draft, config));
    assert.equal(startsInPast.status, 'blocked');
    assert.ok(startsInPast.plans.every(plan => plan.blockers.some(row => row.id === 'not-in-past')));

    draft.setup.startOptions = '1380';
    const expired = await review(buildCase(cases[0], draft, config));
    assert.equal(expired.status, 'blocked');
    const external = expired.plans.find(plan => plan.packageId === config.confirmationPackage);
    for (const id of ['resource-calendar', 'scoped-package-permission', 'scoped-package-confirmation']) {
      assert.ok(external.blockers.some(row => row.id === id), id);
    }

    // Deliberate edits to separately recorded intervals; a deadline edit never does this.
    draft.availability.calendars[0].end = '1440';
    for (const permission of draft.availability.permissions) permission.validThrough = '1440';
    const oldConfirmation = await review(buildCase(cases[0], draft, config));
    assert.deepEqual(oldConfirmation.preferredIds, ['replace-and-repair']);
    assert.equal(oldConfirmation.preferred[0].finishMinute, 1420);
    draft.confirmation.id = 'NEW-REVIEWED-BOOKING';
    draft.confirmation.recordedAt = '1380';
    draft.confirmation.validFrom = '1380';
    draft.confirmation.validThrough = '1440';
    const renewed = await review(buildCase(cases[0], draft, config));
    assert.deepEqual(renewed.preferredIds, ['external-replace-and-repair']);
    assert.equal(renewed.preferred[0].finishMinute, 1405);
    assert.equal(renewed.preferred[0].deadlineSlackMinute, 35);
  } finally {
    await executor.close();
  }
});

test('ties and additional start options survive projection; partial searches cannot recommend', async () => {
  const executor = createNodeExecutor();
  const lab = createDecisionLab({ executor });
  const app = lab.apps.open(appPackage);
  try {
    const inputs = structuredClone(cases[0]);
    inputs.parameters.startOptions = [0, 5];
    const internal = inputs.tables.packages.find(row => row.id === 'replace-and-repair');
    internal.repairMinutes = 10;
    internal.repairCostMinor = 40000;
    const bound = lab.cases.create({ app, inputs });
    const run = await lab.run({ app, case: bound, reportOptions: { scope: 'all' } });
    const result = summarizeRun(run, config);
    assert.equal(result.available, true);
    assert.equal(result.plans.length, 10, 'each start option remains a distinct candidate');
    assert.deepEqual(result.preferredIds, ['replace-and-repair', 'external-replace-and-repair']);
    assert.ok(result.preferred.every(plan => plan.startMinute === 0 && plan.finishMinute === 20));

    const limited = await lab.run({
      app, case: bound, assessmentOptions: { maxPlans: 0 }, reportOptions: { scope: 'all' },
    });
    const unavailable = summarizeRun(limited, config);
    assert.equal(unavailable.available, false);
    assert.equal(unavailable.status, 'unavailable');
    assert.deepEqual(unavailable.preferredIds, []);
  } finally {
    await executor.close();
  }
});

test('a missing budget remains an explicit native validation error', async () => {
  const lab = createDecisionLab();
  const app = lab.apps.open(appPackage);
  const inputs = structuredClone(cases[0]);
  inputs.parameters.budgetMinor = null;
  const bound = lab.cases.create({ app, inputs });
  const validation = lab.cases.validate({ app, case: bound });
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some(issue => issue.path.includes('budgetMinor')));
});
