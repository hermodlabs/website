import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCLI, CLI_EXIT_CODE } from '@decision-lab/cli';

// This is a consumer of the public command interface, not another evaluator.
// Sam is deciding whether to send staff outside for a bounded promotion. The
// model checks whether each complete deployment can run. It does not predict
// customers or maximize profit. The workflow explains conditional guest counts
// and keeps Sam's proposal and recorded authorization separate from findings.
const home = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), stage = args.shift() ?? 'help';
const flag = args.indexOf('--accept-fictional-demo');
const consent = flag >= 0;
if (consent) args.splice(flag, 1);
const atIndex = args.indexOf('--output-root');
if (atIndex >= 0 && (!args[atIndex + 1] || args[atIndex + 1].startsWith('--'))) throw new Error('--output-root needs a directory.');
const output = atIndex >= 0 ? resolve(args.splice(atIndex, 2)[1]) : join(home, '.output');
const stages = ['author', 'intake', 'callouts', 'decision', 'changed-staffing', 'verify'];
const source = (...parts) => join(home, 'source', ...parts);
const target = (id, name) => join(output, id, name);
const read = async file => JSON.parse(await readFile(file, 'utf8'));
const save = async (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
const quote = value => `'${String(value).replaceAll("'", "'\\''")}'`;
if (args.length || ![...stages, 'all'].includes(stage)) {
  console.log('Usage: node walkthrough.mjs author|intake|callouts|decision|changed-staffing|verify|all [--output-root DIRECTORY] [--accept-fictional-demo]');
  console.log('Run stages in order. Authoring and case stages require explicit consent to their named fictional reviews. Use a fresh output directory to repeat.');
  process.exitCode = stage === 'help' && !args.length ? 0 : 2;
} else {
  if (stage !== 'verify' && !consent) throw new Error('Read source/binding-reviews.json and the fictional cases, then add --accept-fictional-demo to record those demonstration reviews.');
  for (const id of stage === 'all' ? stages : [stage]) await runStage(id);
}

async function runStage(id) {
  if (id === 'verify') {
    const { verify } = await import('./verify.mjs');
    await verify(output);
    return;
  }
  const folder = target(id, '');
  await mkdir(folder, { recursive: true });
  const log = join(folder, 'commands.json');
  try { await access(log); throw new Error(`Stage already started: ${folder}. Keep its diagnostics and choose a fresh --output-root.`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const transcript = [];
  let sequence = 0;
  console.log(`${id}: ${folder}`);
  async function cli(arguments_, expected = CLI_EXIT_CODE.COMPLETED) {
    let stdout = '', stderr = '';
    const code = await runCLI(arguments_, { stdout: { write: value => { stdout += value; } }, stderr: { write: value => { stderr += value; } } });
    transcript.push({ args: arguments_, expectedExitCode: expected, exitCode: code, stdout, stderr });
    await writeFile(log, `${JSON.stringify(transcript, null, 2)}\n`);
    await writeFile(join(folder, 'commands.sh'), `#!/bin/sh\n# Inspection transcript; replay with walkthrough.mjs and a fresh output root.\n# Reviewers here are fictional fixtures, not authenticated users.\n${transcript.map(row => `# Expected exit ${row.expectedExitCode}\ndecision-lab ${row.args.map(quote).join(' ')}`).join('\n\n')}\n`);
    assert.equal(code, expected, `${arguments_.join(' ')}\n${stderr || stdout}`);
    return stdout ? JSON.parse(stdout) : null;
  }
  async function inspect(run, name) {
    const file = target(id, `${name}.output.json`);
    await cli(['workflow', 'inspect', '--run', run, '--output', file]);
    await cli(['workflow', 'brief', '--run', run, '--output', target(id, `${name}.brief.json`)]);
    return read(file);
  }
  async function answer(run, questionId, value, final = false) {
    const definition = await read(target('author', 'workflow.definition.json'));
    const question = definition.questions.find(row => row.id === questionId);
    assert(question, `Question ${questionId} is declared.`);
    const stem = `${String(++sequence).padStart(2, '0')}-${questionId}`;
    const file = target(id, `${stem}.value.json`);
    await save(file, value);
    const next = target(id, final ? 'run.json' : `${stem}.run.json`);
    await cli(['workflow', 'answer', '--run', run, '--question', questionId, '--status', 'accepted', '--value', file,
      '--actor', question.role === 'venue-manager' ? 'Sam (fictional)' : `Fictional ${question.role}`, '--role', question.role,
      '--at', '2026-11-18T01:30:00.000Z', '--note', 'Explicit scripted review of the supplied fictional teaching value.', '--output', next]);
    return next;
  }
  async function evaluate(run) {
    const pending = target(id, 'evaluated.run.json');
    await cli(['workflow', 'prepare', '--run', run, '--step', 'operations', '--output', target(id, 'prepared.json')]);
    await cli(['workflow', 'evaluate', '--run', run, '--step', 'operations', '--created-at', '2026-11-18T01:31:00.000Z', '--output', pending]);
    const finding = await inspect(pending, 'awaiting-review');
    assert.equal(finding.steps[0].status, 'awaiting-review');
    const evaluation = finding.evaluations.at(-1);
    const reviewed = target(id, 'run.json');
    const definition = await read(target('author', 'workflow.definition.json'));
    await cli(['workflow', 'review', '--run', pending, '--evaluation', evaluation.id, '--status', 'accepted',
      '--actor', 'Sam (fictional)', '--role', definition.steps[0].role, '--at', '2026-11-18T01:32:00.000Z',
      '--note', 'Reviewed the retained complete operating assessment for this fictional night; this is not deployment authorization.', '--output', reviewed]);
    return inspect(reviewed, 'accepted');
  }
  if (id === 'author') {
    const template = target(id, 'promotion.template.yaml'), appDefinition = target(id, 'promotion.app.yaml');
    const appFile = target(id, 'promotion.app.json');
    const createdAt = '2026-11-17T18:00:00.000Z';
    await cli(['template', 'init', '--pattern', 'complete-a-commitment/1', '--id', 'bounded-promotion', '--version', '1.0.0',
      '--title', 'Review a bounded promotion', '--description', 'Check complete deployments; explain conditional guest thresholds without forecasting demand.',
      '--require-module-field', 'assumptions', '--output', template]);
    await cli(['template', 'validate', template, '--output', target(id, 'template.validation.json')]);
    await cli(['template', 'pack', template, '--created-at', createdAt, '--output', target(id, 'promotion.template.json')]);
    await cli(['app', 'init', '--template', target(id, 'promotion.template.json'), '--model', source('promotion.model.json'),
      '--app-id', 'street-team-operating-review', '--release', '1', '--output', appDefinition]);
    await cli(['app', 'validate', appDefinition, '--output', target(id, 'app.validation.json')]);
    await cli(['app', 'pack', appDefinition, '--created-at', createdAt, '--output', appFile]);
    await cli(['app', 'check', '--app', appFile, '--suite', source('app.scenarios.json'), '--output', target(id, 'app.checks.json')]);
    const app = await read(appFile), definition = await read(source('workflow.source.json'));
    // File assembly only: embed the exact public app package, then let the CLI
    // validate, hash, test and seal it. No business rules are recreated here.
    definition.dependencies = [{ id: 'operations', app, packageHash: app.contentHash }];
    await save(target(id, 'workflow.source.json'), definition);
    await cli(['workflow', 'create', '--source', target(id, 'workflow.source.json'), '--output', target(id, 'workflow.definition.json')]);
    const draft = target(id, 'workflow.draft.json');
    await cli(['workflow', 'draft', '--source', target(id, 'workflow.source.json'), '--catalog', source('catalog.json'), '--id', 'promotion-author', '--at', createdAt, '--published-at', createdAt, '--output', draft]);
    const inspection = await cli(['workflow', 'inspect-draft', '--draft', draft]);
    assert.equal(inspection.readyToPublish, false);
    await cli(['workflow', 'pack', '--draft', draft, '--output', target(id, 'unreviewed.workflow.json')], CLI_EXIT_CODE.INVALID_INPUT);
    const reviews = await read(source('binding-reviews.json'));
    assert.deepEqual(Object.keys(reviews).sort(), inspection.bindings.map(row => row.id).sort(), 'Every current binding needs an authored review.');
    // IDs alone do not identify a meaning: a changed rule can keep the same ID.
    // Check every recorded declaration hash before applying any fixture review.
    for (const binding of inspection.bindings) assert.equal(binding.hash, reviews[binding.id].bindingHash,
      `Authored binding changed: ${binding.id}. Review its meaning, scope and units explicitly; the old fictional review cannot approve this declaration.`);
    let current = draft;
    for (const binding of inspection.bindings) {
      const review = reviews[binding.id], next = target(id, `review-${String(++sequence).padStart(2, '0')}.draft.json`);
      await cli(['workflow', 'review-binding', '--draft', current, '--binding', binding.id, '--actor', 'Fictional promotion module author',
        '--meaning', review.meaning, '--scope', review.scope, '--units', review.units, '--at', createdAt, '--output', next]);
      current = next;
    }
    await cli(['workflow', 'check', '--draft', current, '--suite', source('workflow.scenarios.json'),
      '--draft-output', target(id, 'reviewed.workflow-draft.json'), '--output', target(id, 'workflow.checks.json')]);
    await cli(['workflow', 'inspect-draft', '--draft', target(id, 'reviewed.workflow-draft.json'), '--output', target(id, 'publication.json')]);
    assert.equal((await read(target(id, 'publication.json'))).readyToPublish, true);
    await cli(['workflow', 'pack', '--draft', target(id, 'reviewed.workflow-draft.json'), '--output', target(id, 'promotion.workflow.json')]);
    await cli(['workflow', 'package-validate', target(id, 'promotion.workflow.json'), '--output', target(id, 'package.validation.json')]);
    await cli(['workflow', 'package-open', target(id, 'promotion.workflow.json'), '--output', target(id, 'verified.workflow.json')]);
    assert.deepEqual(await read(target(id, 'verified.workflow.json')), await read(target(id, 'promotion.workflow.json')));
  } else {
    await runCaseStage({ id, source, target, read, save, cli, inspect, answer, evaluate });
  }
}

// Keeping the case sequence separate makes the distinction visible: publishing
// fixes rules; answering a case supplies reviewed facts under those rules.
async function runCaseStage(context) {
  const { runCaseStage: execute } = await import('./case-stages.mjs');
  return execute(context);
}
