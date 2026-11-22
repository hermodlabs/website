#!/usr/bin/env node
// The business has $12,000 of already unrestricted growth cash and 140 delivery
// hours. A large invoiced campaign has an attractive ending balance but cannot
// fund its earlier payments or deliver all the assumed work. A smaller campaign
// and an offer paid before delivery fit the recorded operating requirements.
//
// This example uses public CLI commands for authoring, packaging and solving.
// The assertions describe fictional acceptance cases, not another solver.
// Output artifacts retain every calculation needed by a custom client or the UI.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCLI, CLI_EXIT_CODE, CLI_VERSION } from '@decision-lab/cli';
import { SDK_VERSION, commitment, WORKFLOW_ANSWER_STATUS, WORKFLOW_STEP_STATUS } from '@decision-lab/sdk';
import { growthAuthor } from './model.mjs';
import { growthCases } from './fixtures/cases.mjs';
import { makeLearningWorkflowCase, LEARNING_STUDY } from './learning.mjs';
import configuration from './workflow-config.json' with { type: 'json' };

const home = dirname(fileURLToPath(import.meta.url));
const encode = value => `${JSON.stringify(value, null, 2)}\n`;
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const save = (path, value) => writeFile(path, encode(value), { flag: 'wx' });
const source = name => join(home, 'source', name);
const hash = value => createHash('sha256').update(value).digest('hex');
const quote = value => `'${String(value).replaceAll("'", "'\\''")}'`;
const planning = output => output.steps.find(row => row.id === 'planning');
const stages = ['author', 'cases', 'changes', 'learning'];
const usage = 'Usage: node walkthrough.mjs [all|author|cases|changes|learning|help] [--output-root DIRECTORY] [--accept-fictional-demo]';
const args = process.argv.slice(2), stage = args.shift() ?? 'help';
const consentFlag = args.indexOf('--accept-fictional-demo'), consent = consentFlag >= 0;
if (consent) args.splice(consentFlag, 1);
const outputFlag = args.indexOf('--output-root');
if (outputFlag >= 0 && (!args[outputFlag + 1] || args[outputFlag + 1].startsWith('--'))) throw new Error('--output-root needs a directory.');
const output = outputFlag < 0 ? join(home, '.output') : resolve(args.splice(outputFlag, 2)[1]);
const target = (group, name) => join(output, group, name);

if (args.length || ![...stages, 'all', 'help'].includes(stage)) throw new Error(usage);
if (stage === 'help') {
  console.log(`${usage}\nRun author, cases, changes and learning in order. Use a fresh output directory. Only author/all require consent to replay the individually documented fictional authoring judgments.`);
} else {
  if (['author', 'all'].includes(stage)) {
    if (!consent) throw new Error('Read source/authoring-reviews.json, then add --accept-fictional-demo to replay those exact fictional authoring judgments. This flag does not approve a real business commitment.');
    await mkdir(output, { recursive: true });
    assert.equal((await readdir(output)).length, 0, `Choose a fresh output directory: ${output}`);
  }
  for (const name of stage === 'all' ? stages : [stage]) await runStage(name);
}

function sharedInputs(native, baseline) {
  return { ...structuredClone(baseline), growth: { ...structuredClone(native.parameters),
    ...Object.fromEntries(Object.entries(native.tables).filter(([key]) => !key.startsWith('_')).map(([key, rows]) => [key, structuredClone(rows)])) } };
}

