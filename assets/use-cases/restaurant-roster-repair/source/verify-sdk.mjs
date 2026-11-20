// Optional focused native recalculation. Requires the qualified preview SDK.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { makeCase, makeModel } from './model.mjs';
import { inspectFixture } from './verify.mjs';
const consumer = resolve(process.env.DECISION_LAB_CONSUMER ?? process.cwd());
const sdkUrl = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
  'process.stdout.write(JSON.stringify(import.meta.resolve("@decision-lab/sdk")))'], { cwd: consumer, encoding: 'utf8' }));
const { commitment } = await import(sdkUrl);
const root = new URL('../', import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const story = await json('story-data.json');
const records = [];
for (const scenario of Object.values(story.scenarios)) {
  const retained = await json(`reports/${scenario.id}/assessment.json`);
  const recalculated = commitment.evaluateCommitmentModel(makeModel(scenario.priority, makeCase(scenario)), retained.coverage.limits);
  assert.deepEqual(recalculated, retained, `${scenario.id}: exact native recalculation`);
  records.push({ id: scenario.id, kind: 'exact-native-recalculation', complete: commitment.isAssessmentComplete(recalculated), evaluatedCandidates: recalculated.coverage.evaluatedCandidates });
}
const sat = 5 * 1440;
const tests = [
  { id: 'partial-availability', repair: 'relief', requirement: 'AVAILABILITY', change: input => { input.tables.availability.find(row => row.employee === 'rowan').through = sat + 20 * 60; } },
  { id: 'qualification', repair: 'coupled', requirement: 'QUALIFICATION', change: input => { input.tables.employees.find(row => row.id === 'ben').cook = false; } },
  { id: 'double-assignment', repair: 'relief', requirement: 'CAPACITY', change: input => { input.tables.assignments.find(row => row.id === 'relief')['sat-dinner-cook-2'] = 'luis'; } },
  { id: 'rest', repair: 'relief', requirement: 'REST', change: input => { input.tables.employees.find(row => row.id === 'rowan').lastEarlierShiftEnd = sat + 12 * 60; } },
  { id: 'hours', repair: 'coupled', requirement: 'HOURS', change: input => { input.tables.employees.find(row => row.id === 'ava').earlierWeekMinutes = 30 * 60; } },
  { id: 'budget', repair: 'relief', requirement: 'BUDGET', change: input => { input.parameters.remainingLaborBudgetMinor = 80000; } },
  { id: 'uncovered-break', repair: 'relief', requirement: 'AVAILABILITY', change: input => {
    const window = input.tables.availability.find(row => row.employee === 'ava');
    window.through = sat + 20 * 60;
    input.tables.availability.push({ id: 'ava-after-break', employee: 'ava', from: sat + 20 * 60 + 20, through: 7 * 1440 });
  } },
];
for (const test of tests) {
  const input = makeCase();
  test.change(input);
  const result = commitment.evaluateCommitmentModel(makeModel('feasibility-only', input));
  assert.equal(commitment.isAssessmentComplete(result), true, test.id);
  const plan = result.plans.find(plan => plan.choices.repair === test.repair);
  assert.equal(plan.feasible, false, test.id);
  assert.ok(plan.blockers.some(blocker => blocker.requirement === test.requirement), `${test.id}: native blocker`);
  for (const candidate of result.plans) {
    const oracle = inspectFixture(input, candidate.choices.repair);
    assert.equal(candidate.feasible, oracle.feasible, `${test.id}/${candidate.choices.repair}`);
    for (const requirement of candidate.scenarios[0].requirements) assert.equal(requirement.passed, oracle.checks[requirement.id], `${test.id}/${candidate.choices.repair}/${requirement.id}`);
  }
  records.push({ id: test.id, kind: 'negative-boundary', complete: true, evaluatedCandidates: result.coverage.evaluatedCandidates, repair: test.repair, blockers: plan.blockers });
}
const receipt = { format: 'restaurant-roster-sdk-checks/1', nativeRecalculations: 4, focusedNegativeChecks: tests.length,
  nativeCandidateChecks: records.length * 4, independentRequirementChecks: tests.length * 4 * 8, records };
if (process.argv.includes('--write')) await writeFile(new URL('source/sdk-checks.json', root), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ nativeRecalculations: 4, focusedNegativeChecks: tests.length, nativeCandidateChecks: receipt.nativeCandidateChecks, independentRequirementChecks: receipt.independentRequirementChecks }, null, 2));
