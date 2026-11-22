import assert from 'node:assert/strict';
import test from 'node:test';
import { createDecisionLab, createWorkflowDefinition, validateWorkflowDefinition, openWorkflowDefinition, learning, WORKFLOW_ANSWER_STATUS } from '@decision-lab/sdk';
import { createNodeExecutor } from '@decision-lab/sdk/node';
import { growthAuthor, createGrowthAuthor } from '../model.mjs';
import { makeGrowthWorkflow } from '../workflow.mjs';
import { makeGrowthLearningModel, makeLearningGrowthCase, makeLearningInputs, LEARNING_STUDY } from '../learning.mjs';
import config from '../workflow-config.json' with { type: 'json' };

const lab = createDecisionLab({ executor: createNodeExecutor() });
const templateFor = pattern => lab.templates.pack(lab.templates.create({ templateId: pattern.split('/')[0], version: '1.0.0', pattern, title: pattern }), { createdAt: config.publishedAt });
const packageFor = (author = growthAuthor) => lab.apps.pack(lab.apps.create({ template: templateFor('complete-a-commitment/1'), appId: 'compare-growth-arrangements', release: 1, model: author.makeModel() }), { createdAt: config.publishedAt });
const app = packageFor();
const learningModel = await makeGrowthLearningModel({ author: growthAuthor, planningApp: app, lab, createdAt: config.publishedAt });
const learningApp = lab.apps.pack(lab.apps.create({ template: templateFor('assess-value-of-learning/1'), appId: 'assess-payment-terms-test', release: 1, model: learningModel }), { createdAt: config.publishedAt });
const definition = createWorkflowDefinition(makeGrowthWorkflow({ author: growthAuthor, app, learningApp }));
const start = caseData => lab.workflows.start({ definition, case: caseData ?? definition.initialCase, createdAt: config.publishedAt, inputOrigin: 'example' });
const solve = async caseData => {
  const run = await lab.workflows.solve({ run: start(caseData), createdAt: config.publishedAt });
  return { run, output: lab.workflows.output({ run }) };
};
const operating = output => output.steps.find(step => step.id === 'planning');
const plans = output => operating(output).output?.plans ?? [];
const plan = (output, id) => plans(output).find(row => row.id === id);
const view = (output, id) => output.questionViews.find(view => view.id === id);
const enabledCase = () => {
  const input = makeLearningGrowthCase(growthAuthor);
  return { growth: { ...input.parameters, ...Object.fromEntries(Object.entries(input.tables).filter(([key]) => !key.startsWith('_'))) },
    learning: { enabled: true, basis: Object.fromEntries(Object.entries(makeLearningInputs()).filter(([key]) => key !== 'enabled')) } };
};

test('a portable workflow uses pinned shared templates and minimal question-led report definitions', () => {
  assert.deepEqual(validateWorkflowDefinition(definition), { valid: true, issues: [] });
  assert.deepEqual(openWorkflowDefinition(JSON.stringify(definition)), definition);
  assert.equal(definition.execution.mode, 'calculation');
  assert.deepEqual(definition.dependencies.map(row => row.app.app.model.format), ['complete-a-commitment/1', 'assess-value-of-learning/1']);
  assert.deepEqual(definition.steps.map(row => row.id), ['planning', 'planning-after-test', 'learning']);
  const report = definition.metadata.presentation.report;
  assert.deepEqual(report.decisionSummary.sections.map(row => row.id), ['options', 'next-actions', 'assumptions', 'questions']);
  assert.deepEqual(report.tabs.map(row => row.id), ['conditions', 'cash', 'capacity', 'hurdle', 'learning']);
  assert.equal(report.tabs.find(row => row.id === 'cash').kind, 'cash-flow');
  assert.ok(definition.questions.every(row => !row.path.includes('_resources') && !row.path.includes('_bookings')));
  assert.equal(definition.metadata.presentation.questions['opening-cash'].displayScale, 100);
});

