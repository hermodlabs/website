import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createDecisionLab, commitment } from '@decision-lab/sdk';

const read = async file => JSON.parse(await readFile(file, 'utf8'));
const section = (output, id) => output.brief.sections.find(row => row.id === id)?.value;

export async function verify(directory) {
  const lab = createDecisionLab();
  const pkg = lab.workflows.packages.open(await read(join(directory, 'author/promotion.workflow.json')));
  const appChecks = await read(join(directory, 'author/app.checks.json'));
  const workflowChecks = await read(join(directory, 'author/workflow.checks.json'));
  assert.equal(appChecks.status, 'passed');
  assert.equal(workflowChecks.passed, true);
  const saved = {};
  for (const name of ['intake', 'callouts', 'decision', 'changed-staffing']) {
    const run = lab.workflows.openRun(await read(join(directory, name, 'run.json')));
    assert.equal(run.definition.contentHash, pkg.workflow.contentHash);
    const output = lab.workflows.output({ run });
    assert.deepEqual(output.brief.issues, []);
    for (const evaluation of output.evaluations) {
      assert.equal(lab.runs.validate(evaluation.run).valid, true);
      assert.equal(lab.reports.validate(evaluation.run.report).valid, true);
      const assessment = commitment.resolveCommitmentAssessment(evaluation.run.assessment, evaluation.run.report);
      assert.equal(commitment.isAssessmentComplete(assessment), true);
      assert.equal(commitment.hasEstablishedPreference(assessment), false);
      assert.equal(assessment.recommendation, null);
    }
    saved[name] = { run, output };
  }
  const eligible = name => saved[name].output.steps[0].output.plans.filter(row => row.feasible).map(row => row.deployment);
  assert.deepEqual(eligible('intake'), ['hold', 'small-standard', 'large-standard', 'large-discount']);
  assert.deepEqual(eligible('callouts'), ['hold', 'small-standard']);
  assert.deepEqual(eligible('changed-staffing'), ['hold']);
  const economics = section(saved.decision.output, 'guest-thresholds');
  assert.deepEqual(economics.map(row => [row.breakEvenGuests, row.firstPositiveGuests]), [[null, null], [5, 6], [10, 11], [16, 17]]);
  assert.equal(section(saved.decision.output, 'decision').currentChoice, true);
  assert.equal(section(saved.decision.output, 'decision').specificAuthorizationRecorded, true);
  assert.equal(saved.decision.output.brief.complete, true);
  assert.equal(section(saved['changed-staffing'].output, 'decision').currentChoice, false);
  assert.equal(saved['changed-staffing'].output.brief.complete, false);
  assert(saved['changed-staffing'].run.evaluations.length > saved.decision.run.evaluations.length);
  console.log(`Verified ${appChecks.summary.total} app scenarios and ${workflowChecks.summary.total} workflow scenarios; complete native reports, $200 choice, 5/6 guest thresholds and reassessment history.`);
}
