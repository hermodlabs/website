import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createDecisionLab } from '@decision-lab/sdk';
import { createNodeExecutor } from '@decision-lab/sdk/node';
import { buildCase, toDraft, cents, localTime, minuteFromLocal, summarizeRun } from '../src/shipment.js';

const data = new URL('../public/data/', import.meta.url);
const config = JSON.parse(await readFile(new URL('config.json', data)));
const appPackage = JSON.parse(await readFile(new URL(config.appUrl, data)));
const cases = await Promise.all(config.cases.map(async entry => JSON.parse(await readFile(new URL(entry.url, data)))));

test('form conversions round trip complete cases without changing record scopes', () => {
  for (const inputs of cases) assert.deepEqual(buildCase(inputs, toDraft(inputs, config), config), inputs);
  const original = structuredClone(cases[1]);
  const draft = toDraft(cases[1], config);
  draft.quotes[0].totalCost = '3999.99';
  const prepared = buildCase(cases[1], draft, config);
  assert.equal(prepared.tables.arrangements[0].fee, 399999);
  assert.equal(prepared.parameters.orderRevision, '2');
  assert.equal(prepared.tables.slotConfirmations[0].orderRevision, '1');
  for (const table of ['grants', 'arrangementAuthorities', 'readiness']) {
    assert.deepEqual(prepared.tables[table], original.tables[table]);
  }
  assert.deepEqual(cases[1], original, 'the source case is never mutated');
});

test('an absent confirmation stays absent; adding one requires actual record fields', () => {
  const inputs = structuredClone(cases[0]);
  inputs.tables.slotConfirmations = [];
  const draft = toDraft(inputs, config);
  assert.equal(draft.confirmation.status, 'none');
  assert.equal(draft.confirmation.orderRevision, '');
  assert.equal(draft.confirmation.slotReference, '');
  assert.deepEqual(buildCase(inputs, draft, config).tables.slotConfirmations, []);
  draft.confirmation.status = 'confirmed';
  assert.throws(() => buildCase(inputs, draft, config), error => error.issues.some(issue => issue.path === 'confirmation.slotReference'));
});

test('amounts and dates use explicit supported units without coercion', () => {
  assert.equal(cents('0.01'), 1);
  assert.equal(cents('5000'), 500000);
  for (const value of ['', '-1', '0.001', '5,000', ' 100', '1e3']) assert.throws(() => cents(value));
  assert.equal(localTime(3960, config), '2026-11-19T18:00');
  assert.equal(minuteFromLocal('2026-11-19T18:00', config), 3960);
  for (const value of ['2026-02-30T12:00', '2026-11-17T25:00', '', '2026-11-19T18:00Z']) {
    assert.throws(() => minuteFromLocal(value, config));
  }
  const draft = toDraft(cases[0], config);
  draft.quotes[0].currency = 'EUR';
  assert.throws(() => buildCase(cases[0], draft, config), error => error.issues.some(issue => /USD/.test(issue.message)));
});

test('updating a confirmation does not rewrite other permissions or the source case', () => {
  const draft = toDraft(cases[1], config);
  assert.equal(draft.confirmation.orderRevision, '1');
  draft.confirmation.slotReference = 'REPLACEMENT-RECORD';
  draft.confirmation.orderRevision = '2';
  const prepared = buildCase(cases[1], draft, config);
  assert.equal(prepared.tables.slotConfirmations[0].orderRevision, '2');
  assert.equal(cases[1].tables.slotConfirmations[0].orderRevision, '1');
  assert.deepEqual(prepared.tables.grants, cases[1].tables.grants);
});

// Use the public SDK and an actual Node worker. The screen receives the same
// native assessment contract from its browser worker, not a test evaluator.
test('native SDK results support confirmed, revised and blocked shipment reviews', async () => {
  const executor = createNodeExecutor();
  const lab = createDecisionLab({ executor });
  const app = lab.apps.open(appPackage);
  try {
    const expected = [['consolidated'], ['direct'], []];
    for (const [index, inputs] of cases.entries()) {
      const bound = lab.cases.create({ app, inputs });
      const run = await lab.run({ app, case: bound, reportOptions: { scope: 'all', locale: 'en-US' } });
      const summary = summarizeRun(run, config);
      assert.equal(summary.available, true);
      assert.deepEqual(summary.preferredIds, expected[index]);
      assert.equal(summary.plans.length, 3);
      assert.equal(summary.scope.orderRevision, inputs.parameters.orderRevision);
      if (index === 0) {
        assert.equal(summary.preferred[0].expense, 500000);
        assert.equal(summary.preferred[0].arrivalMinutes, 3960);
      }
      if (index === 1) {
        const consolidated = summary.plans.find(plan => plan.arrangementId === 'consolidated');
        assert.ok(consolidated.blockers.some(blocker => blocker.id === 'scoped-consolidation-slot'));
      }
      if (index === 2) {
        assert.equal(summary.status, 'blocked');
        assert.equal(summary.finding, 'no_feasible_plan');
        assert.ok(summary.plans.every(plan => !plan.feasible));
      }
    }

    // A new slot record can satisfy the slot requirement. It cannot supply the
    // separate selection or release authority that the case still lacks.
    for (const index of [1, 2]) {
      const inputs = structuredClone(cases[index]);
      inputs.tables.slotConfirmations[0].orderRevision = '2';
      inputs.tables.slotConfirmations[0].slotReference = `NEW-SLOT-${inputs.id}`;
      const bound = lab.cases.create({ app, inputs });
      const run = await lab.run({ app, case: bound });
      const summary = summarizeRun(run, config);
      assert.deepEqual(summary.preferredIds, index === 1 ? ['consolidated'] : []);
      assert.deepEqual(run.input.inputs.tables.grants, cases[index].tables.grants);
    }
  } finally { await executor.close(); }
});

test('native SDK ties remain tied and an incomplete search offers no recommendation', async () => {
  const executor = createNodeExecutor();
  const lab = createDecisionLab({ executor });
  const app = lab.apps.open(appPackage);
  try {
    const inputs = structuredClone(cases[0]);
    const direct = inputs.tables.arrangements.find(row => row.id === 'direct');
    direct.fee = 500000;
    direct.travelDuration = 2520;
    const bound = lab.cases.create({ app, inputs });
    const run = await lab.run({ app, case: bound, reportOptions: { scope: 'all' } });
    const summary = summarizeRun(run, config);
    assert.deepEqual(summary.preferredIds, ['direct', 'consolidated']);
    assert.ok(summary.preferred.every(plan => plan.feasible && plan.preferred));

    const limited = await lab.run({ app, case: bound, assessmentOptions: { maxPlans: 0 }, reportOptions: { scope: 'all' } });
    const unavailable = summarizeRun(limited, config);
    assert.equal(unavailable.available, false);
    assert.equal(unavailable.status, 'unavailable');
    assert.deepEqual(unavailable.preferredIds, []);
    assert.ok(unavailable.issues.length);
  } finally { await executor.close(); }
});