test('the default comparison exposes the funding and delivery blockers without inventing a winner', async () => {
  const { output } = await solve();
  assert.equal(operating(output).status, 'complete', JSON.stringify(operating(output).issues));
  assert.deepEqual(plans(output).filter(row => row.feasible).map(row => row.id), ['baseline', 'small-invoice', 'medium-prepay']);
  assert.deepEqual(plans(output).map(row => row.peakFundingRequired), [0, 2800000, 700000, 400000]);
  assert.deepEqual(plans(output).map(row => row.cashHeadroom), [1200000, -1600000, 500000, 800000]);
  assert.deepEqual(plans(output).map(row => row.capacityHeadroom), [140, -60, 90, 40]);
  assert.ok(plans(output).every(row => row.preferred === false));
  assert.equal(output.steps.find(row => row.id === 'learning').status, 'not-applicable');
  assert.equal(output.decisionSummary.finding.availability, 'available');
  assert.equal(output.brief.complete, true);
  assert.equal(view(output, 'arrangement-details').selection.defaultKey, 'baseline');
});

test('campaign hurdle uses whole-customer arithmetic and never claims that demand is established', async () => {
  const { output } = await solve();
  const hurdle = output.brief.sections.find(row => row.id === 'operating-detail').value;
  const medium = hurdle.find(row => row.arrangementId === 'medium-prepay');
  const baseline = hurdle.find(row => row.arrangementId === 'baseline');
  assert.equal(baseline.customersToReachTarget, null);
  assert.equal(baseline.customersToExceedExpense, null);
  assert.equal(baseline.hurdleStatus, 'No incremental campaign; no acquisition hurdle applies.');
  assert.equal(medium.campaignExpense, 400000);
  assert.equal(medium.unitContribution, 100000);
  assert.equal(medium.customersToReachTarget, 4);
  assert.equal(medium.customersToExceedExpense, 5);
  assert.match(medium.hurdleStatus, /not established/);
  const input = structuredClone(definition.initialCase); input.growth.campaignSurplusTargetMinor = 1;
  const changed = (await solve(input)).output.brief.sections.find(row => row.id === 'operating-detail').value.find(row => row.arrangementId === 'medium-prepay');
  assert.equal(changed.customersToReachTarget, 5, 'One additional cent above an exact boundary needs another complete customer.');
});

test('nonpositive contribution leaves the customer hurdle unavailable rather than dividing by zero', async () => {
  const input = structuredClone(definition.initialCase); input.growth.unitPriceMinor = input.growth.deliveryExpensePerCustomerMinor;
  const { output } = await solve(input);
  assert.equal(operating(output).status, 'complete');
  const detail = output.brief.sections.find(row => row.id === 'operating-detail').value.find(row => row.arrangementId === 'medium-prepay');
  assert.equal(detail.customersToReachTarget, null);
  assert.equal(detail.customersToExceedExpense, null);
  assert.match(detail.hurdleStatus, /Nonpositive/);
  input.growth.arrangements.find(row => row.id === 'medium-prepay').campaignExpenseMinor = 0;
  const zero = (await solve(input)).output.brief.sections.find(row => row.id === 'operating-detail').value.find(row => row.arrangementId === 'medium-prepay');
  assert.equal(zero.customersToReachTarget, 0);
  assert.equal(zero.customersToExceedExpense, null);
  assert.match(zero.hurdleStatus, /zero campaign expense/);
  input.growth.campaignSurplusTargetMinor = 100;
  const positive = (await solve(input)).output.brief.sections.find(row => row.id === 'operating-detail').value.find(row => row.arrangementId === 'medium-prepay');
  assert.equal(positive.customersToReachTarget, null);
  assert.match(positive.hurdleStatus, /positive hurdle/);
});

test('the authentic standalone learning seed has a complete operating basis for every action, state and context', () => {
  const assessment = learning.evaluateLearningModel(learningModel);
  assert.equal(assessment.status, 'complete', JSON.stringify(assessment.admission));
  assert.equal(learningModel.module.executionFeasibility.version, 1);
  assert.equal(learningModel.case.executionFeasibility.eligibility.length, 16);
  assert.ok(learningModel.case.executionFeasibility.eligibility.every(row => /[a-f0-9]{64}/.test(row.source)));
  assert.ok(learningModel.case.executionFeasibility.reportSupport.every(row => row.possible === true));
  assert.ok(assessment.studies[0].branches.some(row => row.id === 'inconclusive'));
});

