// Portable checks: Node only. No Decision Lab preview package is required.
// This verifies retained native results; it does not present itself as the SDK.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { makeCase, makeModel, slots, repairs, employees } from './model.mjs';
const root = new URL('../', import.meta.url);
const bytes = path => readFile(new URL(path, root));
const json = async path => JSON.parse(await bytes(path));
const sha = value => createHash('sha256').update(value).digest('hex');
const stable = value => Array.isArray(value) ? value.map(stable) : value !== null && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const canonicalHash = value => sha(JSON.stringify(stable(value)));

// Decode the retained lossless object/array DAG, without evaluating any rule.
function expand(record) {
  const nodes = record.payload.nodes, seen = new Map();
  assert.ok(nodes.length < 100_000);
  function value(item) {
    if (item === null || typeof item !== 'object') return item;
    assert.deepEqual(Object.keys(item), ['ref']);
    const index = item.ref;
    assert.ok(Number.isInteger(index) && index >= 0 && index < nodes.length);
    if (seen.has(index)) return seen.get(index);
    const [kind, payload] = nodes[index];
    assert.ok(kind === 'array' || kind === 'object');
    const result = kind === 'array' ? payload.map(value) : Object.fromEntries(payload.map(([key, item]) => [key, value(item)]));
    seen.set(index, result);
    return result;
  }
  const result = value(record.payload.root);
  assert.equal(canonicalHash(result), record.assessmentHash);
  return result;
}

// Independent fixture arithmetic uses direct interval comparisons and ordinary
// loops, not the canonical expression evaluator. It checks each complete roster.
export function inspectFixture(inputs, repairId) {
  const people = Object.fromEntries(inputs.tables.employees.map(person => [person.id, person]));
  const assignments = inputs.tables.assignments.find(row => row.id === repairId);
  const checks = { BASIS: true, COVERAGE: true, QUALIFICATION: true, AVAILABILITY: true, CAPACITY: true, REST: true, HOURS: true, BUDGET: true };
  const totalMinutes = Object.fromEntries(inputs.tables.employees.map(person => [person.id, person.earlierWeekMinutes]));
  let expense = 0, changed = 0;
  for (const slot of slots) {
    const id = assignments[slot.id], person = people[id];
    assert.ok(person, `Declared employee exists: ${id}`);
    expense += person.fourHourFeeMinor;
    changed += Number(id !== slot.published);
    totalMinutes[id] += slot.duration;
    checks.COVERAGE &&= id !== 'unfilled';
    checks.QUALIFICATION &&= person[slot.role];
    const windows = inputs.tables.availability.filter(window => window.employee === id).sort((a, b) => a.from - b.from);
    let through = slot.start;
    for (const window of windows) {
      if (window.from > through) break;
      if (window.through > through) through = window.through;
    }
    checks.AVAILABILITY &&= through >= slot.end;
    checks.REST &&= slot.start - person.lastEarlierShiftEnd >= inputs.parameters.minimumRestMinutes;
    for (const booking of inputs.tables.bookings.filter(row => row.employee === id)) {
      if (Math.max(slot.start, booking.from) < Math.min(slot.end, booking.through)) checks.CAPACITY = false;
    }
  }
  for (let a = 0; a < slots.length; a++) for (let b = a + 1; b < slots.length; b++) {
    if (assignments[slots[a].id] !== assignments[slots[b].id]) continue;
    if (Math.max(slots[a].start, slots[b].start) < Math.min(slots[a].end, slots[b].end)) checks.CAPACITY = false;
    if (slots[b].start - slots[a].end < inputs.parameters.minimumRestMinutes) checks.REST = false;
  }
  for (const person of inputs.tables.employees.filter(row => row.id !== 'unfilled')) checks.HOURS &&= totalMinutes[person.id] <= person.weeklyLimitMinutes;
  checks.BUDGET = expense <= inputs.parameters.remainingLaborBudgetMinor;
  return { checks, feasible: Object.values(checks).every(Boolean), expense, changed,
    additionalExpense: expense - 65600,
    weeklyMinutes: Object.fromEntries(Object.entries(totalMinutes).filter(([id]) => id !== 'unfilled')) };
}

