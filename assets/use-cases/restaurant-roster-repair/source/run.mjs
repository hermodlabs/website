import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { makeCase, makeModel, repairs, slots, employees, createdAt } from './model.mjs';
import { renderReport } from './render.mjs';

// Resolve the PUBLIC package exports from an installed consumer. This optional
// path is useful while preview npm access is limited; it does not import SDK internals.
const consumer = resolve(process.env.DECISION_LAB_CONSUMER ?? process.cwd());
const [sdkUrl, nodeUrl] = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
  'process.stdout.write(JSON.stringify([import.meta.resolve("@decision-lab/sdk"), import.meta.resolve("@decision-lab/sdk/node")]))'],
{ cwd: consumer, encoding: 'utf8' }));
const sdkEntry = fileURLToPath(sdkUrl);
const { createDecisionLab, commitment, EXECUTION_STATUS, SDK_VERSION } = await import(sdkUrl);
const { createNodeExecutor } = await import(nodeUrl);
const root = fileURLToPath(new URL('../', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const executor = createNodeExecutor();
const lab = createDecisionLab({ executor });
const save = async (path, value) => { await mkdir(dirname(path), { recursive: true }); await writeFile(path, lab.sources.renderJSON(value, { space: 2, maxBytes: 50_000_000 })); };
const specification = [
  { id: 'full-availability', label: 'Full Saturday availability', priority: 'feasibility-only', shortAvailability: false },
  { id: 'short-availability', label: 'Availability ends at 8 p.m.', priority: 'feasibility-only', shortAvailability: true },
  { id: 'stability-first', label: 'Preserve published assignments first', priority: 'stability-first', shortAvailability: false },
  { id: 'cost-first', label: 'Minimize remaining labor expense first', priority: 'cost-first', shortAvailability: false },
];
const story = {
  format: 'restaurant-roster-repair-story/1', fictional: true,
  scope: 'Four supplied complete repairs for all remaining Friday–Sunday services of one published week at one restaurant; earlier-week hours and latest shift ends retained.',
  manager: 'Elena', units: { money: 'USD cent', time: 'minute from Monday 00:00' },
  baselineExpenseMinor: 65600, remainingLaborBudgetMinor: 85600, additionalLaborBudgetMinor: 20000,
  cancelledUnpaidShift: { slotId: 'sat-dinner-cook-2', employeeId: 'nora', removedExpenseMinor: 8800 },
  employees, publishedAssignments: slots.map(slot => ({ ...slot, employeeId: slot.published })),
  scenarios: {},
};
try {
  const template = lab.templates.pack(lab.templates.create({ templateId: 'restaurant-complete-commitment', version: '1.0.0', pattern: 'complete-a-commitment/1', title: 'Compare complete restaurant roster repairs' }), { createdAt });
  await save(join(root, 'source', 'commitment.template.json'), template);
  const apps = new Map();
  for (const priority of ['feasibility-only', 'stability-first', 'cost-first']) {
    const model = makeModel(priority);
    const validation = commitment.validateModel(model);
    assert.equal(validation.valid, true, JSON.stringify(validation.errors));
    const source = JSON.stringify(model, null, 2);
    const app = lab.apps.pack(lab.apps.create({ template, appId: `restaurant-roster-${priority}`, release: 1, model, source }), { createdAt });
    apps.set(priority, lab.apps.open(app));
    await save(join(root, 'source', `${priority}.model.json`), model);
    await save(join(root, 'source', `${priority}.app.json`), app);
  }
  for (const spec of specification) {
    const app = apps.get(spec.priority), inputs = makeCase(spec);
    const bound = lab.cases.create({ app, inputs });
    const run = await lab.run({ app, case: bound, runId: `restaurant-${spec.id}`, createdAt,
      execution: { timeoutMs: 30_000 }, assessmentOptions: { maxPlans: 10, maxScenarioChecks: 10, maxOperations: 1_000_000 } });
    assert.equal(run.execution.status, EXECUTION_STATUS.COMPLETED, JSON.stringify(run.execution));
    const assessment = commitment.resolveCommitmentAssessment(run.assessment, run.report);
    assert.equal(commitment.isAssessmentComplete(assessment), true);
    assert.equal(assessment.coverage.evaluatedCandidates, 4);
    const scenario = {
      ...spec, executionStatus: run.execution.status, finding: assessment.finding,
      complete: commitment.isAssessmentComplete(assessment), feasible: commitment.hasFeasibleWitness(assessment),
      preferenceEstablished: commitment.hasEstablishedPreference(assessment), evaluatedCandidates: assessment.coverage.evaluatedCandidates,
      preferredRepairId: assessment.recommendation ? assessment.plans.find(plan => plan.id === assessment.recommendation.planId).choices.repair : null,
      modelHash: assessment.provenance.modelHash, moduleHash: assessment.provenance.moduleHash, caseHash: assessment.provenance.caseHash,
      reportUrl: `/assets/use-cases/restaurant-roster-repair/reports/${spec.id}/`,
      runUrl: `/assets/use-cases/restaurant-roster-repair/reports/${spec.id}/run.json`,
      assessmentUrl: `/assets/use-cases/restaurant-roster-repair/reports/${spec.id}/assessment.json`,
      modelUrl: `/assets/use-cases/restaurant-roster-repair/source/${spec.priority}.model.json`,
      repairs: assessment.plans.map(plan => {
        const derived = plan.scenarios[0].derived;
        const requirements = plan.scenarios[0].requirements.map(requirement => ({ ...requirement, label: assessment.requirements.find(row => row.id === requirement.id).label }));
        const first = plan.blockers[0];
        const slot = first && slots.find(row => first.constraintId.endsWith(row.id));
        const primaryBlocker = !first ? null : first.requirement === 'AVAILABILITY' ? `${slot?.serviceLabel ?? 'Assignment'}: recorded availability does not cover the complete shift.`
          : first.requirement === 'COVERAGE' ? `${slot?.serviceLabel ?? 'Service'}: one required cook position is unfilled.`
            : `${requirements.find(row => row.id === first.requirement)?.label ?? first.requirement} fails.`;
        return {
          id: plan.choices.repair, label: repairs.find(repair => repair.id === plan.choices.repair).label,
          nativePlanId: plan.id, complete: plan.complete, feasible: plan.feasible,
          preferred: assessment.recommendation?.tiedPlanIds.includes(plan.id) ?? false,
          expenseMinor: plan.expense, baselineExpenseMinor: derived.retainedBaselineExpense,
          additionalExpenseMinor: derived.additionalExpense, changedAssignments: derived.changedAssignments,
          requirements, blockers: plan.blockers, primaryBlocker,
          weeklyMinutes: Object.fromEntries(employees.filter(employee => employee.id !== 'unfilled').map(employee => [employee.id, derived[`minutes-${employee.id}`]])),
          assignments: plan.activities.map(activity => {
            const slot = slots.find(row => row.id === activity.id);
            return { slotId: slot.id, service: slot.service, serviceLabel: slot.serviceLabel, role: slot.role,
              start: activity.start, end: activity.end, employeeId: activity.actor, publishedEmployeeId: slot.published,
              changed: activity.actor !== slot.published };
          }),
        };
      }),
    };
    story.scenarios[spec.id] = scenario;
    const dir = join(root, 'reports', spec.id);
    await save(join(dir, 'run.json'), run);
    await save(join(dir, 'assessment.json'), assessment);
    await save(join(dir, 'case.json'), bound);
    await writeFile(join(dir, 'index.html'), renderReport(story, scenario));
  }
  assert.deepEqual(story.scenarios['full-availability'].repairs.filter(row => row.feasible).map(row => row.id), ['relief', 'coupled']);
  assert.deepEqual(story.scenarios['short-availability'].repairs.filter(row => row.feasible).map(row => row.id), ['coupled']);
  assert.equal(story.scenarios['stability-first'].preferredRepairId, 'relief');
  assert.equal(story.scenarios['cost-first'].preferredRepairId, 'coupled');
  await save(join(root, 'story-data.json'), story);
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name !== 'qualification.json' && !entry.name.endsWith('.png') && !entry.name.endsWith('.svg')) {
        const bytes = await readFile(path);
        files.push({ path: relative(root, path).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha(bytes) });
      }
    }
  }
  await walk(join(root, 'source'));
  await walk(join(root, 'reports'));
  const storyBytes = await readFile(join(root, 'story-data.json'));
  files.push({ path: 'story-data.json', bytes: storyBytes.length, sha256: sha(storyBytes) });
  const sdkDist = dirname(sdkEntry), sdkFiles = [];
  async function walkSdk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walkSdk(path);
      else sdkFiles.push({ path: relative(sdkDist, path).replaceAll('\\', '/'), sha256: sha(await readFile(path)) });
    }
  }
  await walkSdk(sdkDist);
  sdkFiles.sort((a, b) => a.path.localeCompare(b.path));
  await save(join(root, 'qualification.json'), { format: 'restaurant-roster-qualification/1', createdAt, sdkVersion: SDK_VERSION,
    publicEntrypoints: ['@decision-lab/sdk', '@decision-lab/sdk/node'], sdkDistFingerprint: sha(JSON.stringify(sdkFiles)),
    sdkFileCount: sdkFiles.length, files: files.sort((a, b) => a.path.localeCompare(b.path)),
    scenarios: Object.values(story.scenarios).map(scenario => ({ id: scenario.id, complete: scenario.complete, evaluatedCandidates: scenario.evaluatedCandidates, preferredRepairId: scenario.preferredRepairId })),
  });
  console.log(JSON.stringify({ output: root, scenarios: Object.keys(story.scenarios), retainedFiles: files.length }, null, 2));
} finally { await executor.close(); }
