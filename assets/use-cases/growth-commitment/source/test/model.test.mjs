import assert from 'node:assert/strict';
import test from 'node:test';
import { commitment, createDecisionLab } from '@decision-lab/sdk';
import { createNodeExecutor } from '@decision-lab/sdk/node';
import profile from '../profile.json' with { type: 'json' };
import { createGrowthAuthor, makeCase, makeModel, validateCaseInput, validateGrowthProfile } from '../model.mjs';
import { growthCases } from '../fixtures/cases.mjs';

const assess = (input = makeCase()) => {
  const model = makeModel(input), validation = commitment.validateModel(model);
  assert.equal(validation.valid, true, JSON.stringify(validation.errors));
  const result = commitment.evaluateCommitmentModel(model);
  assert.equal(commitment.isAssessmentComplete(result), true, JSON.stringify(result.errors));
  assert.equal(result.coverage.complete, true);
  assert.equal(result.recommendation, null);
  return result;
};
const plan = (result, id) => result.plans.find(row => row.choices.arrangement === id);
const values = (result, id, scenario = 'recorded') => plan(result, id).scenarios.find(row => row.id === scenario).derived;
const finance = (result, id, scenario = 'recorded') => plan(result, id).scenarios.find(row => row.id === scenario).finance;
const feasible = result => result.plans.filter(row => row.feasible).map(row => row.choices.arrangement);
const blocker = (result, id, requirement) => assert.ok(plan(result, id).blockers.some(row => row.requirement === requirement), `${id} should fail ${requirement}`);

// Independent reference arithmetic: this deliberately reads business inputs
// rather than evaluator outputs, and does not call a Decision Lab expression.
function expectedCash(input, arrangement, scenario) {
  const terms = input.parameters, quote = input.tables.arrangements.find(row => row.id === arrangement);
  const outcome = input.tables.outcomes.find(row => row.arrangement === arrangement && row.scenario === scenario);
  const entries = [
    { id: 'campaign-payment', at: outcome.campaignExpenseDay, order: 0, change: -quote.campaignExpenseMinor },
    { id: 'delivery-payment', at: outcome.deliveryExpenseDay, order: 1, change: -outcome.customers * terms.deliveryExpensePerCustomerMinor },
    { id: 'customer-receipt', at: outcome.customerReceiptDay, order: 2, change: outcome.customers * terms.unitPriceMinor },
  ].sort((a, b) => a.at - b.at || a.order - b.order);
  let balance = terms.openingCashMinor, minimum = balance, first = null;
  for (const entry of entries) {
    balance += entry.change; minimum = Math.min(minimum, balance);
    if (first === null && balance < terms.minimumReserveMinor) first = { id: entry.id, at: entry.at, shortfall: terms.minimumReserveMinor - balance };
  }
  return { endingBalance: balance, lowestBalance: minimum, minimumHeadroom: minimum - terms.minimumReserveMinor, peakFundingRequired: terms.openingCashMinor - minimum, first };
}

test('the growth comparison separates cash funding, complete expense and delivery capacity', () => {
  const input = makeCase(), before = structuredClone(input), result = assess(input);
  assert.deepEqual(feasible(result), ['baseline', 'small-invoice', 'medium-prepay']);
  assert.deepEqual(result.plans.map(row => row.worstPeakCash), [0, 2800000, 700000, 400000]);
  assert.deepEqual(result.plans.map(row => row.expense), [0, 2800000, 700000, 1400000]);
  assert.deepEqual(result.plans.map(row => row.scenarios[0].derived.capacityHours), [0, 200, 50, 100]);
  blocker(result, 'large-invoice', 'CASH'); blocker(result, 'large-invoice', 'CAPACITY');
  assert.equal(finance(result, 'large-invoice').firstReserveBreach.shortfall, 1600000);
  assert.equal(finance(result, 'large-invoice').firstReserveBreach.at, 7);
  assert.equal(values(result, 'medium-prepay').netContribution, 1600000);
  assert.equal(values(result, 'medium-prepay').contributionPerCustomer, 100000);
  assert.deepEqual(input, before);
});

