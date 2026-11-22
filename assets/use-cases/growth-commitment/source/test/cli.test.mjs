import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const execute = promisify(execFile);
const home = fileURLToPath(new URL('../', import.meta.url));
const read = async path => JSON.parse(await readFile(path, 'utf8'));

test('the public CLI recreates exact packages and calculates, changes and compares growth commitments', { timeout: 240000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'growth-cli-'));
  try {
    const { stdout } = await execute(process.execPath, [join(home, 'walkthrough.mjs'), 'all', '--accept-fictional-demo', '--output-root', directory], { timeout: 220000, maxBuffer: 2 * 1024 * 1024 });
    assert.match(stdout, /baseline: passing \[baseline, small-invoice, medium-prepay\]; no arrangement ranked/);
    assert.match(stdout, /timely test \$9,800/);
    const author = await read(join(directory, 'author', 'verification.json'));
    for (const name of ['growth.app.json', 'learning.app.json', 'growth.workflow.json', 'growth.workbook.json']) assert.deepEqual(await read(join(directory, 'author', name)), await read(join(home, 'source', name)));
    assert.equal(author.workflowPackageHash, (await read(join(home, 'source', 'growth.workflow.json'))).contentHash);
    const cases = await read(join(directory, 'cases', 'verification.json'));
    assert.deepEqual(cases.baselinePeakFundingMinor, [0, 2800000, 700000, 400000]);
    assert.deepEqual(cases.mediumCampaignHurdle, { coversExpense: 4, firstExceedingExpense: 5 });
    assert.deepEqual(cases.findings.find(row => row.case === 'zero-sales').passing, ['baseline', 'large-invoice', 'small-invoice', 'medium-prepay']);
    assert.deepEqual(cases.findings.find(row => row.case === 'all-growth-blocked').passing, ['baseline']);
    assert.equal(cases.findings.find(row => row.case === 'missing-cash').available, false);
    const commands = await read(join(directory, 'cases', 'commands.json'));
    assert.ok(commands.some(row => row.args[1] === 'solve' && row.args.some(arg => arg.endsWith('/missing-cash.started.run.json')) && row.exitCode === 3));
    const baseline = await read(join(directory, 'cases', 'baseline.output.json'));
    assert.equal(baseline.steps.find(row => row.id === 'planning').assessment.recommendation, null);
    assert.ok(baseline.decisionProcess.nodes.length > 0 && baseline.decisionProcess.edges.length > 0);
    assert.match(await readFile(join(directory, 'cases', 'baseline.brief.md'), 'utf8'), /growth/i);
    const changes = await read(join(directory, 'changes', 'verification.json'));
    assert.equal(changes.originalRunUnchanged, true); assert.equal(changes.oldFindingsRetained, true); assert.equal(changes.unknownCashUnavailable, true);
    const learning = await read(join(directory, 'learning', 'verification.json'));
    assert.equal(learning.choosingNowExpectedContributionMinor, 800000);
    assert.equal(learning.timelyTestNetExpectedContributionMinor, 980000);
    assert.equal(learning.testIncrementalValueMinor, 180000);
    assert.deepEqual(learning.lateTestBestIds, ['no-study']); assert.equal(learning.unknownTestPreservesPlanning, true);
    const unknown = await read(join(directory, 'learning', 'test-basis-unknown.output.json'));
    assert.equal(unknown.steps.find(row => row.id === 'planning').status, 'complete');
    assert.notEqual(unknown.steps.find(row => row.id === 'learning').status, 'complete');
    const originalBytes = await readFile(join(directory, 'cases', 'baseline.solved.run.json'));
    await assert.rejects(() => execute(process.execPath, [join(home, 'walkthrough.mjs'), 'cases', '--output-root', directory]), /EEXIST/);
    assert.deepEqual(await readFile(join(directory, 'cases', 'baseline.solved.run.json')), originalBytes);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('authoring judgment replay is explicit and argument failures explain recovery', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'growth-cli-no-consent-'));
  try {
    await assert.rejects(() => execute(process.execPath, [join(home, 'walkthrough.mjs'), 'author', '--output-root', directory]), /Read source\/authoring-reviews.json/);
    await assert.rejects(() => execute(process.execPath, [join(home, 'walkthrough.mjs'), 'author', '--output-root']), /needs a directory/);
    const { stdout } = await execute(process.execPath, [join(home, 'walkthrough.mjs'), 'help']);
    assert.match(stdout, /author\|cases\|changes\|learning/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
