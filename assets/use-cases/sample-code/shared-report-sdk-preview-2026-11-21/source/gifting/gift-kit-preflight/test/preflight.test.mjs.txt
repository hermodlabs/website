import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPreflight } from '../src/preflight.mjs';
import { renderHTML } from '../src/report.mjs';

let root, inputFile, result;
const fixtureDir = fileURLToPath(new URL('../fixtures', import.meta.url));
const load = async file => JSON.parse(await readFile(file, 'utf8'));

before(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'gift-kit-preflight-test-'));
  await cp(fixtureDir, path.join(root, 'fixtures'), { recursive: true });
  inputFile = path.join(root, 'fixtures', 'campaigns.json');
  result = await runPreflight({ inputFile, outputDir: path.join(root, 'review') });
});
after(async () => { await rm(root, { recursive: true, force: true }); });

test('the actual CLI compares all fault scenarios and exports cases for the React desk', async () => {
  assert.equal(result.exitCode, 2); // An intentionally invalid fourth case.
  const [confirmed, stale, permissions, invalid] = result.manifest.campaigns;
  assert.deepEqual(result.manifest.summary, { eligible: 2, blocked: 1, 'input-error': 1 });
  assert.deepEqual(confirmed.review.preferredIds, ['external-replace-and-repair']);
  assert.deepEqual(stale.review.preferredIds, ['replace-and-repair']);
  assert.equal(confirmed.review.preferred[0].expense, 40000);
  assert.equal(confirmed.review.preferred[0].finishMinute, 20);
  assert.equal(stale.review.preferred[0].expense, 30000);
  assert.equal(stale.review.preferred[0].finishMinute, 35);
  assert.equal(stale.review.scenarioCount, 8);
  assert.equal(result.manifest.policy.minimumRehearsalMinutes, 5);
  assert.deepEqual(confirmed.review.timing, {
    nowMinute: 0, handoffDeadlineMinute: 60, rehearsalMinutes: 5,
    handoffMinutes: 5, startOptions: [0],
  });
  assert.equal(confirmed.review.preferred[0].deadlineSlackMinute, 40);
  assert.equal(confirmed.basis.confirmations[0].validThrough, 60);
  assert.equal(confirmed.basis.permissions[0].validThrough, 120);
  assert.equal(permissions.status, 'blocked');
  assert.deepEqual(permissions.review.preferredIds, []);
  assert.match(invalid.messages.join(' '), /budgetMinor/);
  assert.equal(invalid.run, null);

  const exported = await load(path.join(result.outputDir, stale.case));
  const source = await load(path.join(fixtureDir, 'cases', 'stale.json'));
  assert.deepEqual(exported, source);
  assert.equal(exported.parameters.insertRevision, 'insert-4');
  assert.equal(exported.tables.confirmations[0].insertRevision, 'insert-3');
  const run = await load(path.join(result.outputDir, stale.run));
  assert.deepEqual(run.input.inputs, source);
  assert.equal(run.execution.status, 'completed');
  const commands = await load(path.join(result.outputDir, 'commands.json'));
  assert.equal(commands.filter(item => item.args[0] === 'run').length, 3);
  assert.equal(commands.find(item => item.args.includes('gift-preflight-GIFT-122')).exitCode, 0);
  for (const name of ['confirmed', 'stale', 'permissions', 'invalid']) {
    assert.deepEqual(await readFile(path.join(root, 'fixtures', 'cases', `${name}.json`)), await readFile(path.join(fixtureDir, 'cases', `${name}.json`)));
  }
});