test('cash accounting agrees with a separately written ledger across joint situations', () => {
  const input = growthCases()['weak-demand'], result = assess(input);
  assert.equal(result.coverage.totalScenarios, 2);
  assert.equal(result.coverage.evaluatedPlanScenarioChecks, 8);
  for (const alternative of input.tables.arrangements) for (const situation of input.tables.scenarios) {
    const expected = expectedCash(input, alternative.id, situation.id), actual = finance(result, alternative.id, situation.id);
    for (const key of ['endingBalance', 'lowestBalance', 'minimumHeadroom', 'peakFundingRequired']) assert.equal(actual[key], expected[key], `${alternative.id}/${situation.id}/${key}`);
    assert.equal(actual.firstReserveBreach?.eventId ?? null, expected.first?.id ?? null);
    assert.equal(actual.firstReserveBreach?.shortfall ?? null, expected.first?.shortfall ?? null);
  }
  assert.equal(values(result, 'medium-prepay', 'weak-demand').customers, 3);
  assert.equal(values(result, 'medium-prepay', 'weak-demand').netContribution, -100000);
  // It can be executable and still unattractive. Feasibility does not decide
  // whether the fictional campaign will produce enough customers.
  assert.equal(plan(result, 'medium-prepay').feasible, true);
});

test('committed campaign spending does not disappear when customer demand is zero', () => {
  const result = assess(growthCases()['zero-sales']);
  assert.deepEqual(result.plans.map(row => row.expense), [0, 800000, 200000, 400000]);
  assert.deepEqual(result.plans.map(row => row.scenarios[0].derived.capacityHours), [0, 0, 0, 0]);
  assert.deepEqual(result.plans.map(row => row.scenarios[0].derived.netContribution), [0, -800000, -200000, -400000]);
  assert.deepEqual(result.plans.map(row => row.worstPeakCash), [0, 800000, 200000, 400000]);
});

test('a positive ending cash balance cannot hide an earlier reserve breach', () => {
  const result = assess();
  assert.equal(finance(result, 'large-invoice').endingBalance, 4400000);
  assert.equal(finance(result, 'large-invoice').lowestBalance, -1600000);
  blocker(result, 'large-invoice', 'CASH');
  const reserved = assess(growthCases()['protected-reserve']);
  assert.deepEqual(feasible(reserved), ['baseline']);
  blocker(reserved, 'small-invoice', 'CASH'); blocker(reserved, 'medium-prepay', 'CASH');
  assert.equal(finance(reserved, 'medium-prepay').firstReserveBreach.shortfall, 100000);
});

test('same-day receipts follow payments according to the published event order', () => {
  const input = makeCase({ parameters: { openingCashMinor: 400000 } });
  const prepay = input.tables.outcomes.find(row => row.arrangement === 'medium-prepay');
  prepay.customerReceiptDay = prepay.deliveryExpenseDay;
  const result = assess(input), actual = finance(result, 'medium-prepay');
  assert.deepEqual(actual.cashEvents.map(row => row.id), ['campaign-payment', 'delivery-payment', 'customer-receipt']);
  assert.equal(actual.lowestBalance, -1000000);
  assert.equal(actual.endingBalance, 2000000);
  assert.equal(actual.firstReserveBreach.at, 7);
  blocker(result, 'medium-prepay', 'CASH');
});

