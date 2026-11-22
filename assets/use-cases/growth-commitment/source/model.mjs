// This authoring helper compiles one bounded business model into the public
// Complete a Commitment contract. It never evaluates, ranks or repairs plans.
// The profile owns the alternatives and their payment meanings; a case supplies
// quotes, forecasts, collection dates, available cash and period capacity.
import initialProfile from './profile.json' with { type: 'json' };

export const GROWTH_PROFILE_FORMAT = 'business-growth-profile/1';
export const GROWTH_ARRANGEMENTS = Object.freeze(['baseline', 'large-invoice', 'small-invoice', 'medium-prepay']);
const clone = value => structuredClone(value);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = (path, message) => { throw Object.assign(new TypeError(`${path}: ${message}`), { code: 'GROWTH_INPUT_INVALID', path }); };
const need = (condition, path, message) => { if (!condition) fail(path, message); };
const text = (value, path) => need(typeof value === 'string' && value.trim().length > 0, path, 'needs nonempty text.');
const integer = (value, path, minimum = 0) => need(Number.isSafeInteger(value) && value >= minimum, path, `needs a safe integer of at least ${minimum}; unknown is not zero.`);
const safeId = value => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(value) && !['constructor', 'prototype', '__proto__'].includes(value);
const only = (value, allowed, path) => need(Object.keys(value).every(key => allowed.includes(key)), path, 'contains an unsupported field.');
const validResult = fn => { try { fn(); return { valid: true, errors: [] }; } catch (error) { return { valid: false, errors: [{ path: error.path ?? 'input', message: error.message }] }; } };
const parameterKeys = Object.freeze(['openingCashMinor', 'minimumReserveMinor', 'unitPriceMinor', 'deliveryExpensePerCustomerMinor', 'deliveryHoursPerCustomer', 'currentDay', 'decisionDeadlineDay', 'horizonDay', 'campaignSurplusTargetMinor']);
const outcomeKeys = Object.freeze(['scenario', 'arrangement', 'customers', 'campaignExpenseDay', 'deliveryExpenseDay', 'customerReceiptDay', 'deliveryStartDay', 'deliveryFinishDay', 'capacityPeriod']);
const L = literal => ({ literal }), R = ref => ({ ref }), O = (op, ...args) => ({ op, args });
const lookup = (table, where, column) => ({ op: 'lookup', table, where, column });
const str = { type: 'string' }, time = { type: 'integer', unit: 'time', minimum: 0 }, money = { type: 'integer', unit: 'money', minimum: 0 }, count = { type: 'integer', unit: 'count', minimum: 0 }, hours = { type: 'integer', unit: 'hours', minimum: 0 };
const table = columns => ({ key: ['id'], columns });

