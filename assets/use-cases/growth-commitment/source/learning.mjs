// A nonbinding payment-preference test supplies information only. It does not
// collect deposits, create customer orders, or make a marketing forecast.
// Cash and delivery eligibility come from complete commitment assessments;
// neither probabilities nor a favorable survey result waive operating rules.
import { commitment, hashing } from '@decision-lab/sdk';

export const LEARNING_STATES = Object.freeze([
  { id: 'prepay-accepted', label: 'Prepayment offer attracts the larger customer count', attributes: { prepayAccepted: true } },
  { id: 'prepay-weak', label: 'Prepayment offer attracts the smaller customer count', attributes: { prepayAccepted: false } },
]);
export const LEARNING_STUDY = 'payment-preference-test';
export const LEARNING_REPORTS = Object.freeze([
  { id: 'favorable', label: 'Favorable preference signal', kind: 'report' },
  { id: 'unfavorable', label: 'Unfavorable preference signal', kind: 'report' },
  { id: 'inconclusive', label: 'No usable preference signal', kind: 'no-report' },
]);

export function makeLearningInputs() {
  return {
    enabled: false, feeMinor: 50000, durationDays: 1,
    probabilityBasis: { source: 'FICTIONAL-TEACHING-ASSESSMENT-1: Explicit hypothetical probabilities and signal reliability; not evidence interpretation counts or measured demand.', scope: 'One standardized service package and the next-month campaign window' },
    priors: [{ state: 'prepay-accepted', probability: 0.5 }, { state: 'prepay-weak', probability: 0.5 }],
    likelihoods: LEARNING_STATES.flatMap(state => LEARNING_REPORTS.map(report => ({ state: state.id, report: report.id,
      probability: report.id === 'inconclusive' ? 0.2 : (report.id === 'favorable') === state.attributes.prepayAccepted ? 0.7 : 0.1 }))),
  };
}

/** A worked two-situation case. Every arrangement has an outcome in each
 * situation; sales and prepayment acceptance are assumptions, never forecasts.
 * The invoice alternatives retain their supplied customer counts, while the
 * prepayment offer has 20 customers or 2 customers under the two hypotheses. */
export function makeLearningGrowthCase(author) {
  const input = author.makeCase();
  input.id = 'GROWTH-payment-terms';
  input.tables.scenarios = LEARNING_STATES.map(state => ({ id: state.id, label: state.label }));
  input.tables.outcomes = LEARNING_STATES.flatMap(state => author.makeCase().tables.outcomes.map(outcome => ({ ...outcome,
    scenario: state.id,
    ...(outcome.arrangement === 'medium-prepay' && !state.attributes.prepayAccepted ? { customers: 2 } : {}),
  })));
  return input;
}

/** The UI and CLI consume this exact shared case shape. The two operating
 * situations are part of the case; enabling learning does not quietly replace
 * a worker's existing forecasts or turn an unspecified outcome into a fact. */
export function makeLearningWorkflowCase(author, { inputs = makeLearningInputs() } = {}) {
  const operatingCase = makeLearningGrowthCase(author);
  return {
    growth: { ...operatingCase.parameters, ...Object.fromEntries(Object.entries(operatingCase.tables).filter(([key]) => !key.startsWith('_'))) },
    learning: { enabled: true, basis: Object.fromEntries(Object.entries(structuredClone(inputs)).filter(([key]) => key !== 'enabled')) },
  };
}

export function makeGrowthLearningModule({ author }) {
  return {
    id: 'payment-terms-learning', version: '1.0.0', title: 'Assess a payment-terms test',
    description: 'Compare choosing a fundable and deliverable growth arrangement now with a nonbinding payment-preference test and a complete response to each possible signal.',
    question: 'Could a timely preference test improve the growth choice enough to cover its cost?',
    boundary: 'One nonbinding preference test followed by one complete growth arrangement. Customer orders, collected deposits, refunds and adaptive marketing campaigns are outside this model.',
    metadata: { catalog: { domain: { id: 'business-growth', label: 'Business growth' }, useCase: { id: 'fund-and-deliver-growth', label: 'Fund and deliver growth' } },
      requiredCapabilities: [{ id: 'learning-execution-feasibility', version: 1 }] },
    executionFeasibility: { version: 1 },
    objective: { criterion: 'risk-neutral-expected-money', unit: author.profile.money, timeUnit: 'day',
      beneficiary: 'The business funding and delivering the growth commitment', horizon: 'The complete declared campaign and customer delivery horizon' },
    assumptions: [
      'The prior and likelihood matrix are explicit fictional teaching inputs. A survey signal is an imperfect observation of a declared situation; it is not a causal estimate of additional customers.',
      'Net contribution for each action and situation comes from the same pinned planning assessment: customer receipts less delivery expense and committed campaign expense. The test fee is charged once, separately.',
      'The test accepts no payment, order or deposit and creates no customer delivery obligation. A paid pilot requires a different complete operating model.',
      'All declared situations remain logically possible after every report, including an inconclusive report. Zero probabilities never waive funding, capacity or timing conditions.',
      'Operating eligibility comes from current native commitment runs for acting now and acting after the test fee and delay. A profitable action cannot compensate for an operating failure.',
      'The baseline is a complete no-expansion alternative. An expected-contribution preference is supplied only for this optional learning comparison; feasibility alone does not select a growth arrangement.',
    ],
    attributes: [{ id: 'prepayAccepted', label: 'Larger prepayment-offer customer count', type: 'boolean' }],
    states: structuredClone(LEARNING_STATES),
    actions: author.profile.arrangements.map(arrangement => ({ id: arrangement.id, label: arrangement.label })),
    studies: [{ id: LEARNING_STUDY, label: 'Nonbinding payment-preference test', reports: structuredClone(LEARNING_REPORTS) }],
    presentation: {
      labels: { baseline: 'Choose a growth arrangement now', study: 'Learning option', action: 'Complete growth arrangement', state: 'Customer-response situation', report: 'Preference-test signal' },
      reports: {
        comparison: { title: 'Test before committing', question: 'Does the preference test improve expected contribution while retaining a complete usable response?' },
        responses: { title: 'Response to each signal', question: 'Which eligible growth arrangement has the highest expected contribution after each possible signal?' },
        inputs: { title: 'Probability and operating basis', question: 'Which explicit assumptions and complete operating assessments support this comparison?' },
      },
    }, recordTypes: [],
  };
}