test('delivery capacity is checked within its declared period and never borrowed from another one', () => {
  const input = makeCase();
  input.tables.capacityPeriods = [{ id: 'first-week', from: 0, through: 7, availableHours: 500 }, { id: 'second-week', from: 7, through: 14, availableHours: 90 }];
  input.tables.outcomes.forEach(row => { row.capacityPeriod = row.arrangement === 'baseline' ? 'first-week' : 'second-week'; });
  const result = assess(input);
  assert.equal(values(result, 'medium-prepay').capacityHeadroom, -10); blocker(result, 'medium-prepay', 'CAPACITY');
  assert.equal(plan(result, 'small-invoice').feasible, true);
  input.tables.outcomes.find(row => row.arrangement === 'small-invoice').deliveryFinishDay = 15;
  blocker(assess(input), 'small-invoice', 'CAPACITY');
  assert.deepEqual(feasible(assess(growthCases()['capacity-shortage'])), ['baseline']);
});

test('the horizon includes the actual collection date and cannot truncate the obligation', () => {
  const late = growthCases()['late-collection'], result = assess(late);
  blocker(result, 'small-invoice', 'TIME');
  assert.equal(finance(result, 'small-invoice').cashEvents.at(-1).at, 61);
  late.parameters.horizonDay = 61;
  assert.equal(plan(assess(late), 'small-invoice').feasible, true);
  const short = makeCase({ parameters: { horizonDay: 13 } });
  assert.deepEqual(feasible(assess(short)), ['baseline']);
});

test('unused zero-value dates do not invent baseline obligations beyond the horizon', () => {
  const input = makeCase({ parameters: { horizonDay: 20 } });
  const baseline = input.tables.outcomes.find(row => row.arrangement === 'baseline');
  for (const key of ['campaignExpenseDay', 'deliveryExpenseDay', 'customerReceiptDay', 'deliveryStartDay', 'deliveryFinishDay']) baseline[key] = 30;
  const result = assess(input);
  assert.equal(plan(result, 'baseline').feasible, true, 'No incremental customers or payments creates no future delivery or collection obligation.');
  blocker(result, 'small-invoice', 'TIME');
  assert.equal(plan(result, 'medium-prepay').feasible, true);

  const noSales = growthCases()['zero-sales']; noSales.parameters.horizonDay = 2;
  const committed = assess(noSales);
  assert.equal(plan(committed, 'baseline').feasible, true);
  for (const id of ['large-invoice', 'small-invoice', 'medium-prepay']) {
    blocker(committed, id, 'TIME');
    assert.ok(finance(committed, id).expense > 0, 'Zero customers never removes the committed campaign payment on day three.');
  }
});

test('payment terms and the commitment cutoff retain their published meaning', () => {
  blocker(assess(growthCases()['late-prepayment']), 'medium-prepay', 'TERMS');
  const earlyInvoice = makeCase(); earlyInvoice.tables.outcomes.find(row => row.arrangement === 'small-invoice').customerReceiptDay = 13;
  blocker(assess(earlyInvoice), 'small-invoice', 'TERMS');
  const missed = assess(growthCases()['missed-cutoff']);
  assert.deepEqual(feasible(missed), ['baseline']);
  for (const id of ['large-invoice', 'small-invoice', 'medium-prepay']) blocker(missed, id, 'TIME');
});

test('unknown forecasts, incomplete situation matrices and unsafe money fail without coercion', () => {
  for (const mutate of [
    input => { input.parameters.openingCashMinor = null; },
    input => { input.parameters.deliveryHoursPerCustomer = 0; },
    input => { input.tables.outcomes[1].customers = '40'; },
    input => { delete input.tables.outcomes[2].customers; },
    input => { input.tables.outcomes[1].customers = Number.MAX_SAFE_INTEGER; },
    input => { input.tables.outcomes.pop(); },
    input => { input.tables.outcomes.push(structuredClone(input.tables.outcomes[0])); },
    input => { input.tables.scenarios.push({ id: 'unfilled', label: 'No forecasts supplied' }); },
    input => { input.tables.capacityPeriods[0].through = input.tables.capacityPeriods[0].from; },
    input => { input.tables.outcomes[1].capacityPeriod = 'unknown'; },
    input => { input.tables.arrangements[0].campaignExpenseMinor = 1; },
    input => { input.tables._resources.push({ id: 'invented', capacity: 1 }); },
    input => { input.parameters.probabilityOfSuccess = 0.5; },
  ]) {
    const input = makeCase(); mutate(input);
    assert.equal(validateCaseInput(input).valid, false); assert.throws(() => makeModel(input), TypeError);
  }
});

