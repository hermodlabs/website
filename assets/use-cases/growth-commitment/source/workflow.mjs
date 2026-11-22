// Author a portable workflow, not a second solver. Expressions below bind
// case inputs to pinned apps and project their findings into shared views.
// Complete cash ledgers and delivery feasibility remain native SDK outputs.
import configuration from './workflow-config.json' with { type: 'json' };
import { LEARNING_REPORTS, LEARNING_STATES, LEARNING_STUDY, makeLearningInputs } from './learning.mjs';

const ref = path => ({ ref: path });
const literal = value => ({ literal: value });
const op = (operator, ...args) => ({ op: operator, args });
const eq = (a, b) => op('eq', a, b);
const and = (...args) => op('and', ...args);
const choose = (test, yes, no) => op('if', test, yes, no);
const get = (source, key) => op('get', source, key);
const map = (source, as, projection) => ({ op: 'map', args: [source, projection], as });
const flatMap = (source, as, projection) => ({ op: 'flatMap', args: [source, projection], as });
const filter = (source, as, test) => ({ op: 'filter', args: [source, test], as });
const row = path => ref(`vars.${path}`);
const count = source => op('length', source);
const minimum = source => get(op('sort', source), 0);
const maximum = source => get(op('sort', source), op('subtract', count(source), 1));
const condition = (id, label, test) => ({ id, label, test });

const parameterMeanings = {
  openingCashMinor: ['opening-cash', 'Cash available at the start', 'How much cash is available before this growth commitment?', 'Available opening cash in minor currency units after obligations outside this case have already been accounted for. Do not subtract those obligations again.'],
  minimumReserveMinor: ['cash-reserve', 'Minimum cash reserve', 'What minimum cash balance must remain available?', 'A minimum balance maintained after every ordered payment or receipt, including intermediate events on the same date.'],
  currentDay: ['current-day', 'Current decision day', 'On which day can we make the growth commitment?', 'Whole elapsed days from the declared origin. All nonzero operating cash events must still be in the future at commitment time.'],
  decisionDeadlineDay: ['decision-cutoff', 'Growth commitment cutoff', 'By which day must we commit to an expansion arrangement?', 'Latest elapsed day for a growth arrangement. The no-expansion alternative remains available after this cutoff.'],
  horizonDay: ['comparison-horizon', 'Complete comparison horizon', 'Through which day does this comparison include cash and delivery?', 'All nonzero payments, receipts and complete customer delivery must lie within this horizon. Extending a contract requires its full obligations, not only a favorable first month.'],
  campaignSurplusTargetMinor: ['campaign-target', 'Contribution target above campaign expense', 'How much contribution must remain after campaign expense?', 'A stated monetary hurdle above recovering the committed campaign expense. This target does not predict how many genuinely additional customers will be acquired.'],
  unitPriceMinor: ['package-price', 'Collected price per customer', 'How much will each customer pay for the standardized package?', 'Full collected price per customer in minor currency units. Collection timing is declared separately for every arrangement and situation.'],
  deliveryExpensePerCustomerMinor: ['delivery-expense', 'Delivery expense per customer', 'What additional delivery expense does one customer create?', 'Incremental complete delivery expense per customer in minor currency units. The campaign expense is committed separately and does not shrink when fewer customers buy.'],
  deliveryHoursPerCustomer: ['delivery-effort', 'Delivery effort per customer', 'How many delivery hours does each customer require?', 'Whole delivery hours per standardized customer package. Only capacity within the declared delivery period supports that work.'],
};
const tableMeanings = {
  arrangements: ['campaign-expenses', 'Committed campaign expenses', 'What campaign expense is committed for each arrangement?', 'Complete campaign expense in minor currency units, paid independently of customer response. Arrangement identities and payment-term meanings are fixed by the authored app.'],
  scenarios: ['operating-situations', 'Declared operating situations', 'Which demand and collection situations must the arrangements withstand?', 'Explicit joint situations, not probability samples. Every arrangement needs exactly one complete outcome in every declared situation.'],
  outcomes: ['customer-outcomes', 'Customers, collection and delivery', 'What customers, cash dates and delivery work are assumed in each situation?', 'Customer count, complete payment and receipt dates, delivery interval and capacity period for every arrangement and situation. These are declared assumptions; the app does not forecast sales.'],
  capacityPeriods: ['delivery-capacity', 'Available delivery capacity', 'How many hours are available in the delivery period?', 'Available hours during the specified complete period, after other work has been accounted for once. Work must fit inside that period as well as within its available hours.'],
};