test('optional learning uses native economic findings and source-backed eligibility before and after the test', async () => {
  const { run, output } = await solve(enabledCase());
  for (const step of output.steps) assert.equal(step.status, 'complete', `${step.id}: ${JSON.stringify(step.issues)}`);
  const evaluation = run.evaluations.find(row => row.stepId === 'learning');
  const input = evaluation.run.input.model.case;
  const assessment = evaluation.run.assessment;
  assert.equal(input.executionFeasibility.eligibility.length, 16);
  for (const source of input.executionFeasibility.eligibility) {
    const sourceStep = source.context === 'no-study' ? 'planning' : 'planning-after-test';
    assert.ok(source.source.includes(output.steps.find(row => row.id === sourceStep).runHash));
  }
  assert.deepEqual(input.payoffs.filter(row => row.action === 'medium-prepay').map(row => row.value), [1600000, -200000]);
  assert.deepEqual(assessment.baseline.bestActionIds, ['small-invoice']);
  assert.deepEqual(assessment.recommendation.bestIds, [LEARNING_STUDY]);
  assert.equal(assessment.baseline.expectedPayoff, 800000);
  assert.equal(assessment.recommendation.bestValue, 980000);
  const study = assessment.studies[0];
  assert.deepEqual(study.branches.find(row => row.id === 'favorable').bestActionIds, ['medium-prepay']);
  assert.deepEqual(study.branches.find(row => row.id === 'unfavorable').bestActionIds, ['small-invoice']);
  assert.deepEqual(study.branches.find(row => row.id === 'inconclusive').bestActionIds, ['small-invoice']);
  const before = run.evaluations.find(row => row.stepId === 'planning').run.input.model.case;
  const after = run.evaluations.find(row => row.stepId === 'planning-after-test').run.input.model.case;
  assert.equal(after.parameters.openingCashMinor, before.parameters.openingCashMinor - input.studies[0].fee);
  assert.equal(after.parameters.currentDay, before.parameters.currentDay + input.studies[0].duration);
});

test('a late preference test cannot retain a growth response after the native commitment cutoff', async () => {
  const input = enabledCase(); input.learning.basis.durationDays = input.growth.decisionDeadlineDay + 1;
  const { run, output } = await solve(input);
  assert.equal(output.steps.find(row => row.id === 'learning').status, 'complete');
  const assessment = run.evaluations.find(row => row.stepId === 'learning').run.assessment;
  assert.deepEqual(assessment.recommendation.bestIds, ['no-study']);
  const eligibility = run.evaluations.find(row => row.stepId === 'learning').run.input.model.case.executionFeasibility.eligibility;
  assert.ok(eligibility.filter(row => row.context === LEARNING_STUDY && row.action !== 'baseline').every(row => row.eligible === false));
  assert.ok(eligibility.filter(row => row.context === LEARNING_STUDY && row.action === 'baseline').every(row => row.eligible));
});

test('a preference signal cannot waive capacity even when its prior probability is zero', async () => {
  const input = enabledCase(); input.growth.capacityPeriods[0].availableHours = 70;
  input.learning.basis.priors = [{ state: 'prepay-accepted', probability: 0 }, { state: 'prepay-weak', probability: 1 }];
  const { run, output } = await solve(input);
  assert.equal(output.steps.find(row => row.id === 'learning').status, 'complete');
  const assessment = run.evaluations.find(row => row.stepId === 'learning').run.assessment;
  assert.deepEqual(assessment.recommendation.bestIds, ['no-study']);
  assert.ok(assessment.studies[0].branches.every(branch => !branch.bestActionIds.includes('medium-prepay')));
  assert.equal(plan(output, 'medium-prepay').feasible, false);
});