export function validateGrowthProfile(profile) {
  return validResult(() => {
    need(record(profile) && profile.format === GROWTH_PROFILE_FORMAT, 'profile.format', `must be ${GROWTH_PROFILE_FORMAT}.`);
    need(safeId(profile.id), 'profile.id', 'needs a safe identity.');
    for (const key of ['version', 'title', 'timeOrigin']) text(profile[key], `profile.${key}`);
    need(/^[A-Z]{3} cent$/.test(profile.money), 'profile.money', 'needs an explicit currency in cent units.');
    need(record(profile.defaults), 'profile.defaults', 'needs complete defaults.');
    only(profile.defaults, parameterKeys, 'profile.defaults');
    for (const key of parameterKeys) integer(profile.defaults[key], `profile.defaults.${key}`, key === 'deliveryHoursPerCustomer' || key === 'horizonDay' ? 1 : 0);
    need(Array.isArray(profile.arrangements) && JSON.stringify(profile.arrangements.map(row => row.id)) === JSON.stringify(GROWTH_ARRANGEMENTS), 'profile.arrangements', 'retains the four declared arrangement identities in order.');
    profile.arrangements.forEach(row => {
      text(row.label, `profile.arrangements.${row.id}.label`);
      integer(row.campaignExpenseMinor, `profile.arrangements.${row.id}.campaignExpenseMinor`);
      integer(row.customers, `profile.arrangements.${row.id}.customers`);
      need(row.paymentTerms === (row.id === 'medium-prepay' ? 'prepay' : 'invoice'), `profile.arrangements.${row.id}.paymentTerms`, 'retains the authored invoice or payment-before-delivery meaning.');
    });
    need(profile.arrangements[0].customers === 0 && profile.arrangements[0].campaignExpenseMinor === 0, 'profile.arrangements.baseline', 'the current-approach alternative contains no incremental campaign or customers.');
    need(Array.isArray(profile.capacityPeriods) && profile.capacityPeriods.length > 0, 'profile.capacityPeriods', 'needs explicit period capacity.');
    need(record(profile.schedule), 'profile.schedule', 'needs an explicit elapsed-day schedule.');
    for (const key of ['campaignExpenseDay', 'prepaymentDay', 'deliveryExpenseDay', 'deliveryStartDay', 'deliveryFinishDay', 'invoiceReceiptDay']) integer(profile.schedule[key], `profile.schedule.${key}`);
    need(safeId(profile.schedule.capacityPeriod), 'profile.schedule.capacityPeriod', 'needs an explicit capacity-period identity.');
  });
}