test('the one-day article cases retain their timing and interval basis through the real CLI', async () => {
  const review = await runPreflight({
    inputFile: path.join(root, 'fixtures', 'campaigns.one-day.json'),
    outputDir: path.join(root, 'one-day'),
  });
  assert.equal(review.exitCode, 0);
  assert.deepEqual(review.manifest.summary, { eligible: 3, blocked: 1 });
  const [confirmed, stale, expired, late] = review.manifest.campaigns;
  assert.deepEqual(confirmed.review.preferredIds, ['external-replace-and-repair']);
  assert.equal(confirmed.review.preferred[0].finishMinute, 25);
  assert.equal(confirmed.review.preferred[0].deadlineSlackMinute, 1415);
  assert.equal(confirmed.review.timing.handoffDeadlineMinute, 1440);
  assert.equal(confirmed.review.timing.rehearsalMinutes, 10);
  assert.equal(confirmed.basis.calendars[0].end, 120);
  assert.equal(confirmed.basis.confirmations[0].validThrough, 60);
  assert.deepEqual(stale.review.preferredIds, ['replace-and-repair']);
  assert.equal(stale.review.preferred[0].finishMinute, 40);
  assert.equal(expired.status, 'blocked');
  assert.equal(expired.review.timing.nowMinute, 1380);
  assert.deepEqual(expired.review.timing.startOptions, [1380]);
  assert.equal(expired.basis.calendars[0].end, 120);
  assert.equal(expired.basis.permissions[0].validThrough, 120);
  assert.equal(expired.basis.confirmations[0].validThrough, 60);
  assert.ok(expired.review.plans.some(plan => plan.blockers.some(item => item.id === 'resource-calendar')));
  assert.deepEqual(late.review.preferredIds, ['external-replace-and-repair']);
  assert.equal(late.review.preferred[0].startMinute, 1380);
  assert.equal(late.review.preferred[0].finishMinute, 1405);
  assert.equal(late.review.preferred[0].deadlineSlackMinute, 35);
  assert.equal(late.basis.calendars[0].end, 1440);
  assert.equal(late.basis.confirmations[0].validThrough, 1440);

  for (const campaign of review.manifest.campaigns) {
    const sourcePath = path.join(root, 'fixtures', 'cases', `one-day-${{
      'GIFT-220': 'confirmed', 'GIFT-221': 'stale', 'GIFT-222': 'expired', 'GIFT-223': 'late',
    }[campaign.id]}.json`);
    assert.deepEqual(await load(path.join(review.outputDir, campaign.case)), await load(sourcePath));
    assert.equal(campaign.review.scenarioCount, 8);
  }
  const html = await readFile(path.join(review.outputDir, 'campaigns.html'), 'utf8');
  for (const text of ['Timing basis', 'T+24 hr', 'Planned rehearsal', '10 min', 'Published rehearsal minimum', 'Candidate starts', 'T+23 hr', 'cutoff slack 35 min', 'Production availability', 'Operating permissions', 'External-booking confirmation']) {
    assert.ok(html.includes(text), `Report should contain ${text}`);
  }
  assert.match(html, /later cutoff does not extend/);
});

test('a shorter planned rehearsal remains subject to the pinned five-minute minimum', async () => {
  const inputs = await load(path.join(fixtureDir, 'cases', 'confirmed.json'));
  inputs.parameters.rehearsalMinutes = 4;
  await writeFile(path.join(root, 'fixtures', 'cases', 'short-rehearsal.json'), JSON.stringify(inputs));
  const file = path.join(root, 'fixtures', 'short-rehearsal.json');
  await writeFile(file, JSON.stringify({ campaigns: [{ id: 'GIFT-120', owner: 'Campaign owner', case: 'cases/short-rehearsal.json' }] }));
  const review = await runPreflight({ inputFile: file, outputDir: path.join(root, 'short-rehearsal') });
  assert.equal(review.exitCode, 0);
  const campaign = review.manifest.campaigns[0];
  assert.equal(campaign.status, 'blocked');
  assert.equal(campaign.review.timing.rehearsalMinutes, 4);
  assert.equal(review.manifest.policy.minimumRehearsalMinutes, 5);
  assert.ok(campaign.review.plans.every(plan => plan.blockers.some(item => item.id === 'minimum-rehearsal')));
});

test('a complete blocked case is an ordinary business finding, not a CLI failure', async () => {
  const file = path.join(root, 'fixtures', 'blocked.json');
  await writeFile(file, JSON.stringify({ campaigns: [{ id: 'GIFT-122', owner: 'Campaign owner', case: 'cases/permissions.json' }] }));
  const review = await runPreflight({ inputFile: file, outputDir: path.join(root, 'blocked') });
  assert.equal(review.exitCode, 0);
  assert.equal(review.manifest.campaigns[0].status, 'blocked');
});

test('a native search limit withholds partial recommendations', async () => {
  const file = path.join(root, 'fixtures', 'limited.json');
  await writeFile(file, JSON.stringify({ campaigns: [{ id: 'GIFT-120', owner: 'Campaign owner', case: 'cases/confirmed.json' }] }));
  const review = await runPreflight({ inputFile: file, outputDir: path.join(root, 'limited'), maxPlans: 0 });
  assert.equal(review.exitCode, 3);
  assert.equal(review.manifest.campaigns[0].status, 'unavailable');
  assert.deepEqual(review.manifest.campaigns[0].review.preferredIds, []);
  assert.ok(review.manifest.campaigns[0].run);
});

test('an imported case displays its actual admitted fault set rather than assuming eight', async () => {
  const inputs = await load(path.join(fixtureDir, 'cases', 'confirmed.json'));
  inputs.tables.scenarios = inputs.tables.scenarios.filter(row => row.id === 'none');
  await writeFile(path.join(root, 'fixtures', 'cases', 'narrowed.json'), JSON.stringify(inputs));
  const file = path.join(root, 'fixtures', 'narrowed.json');
  await writeFile(file, JSON.stringify({ campaigns: [{ id: 'GIFT-120', owner: 'Campaign owner', case: 'cases/narrowed.json' }] }));
  const review = await runPreflight({ inputFile: file, outputDir: path.join(root, 'narrowed') });
  assert.equal(review.exitCode, 0);
  assert.equal(review.manifest.campaigns[0].review.scenarioCount, 1);
  assert.deepEqual(review.manifest.campaigns[0].review.preferredIds, ['rehearse-unchanged']);
  assert.match(await readFile(path.join(review.outputDir, 'campaigns.html'), 'utf8'), /1 retained fault configuration/);
});