test('missing learning assumptions never block the operating decision and unknown cash is never fabricated as zero', async () => {
  let run = start(enabledCase());
  run = lab.workflows.answer({ run, questionId: 'learning-basis', status: WORKFLOW_ANSWER_STATUS.UNKNOWN, at: config.publishedAt });
  run = await lab.workflows.solve({ run, createdAt: config.publishedAt });
  let output = lab.workflows.output({ run });
  assert.equal(operating(output).status, 'complete');
  assert.equal(output.decisionSummary.finding.availability, 'available');
  assert.notEqual(output.steps.find(row => row.id === 'learning').status, 'complete');
  run = lab.workflows.answer({ run, questionId: 'opening-cash', status: WORKFLOW_ANSWER_STATUS.UNKNOWN, at: config.publishedAt });
  output = lab.workflows.output({ run });
  assert.equal(Object.hasOwn(run.case.growth, 'openingCashMinor'), false);
  assert.equal(operating(output).status, 'stale');
  assert.equal(output.decisionSummary.finding.availability, 'stale');
});

test('an unfunded reserve remains an operating blocker without creating a negative learning cash budget', async () => {
  const input = enabledCase(); input.growth.minimumReserveMinor = input.growth.openingCashMinor + 1;
  const { run, output } = await solve(input);
  assert.equal(operating(output).status, 'complete');
  assert.equal(output.decisionSummary.finding.status, 'blocked');
  assert.equal(output.steps.find(row => row.id === 'learning').status, 'invalid');
  assert.ok(output.steps.find(row => row.id === 'learning').issues.some(row => row.checkId === 'reserve-funded'));
  assert.equal(run.evaluations.some(row => row.stepId === 'learning'), false);
  assert.equal(output.brief.issues.length, 0);
});

test('keeping the current approach does not hide the next action to resolve blocked expansion', async () => {
  const input = structuredClone(definition.initialCase); input.growth.minimumReserveMinor = 900000;
  let result = (await solve(input)).output;
  assert.deepEqual(plans(result).filter(plan => plan.feasible).map(plan => plan.id), ['baseline']);
  const applicable = id => result.decisionProcess.actions.find(action => action.id === id).status === 'applicable';
  assert.equal(applicable('compare-arrangements'), true);
  assert.equal(applicable('resolve-blockers'), true);
  assert.equal(result.decisionProcess.edges.find(edge => edge.id === 'growth-blocked').status, 'applicable');
  input.growth.minimumReserveMinor = input.growth.openingCashMinor + 1;
  result = (await solve(input)).output;
  assert.equal(applicable('compare-arrangements'), false);
  assert.equal(applicable('resolve-blockers'), true);
});

test('changed quotes invalidate planning and its dependent learning eligibility', async () => {
  const { run: before } = await solve(enabledCase());
  const arrangements = structuredClone(before.case.growth.arrangements); arrangements.find(row => row.id === 'medium-prepay').campaignExpenseMinor += 10000;
  const run = lab.workflows.answer({ run: before, questionId: 'campaign-expenses', status: WORKFLOW_ANSWER_STATUS.SUPPLIED, value: arrangements, at: config.publishedAt });
  const output = lab.workflows.output({ run });
  assert.ok(output.steps.every(step => step.status === 'stale'));
});

test('adapted app vocabulary remains configuration rather than a custom renderer', () => {
  const profile = structuredClone(growthAuthor.profile); profile.money = 'EUR cent'; profile.arrangements.find(row => row.id === 'medium-prepay').label = 'Prepaid installation package';
  const author = createGrowthAuthor(profile), adapted = createWorkflowDefinition(makeGrowthWorkflow({ author, app: packageFor(author) }));
  assert.equal(adapted.metadata.presentation.display.currency, 'EUR');
  assert.equal(adapted.metadata.presentation.display.names['medium-prepay'], 'Prepaid installation package');
  assert.equal(adapted.metadata.presentation.questions['opening-cash'].unit, 'EUR');
  assert.deepEqual(adapted.metadata.presentation.report.questionViews, createWorkflowDefinition(makeGrowthWorkflow({ author: growthAuthor, app })).metadata.presentation.report.questionViews);
});