export async function verifyRetained() {
  const manifest = await json('qualification.json'), story = await json('story-data.json');
  let hashChecks = 0, candidateChecks = 0;
  for (const file of manifest.files) {
    const data = await bytes(file.path);
    assert.equal(data.length, file.bytes, `${file.path} byte length`);
    assert.equal(sha(data), file.sha256, `${file.path} exact source/output hash`);
    hashChecks++;
  }
  assert.equal(story.baselineExpenseMinor, 65600);
  assert.equal(story.remainingLaborBudgetMinor, 85600);
  assert.equal(story.additionalLaborBudgetMinor, 20000);
  assert.equal(story.cancelledUnpaidShift.removedExpenseMinor, 8800);
  assert.deepEqual(story.publishedAssignments, slots.map(slot => ({ ...slot, employeeId: slot.published })));
  assert.deepEqual(story.employees, employees);
  const full = makeCase(), short = makeCase({ shortAvailability: true });
  const shortRestored = structuredClone(short);
  shortRestored.id = full.id;
  shortRestored.tables.availability.find(row => row.employee === 'rowan').through += 120;
  assert.deepEqual(shortRestored, full, 'Availability scenario changes only case identity and Rowan’s end time.');
  for (const [id, scenario] of Object.entries(story.scenarios)) {
    const raw = await json(`reports/${id}/assessment.json`), run = await json(`reports/${id}/run.json`), bound = await json(`reports/${id}/case.json`);
    const inputs = makeCase(scenario);
    assert.deepEqual(bound.inputs, inputs);
    assert.deepEqual(run.input, bound, 'Run retains the exact frozen case.');
    assert.deepEqual(await json(`source/${scenario.priority}.model.json`), makeModel(scenario.priority));
    assert.deepEqual(bound.model.module, makeModel(scenario.priority).module);
    assert.equal(run.execution.status, 'completed');
    assert.equal(raw.status, 'complete');
    assert.equal(raw.coverage.complete, true);
    assert.equal(raw.coverage.admissionComplete, true);
    assert.equal(raw.coverage.evaluatedCandidates, 4);
    assert.equal(raw.coverage.totalCandidates, 4);
    assert.equal(raw.coverage.evaluatedPlanScenarioChecks, 4);
    assert.deepEqual(expand(run.report.datasets.commitment.assessment), raw, 'Complete report losslessly retains the same native assessment.');
    assert.equal(run.assessment.assessmentHash, canonicalHash(raw));
    const app = await json(`source/${scenario.priority}.app.json`);
    assert.equal(bound.binding.packageHash, app.contentHash);
    assert.equal(bound.binding.moduleHash, canonicalHash(bound.model.module));
    assert.equal(raw.provenance.caseHash, canonicalHash(inputs));
    assert.deepEqual(raw.plans.map(plan => plan.choices.repair), repairs.map(repair => repair.id));
    const feasible = [];
    for (const plan of raw.plans) {
      const repair = scenario.repairs.find(row => row.id === plan.choices.repair);
      const oracle = inspectFixture(inputs, repair.id);
      assert.equal(plan.complete, true);
      assert.equal(plan.feasible, oracle.feasible, `${id}/${repair.id}: independent requirements`);
      assert.equal(plan.expense, oracle.expense);
      assert.equal(plan.scenarios[0].derived.changedAssignments, oracle.changed);
      assert.equal(plan.scenarios[0].derived.additionalExpense, oracle.additionalExpense);
      assert.equal(plan.scenarios[0].derived.retainedBaselineExpense, 65600);
      for (const requirement of plan.scenarios[0].requirements) assert.equal(requirement.passed, oracle.checks[requirement.id], `${id}/${repair.id}/${requirement.id}`);
      assert.equal(repair.feasible, plan.feasible);
      assert.equal(repair.expenseMinor, oracle.expense);
      assert.equal(repair.additionalExpenseMinor, oracle.additionalExpense);
      assert.equal(repair.changedAssignments, oracle.changed);
      assert.deepEqual(repair.weeklyMinutes, oracle.weeklyMinutes);
      assert.deepEqual(repair.blockers, plan.blockers);
      for (const assignment of repair.assignments) {
        const slot = slots.find(row => row.id === assignment.slotId);
        assert.equal(assignment.employeeId, inputs.tables.assignments.find(row => row.id === repair.id)[slot.id]);
        assert.equal(assignment.start, slot.start);
        assert.equal(assignment.end, slot.end);
        assert.equal(assignment.changed, assignment.employeeId !== slot.published);
      }
      if (oracle.feasible) feasible.push({ id: repair.id, nativeId: plan.id, expense: oracle.expense, changes: oracle.changed });
      candidateChecks++;
    }
    const preferred = scenario.priority === 'feasibility-only' ? null : feasible.sort((a, b) => scenario.priority === 'stability-first'
      ? a.changes - b.changes || a.expense - b.expense : a.expense - b.expense || a.changes - b.changes)[0];
    assert.equal(scenario.preferredRepairId, preferred?.id ?? null);
    assert.equal(raw.recommendation?.planId ?? null, preferred?.nativeId ?? null);
    assert.equal(raw.preference.optimalityEstablished, Boolean(preferred));
    if (id === 'short-availability') assert.deepEqual(raw.plans.find(plan => plan.choices.repair === 'relief').blockers, [{ constraintId: 'available-sat-dinner-cook-2', requirement: 'AVAILABILITY', scenarioId: 'recorded-week' }]);
  }
  assert.deepEqual(story.scenarios['full-availability'].repairs.filter(row => row.feasible).map(row => row.id), ['relief', 'coupled']);
  assert.deepEqual(story.scenarios['short-availability'].repairs.filter(row => row.feasible).map(row => row.id), ['coupled']);
  const basis = story.scenarios['full-availability'].repairs;
  assert.equal(basis.find(row => row.id === 'relief').additionalExpenseMinor - basis.find(row => row.id === 'coupled').additionalExpenseMinor, 10000);
  return { hashChecks, candidateChecks, nativeRuns: 4, independentRequirementChecks: candidateChecks * 8 };
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  console.log(JSON.stringify(await verifyRetained(), null, 2));
}