/** Seed an independently installable learning app through the public SDK.
 * These are projections of real solver findings, not a second feasibility
 * implementation. The workflow uses equivalent portable bindings at runtime. */
export async function makeGrowthLearningModel({ author, planningApp, lab, inputs = makeLearningInputs(), createdAt = '2026-11-22T18:00:00.000Z' }) {
  const now = makeLearningGrowthCase(author), after = structuredClone(now);
  after.parameters.openingCashMinor -= inputs.feeMinor;
  after.parameters.currentDay += inputs.durationDays;
  if (after.parameters.openingCashMinor < 0) throw new Error('The test fee must be funded before evaluating complete after-test arrangements.');
  const contexts = [];
  for (const [context, operatingCase] of [['no-study', now], [LEARNING_STUDY, after]]) {
    const run = await lab.assess({ app: planningApp, case: operatingCase, createdAt });
    if (!commitment.isAssessmentComplete(run.assessment)) throw new Error(`The ${context} operating assessment is incomplete: ${JSON.stringify(run.assessment?.errors ?? run.execution)}`);
    contexts.push({ context, run });
  }
  const plans = contexts[0].run.assessment.plans;
  const cashBudget = now.parameters.openingCashMinor - now.parameters.minimumReserveMinor;
  const caseData = {
    id: 'GROWTH-payment-learning', scope: `${author.profile.id} / profile ${author.profile.version} / next-month package and campaign window`, currentTime: now.parameters.currentDay, cashBudget,
    probabilityBasis: structuredClone(inputs.probabilityBasis), priors: structuredClone(inputs.priors),
    actions: plans.map(plan => ({ action: plan.choices.arrangement,
      cash: Math.max(...plan.scenarios.map(scenario => scenario.derived.peakFundingRequired)),
      deadline: plan.choices.arrangement === 'baseline' ? null : now.parameters.decisionDeadlineDay })),
    payoffs: plans.flatMap(plan => plan.scenarios.map(scenario => ({ action: plan.choices.arrangement, state: scenario.id, value: scenario.derived.netContribution }))),
    acceptedFacts: [], studies: [{ study: LEARNING_STUDY, fee: inputs.feeMinor, duration: inputs.durationDays, likelihoods: structuredClone(inputs.likelihoods) }],
    executionFeasibility: {
      admittedStateIds: LEARNING_STATES.map(state => state.id),
      contexts: contexts.map(({ context }) => ({ context, currentTime: now.parameters.currentDay,
        fee: context === 'no-study' ? 0 : inputs.feeMinor, duration: context === 'no-study' ? 0 : inputs.durationDays, cashBudget })),
      reportSupport: LEARNING_STATES.flatMap(state => LEARNING_REPORTS.map(report => ({ study: LEARNING_STUDY, report: report.id, state: state.id, possible: true }))),
      eligibility: contexts.flatMap(({ context, run }) => run.assessment.plans.flatMap(plan => plan.scenarios.map(scenario => ({
        context, action: plan.choices.arrangement, state: scenario.id, eligible: scenario.passed,
        reasons: scenario.constraints.filter(condition => !condition.passed).map(condition => condition.id),
        source: `decision-lab-assessment:${hashing.canonicalHash(run)}#plan=${plan.id}&state=${scenario.id}`,
      })))),
    },
  };
  return { format: 'assess-value-of-learning/1', module: makeGrowthLearningModule({ author }), case: caseData };
}