test('raw native input edits cannot turn missing forecasts or a rewritten baseline into a pass', () => {
  const missing = makeModel(); missing.case.tables.outcomes.pop();
  assert.equal(commitment.validateModel(missing).valid, false);
  const changed = makeModel(); changed.case.tables.arrangements[0].campaignExpenseMinor = 1;
  const result = commitment.evaluateCommitmentModel(changed);
  assert.equal(commitment.isAssessmentComplete(result), true);
  assert.ok(result.plans.every(row => !row.feasible));
  assert.ok(result.plans.every(row => row.blockers.some(item => item.requirement === 'BASIS')));
});

test('zero or negative unit contribution remains explicit and does not invent customer effectiveness', () => {
  const zero = assess(growthCases()['zero-contribution']);
  assert.equal(values(zero, 'medium-prepay').contributionPerCustomer, 0);
  const negative = assess(makeCase({ parameters: { unitPriceMinor: 40000 } }));
  assert.equal(values(negative, 'small-invoice').contributionPerCustomer, -10000);
  assert.equal(values(negative, 'small-invoice').netContribution, -300000);
  assert.equal(negative.recommendation, null);
});

test('authors can change defaults and labels while preserving bounded payment semantics', () => {
  const changed = structuredClone(profile); changed.money = 'EUR cent'; changed.arrangements[2].label = 'Smaller invoiced commitment'; changed.defaults.unitPriceMinor = 160000;
  const author = createGrowthAuthor(changed), model = author.makeModel();
  assert.equal(commitment.validateModel(model).valid, true);
  assert.equal(model.module.metadata.decisionPresentation.moneyFormat.currency, 'EUR');
  assert.equal(model.module.labels['choice.arrangement.small-invoice'], 'Smaller invoiced commitment');
  assert.equal(author.makeCase().parameters.unitPriceMinor, 160000);
  for (const mutate of [input => { input.arrangements.pop(); }, input => { input.arrangements[3].paymentTerms = 'invoice'; }, input => { input.defaults.openingCashMinor = null; }, input => { input.id = '__proto__'; }]) {
    const invalid = structuredClone(profile); mutate(invalid);
    assert.equal(validateGrowthProfile(invalid).valid, false); assert.throws(() => createGrowthAuthor(invalid));
  }
});

test('the standalone app packages and runs through the public Node SDK', async () => {
  const executor = createNodeExecutor(), lab = createDecisionLab({ executor });
  try {
    const model = makeModel(), template = lab.templates.pack(lab.templates.create({ templateId: 'complete-a-commitment', version: '1.0.0', pattern: 'complete-a-commitment/1', title: 'Complete a commitment' }));
    const packed = lab.apps.pack(lab.apps.create({ template, appId: 'compare-growth-arrangements', release: 1, model, source: JSON.stringify(model) }));
    const app = lab.apps.open(packed), bound = lab.cases.create({ app, inputs: makeCase() });
    const run = await lab.run({ app, case: bound, execution: { timeoutMs: 30000 } });
    assert.equal(run.execution.status, 'completed', JSON.stringify(run.execution));
    const result = commitment.resolveCommitmentAssessment(run.assessment, run.report);
    assert.equal(commitment.isAssessmentComplete(result), true);
    assert.deepEqual(feasible(result), ['baseline', 'small-invoice', 'medium-prepay']);
    const decision = lab.reports.decision(run.report);
    assert.equal(decision.status, 'complete'); assert.equal(decision.comparison.rows.length, 4);
    assert.equal(model.module.metadata.catalog.domain.id, 'business-growth');
  } finally { await executor.close(); }
});