test('missing and incorrectly scoped cases are isolated while the other campaign is evaluated', async () => {
  const file = path.join(root, 'fixtures', 'missing.json');
  await writeFile(file, JSON.stringify({ campaigns: [
    { id: 'missing', owner: 'Avery', case: 'cases/not-there.json' },
    { id: 'mislabeled', owner: 'Casey', case: 'cases/confirmed.json' },
    { id: 'GIFT-120', owner: 'Jordan', case: 'cases/confirmed.json' },
  ] }));
  const review = await runPreflight({ inputFile: file, outputDir: path.join(root, 'missing') });
  assert.equal(review.exitCode, 2);
  assert.deepEqual(review.manifest.campaigns.map(row => row.status), ['input-error', 'input-error', 'eligible']);
  assert.match(review.manifest.campaigns[1].messages[0], /must both match/);
  assert.equal(review.manifest.campaigns[1].case, null);
});

test('duplicate IDs and traversal paths are rejected before publication', async () => {
  const file = path.join(root, 'fixtures', 'bad-manifest.json');
  for (const campaigns of [
    [{ id: 'duplicate', owner: 'A', case: 'cases/confirmed.json' }, { id: 'duplicate', owner: 'B', case: 'cases/stale.json' }],
    [{ id: '../escape', owner: 'A', case: 'cases/confirmed.json' }],
    [{ id: 'escape', owner: 'A', case: '../cases/confirmed.json' }],
  ]) {
    await writeFile(file, JSON.stringify({ campaigns }));
    await assert.rejects(runPreflight({ inputFile: file, outputDir: path.join(root, 'bad-output') }), error => error.exitCode === 2);
  }
});

test('existing directories and symlink aliases into source data cannot become outputs', async () => {
  await assert.rejects(runPreflight({ inputFile, outputDir: result.outputDir }), /already exists/);
  await symlink(path.join(root, 'fixtures'), path.join(root, 'alias'));
  await assert.rejects(runPreflight({ inputFile, outputDir: path.join(root, 'alias', 'new-output') }), /overlaps/);
  const outside = path.join(root, 'outside-case.json');
  await writeFile(outside, '{}');
  await symlink(outside, path.join(root, 'fixtures', 'cases', 'outside.json'));
  const file = path.join(root, 'fixtures', 'outside.json');
  await writeFile(file, JSON.stringify({ campaigns: [{ id: 'escape', owner: 'A', case: 'cases/outside.json' }] }));
  const review = await runPreflight({ inputFile: file, outputDir: path.join(root, 'outside') });
  assert.equal(review.exitCode, 2);
  assert.match(review.manifest.campaigns[0].messages[0], /outside/);
});

test('the human report escapes source text and retains canonical download links', async () => {
  const manifest = structuredClone(result.manifest);
  manifest.campaigns[0].owner = '<script>alert("x")</script>';
  manifest.campaigns[0].basis.bookings.push({ id: 'BOOK-PRODUCTION-OTHER-CAMPAIGN', resource: 'production-team', start: 0, end: 10, amount: 1 });
  const html = renderHTML(manifest);
  assert.ok(!html.includes('<script>'));
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /campaigns\/GIFT-121\/case\.json/);
  assert.match(html, /External replacement and repair/);
  assert.match(html, /Every retained fault scenario|Current campaign|Permission covers this campaign/);
  assert.match(html, /occupied units 1/);
  assert.match(html, /BOOK-PRODUCTION-OTHER-CAMPAIGN/);
  assert.ok(!html.includes('"feasible":'));
  assert.match(html, /data-record-view="gift-kit-preflight-queue"/);
  assert.match(html, /data-record-view="gift-kit-GIFT-120-packages"/);
  assert.equal((html.match(/<table\b/g) || []).length, (html.match(/data-record-view=/g) || []).length, 'Every report table uses the shared records view.');
  manifest.campaigns[0].case = 'javascript:alert(1)';
  manifest.campaigns[0].run = '../outside.json';
  manifest.campaigns[0].validation = 'sources/a"b#c.json';
  const links = renderHTML(manifest);
  assert.doesNotMatch(links, /href="javascript:|href="\.\.\//);
  assert.match(links, /href="sources\/a%22b%23c.json"/);
});

test('an unrecognized queue status withholds ordinary proposal guidance', () => {
  const manifest = structuredClone(result.manifest);
  manifest.campaigns = [{ ...manifest.campaigns[0], status: 'future-status' }];
  const html = renderHTML(manifest);
  assert.match(html, /Unknown assessment status/);
  assert.match(html, /Resolve the assessment problem, then run it again/);
  assert.doesNotMatch(html, /Review the proposed package and obtain/);
  assert.doesNotMatch(html, /data-record-view="gift-kit-GIFT-120-packages"/);
});