export function createGrowthAuthor(inputProfile) {
  const admission = validateGrowthProfile(inputProfile);
  if (!admission.valid) fail(admission.errors[0].path, admission.errors[0].message);
  const profile = clone(inputProfile), currency = profile.money.slice(0, 3);
  function makeCase(overrides = {}) {
    need(record(overrides), 'case', 'needs an input record.');
    const base = {
      id: 'next-month-growth', parameters: clone(profile.defaults),
      tables: {
        arrangements: profile.arrangements.map(({ id, campaignExpenseMinor }) => ({ id, campaignExpenseMinor })),
        scenarios: [{ id: 'recorded', label: 'Recorded planning estimates' }],
        outcomes: profile.arrangements.map(row => ({
          scenario: 'recorded', arrangement: row.id, customers: row.customers,
          campaignExpenseDay: row.id === 'baseline' ? 0 : profile.schedule.campaignExpenseDay,
          deliveryExpenseDay: row.id === 'baseline' ? 0 : profile.schedule.deliveryExpenseDay,
          customerReceiptDay: row.id === 'baseline' ? 0 : row.paymentTerms === 'prepay' ? profile.schedule.prepaymentDay : profile.schedule.invoiceReceiptDay,
          deliveryStartDay: row.id === 'baseline' ? 0 : profile.schedule.deliveryStartDay,
          deliveryFinishDay: row.id === 'baseline' ? 0 : profile.schedule.deliveryFinishDay,
          capacityPeriod: profile.schedule.capacityPeriod,
        })),
        capacityPeriods: clone(profile.capacityPeriods),
        _resources: [], _bookings: [],
      },
      provenance: [{ id: 'fictional-growth-basis', description: 'Fictional incremental planning estimates. Opening cash is already unrestricted growth funding after existing obligations; those obligations are not deducted a second time. Customer forecasts and payment promises are assumptions, not guaranteed sales or bank receipts.' }],
    };
    return { ...base, ...clone(overrides), parameters: { ...base.parameters, ...clone(overrides.parameters ?? {}) }, tables: { ...base.tables, ...clone(overrides.tables ?? {}) } };
  }
  function validateCaseInput(input) {
    return validResult(() => {
      need(record(input) && record(input.parameters) && record(input.tables), 'case', 'needs parameters and tables.');
      only(input, ['id', 'parameters', 'tables', 'provenance'], 'case'); text(input.id, 'case.id');
      only(input.parameters, parameterKeys, 'case.parameters');
      for (const key of parameterKeys) integer(input.parameters[key], `case.parameters.${key}`, key === 'deliveryHoursPerCustomer' || key === 'horizonDay' ? 1 : 0);
      only(input.tables, ['arrangements', 'scenarios', 'outcomes', 'capacityPeriods', '_resources', '_bookings'], 'case.tables');
      for (const key of ['_resources', '_bookings']) need(Array.isArray(input.tables[key]) && input.tables[key].length === 0, `case.tables.${key}`, 'is an empty authored scheduling registry; this profile compares period workloads rather than detailed resource schedules.');
      for (const key of ['arrangements', 'scenarios', 'outcomes', 'capacityPeriods']) need(Array.isArray(input.tables[key]), `case.tables.${key}`, 'needs an explicit record list.');
      const arrangements = new Set(), scenarios = new Set(), periods = new Set(), outcomes = new Set();
      input.tables.arrangements.forEach((row, index) => {
        const path = `case.tables.arrangements[${index}]`; need(record(row), path, 'needs a record.'); only(row, ['id', 'campaignExpenseMinor'], path);
        need(GROWTH_ARRANGEMENTS.includes(row.id) && !arrangements.has(row.id), `${path}.id`, 'needs one of the four distinct authored alternatives.'); arrangements.add(row.id);
        integer(row.campaignExpenseMinor, `${path}.campaignExpenseMinor`);
        if (row.id === 'baseline') need(row.campaignExpenseMinor === 0, `${path}.campaignExpenseMinor`, 'the baseline has no incremental campaign expense.');
      });
      need(arrangements.size === GROWTH_ARRANGEMENTS.length, 'case.tables.arrangements', 'needs every authored arrangement exactly once.');
      input.tables.scenarios.forEach((row, index) => {
        const path = `case.tables.scenarios[${index}]`; need(record(row), path, 'needs a record.'); only(row, ['id', 'label'], path);
        need(safeId(row.id) && !scenarios.has(row.id), `${path}.id`, 'needs a distinct safe identity.'); scenarios.add(row.id); text(row.label, `${path}.label`);
      });
      need(scenarios.size > 0 && scenarios.size <= 100, 'case.tables.scenarios', 'needs between one and 100 explicitly declared joint situations.');
      input.tables.capacityPeriods.forEach((row, index) => {
        const path = `case.tables.capacityPeriods[${index}]`; need(record(row), path, 'needs a record.'); only(row, ['id', 'from', 'through', 'availableHours'], path);
        need(safeId(row.id) && !periods.has(row.id), `${path}.id`, 'needs a distinct safe identity.'); periods.add(row.id);
        for (const key of ['from', 'through', 'availableHours']) integer(row[key], `${path}.${key}`);
        need(row.from < row.through, path, 'needs a positive capacity period.');
      });
      need(periods.size > 0, 'case.tables.capacityPeriods', 'needs an explicitly recorded capacity period.');
      input.tables.outcomes.forEach((row, index) => {
        const path = `case.tables.outcomes[${index}]`; need(record(row), path, 'needs a record.'); only(row, outcomeKeys, path);
        need(scenarios.has(row.scenario) && arrangements.has(row.arrangement), path, 'references a declared scenario and arrangement.');
        const key = JSON.stringify([row.scenario, row.arrangement]); need(!outcomes.has(key), path, 'duplicates a scenario/arrangement forecast.'); outcomes.add(key);
        need(periods.has(row.capacityPeriod), `${path}.capacityPeriod`, 'references a declared capacity period.');
        for (const key of outcomeKeys.filter(key => !['scenario', 'arrangement', 'capacityPeriod'].includes(key))) integer(row[key], `${path}.${key}`);
        if (row.arrangement === 'baseline') need(row.customers === 0, `${path}.customers`, 'the current-approach alternative has no incremental customers.');
        for (const [name, unit] of [['unitPriceMinor', 'receipts'], ['deliveryExpensePerCustomerMinor', 'delivery expense'], ['deliveryHoursPerCustomer', 'workload']]) integer(row.customers * input.parameters[name], `${path}.${unit}`);
        integer(row.customers * input.parameters.deliveryExpensePerCustomerMinor + input.tables.arrangements.find(item => item.id === row.arrangement).campaignExpenseMinor, `${path}.completeExpense`);
      });
      need(outcomes.size === scenarios.size * arrangements.size, 'case.tables.outcomes', 'needs a complete forecast for every scenario and arrangement; a missing forecast is not zero sales.');
      need(Array.isArray(input.provenance), 'case.provenance', 'needs an explicit provenance list.');
    });
  }
  const defaults = validateCaseInput(makeCase());
  if (!defaults.valid) fail(defaults.errors[0].path, defaults.errors[0].message);
  function makeModel(input = makeCase()) {
    const admitted = validateCaseInput(input); if (!admitted.valid) fail(admitted.errors[0].path, admitted.errors[0].message);
    const D = id => R(`derived.${id}`), P = id => R(`parameter.${id}`);
    const outcome = column => lookup('outcomes', { scenario: R('scenario.id'), arrangement: R('choice.arrangement') }, column);
    const period = column => lookup('capacityPeriods', { id: outcome('capacityPeriod') }, column);
    const baseline = O('eq', R('choice.arrangement'), L('baseline'));
    const prepay = O('eq', R('choice.arrangement'), L('medium-prepay'));
    const constraints = [], labels = {};
    const predicate = (id, requirement, expression, label) => { constraints.push({ id, requirement, kind: 'predicate', predicate: expression }); labels[`constraint.${id}`] = label; };
    predicate('baseline-expense', 'BASIS', O('eq', lookup('arrangements', { id: L('baseline') }, 'campaignExpenseMinor'), L(0)), 'Keep the current-approach alternative free of incremental campaign expense');
    predicate('baseline-customers', 'BASIS', O('or', O('not', baseline), O('eq', D('customers'), L(0))), 'Keep the current-approach alternative free of forecast incremental customers');
    predicate('cash-reserve', 'CASH', O('gte', R('finance.minimumHeadroom'), L(0)), 'Keep available cash at or above the required reserve after every receipt and payment');
    predicate('delivery-capacity', 'CAPACITY', O('lte', D('capacityHours'), D('availableHours')), 'The complete customer workload fits the recorded delivery-period capacity');
    predicate('delivery-period', 'CAPACITY', O('or', O('eq', D('customers'), L(0)), O('and', O('gte', D('deliveryStartDay'), period('from')), O('lte', D('deliveryFinishDay'), period('through')), O('gt', D('deliveryFinishDay'), D('deliveryStartDay')))), 'The complete delivery interval fits its declared capacity period');
    predicate('decision-cutoff', 'TIME', O('or', baseline, O('lte', P('currentDay'), P('decisionDeadlineDay'))), 'Choose a new campaign before the recorded commitment cutoff');
    // A zero cash entry is only a structural placeholder, not a future
    // obligation. Committed campaign payments remain real even at zero sales.
    predicate('planning-horizon', 'TIME', O('and',
      ...[['campaignExpenseDay', 'campaignExpense'], ['deliveryExpenseDay', 'deliveryExpense'], ['customerReceiptDay', 'customerReceipts']]
        .map(([date, amount]) => O('or', O('eq', D(amount), L(0)), O('lte', D(date), P('horizonDay')))),
      O('or', O('eq', D('customers'), L(0)), O('lte', D('deliveryFinishDay'), P('horizonDay')))),
    'The comparison horizon includes every nonzero payment, customer receipt and actual delivery completion');
    for (const [event, amount] of [['campaignExpenseDay', 'campaignExpense'], ['deliveryExpenseDay', 'deliveryExpense'], ['customerReceiptDay', 'customerReceipts']]) predicate(`future-${event}`, 'TIME', O('or', O('eq', D(amount), L(0)), O('gte', D(event), P('currentDay'))), `The ${labels[event] ?? event.replace(/([A-Z])/g, ' $1').toLowerCase()} has not already passed when making this future commitment`);
    predicate('future-delivery', 'TIME', O('or', O('eq', D('customers'), L(0)), O('gte', D('deliveryStartDay'), P('currentDay'))), 'Forecast delivery starts no earlier than the planning day');
    predicate('payment-terms', 'TERMS', O('or', O('eq', D('customers'), L(0)), O('and', prepay, O('lte', D('customerReceiptDay'), D('deliveryStartDay'))), O('and', O('not', prepay), O('gte', D('customerReceiptDay'), D('deliveryFinishDay')))), 'Customer receipt timing retains the authored invoice or payment-before-delivery terms');
    const derived = [
      { id: 'customers', type: 'integer', unit: 'count', expr: outcome('customers') },
      { id: 'campaignExpense', type: 'integer', unit: 'money', expr: lookup('arrangements', { id: R('choice.arrangement') }, 'campaignExpenseMinor') },
      { id: 'customerReceipts', type: 'integer', unit: 'money', expr: O('mul', D('customers'), P('unitPriceMinor')) },
      { id: 'deliveryExpense', type: 'integer', unit: 'money', expr: O('mul', D('customers'), P('deliveryExpensePerCustomerMinor')) },
      { id: 'totalExpense', type: 'integer', unit: 'money', expr: O('add', D('campaignExpense'), D('deliveryExpense')) },
      { id: 'contributionBeforeCampaign', type: 'integer', unit: 'money', expr: O('sub', D('customerReceipts'), D('deliveryExpense')) },
      { id: 'netContribution', type: 'integer', unit: 'money', expr: O('sub', D('contributionBeforeCampaign'), D('campaignExpense')) },
      { id: 'contributionPerCustomer', type: 'integer', unit: 'money', expr: O('sub', P('unitPriceMinor'), P('deliveryExpensePerCustomerMinor')) },
      { id: 'campaignRecoveryTarget', type: 'integer', unit: 'money', expr: O('add', D('campaignExpense'), P('campaignSurplusTargetMinor')) },
      { id: 'capacityHours', type: 'integer', unit: 'hours', expr: O('mul', D('customers'), P('deliveryHoursPerCustomer')) },
      { id: 'availableHours', type: 'integer', unit: 'hours', expr: period('availableHours') },
      { id: 'capacityHeadroom', type: 'integer', unit: 'hours', expr: O('sub', D('availableHours'), D('capacityHours')) },
      ...['campaignExpenseDay', 'deliveryExpenseDay', 'customerReceiptDay', 'deliveryStartDay', 'deliveryFinishDay'].map(id => ({ id, type: 'integer', unit: 'time', expr: outcome(id) })),
      { id: 'cashHeadroom', type: 'integer', unit: 'money', expr: R('finance.minimumHeadroom') },
      { id: 'peakFundingRequired', type: 'integer', unit: 'money', expr: R('finance.peakFundingRequired') },
      { id: 'minimumCashBalance', type: 'integer', unit: 'money', expr: R('finance.lowestBalance') },
      { id: 'endingCashBalance', type: 'integer', unit: 'money', expr: R('finance.endingBalance') },
    ];
    return { format: 'complete-a-commitment/1', module: {
      id: profile.id, version: profile.version, template: { id: 'complete-a-commitment', version: 1 }, title: profile.title,
      question: 'Which growth commitments can we fund and deliver under the declared demand and collection situations?',
      description: 'Compare a current-approach baseline and three complete growth arrangements against cash by date, a required reserve, delivery capacity and a commitment cutoff. Forecast customer counts are uncertain situations, not controllable sales or probabilities. A passing arrangement is operationally supportable under these inputs; no most-profitable option is selected.',
      units: { time: 'day', timeOrigin: profile.timeOrigin, money: profile.money, count: 'customer', hours: 'hour' },
      assumptions: [
        'This is an incremental growth calculation for one standard service package. Opening cash is already unrestricted growth funding after existing obligations; do not deduct those obligations again. The minimum reserve is an additional balance that must remain available.',
        'Each arrangement has a fixed committed campaign expense that remains payable when sales disappoint. Forecast customer counts determine delivery expense, receipts and workload. Costs are not automatically inferred from customer-acquisition ratios.',
        'Every declared situation supplies a complete joint forecast for all alternatives. Passing requires meeting every retained requirement in every declared situation; no probability of success or guarantee of customer demand is inferred.',
        'Cash uses explicit elapsed days and ordered atomic events. On the same day, campaign payment occurs first, delivery payment second, and customer receipt third. A later receipt cannot fund an earlier payment. Customer receipts are not treated as negative expenses or returned deposits.',
        'The payment-before-delivery alternative receives its complete customer price no later than delivery starts. Invoice alternatives collect no earlier than delivery finishes. The model assumes full receipt on each declared collection date; bad debt, refunds, tax and recognition rules require an authored extension.',
        'Capacity is available incremental hours in the explicitly identified delivery period. All customer work fits inside that period. The model does not spread work across periods, infer staffing from elapsed time, or solve a detailed task schedule.',
        'The comparison horizon must contain every payment, receipt and delivery completion. A multi-period contract needs its complete obligations inside this model or a new authored profile; its first month cannot stand for the whole commitment.',
        'The baseline represents no incremental campaign and no incremental customers. Its zero cash events are harmless placeholders. Feasibility-only comparison neither recommends a growth target nor estimates campaign effectiveness or causal impact.',
      ],
      inputs: { parameters: {
        openingCashMinor: money, minimumReserveMinor: money, unitPriceMinor: money, deliveryExpensePerCustomerMinor: money,
        deliveryHoursPerCustomer: { ...hours, minimum: 1 }, currentDay: time, decisionDeadlineDay: time, horizonDay: { ...time, minimum: 1 }, campaignSurplusTargetMinor: money,
      }, tables: {
        arrangements: table({ id: { ...str, enum: GROWTH_ARRANGEMENTS }, campaignExpenseMinor: money }),
        scenarios: table({ id: str, label: str }),
        outcomes: { key: ['scenario', 'arrangement'], columns: {
          scenario: { ...str, references: { table: 'scenarios', column: 'id' } }, arrangement: { ...str, enum: GROWTH_ARRANGEMENTS }, customers: count,
          campaignExpenseDay: time, deliveryExpenseDay: time, customerReceiptDay: time, deliveryStartDay: time, deliveryFinishDay: time,
          capacityPeriod: { ...str, references: { table: 'capacityPeriods', column: 'id' } },
        } },
        capacityPeriods: table({ id: str, from: time, through: time, availableHours: hours }),
        _resources: table({ id: str, capacity: count }),
        _bookings: table({ id: str, resource: str, from: time, through: time, amount: count }),
      } },
      choices: [{ id: 'arrangement', domain: { values: GROWTH_ARRANGEMENTS } }], scenarioDomain: { table: 'scenarios' },
      lookupCoverage: [
        { table: 'arrangements', keys: { id: { domain: { values: GROWTH_ARRANGEMENTS } } } },
        { table: 'outcomes', keys: { scenario: { domain: { table: 'scenarios', column: 'id' } }, arrangement: { domain: { values: GROWTH_ARRANGEMENTS } } } },
      ],
      derived, activities: [], resources: { definitions: { table: '_resources', idColumn: 'id', capacityColumn: 'capacity' }, bookings: { table: '_bookings', resourceColumn: 'resource', startColumn: 'from', endColumn: 'through', amountColumn: 'amount' } },
      requirements: [
        ['CASH', 'Cash and reserve by date', 'Every ordered payment and receipt leaves at least the declared reserve.'],
        ['CAPACITY', 'Delivery-period capacity', 'The complete forecast workload fits the available hours and interval of its declared delivery period.'],
        ['TIME', 'Commitment cutoff and full horizon', 'New campaign choices remain available at the planning day and all future obligations fit the comparison horizon.'],
        ['TERMS', 'Declared customer payment terms', 'Receipt dates preserve the published invoice or payment-before-delivery meaning.'],
        ['BASIS', 'Incremental baseline meaning', 'Keeping the current approach adds no campaign expense and no forecast growth customers.'],
      ].map(([id, label, meaning]) => ({ id, label, meaning, waivable: false })),
      constraints,
      finance: { mode: 'cash-flow', charges: [{ id: 'campaign-expense', amount: D('campaignExpense') }, { id: 'delivery-expense', amount: D('deliveryExpense') }], holds: [], cashFlow: {
        version: 1, openingBalance: P('openingCashMinor'), minimumBalance: P('minimumReserveMinor'),
        events: [
          { id: 'campaign-payment', direction: 'payment', amount: D('campaignExpense'), at: D('campaignExpenseDay'), order: 0 },
          { id: 'delivery-payment', direction: 'payment', amount: D('deliveryExpense'), at: D('deliveryExpenseDay'), order: 1 },
          { id: 'customer-receipt', direction: 'receipt', amount: D('customerReceipts'), at: D('customerReceiptDay'), order: 2 },
        ],
      } }, preference: { mode: 'feasibility-only' },
      labels: {
        plan: 'Complete growth arrangement', actor: 'Delivery team', scenario: 'Demand and collection situation', financeExpense: 'Campaign and delivery expense',
        'choice.arrangement': 'Growth arrangement', 'view.finance.title': 'Cash and expense', 'view.cashFlow.title': 'Cash by date', 'charge.campaign-expense': 'Committed campaign expense', 'charge.delivery-expense': 'Delivery expense',
        'cash-event.campaign-payment': 'Pay the committed campaign expense', 'cash-event.delivery-payment': 'Pay delivery expense', 'cash-event.customer-receipt': 'Receive customer payment',
        ...labels, ...Object.fromEntries(profile.arrangements.map(row => [`choice.arrangement.${row.id}`, row.label])),
      },
      metadata: { caseStart: { starterMeaning: 'example', supportsOwnData: false, scope: 'Four authored arrangements for one standard service package. Change prices, committed campaign quotes, joint customer and collection forecasts, available cash, reserve and delivery-period capacity. A different service structure, installment contract or refund process needs an authored extension.' },
        catalog: { domain: { id: 'business-growth', label: 'Business growth', description: 'Bounded growth commitments, operating capacity and the value of further learning.' }, useCase: { id: 'growth-commitment', label: 'Choose next month’s growth commitment', description: 'Find which supplied growth arrangements can be funded and delivered, then inspect what their spending must achieve.' } },
        decisionPresentation: { format: 'decision-presentation/1', title: 'Compare growth commitments', question: 'Which arrangements can we fund and deliver?', priorityLabel: 'Compare without ranking', moneyFormat: { currency, divisor: 100 }, columns: [
          { id: 'plan', label: 'Growth arrangement' }, { id: 'status', label: 'Operating fit' },
          { id: 'cashHeadroom', source: { kind: 'derived', id: 'cashHeadroom' }, label: 'Lowest cash headroom', format: { kind: 'money', currency, divisor: 100 } },
          { id: 'capacityHeadroom', source: { kind: 'derived', id: 'capacityHeadroom' }, label: 'Delivery headroom (hours)', format: { kind: 'number' } },
          { id: 'blockers', label: 'Blocking conditions' },
        ], charts: [{ viewId: 'commitment:cash-flow', defaultRepresentation: 'line' }] },
      },
    }, case: clone(input) };
  }
  return Object.freeze({ profile: clone(profile), priorities: Object.freeze(['feasibility']), makeCase, makeModel, validateCaseInput });
}

export const growthAuthor = createGrowthAuthor(initialProfile);
export const makeCase = overrides => growthAuthor.makeCase(overrides);
export const makeModel = input => growthAuthor.makeModel(input);
export const validateCaseInput = input => growthAuthor.validateCaseInput(input);