async function runStage(name) {
  const directory = target(name, '');
  await mkdir(directory); // Refuse an existing stage before changing its files.
  const transcript = [];
  let sequence = 0;
  console.log(`${name}: ${directory}`);
  async function cli(arguments_, expectedExitCode = CLI_EXIT_CODE.COMPLETED) {
    let stdout = '', stderr = '';
    const exitCode = await runCLI(arguments_, { stdout: { write: value => { stdout += value; } }, stderr: { write: value => { stderr += value; } } });
    transcript.push({ args: arguments_, expectedExitCode, exitCode, stdout, stderr });
    await writeFile(join(directory, 'commands.json'), encode(transcript));
    await writeFile(join(directory, 'commands.sh'), `#!/bin/sh\n# Exact command transcript. Its paths already exist; use a fresh walkthrough output root to repeat.\n${transcript.map(row => `# Expected exit ${row.expectedExitCode}\ndecision-lab ${row.args.map(quote).join(' ')}`).join('\n\n')}\n`);
    assert.equal(exitCode, expectedExitCode, `${arguments_.join(' ')}\n${stderr || stdout}`);
  }
  async function inspect(run, stem) {
    const file = join(directory, `${stem}.output.json`);
    await cli(['workflow', 'inspect', '--run', run, '--output', file]);
    await cli(['workflow', 'brief', '--run', run, '--output', join(directory, `${stem}.brief.json`)]);
    await cli(['workflow', 'brief', '--run', run, '--format', 'markdown', '--case-name', stem, '--output', join(directory, `${stem}.brief.md`)]);
    return read(file);
  }
  async function start(caseFile, stem) {
    const started = join(directory, `${stem}.started.run.json`);
    await cli(['workflow', 'start', '--definition', target('author', 'workflow.definition.json'), '--case', caseFile,
      '--run-id', `growth-${stem}`, '--created-at', configuration.publishedAt, '--output', started]);
    return started;
  }
  async function solve(run, stem, expectedExitCode = CLI_EXIT_CODE.COMPLETED) {
    const solved = join(directory, `${stem}.solved.run.json`);
    await cli(['workflow', 'solve', '--run', run, '--created-at', configuration.publishedAt, '--output', solved], expectedExitCode);
    return { run: solved, output: await inspect(solved, stem) };
  }
  async function answer(run, questionId, value, status = WORKFLOW_ANSWER_STATUS.SUPPLIED) {
    const stem = `${String(++sequence).padStart(2, '0')}-${questionId}`, next = join(directory, `${stem}.run.json`);
    const flags = ['workflow', 'answer', '--run', run, '--question', questionId, '--status', status, '--at', configuration.publishedAt,
      '--note', 'A changed input in the fictional growth calculation; no external payment, customer order or spending authorization is performed.', '--output', next];
    if (status === WORKFLOW_ANSWER_STATUS.SUPPLIED) {
      const valueFile = join(directory, `${stem}.value.json`); await save(valueFile, value); flags.push('--value', valueFile);
    }
    await cli(flags); return next;
  }

  if (name === 'author') {
    for (const stem of ['commitment', 'learning']) {
      const retained = await read(source(`${stem}.template.json`));
      const definition = join(directory, `${stem}.template-definition.json`), packed = join(directory, `${stem}.template.json`);
      await save(definition, retained.definition);
      await cli(['template', 'validate', definition, '--output', join(directory, `${stem}.template.validation.json`)]);
      await cli(['template', 'pack', definition, '--created-at', retained.createdAt, '--output', packed]);
      assert.deepEqual(await read(packed), retained);
    }
    for (const [stem, template] of [['growth', 'commitment'], ['learning', 'learning']]) {
      const retained = await read(source(`${stem}.app-definition.json`));
      const definition = join(directory, `${stem}.app-definition.json`), app = join(directory, `${stem}.app.json`);
      await cli(['app', 'init', '--template', join(directory, `${template}.template.json`), '--model', source(`${stem}.model.json`),
        '--app-id', retained.appId, '--release', String(retained.release), '--format', 'json', '--output', definition]);
      assert.deepEqual(await read(definition), retained);
      await cli(['app', 'validate', definition, '--output', join(directory, `${stem}.app.validation.json`)]);
      await cli(['app', 'pack', definition, '--created-at', configuration.publishedAt, '--output', app]);
      assert.deepEqual(await read(app), await read(source(`${stem}.app.json`)), 'Public CLI creation must reproduce the supplied app, not import an unexplained package.');
    }
    const workflowSource = await read(source('workflow.source.json'));
    assert.deepEqual(workflowSource.dependencies.find(row => row.id === 'planning').app, await read(join(directory, 'growth.app.json')));
    assert.deepEqual(workflowSource.dependencies.find(row => row.id === 'learning').app, await read(join(directory, 'learning.app.json')));
    const definition = join(directory, 'workflow.definition.json');
    await cli(['workflow', 'create', '--source', source('workflow.source.json'), '--output', definition]);
    await cli(['workflow', 'validate', definition, '--output', join(directory, 'workflow.validation.json')]);
    assert.deepEqual(await read(definition), await read(source('workflow.definition.json')));
    let draft = join(directory, 'workflow.draft.json');
    await cli(['workflow', 'draft', '--source', source('workflow.source.json'), '--catalog', source('workflow.catalog.json'), '--id', 'growth-author',
      '--at', configuration.publishedAt, '--published-at', configuration.publishedAt, '--output', draft]);
    const inspectionPath = join(directory, 'unreviewed.inspection.json');
    await cli(['workflow', 'inspect-draft', '--draft', draft, '--output', inspectionPath]);
    const inspection = await read(inspectionPath), reviews = await read(source('authoring-reviews.json'));
    assert.equal(inspection.readyToPublish, false);
    await cli(['workflow', 'pack', '--draft', draft, '--output', join(directory, 'unreviewed.workflow.json')], CLI_EXIT_CODE.INVALID_INPUT);
    assert.equal(reviews.format, 'growth-authoring-reviews/1');
    assert.equal(reviews.at, configuration.publishedAt);
    assert.deepEqual(reviews.bindings.map(row => row.id).sort(), inspection.bindings.map(row => row.id).sort());
    const byId = new Map(reviews.bindings.map(row => [row.id, row]));
    for (const binding of inspection.bindings) {
      const review = byId.get(binding.id);
      assert.equal(review.hash, binding.hash, `Binding ${binding.id} changed. Its old meaning/scope/units judgment must be revisited.`);
      for (const field of ['meaning', 'scope', 'units']) assert.ok(typeof review[field] === 'string' && review[field].trim(), `${binding.id}: ${field} needs an authored judgment.`);
      const next = join(directory, `review-${String(++sequence).padStart(2, '0')}.draft.json`);
      await cli(['workflow', 'review-binding', '--draft', draft, '--binding', binding.id, '--actor', reviews.actor,
        '--meaning', review.meaning, '--scope', review.scope, '--units', review.units, '--at', reviews.at, '--output', next]);
      draft = next;
    }
    const published = join(directory, 'growth.workflow.json');
    await cli(['workflow', 'pack', '--draft', draft, '--output', published]);
    await cli(['workflow', 'package-validate', published, '--output', join(directory, 'package.validation.json')]);
    assert.deepEqual(await read(published), await read(source('growth.workflow.json')));
    await cli(['workbook', 'pack', '--target', published, '--mapping', source('workbook.mapping.json'), '--starter', join(home, 'cases', 'baseline.json'),
      '--starter-meaning', 'example', '--output', join(directory, 'growth.workbook.json')]);
    assert.deepEqual(await read(join(directory, 'growth.workbook.json')), await read(source('growth.workbook.json')));
    await save(join(directory, 'verification.json'), { cliVersion: CLI_VERSION, sdkVersion: SDK_VERSION,
      modelSourceSha256: hash(await readFile(source('growth.model.json'))),
      appPackageHashes: { planning: (await read(join(directory, 'growth.app.json'))).contentHash, learning: (await read(join(directory, 'learning.app.json'))).contentHash },
      workflowDefinitionHash: (await read(definition)).contentHash, workflowPackageHash: (await read(published)).contentHash,
      conclusion: 'Public CLI commands recreated both apps, their workflow and its Excel input package from complete authored source files.' });
  } else if (name === 'cases') {
    await access(target('author', 'workflow.definition.json'));
    const baseline = await read(join(home, 'cases', 'baseline.json')), fixtures = growthCases();
    const expected = {
      baseline: ['baseline', 'small-invoice', 'medium-prepay'], 'all-growth-blocked': ['baseline'], 'weak-demand': ['baseline', 'small-invoice', 'medium-prepay'],
      'zero-sales': ['baseline', 'large-invoice', 'small-invoice', 'medium-prepay'], 'late-collection': ['baseline', 'medium-prepay'],
      'late-prepayment': ['baseline', 'small-invoice'], 'capacity-shortage': ['baseline'], 'protected-reserve': ['baseline'],
      'missed-cutoff': ['baseline'], 'zero-contribution': ['baseline', 'small-invoice', 'medium-prepay'],
    };
    const findings = [];
    for (const [id, passing] of Object.entries(expected)) {
      const caseFile = join(directory, `${id}.case.json`); await save(caseFile, sharedInputs(fixtures[id], baseline));
      const solved = await solve(await start(caseFile, id), id);
      findings.push(checkFinding(solved.output, { id, passing }));
    }
    const incomplete = structuredClone(baseline); delete incomplete.growth.openingCashMinor;
    const caseFile = join(directory, 'missing-cash.case.json'); await save(caseFile, incomplete);
    const solved = await solve(await start(caseFile, 'missing-cash'), 'missing-cash', CLI_EXIT_CODE.UNAVAILABLE);
    findings.push(checkFinding(solved.output, { id: 'missing-cash', unavailable: true }));
    assert.equal(solved.output.questions.find(row => row.id === 'opening-cash').status, WORKFLOW_ANSWER_STATUS.UNANSWERED);
    const baselineOutput = await read(join(directory, 'baseline.output.json'));
    assert.deepEqual(planning(baselineOutput).output.plans.map(row => row.peakFundingRequired), [0, 2800000, 700000, 400000]);
    const detail = baselineOutput.brief.sections.find(row => row.id === 'operating-detail').value.find(row => row.arrangementId === 'medium-prepay');
    assert.equal(detail.customersToReachTarget, 4); assert.equal(detail.customersToExceedExpense, 5);
    await save(join(directory, 'verification.json'), { findings, baselinePeakFundingMinor: [0, 2800000, 700000, 400000], mediumCampaignHurdle: { coversExpense: 4, firstExceedingExpense: 5 } });
  } else if (name === 'changes') {
    const original = target('cases', 'baseline.solved.run.json'); await access(original);
    const originalBytes = await readFile(original), baseline = await read(target('cases', 'baseline.output.json'));
    const originalEvaluationId = planning(baseline).evaluationId;
    const cashAnswer = await answer(original, 'opening-cash', 100000);
    const stale = await inspect(cashAnswer, 'cash.before-calculation');
    assert.equal(planning(stale).status, WORKFLOW_STEP_STATUS.STALE);
    assert.notEqual(stale.decisionSummary.finding.availability, 'available');
    const lowerCash = await solve(cashAnswer, 'lower-cash');
    const findings = [checkFinding(lowerCash.output, { id: 'lower-cash', passing: ['baseline'] })];
    assert.ok(lowerCash.output.evaluations.some(row => row.id === originalEvaluationId));
    assert.notEqual(planning(lowerCash.output).evaluationId, originalEvaluationId);
    const capacity = structuredClone((await read(join(home, 'cases', 'baseline.json'))).growth.capacityPeriods); capacity[0].availableHours = 80;
    const changed = await solve(await answer(original, 'delivery-capacity', capacity), 'lower-capacity');
    findings.push(checkFinding(changed.output, { id: 'lower-capacity', passing: ['baseline', 'small-invoice'] }));
    const unknown = await solve(await answer(original, 'opening-cash', undefined, WORKFLOW_ANSWER_STATUS.UNKNOWN), 'cash-unknown', CLI_EXIT_CODE.UNAVAILABLE);
    assert.equal(unknown.output.questions.find(row => row.id === 'opening-cash').status, WORKFLOW_ANSWER_STATUS.UNKNOWN);
    assert.notEqual(unknown.output.decisionSummary.finding.availability, 'available');
    assert.equal(hash(await readFile(original)), hash(originalBytes));
    await save(join(directory, 'verification.json'), { originalEvaluationId, oldFindingsRetained: true, unknownCashUnavailable: true, originalRunUnchanged: true, findings });
  } else {
    await access(target('author', 'workflow.definition.json'));
    const input = makeLearningWorkflowCase(growthAuthor);
    const caseFile = join(directory, 'preference-test.case.json'); await save(caseFile, input);
    const solved = await solve(await start(caseFile, 'preference-test'), 'preference-test');
    const current = solved.output.steps.find(row => row.id === 'learning');
    assert.equal(current.status, WORKFLOW_STEP_STATUS.COMPLETE);
    const assessment = current.assessment;
    assert.equal(assessment.baseline.expectedPayoff, 800000);
    assert.deepEqual(assessment.baseline.bestActionIds, ['small-invoice']);
    assert.deepEqual(assessment.recommendation.bestIds, [LEARNING_STUDY]);
    const study = assessment.studies.find(row => row.id === LEARNING_STUDY);
    assert.equal(study.netValue, 980000); assert.equal(study.incrementalValue, 180000);
    assert.deepEqual(study.branches.find(row => row.id === 'favorable').bestActionIds, ['medium-prepay']);
    assert.deepEqual(study.branches.find(row => row.id === 'inconclusive').bestActionIds, ['small-invoice']);
    // The native app is separately usable. Its source contains projections of
    // two authentic commitment assessments, with their hashes and eligibility.
    const nativeCase = join(directory, 'learning-native.case.json'); await save(nativeCase, (await read(source('learning.model.json'))).case);
    const nativeRun = join(directory, 'learning-native.run.json');
    await cli(['run', '--app', target('author', 'learning.app.json'), '--case', nativeCase, '--created-at', configuration.publishedAt, '--output', nativeRun]);
    assert.equal((await read(nativeRun)).assessment.studies[0].netValue, 980000);
    const late = await solve(await answer(solved.run, 'learning-basis', { ...input.learning.basis, durationDays: 4 }), 'late-test');
    const lateAssessment = late.output.steps.find(row => row.id === 'learning').assessment;
    assert.deepEqual(lateAssessment.recommendation.bestIds, ['no-study']);
    assert.ok(late.output.steps.find(row => row.id === 'planning-after-test').assessment.plans.filter(row => row.feasible).every(row => row.choices.arrangement === 'baseline'));
    const unknown = await solve(await answer(solved.run, 'learning-basis', undefined, WORKFLOW_ANSWER_STATUS.UNKNOWN), 'test-basis-unknown');
    assert.equal(planning(unknown.output).status, WORKFLOW_STEP_STATUS.COMPLETE);
    assert.equal(unknown.output.decisionSummary.finding.availability, 'available', 'Missing optional probabilities must not erase a complete operating comparison.');
    await save(join(directory, 'verification.json'), { choosingNowExpectedContributionMinor: 800000, timelyTestNetExpectedContributionMinor: study.netValue,
      testIncrementalValueMinor: study.incrementalValue, lateTestBestIds: lateAssessment.recommendation.bestIds, unknownTestPreservesPlanning: true,
      qualification: 'Hypothetical priors and imperfect nonbinding preference signals. The test takes no orders or deposits and does not estimate a causal marketing effect.' });
    console.log('preference-test: choose now $8,000; timely test $9,800 after its $500 fee; late test cannot retain a growth response.');
  }
}

function checkFinding(output, expected) {
  const active = planning(output);
  if (expected.unavailable) {
    assert.notEqual(active.status, WORKFLOW_STEP_STATUS.COMPLETE);
    assert.notEqual(output.decisionSummary.finding.availability, 'available');
    console.log(`${expected.id}: unavailable; required cash remains unknown.`);
    return { case: expected.id, available: false };
  }
  assert.equal(active.status, WORKFLOW_STEP_STATUS.COMPLETE);
  assert.equal(commitment.isAssessmentComplete(active.assessment), true);
  assert.equal(active.assessment.coverage.evaluatedCandidates, 4);
  assert.equal(active.assessment.recommendation, null, 'Operating feasibility does not invent a preferred growth commitment.');
  const passing = active.assessment.plans.filter(row => row.feasible).map(row => row.choices.arrangement);
  assert.deepEqual(passing, expected.passing);
  assert.equal(output.decisionSummary.finding.availability, 'available');
  assert.equal(output.brief.complete, true);
  assert.deepEqual(output.reviews, []);
  assert.ok(output.decisionProcess.nodes.length > 0 && output.decisionProcess.edges.length > 0);
  console.log(`${expected.id}: passing [${passing.join(', ')}]; no arrangement ranked.`);
  return { case: expected.id, available: true, passing, actions: output.brief.actions.map(row => row.id) };
}
