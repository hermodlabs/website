#!/usr/bin/env node
// Continue the exact case exported by the React desk. This command does not
// import CSV snapshots over records Maya has just received, and never turns an
// analytical acceptance into booking authority or a delivery claim.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createDecisionLab, WORKFLOW_ANSWER_STATUS } from '@decision-lab/sdk';
import { CLI_EXIT_CODE } from '@decision-lab/cli';
import { openReviewJourney, updateReviewInputs, reviewJourneyInputs, inspectReviewJourney } from './src/reviewJourney.js';
import { relativeMinute } from './src/inputs.mjs';
import { invokeCLI } from './src/cli.mjs';
import { projectRun, renderHTML } from './src/report.mjs';
import { classify, nextAction } from './src/classify.mjs';

const folder = path.dirname(fileURLToPath(import.meta.url));
const json = value => `${JSON.stringify(value, null, 2)}\n`;
export async function continueReview({ reviewFile, outputDir, asOf, reviewInputs = false, actor, createdAt = new Date().toISOString() }) {
  if (!reviewFile || !outputDir) throw new Error('--review and a fresh --output directory are required.');
  const lab = createDecisionLab();
  const config = JSON.parse(await readFile(path.join(folder, 'config.json'), 'utf8'));
  const app = lab.apps.open(JSON.parse(await readFile(path.join(folder, config.appFile), 'utf8')));
  const definition = lab.workflows.open(JSON.parse(await readFile(path.join(folder, config.workflowFile), 'utf8')));
  if (definition.contentHash !== config.workflowHash) throw new Error('The operating workflow differs from its configured version.');
  let run = openReviewJourney({ lab, value: await readFile(reviewFile, 'utf8'), app, definition });
  if (asOf) {
    const inputs = structuredClone(run.case.inputs), currentTime = relativeMinute(asOf, config.timeOrigin, '--as-of');
    if (currentTime < inputs.parameters.currentTime) throw new Error('--as-of cannot move a review backward.');
    inputs.parameters.currentTime = currentTime;
    inputs.parameters.actionReady = Math.max(inputs.parameters.actionReady, currentTime);
    run = updateReviewInputs({ lab, run, inputs, at: createdAt });
  }
  if (reviewInputs) run = reviewJourneyInputs({ lab, run, actor, at: createdAt });
  if (run.answers.inputs.status !== WORKFLOW_ANSWER_STATUS.ACCEPTED) {
    throw new Error('Imported or changed inputs await review. Use --review-inputs --actor NAME only after reviewing the actual records.');
  }
  const output = path.resolve(outputDir);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output); // Deliberately refuse to overwrite an earlier operating review.
  const prepared = path.join(output, 'prepared-review.json'), destination = path.join(output, 'review.json');
  await writeFile(prepared, json(run));
  const transcript = [];
  // A current retained finding is already evaluated. Reopening it must not
  // invalidate a recorded booking by needlessly creating another assessment.
  const invocation = inspectReviewJourney({ lab, run }).currentRun
    ? (await writeFile(destination, json(run)), { exitCode: CLI_EXIT_CODE.COMPLETED })
    : await invokeCLI(['workflow', 'evaluate', '--run', prepared, '--step', 'planning',
      '--created-at', createdAt, '--output', destination], transcript);
  await writeFile(path.join(output, 'cli-commands.json'), json(transcript));
  if (invocation.exitCode !== CLI_EXIT_CODE.COMPLETED) throw new Error(invocation.stderr || 'The CLI could not complete the current review.');
  run = openReviewJourney({ lab, value: await readFile(destination, 'utf8'), app, definition });
  const view = inspectReviewJourney({ lab, run });
  await writeFile(path.join(output, 'case.json'), json(run.case.inputs));
  if (view.currentRun) {
    await writeFile(path.join(output, 'run.json'), json(view.currentRun));
    const current = projectRun(view.currentRun, config), before = view.previousRun ? projectRun(view.previousRun, config) : null;
    const row = { shipmentId: run.case.inputs.id, orderId: run.case.inputs.parameters.orderId,
      orderRevision: run.case.inputs.parameters.orderRevision, owner: view.context.owner,
      deadline: run.case.inputs.parameters.reservationDeadline, current, before, changes: [], diagnostics: [], sources: [],
      links: [{ label: 'Continue operating review', href: 'review.json' }, { label: 'Complete calculation', href: 'run.json' }] };
    row.status = classify(current, before, []); row.nextAction = nextAction(row);
    await writeFile(path.join(output, 'shipment.html'), renderHTML([row], { ...config, createdAt,
      operating: view.output.brief.sections.find(section => section.id === 'actual-shipment')?.value }));
  }
  return { run, outputDir: output };
}

export async function main(args = process.argv.slice(2)) {
  try {
    const options = {}, names = { '--review': 'reviewFile', '--output': 'outputDir', '--as-of': 'asOf', '--actor': 'actor', '--created-at': 'createdAt' };
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--review-inputs') { options.reviewInputs = true; continue; }
      const key = names[args[i]];
      if (!key || !args[i + 1] || args[i + 1].startsWith('--') || Object.hasOwn(options, key)) throw new Error(`Unknown, duplicate or incomplete option ${args[i]}.`);
      options[key] = args[++i];
    }
    const result = await continueReview(options);
    process.stdout.write(`Continued operating review: ${path.join(result.outputDir, 'review.json')}\n`);
    return CLI_EXIT_CODE.COMPLETED;
  } catch (error) { process.stderr.write(`${error.message}\n`); return CLI_EXIT_CODE.INVALID_INPUT; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = await main();