export function makeGrowthWorkflow({ author, app, learningApp, config = configuration }) {
  if (!author?.makeCase || app?.format !== 'decision-lab-app/1') throw new Error('Supply the growth author and its exact commitment app package.');
  const base = author.makeCase(), model = app.app.model, currency = author.profile.money.split(' ')[0];
  const arrangements = Object.fromEntries(author.profile.arrangements.map(item => [item.id, item.label]));
  const labels = Object.fromEntries(model.module.constraints.map(item => [item.id,
    model.module.labels?.[`constraint.${item.id}`] ?? model.module.requirements.find(requirement => requirement.id === item.requirement)?.label ?? item.id]));
  const question = (meaning, field, type, required = true) => ({ id: meaning[0], label: meaning[1], question: meaning[2], meaning: meaning[3],
    path: `growth.${field}`, type, role: 'growth-owner', required });
  const questions = [
    ...Object.entries(base.parameters).map(([key, value]) => question(parameterMeanings[key] ?? [key, key, `What value applies to ${key}?`, 'An authored operating parameter.'], key, typeof value === 'number' ? 'number' : typeof value)),
    ...Object.keys(base.tables).filter(key => !key.startsWith('_')).map(key => question(tableMeanings[key] ?? [key, key, `Which ${key} records apply?`, 'Complete operating records.'], key, 'array')),
  ];
  const operatingIds = questions.map(item => item.id);
  const inputs = { ...Object.fromEntries(Object.entries(base).filter(([key]) => !['parameters', 'tables'].includes(key)).map(([key, value]) => [key, literal(value)])),
    parameters: Object.fromEntries(Object.keys(base.parameters).map(key => [key, ref(`case.growth.${key}`)])),
    tables: Object.fromEntries(Object.keys(base.tables).map(key => [key, key.startsWith('_') ? literal(base.tables[key]) : ref(`case.growth.${key}`)])),
  };
  const projectedScenarios = map(row('plan.scenarios'), 'situation', {
    id: row('situation.id'), label: get(get(filter(ref('case.growth.scenarios'), 'meaning', eq(row('meaning.id'), row('situation.id'))), 0), 'label'),
    feasible: row('situation.passed'), ...Object.fromEntries(['customers', 'campaignExpense', 'deliveryExpense', 'customerReceipts', 'totalExpense',
      'netContribution', 'capacityHours', 'availableHours', 'capacityHeadroom', 'cashHeadroom', 'peakFundingRequired', 'minimumCashBalance',
      'endingCashBalance', 'deliveryStartDay', 'deliveryFinishDay'].map(key => [key, row(`situation.derived.${key}`)])),
    blockers: map(filter(row('situation.constraints'), 'check', eq(row('check.passed'), false)), 'unmet', {
      condition: get(literal(labels), row('unmet.id')), requirement: row('unmet.requirement'), constraintId: row('unmet.id'),
    }),
  });
  const values = key => map(row('plan.scenarios'), 'measure', row(`measure.derived.${key}`));
  const output = { plans: map(ref('assessment.plans'), 'plan', {
    id: row('plan.choices.arrangement'), planId: row('plan.id'), label: get(literal(arrangements), row('plan.choices.arrangement')),
    feasible: row('plan.feasible'), preferred: false,
    cashHeadroom: minimum(values('cashHeadroom')), capacityHeadroom: minimum(values('capacityHeadroom')),
    expense: maximum(values('totalExpense')), peakFundingRequired: maximum(values('peakFundingRequired')),
    blocker: choose(eq(count(row('plan.blockers')), 0), 'None under the declared situations', get(literal(labels), get(get(row('plan.blockers'), 0), 'constraintId'))),
    blockers: map(row('plan.blockers'), 'unmet', { condition: get(literal(labels), row('unmet.constraintId')), requirement: row('unmet.requirement'), situation: row('unmet.scenarioId') }),
    scenarios: projectedScenarios,
  }) };
  const acceptWhen = and(eq(ref('assessment.status'), 'complete'), eq(ref('assessment.coverage.complete'), true));
  const steps = [{ id: 'planning', title: 'Calculate fundable and deliverable growth arrangements', app: 'planning', role: 'growth-owner', dependsOn: [],
    requires: operatingIds, input: inputs, output, acceptWhen }];
  const dependencies = [{ id: 'planning', app, packageHash: app.contentHash }];
  const plans = ref('steps.planning.output.plans'), passing = filter(plans, 'candidate', eq(row('candidate.feasible'), true));
  const expansion = filter(passing, 'candidate', op('ne', row('candidate.id'), 'baseline'));
  const conditions = [
    condition('inputs-supplied', 'Every required operating input is supplied', and(...operatingIds.map(id => eq(ref(`answers.${id}.status`), 'supplied')))),
    condition('planning-current', 'The complete growth comparison is current', eq(ref('steps.planning.status'), 'complete')),
    condition('has-options', 'A complete arrangement meets all declared requirements', op('gt', count(passing), 0)),
    condition('has-growth', 'An expansion arrangement meets all declared requirements', op('gt', count(expansion), 0)),
    condition('can-compare', 'Current complete arrangements can be compared', and(ref('conditions.planning-current'), ref('conditions.has-options'))),
    condition('must-revise', 'No supplied expansion arrangement meets the recorded requirements', and(ref('conditions.planning-current'), op('not', ref('conditions.has-growth')))),
  ];
  const learningInputs = makeLearningInputs();
  if (learningApp) {
    if (learningApp.format !== 'decision-lab-app/1') throw new Error('The optional learning dependency must be an immutable app package.');
    questions.push({ id: 'learning-enabled', path: 'learning.enabled', type: 'boolean', role: 'growth-owner', required: false,
      label: 'Compare a preference test', question: 'Should we also calculate the value of a nonbinding preference test?',
      meaning: 'Optional expected-contribution analysis. Missing probabilities or test assumptions do not prevent the operating comparison.' },
    { id: 'learning-basis', path: 'learning.basis', type: 'object', role: 'growth-owner', required: false,
      label: 'Test and probability assumptions', question: 'Which test cost, delay, probabilities and signal likelihoods are defensible?',
      meaning: 'Explicit priors and a complete likelihood matrix for the two authored payment-response situations. The nonbinding test collects no money or orders. Its fee and elapsed days are counted before the complete response.' });
    dependencies.push({ id: 'learning', app: learningApp, packageHash: learningApp.contentHash });
    const when = eq(ref('case.learning.enabled'), true), learningIds = ['learning-enabled', 'learning-basis'];
    conditions.push(condition('learning-requested', 'The optional nonbinding preference comparison is requested', when),
      condition('learning-current', 'The optional preference-test calculation is current', eq(ref('steps.learning.status'), 'complete')),
      condition('learning-needs-attention', 'The requested learning calculation needs current complete inputs and results', and(when, op('not', ref('conditions.learning-current')))));
    const afterInput = structuredClone(inputs);
    afterInput.parameters.openingCashMinor = op('subtract', ref('case.growth.openingCashMinor'), ref('case.learning.basis.feeMinor'));
    afterInput.parameters.currentDay = op('add', ref('case.growth.currentDay'), ref('case.learning.basis.durationDays'));
    steps.push({ id: 'planning-after-test', title: 'Calculate complete arrangements after test expense and delay', app: 'planning', role: 'growth-owner',
      dependsOn: ['planning'], requires: [...operatingIds, ...learningIds], when, input: afterInput, output, acceptWhen,
      checks: [
        { id: 'fund-test', message: 'The test fee must be funded before calculating after-test arrangements.', test: op('gte', ref('case.growth.openingCashMinor'), ref('case.learning.basis.feeMinor')) },
        { id: 'learning-situations', message: 'The payment-terms comparison requires exactly the two authored situations: prepay-accepted and prepay-weak. Supply complete outcomes for every arrangement in both situations.',
          test: eq(op('sort', map(ref('case.growth.scenarios'), 'state', row('state.id'))), literal(LEARNING_STATES.map(state => state.id).sort())) },
      ] });
    const operatingPlans = step => ref(`steps.${step}.output.plans`);
    const source = (step, context) => flatMap(operatingPlans(step), 'eligiblePlan', map(row('eligiblePlan.scenarios'), 'eligibleState', {
      context, action: row('eligiblePlan.id'), state: row('eligibleState.id'), eligible: row('eligibleState.feasible'),
      reasons: map(row('eligibleState.blockers'), 'failure', row('failure.constraintId')),
      source: op('stringConcat', 'decision-lab-run:', ref(`steps.${step}.runHash`), '#plan=', row('eligiblePlan.planId'), '&state=', row('eligibleState.id')),
    }));
    const cashBudget = op('subtract', ref('case.growth.openingCashMinor'), ref('case.growth.minimumReserveMinor'));
    const learningCase = { id: 'GROWTH-payment-learning', scope: `${author.profile.id} / profile ${author.profile.version} / next-month package and campaign window`, currentTime: ref('case.growth.currentDay'), cashBudget,
      probabilityBasis: ref('case.learning.basis.probabilityBasis'), priors: ref('case.learning.basis.priors'), acceptedFacts: [],
      actions: map(plans, 'action', { action: row('action.id'), cash: row('action.peakFundingRequired'),
        deadline: choose(eq(row('action.id'), 'baseline'), null, ref('case.growth.decisionDeadlineDay')) }),
      payoffs: flatMap(plans, 'action', map(row('action.scenarios'), 'state', { action: row('action.id'), state: row('state.id'), value: row('state.netContribution') })),
      studies: [{ study: LEARNING_STUDY, fee: ref('case.learning.basis.feeMinor'), duration: ref('case.learning.basis.durationDays'), likelihoods: ref('case.learning.basis.likelihoods') }],
      executionFeasibility: { admittedStateIds: literal(LEARNING_STATES.map(state => state.id)),
        contexts: ['no-study', LEARNING_STUDY].map(context => ({ context, currentTime: ref('case.growth.currentDay'), cashBudget,
          fee: context === 'no-study' ? 0 : ref('case.learning.basis.feeMinor'), duration: context === 'no-study' ? 0 : ref('case.learning.basis.durationDays') })),
        reportSupport: literal(LEARNING_STATES.flatMap(state => LEARNING_REPORTS.map(report => ({ study: LEARNING_STUDY, report: report.id, state: state.id, possible: true })))),
        eligibility: op('concat', source('planning', 'no-study'), source('planning-after-test', LEARNING_STUDY)),
      },
    };
    steps.push({ id: 'learning', title: 'Compare choosing now with a nonbinding preference test', app: 'learning', role: 'growth-owner',
      dependsOn: ['planning', 'planning-after-test'], requires: learningIds, when, input: learningCase,
      checks: [{ id: 'reserve-funded', message: 'The opening cash does not fund the required reserve. Resolve the operating cash shortfall before calculating optional learning value.',
        test: op('gte', ref('case.growth.openingCashMinor'), ref('case.growth.minimumReserveMinor')) }],
      output: { baseline: ref('assessment.baseline'), comparison: ref('assessment.comparison'), studies: ref('assessment.studies'), recommendation: ref('assessment.recommendation') }, acceptWhen });
  }
  const summary = choose(ref('conditions.planning-current'), {
    status: choose(ref('conditions.has-options'), 'choice', 'blocked'),
    heading: choose(ref('conditions.has-growth'), 'Expansion arrangements meet the declared funding and delivery requirements.',
      choose(ref('conditions.has-options'), 'Only the no-expansion arrangement meets the declared requirements.', 'No supplied arrangement meets the declared requirements.')),
    priorityLabel: 'Feasibility comparison; no growth arrangement is automatically selected.',
    qualification: 'Results cover the supplied complete arrangements and declared joint situations. Cash availability and customer contribution are separate findings.',
    metrics: [{ id: 'growth-count', label: 'Passing expansion arrangements', value: count(expansion), format: 'number' }], rows: plans,
  }, null);
  const unitContribution = op('subtract', ref('case.growth.unitPriceMinor'), ref('case.growth.deliveryExpensePerCustomerMinor'));
  const hurdleAmount = campaign => op('add', campaign, ref('case.growth.campaignSurplusTargetMinor'));
  const customerHurdle = campaign => choose(eq(hurdleAmount(campaign), 0), 0, choose(op('gt', unitContribution, 0),
    op('ceilDivide', hurdleAmount(campaign), unitContribution), null));
  const isBaseline = eq(row('arrangement.id'), 'baseline');
  const detailRows = flatMap(plans, 'arrangement', map(row('arrangement.scenarios'), 'situation', {
    id: op('stringConcat', row('arrangement.id'), ':', row('situation.id')), arrangementId: row('arrangement.id'),
    label: op('stringConcat', row('arrangement.label'), ' · ', row('situation.label')), arrangement: row('arrangement.label'), situation: row('situation.label'),
    feasible: row('situation.feasible'), preferred: false,
    ...Object.fromEntries(['customers', 'cashHeadroom', 'peakFundingRequired', 'minimumCashBalance', 'endingCashBalance', 'capacityHours', 'availableHours', 'capacityHeadroom',
      'campaignExpense', 'deliveryExpense', 'customerReceipts', 'totalExpense', 'netContribution', 'deliveryStartDay', 'deliveryFinishDay'].map(key => [key, row(`situation.${key}`)])),
    unitContribution, contributionTarget: ref('case.growth.campaignSurplusTargetMinor'), customersToReachTarget: choose(isBaseline, null, customerHurdle(row('situation.campaignExpense'))),
    customersToExceedExpense: choose(isBaseline, null, choose(op('gt', unitContribution, 0), op('add', op('floorDivide', row('situation.campaignExpense'), unitContribution), 1), null)),
    hurdleStatus: choose(isBaseline, 'No incremental campaign; no acquisition hurdle applies.',
      choose(op('gt', unitContribution, 0), 'Conditional performance requirement; customer response is not established.',
        choose(eq(hurdleAmount(row('situation.campaignExpense')), 0), 'No acquisition contribution is needed to cover zero campaign expense. Additional customers do not create positive unit contribution.',
          'Nonpositive contribution per customer cannot reach this positive hurdle.'))),
  }));
  const brief = { sections: [
    { id: 'decision-summary', title: 'Growth decision', value: summary },
    { id: 'arrangements', title: 'Complete growth arrangements', value: choose(ref('conditions.planning-current'), plans, []) },
    { id: 'operating-detail', title: 'Situation-specific operating and financial findings', value: choose(ref('conditions.planning-current'), detailRows, []) },
    { id: 'decision-basis', title: 'Growth assumptions and limits', value: {
      scope: 'One standardized service package, four authored complete arrangements and an explicit finite set of joint customer and collection situations.',
      assumptions: ['Opening cash and delivery capacity are available after other obligations have been counted once.',
        'Campaign expense is committed independently of the eventual customer count. Price, customer count and collection dates are explicit assumptions rather than sales forecasts.',
        'Cash events on the same day follow the authored event order. A receipt cannot fund an earlier payment merely because their dates match.',
        'Every nonzero payment, customer receipt and complete delivery obligation must fall within the comparison horizon.',
        'The campaign hurdle is a required customer count, not evidence of additional demand, causal marketing effectiveness or earned profit.',
        'A preference-test signal is optional information. Its explicit hypothetical probabilities never replace complete funding, capacity and timing checks.'],
      unresolvedQuestions: [{ id: 'demand', label: 'Are the customer counts and collection dates defensible for this campaign and payment offer?' },
        { id: 'cost-capacity', label: 'Do the recorded cash, complete expenses and available delivery hours remain valid?' },
        { id: 'choice', label: 'Which supported commitment best serves the business when consequences outside this bounded model are considered?' }],
    } },
    ...(learningApp ? [{ id: 'learning-comparison', title: 'Optional preference-test comparison', value: choose(ref('conditions.learning-current'), ref('steps.learning.output'), null) }] : []),
  ], actions: [
    { id: 'supply-inputs', label: 'Supply the missing operating inputs', when: op('not', ref('conditions.inputs-supplied')), value: { summary: 'Resolve the listed unanswered or unknown values before comparing complete commitments.' } },
    { id: 'compare-arrangements', label: 'Compare the supported growth commitments', when: ref('conditions.can-compare'), value: { summary: 'Compare cash headroom, delivery capacity and the conditional customer hurdle. A passing result does not select or authorize a commitment.' } },
    { id: 'resolve-blockers', label: 'Change the growth arrangements or resolve their operating blockers', when: ref('conditions.must-revise'), value: { summary: 'Inspect unmet cash, capacity and timing requirements for the expansion arrangements. Keeping the current approach remains available when its own requirements fit. No passing supplied expansion arrangement does not prove that every possible growth plan is impossible.' } },
    ...(learningApp ? [{ id: 'inspect-learning', label: 'Inspect the response to each possible preference signal', when: ref('conditions.learning-current'), value: { summary: 'Compare choosing now with the complete test-and-response policy. Customer response remains uncertain until evidence exists.' } },
      { id: 'complete-learning', label: 'Complete or correct the optional test comparison', when: ref('conditions.learning-needs-attention'), value: { summary: 'Supply both authored operating situations, complete outcomes, test expense and delay, and explicit probability assumptions. The current operating comparison remains usable while the optional calculation is unresolved.' } }] : []),
  ], completion: ref('conditions.planning-current') };
  const selection = { group: 'growth-arrangement', keyField: 'id', labelField: 'label', initial: { supportedField: 'feasible' } };
  const detailSelection = { group: 'growth-situation', keyField: 'id', labelField: 'label', initial: { supportedField: 'feasible' } };
  const columns = [{ key: 'cashHeadroom', label: 'Minimum cash headroom', format: 'money' },
    { key: 'capacityHeadroom', label: 'Delivery hours remaining', format: 'number' }, { key: 'blocker', label: 'Decisive unmet condition' }];
  const focused = (id, title, questionText, fields) => ({ id, sectionId: 'operating-detail', title, question: questionText, selectorLabel: 'Arrangement and situation', selection: detailSelection,
    comparison: { columns: [{ key: 'label', label: 'Arrangement and situation' }, ...fields].slice(0, 8) }, summary: { fields: fields.slice(0, 4).map(field => ({ ...field, presentation: 'metric' })) } });
  const report = { title: 'Growth commitment reports',
    readableBrief: { format: 'workflow-readable-brief/1', sectionId: 'decision-basis', sourceStepIds: [] },
    tabs: [
      { id: 'conditions', label: 'Arrangement details', question: 'What makes this complete growth arrangement usable or blocked?', sectionId: 'arrangements', viewId: 'arrangement-details' },
      { id: 'cash', kind: 'cash-flow', label: 'Cash by date', question: 'When does each arrangement use or receive cash, and does its reserve hold?', stepIds: ['planning'],
        selection: { group: 'growth-arrangement', keyField: 'choices.arrangement', labelField: 'choices.arrangement' } },
      { id: 'capacity', label: 'Capacity by period', question: 'Can the assumed customers be served inside the available delivery period?', sectionId: 'operating-detail', viewId: 'capacity-detail' },
      { id: 'hurdle', label: 'Campaign hurdle', question: 'How many genuinely additional customers must the campaign produce?', sectionId: 'operating-detail', viewId: 'campaign-hurdle' },
      ...(learningApp ? [{ id: 'learning', kind: 'learning', label: 'Test before committing', question: 'Would a timely preference test improve the commitment choice?', stepIds: ['learning'] }] : []),
    ],
    questionViews: [
      { id: 'arrangement-details', sectionId: 'arrangements', title: 'Complete growth arrangement', question: 'What makes this complete growth arrangement usable or blocked?', selectorLabel: 'Arrangement to inspect', selection,
        comparison: { columns: [{ key: 'label', label: 'Complete arrangement' }, ...columns] },
        summary: { fields: [{ key: 'feasible', label: 'Meets all declared requirements', format: 'boolean', presentation: 'text' }, ...columns.slice(0, 2).map(field => ({ ...field, presentation: 'metric' }))] },
        details: [{ id: 'unmet', title: 'Unmet operating conditions', question: 'Which conditions prevent this arrangement?', fields: [{ key: 'blockers', label: 'Conditions preventing this arrangement', presentation: 'records' }] },
          { id: 'situations', title: 'Situation-specific findings', question: 'How does the arrangement behave in each declared situation?', fields: [{ key: 'scenarios', label: 'Declared situations', presentation: 'records' }] }] },
      focused('capacity-detail', 'Delivery capacity', 'Can the assumed customers be served inside the available delivery period?', [
        { key: 'customers', label: 'Assumed customers', format: 'number' }, { key: 'capacityHours', label: 'Delivery hours required', format: 'number' },
        { key: 'availableHours', label: 'Delivery hours available', format: 'number' }, { key: 'capacityHeadroom', label: 'Hours remaining', format: 'number' },
        { key: 'deliveryStartDay', label: 'Delivery starts (day)', format: 'number' }, { key: 'deliveryFinishDay', label: 'Delivery finishes (day)', format: 'number' }]),
      { ...focused('campaign-hurdle', 'Campaign performance hurdle', 'How many genuinely additional customers must the campaign produce?', [
        { key: 'campaignExpense', label: 'Committed campaign expense', format: 'money' }, { key: 'unitContribution', label: 'Contribution per additional customer', format: 'money' },
        { key: 'customersToReachTarget', label: 'Customers to reach the stated target', format: 'number' }, { key: 'customersToExceedExpense', label: 'First count exceeding campaign expense', format: 'number' }]),
        contextFields: [{ key: 'hurdleStatus', label: 'Meaning of this calculation', presentation: 'text' }],
        details: [{ id: 'target', title: 'Target and assumed outcome', fields: [{ key: 'contributionTarget', label: 'Target above campaign expense', format: 'money' }, { key: 'customers', label: 'Assumed customers', format: 'number' }, { key: 'netContribution', label: 'Contribution under that assumption', format: 'money' }] }] },
    ],
    decisionSummary: { format: 'workflow-decision-summary/1', sectionId: 'decision-summary', sourceStepIds: ['planning'], title: 'Growth commitment',
      question: 'Which growth commitment can we fund and deliver, and what must its spending achieve?',
      sections: [{ id: 'options', label: 'Options', question: 'Which growth arrangements can we fund and deliver?' },
        { id: 'next-actions', label: 'Next actions', question: 'What can we do next given the current operating findings?' },
        { id: 'assumptions', label: 'Assumptions', question: 'Which customer, collection and workload assumptions could change this comparison?' },
        { id: 'questions', label: 'Questions', question: 'What remains unestablished before choosing a commitment?' }],
      comparison: { title: 'Complete growth arrangements', keyField: 'id', labelField: 'label', primaryField: 'feasible', columns: [{ key: 'label', label: 'Growth arrangement' }, ...columns],
        rowActions: [{ id: 'inspect', label: 'Inspect arrangement', tabId: 'conditions', inspectionKeyField: 'id' }, { id: 'cash', label: 'Inspect cash by date', tabId: 'cash', inspectionKeyField: 'id' }] },
      actionGroups: [{ id: 'operating-next', presentation: 'actions' }], links: [{ tabId: 'hurdle', label: 'Inspect the conditional campaign hurdle' }, { tabId: 'cash', label: 'Inspect cash timing and reserve' }],
    },
  };
  // The portable view contract declares presentation explicitly. Comparison
  // cells stay compact text; focused numeric findings become metrics, while
  // previously declared record collections retain their table presentation.
  const present = (fields, fallback) => fields.map(field => ({ ...field, presentation: field.presentation ?? fallback(field) }));
  for (const view of report.questionViews) {
    view.comparison.columns = present(view.comparison.columns, () => 'text');
    if (view.summary) view.summary.fields = present(view.summary.fields, field => ['money', 'number', 'duration'].includes(field.format) ? 'metric' : 'text');
    if (view.contextFields) view.contextFields = present(view.contextFields, () => 'text');
    for (const detail of view.details ?? []) detail.fields = present(detail.fields, field => ['money', 'number', 'duration'].includes(field.format) ? 'metric' : 'text');
  }
  const edge = (id, from, to, label, outcome, kind) => ({ id, from, to, label, ...(outcome ? { outcome } : {}), ...(kind ? { kind } : {}) });
  const decisionProcess = { title: 'Choose a fundable and deliverable growth commitment',
    description: 'Operating findings determine which commitments can be compared. Optional learning improves a choice only when a usable complete response remains available.', entryNodeIds: ['inputs'],
    nodes: [
      { id: 'inputs', kind: 'stage', label: 'Supply complete growth assumptions and operating limits', questionIds: operatingIds },
      { id: 'input-check', kind: 'decision', label: 'Are the required operating values supplied?', conditionId: 'inputs-supplied' },
      { id: 'missing', kind: 'action', label: 'Supply unanswered or unknown values', actionId: 'supply-inputs' },
      { id: 'planning', kind: 'stage', label: 'Calculate complete cash and delivery feasibility', stepIds: ['planning'] },
      { id: 'has-options', kind: 'decision', label: 'Does a supplied complete arrangement satisfy the requirements?', conditionId: 'has-options' },
      { id: 'has-growth', kind: 'decision', label: 'Does a supplied expansion arrangement satisfy the requirements?', conditionId: 'has-growth' },
      { id: 'compare', kind: 'action', label: 'Compare supported commitments and campaign hurdles', actionId: 'compare-arrangements' },
      { id: 'blocked', kind: 'action', label: 'Resolve blockers or change the complete arrangements', actionId: 'resolve-blockers' },
      { id: 'choose', kind: 'outcome', label: 'Choose a supported commitment with its stated assumptions', sectionIds: ['decision-summary'] },
      ...(learningApp ? [{ id: 'learning-check', kind: 'decision', label: 'Is a nonbinding preference test being considered?', conditionId: 'learning-requested' },
        { id: 'learning', kind: 'stage', label: 'Check complete responses after test fee and delay, then compare expected contribution', stepIds: ['planning-after-test', 'learning'] },
        { id: 'learning-ready', kind: 'decision', label: 'Is the requested test-and-response comparison current and complete?', conditionId: 'learning-current' },
        { id: 'learning-inputs', kind: 'action', label: 'Complete or correct optional test assumptions', actionId: 'complete-learning' },
        { id: 'test-responses', kind: 'action', label: 'Inspect the response to each possible signal', actionId: 'inspect-learning' }] : []),
    ], edges: [edge('inputs-check', 'inputs', 'input-check', 'Use complete operating assumptions'),
      edge('inputs-ready', 'input-check', 'planning', 'Required values supplied', 'true'), edge('inputs-missing', 'input-check', 'missing', 'A required value is unavailable', 'false'),
      edge('calculate-options', 'planning', 'has-options', 'Use the complete native commitment result'),
      edge('calculate-growth', 'planning', 'has-growth', 'Check expansion separately from keeping the current approach'),
      edge('options-compare', 'has-options', 'compare', 'At least one complete arrangement passes', 'true'), edge('options-blocked', 'has-options', 'blocked', 'No supplied complete arrangement passes', 'false'),
      edge('growth-compare', 'has-growth', 'compare', 'A complete expansion arrangement passes', 'true'),
      edge('growth-blocked', 'has-growth', 'blocked', 'No supplied expansion arrangement passes', 'false'),
      ...['unknown', 'not-calculated', 'stale', 'error'].map(state => edge(`options-${state}`, 'has-options', 'inputs',
        ({ unknown: 'Required operating facts remain unavailable', 'not-calculated': 'Calculate the complete arrangements first', stale: 'Operating inputs changed; recalculate', error: 'Correct invalid inputs or a calculation failure' })[state], state, 'reassessment')),
      ...['unknown', 'not-calculated', 'stale', 'error'].map(state => edge(`growth-${state}`, 'has-growth', 'inputs',
        ({ unknown: 'Required growth facts remain unavailable', 'not-calculated': 'Calculate the expansion arrangements first', stale: 'Growth inputs changed; recalculate', error: 'Correct invalid inputs or a calculation failure' })[state], state, 'reassessment')),
      edge('missing-return', 'missing', 'inputs', 'Supply or correct the missing facts', null, 'reassessment'),
      edge('blocked-return', 'blocked', 'inputs', 'Change operating facts or author another arrangement', null, 'reassessment'),
      ...(learningApp ? [edge('compare-learning', 'compare', 'learning-check', 'Consider whether further information could improve the choice'),
        edge('learning-yes', 'learning-check', 'learning', 'The optional test comparison is requested', 'true'), edge('learning-no', 'learning-check', 'choose', 'Use operating findings without a learning calculation', 'false'),
        edge('learning-result', 'learning', 'learning-ready', 'Retain a complete current calculation'),
        edge('learning-responses', 'learning-ready', 'test-responses', 'Use supplied probabilities and native operating eligibility', 'true'),
        edge('learning-incomplete', 'learning-ready', 'learning-inputs', 'The optional calculation is missing, stale or invalid', 'false'),
        edge('learning-return', 'learning-inputs', 'inputs', 'Supply complete operating situations and test assumptions, then recalculate', null, 'reassessment'),
        edge('responses-choose', 'test-responses', 'choose', 'Compare acting now with the full test-and-response policy')] : [edge('compare-choose', 'compare', 'choose', 'Inspect the complete commitment and required performance')]),
    ], groups: [{ id: 'basis', label: '1. Define the complete commitment', nodeIds: ['inputs', 'input-check', 'missing'] },
      { id: 'operating', label: '2. Establish funding and delivery feasibility', nodeIds: ['planning', 'has-options', 'has-growth', 'compare', 'blocked'] },
      { id: 'choice', label: '3. Decide whether to commit or learn first', nodeIds: [...(learningApp ? ['learning-check', 'learning', 'learning-ready', 'learning-inputs', 'test-responses'] : []), 'choose'] }],
    actionGroups: [{ id: 'operating-next', label: 'Available next actions', selection: 'all-matching', actionIds: brief.actions.map(action => action.id) }],
  };
  const numeric = (label, extras = {}) => ({ type: 'number', label, integer: true, minimum: 0, ...extras });
  const text = label => ({ type: 'string', label });
  const arrangementOptions = Object.entries(arrangements).map(([value, label]) => ({ value, label }));
  const tableFields = {
    arrangements: { id: { ...text('Arrangement'), options: arrangementOptions }, campaignExpenseMinor: numeric('Committed campaign expense', { displayScale: 100, unit: currency }) },
    scenarios: { id: text('Situation reference'), label: text('Situation meaning') },
    outcomes: { scenario: text('Situation'), arrangement: { ...text('Arrangement'), options: arrangementOptions }, customers: numeric('Assumed customers'), campaignExpenseDay: numeric('Campaign paid (day)'),
      deliveryExpenseDay: numeric('Delivery paid (day)'), customerReceiptDay: numeric('Customers pay (day)'), deliveryStartDay: numeric('Delivery starts (day)'), deliveryFinishDay: numeric('Delivery finishes (day)'), capacityPeriod: text('Capacity period') },
    capacityPeriods: { id: text('Capacity period'), from: numeric('Period starts (day)'), through: numeric('Period finishes (day)'), availableHours: numeric('Available delivery hours') },
  };
  const forms = Object.fromEntries(Object.entries(base.parameters).map(([key]) => {
    const contract = model.module.inputs.parameters[key], definition = parameterMeanings[key];
    return [definition?.[0] ?? key, numeric(definition?.[1] ?? key, { ...Object.fromEntries(['minimum', 'maximum'].filter(name => contract[name] !== undefined).map(name => [name, contract[name]])),
      ...(key.endsWith('Minor') ? { displayScale: 100, unit: currency } : { unit: key === 'deliveryHoursPerCustomer' ? 'hours per customer' : 'day' }) })];
  }));
  for (const [name, fields] of Object.entries(tableFields)) forms[tableMeanings[name][0]] = { type: 'array', label: tableMeanings[name][1], collapseRecords: true,
    summaryFields: name === 'arrangements' ? ['id'] : Object.keys(fields).slice(0, 2),
    ...(['arrangements', 'outcomes'].includes(name) ? { valueLabels: arrangements } : {}), items: { type: 'object', label: tableMeanings[name][1], fields } };
  if (learningApp) {
    forms['learning-enabled'] = { type: 'boolean', label: 'Also compare a nonbinding preference test', help: 'Optional. Operating feasibility remains useful without probabilities.' };
    forms['learning-basis'] = { type: 'object', label: 'Explicit test and probability assumptions', fields: {
      feeMinor: numeric('Complete test expense', { displayScale: 100, unit: currency }), durationDays: numeric('Time until a usable signal', { unit: 'days' }),
      probabilityBasis: { type: 'object', label: 'Probability basis', fields: { source: text('Source and assessment basis'), scope: text('Exact assessment scope') } },
      priors: { type: 'array', label: 'Prior situation probabilities', items: { type: 'object', label: 'Prior situation probability', fields: { state: text('Situation'), probability: { type: 'number', label: 'Probability', minimum: 0, maximum: 1 } } } },
      likelihoods: { type: 'array', label: 'Signal likelihoods in each situation', collapseRecords: true, summaryFields: ['state', 'report'], items: { type: 'object', label: 'Signal likelihood', fields: {
        state: text('Situation'), report: text('Signal'), probability: { type: 'number', label: 'Conditional probability', minimum: 0, maximum: 1 },
      } } },
    } };
  }
  const caseProperties = Object.fromEntries(Object.entries(base.parameters).map(([key, value]) => [key, { type: [typeof value === 'number' ? 'integer' : typeof value, 'null'],
    ...Object.fromEntries(['minimum', 'maximum'].filter(field => model.module.inputs.parameters[key][field] !== undefined).map(field => [field, model.module.inputs.parameters[key][field]])) }]));
  for (const [name, table] of Object.entries(model.module.inputs.tables).filter(([key]) => !key.startsWith('_'))) caseProperties[name] = { type: 'array', maxItems: 256, items: { type: 'object', additionalProperties: false,
    required: Object.keys(table.columns), properties: Object.fromEntries(Object.entries(table.columns).map(([key, contract]) => [key, { type: contract.type,
      ...Object.fromEntries(['minimum', 'maximum', 'enum'].filter(field => contract[field] !== undefined).map(field => [field, contract[field]])) }])) } };
  const probabilityRow = fields => ({ type: 'array', maxItems: 64, items: { type: 'object', additionalProperties: false, required: [...fields, 'probability'],
    properties: { ...Object.fromEntries(fields.map(field => [field, { type: 'string' }])), probability: { type: 'number', minimum: 0, maximum: 1 } } } });
  const learningSchema = { type: 'object', additionalProperties: false, properties: { enabled: { type: 'boolean' }, basis: { type: 'object', additionalProperties: false,
    properties: { feeMinor: { type: 'integer', minimum: 0 }, durationDays: { type: 'integer', minimum: 0 },
      probabilityBasis: { type: 'object', additionalProperties: false, required: ['source', 'scope'], properties: { source: { type: 'string' }, scope: { type: 'string' } } },
      priors: probabilityRow(['state']), likelihoods: probabilityRow(['state', 'report']) } } } };
  return { id: config.id, version: config.version, title: config.title,
    question: 'Which growth plan can we afford to carry out?',
    description: 'Compare four complete growth commitments against cash after every dated payment and receipt, a required reserve, delivery hours, collection timing and the complete obligation horizon. Show the customer contribution needed to cover committed campaign spending. Optionally compare a nonbinding preference test using explicit probability assumptions and the same complete operating checks.',
    execution: { mode: 'calculation' }, dependencies, questions, steps, conditions, brief, decisionProcess,
    initialCase: { growth: { ...base.parameters, ...Object.fromEntries(Object.entries(base.tables).filter(([key]) => !key.startsWith('_'))) }, ...(learningApp ? { learning: { enabled: false, basis: Object.fromEntries(Object.entries(learningInputs).filter(([key]) => key !== 'enabled')) } } : {}) },
    metadata: { caseSchema: { type: 'object', additionalProperties: false, required: ['growth'], properties: { growth: { type: 'object', additionalProperties: false, properties: caseProperties }, ...(learningApp ? { learning: learningSchema } : {}) } },
      caseStart: { starterMeaning: 'example', supportsOwnData: false, scope: 'A fictional service business with four authored complete arrangements and one standardized package. Edit the explicit case values; adapt the app for other arrangements, payment structures, activity dependencies or services.' },
      presentation: { version: 1, questions: forms, display: { currency, amountUnit: 'cent', timeUnit: 'day', timeOrigin: config.calendarOrigin, names: arrangements,
        formats: { expense: 'money', cashHeadroom: 'money', peakFundingRequired: 'money', minimumCashBalance: 'money', endingCashBalance: 'money', campaignExpense: 'money', netContribution: 'money' } },
        groups: [
          { id: 'commitment', label: 'Growth commitment', question: 'What will the growth commitment spend, collect and deliver?', subtabs: [
            { id: 'offer', label: 'Package and campaign', questionIds: ['package-price', 'delivery-expense', 'delivery-effort', 'campaign-expenses', 'campaign-target'] },
            { id: 'situations', label: 'Customers and collection', questionIds: ['operating-situations', 'customer-outcomes'] },
          ] },
          { id: 'limits', label: 'Operating limits', question: 'Which cash, delivery and timing limits must hold?', subtabs: [
            { id: 'cash', label: 'Cash and reserve', questionIds: ['opening-cash', 'cash-reserve'] },
            { id: 'delivery', label: 'Capacity and timing', questionIds: ['delivery-capacity', 'current-day', 'decision-cutoff', 'comparison-horizon'] },
          ] },
          ...(learningApp ? [{ id: 'learning', label: 'Optional learning', question: 'Could another signal improve the commitment choice?', subtabs: [{ id: 'test', label: 'Test and assumptions', questionIds: ['learning-enabled', 'learning-basis'] }] }] : []),
          { id: 'calculations', kind: 'evaluations', label: 'Calculation dependencies', question: 'Which pinned apps establish operating fit and optional learning value?', subtabs: [] },
          { id: 'decision', kind: 'brief', label: 'Decision summary', question: 'Which commitment can we fund and deliver?', subtabs: [] },
        ],
        workflowMap: { title: 'Growth commitment calculations', description: 'The same pinned complete-commitment app supplies the operating basis before and after an optional test.',
          steps: { planning: { label: 'Complete growth feasibility', description: 'Ordered customer receipts and payments, reserve, capacity and timing.' },
            ...(learningApp ? { 'planning-after-test': { label: 'Feasibility after test expense and delay', description: 'The test fee reduces opening cash and its duration advances the decision day.' }, learning: { label: 'Optional preference-test value', description: 'Use supplied probabilities, native net contributions and source-linked operating eligibility.' } } : {}) },
          groups: [{ id: 'operating', label: 'Operating comparison', stepIds: ['planning'] }, ...(learningApp ? [{ id: 'test', label: 'Optional test and response', stepIds: ['planning-after-test', 'learning'] }] : [])] }, report,
      },
    },
  };
}
