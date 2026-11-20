// A finite comparison of four supplied complete repairs, using the public
// complete-a-commitment/1 expression language. No scheduling happens here.
export const createdAt = '2026-11-19T12:00:00.000Z';
export const repairs = [
  { id: 'hold', label: 'Leave the gap' },
  { id: 'move-only', label: 'Move Theo only' },
  { id: 'relief', label: 'Bring in Rowan' },
  { id: 'coupled', label: 'Repair three assignments' },
];
export const employees = [
  { id: 'luis', name: 'Luis', cook: true, server: false, fourHourFeeMinor: 8800 },
  { id: 'priya', name: 'Priya', cook: true, server: false, fourHourFeeMinor: 8000 },
  { id: 'theo', name: 'Theo', cook: true, server: false, fourHourFeeMinor: 8000 },
  { id: 'ava', name: 'Ava', cook: false, server: true, fourHourFeeMinor: 8000 },
  { id: 'ben', name: 'Ben', cook: true, server: true, fourHourFeeMinor: 8000 },
  { id: 'nora', name: 'Nora', cook: true, server: false, fourHourFeeMinor: 8800 },
  { id: 'rowan', name: 'Rowan', cook: true, server: false, fourHourFeeMinor: 18000 },
  { id: 'unfilled', name: 'Unfilled', cook: false, server: false, fourHourFeeMinor: 0 },
];
export const services = [
  { id: 'fri-dinner', label: 'Friday dinner', start: 4 * 1440 + 18 * 60 },
  { id: 'sat-dinner', label: 'Saturday dinner', start: 5 * 1440 + 18 * 60 },
  { id: 'sun-lunch', label: 'Sunday lunch', start: 6 * 1440 + 12 * 60 },
];
const published = [
  ['luis', 'priya', 'ava'], ['luis', 'nora', 'ava'], ['theo', 'priya', 'ben'],
];
export const slots = services.flatMap((service, serviceIndex) => ['cook-1', 'cook-2', 'server'].map((position, index) => ({
  id: `${service.id}-${position}`, service: service.id, serviceLabel: service.label,
  role: position === 'server' ? 'server' : 'cook', start: service.start,
  end: service.start + 240, duration: 240, published: published[serviceIndex][index],
})));
const L = literal => ({ literal }), R = ref => ({ ref }), O = (op, ...args) => ({ op, args });
const add = args => args.length === 1 ? args[0] : O('add', ...args);
const lookup = (table, where, column) => ({ op: 'lookup', table, where, column });
const table = columns => ({ key: ['id'], columns });
const str = { type: 'string' }, bool = { type: 'boolean' };
const count = { type: 'integer', unit: 'count', minimum: 0 };
const money = { type: 'integer', unit: 'money', minimum: 0 };
const time = { type: 'integer', unit: 'time', minimum: 0 };
const actor = slot => R(`activity.${slot.id}.actor`);
const truthCount = expression => lookup('truthValues', { flag: expression }, 'count');
const truthMinutes = expression => lookup('truthValues', { flag: expression }, 'minutes');
const employeeValue = (employee, column) => lookup('employees', { id: typeof employee === 'string' ? L(employee) : employee }, column);

export function makeCase({ shortAvailability = false } = {}) {
  const assignments = repairs.map(repair => {
    const row = { id: repair.id };
    for (const slot of slots) row[slot.id] = slot.published;
    row['sat-dinner-cook-2'] = 'unfilled'; // Nora's reported absence is never treated as available.
    if (repair.id === 'move-only') {
      row['sat-dinner-cook-2'] = 'theo';
      row['sun-lunch-cook-1'] = 'unfilled';
    }
    if (repair.id === 'relief') row['sat-dinner-cook-2'] = 'rowan';
    if (repair.id === 'coupled') {
      row['sat-dinner-cook-2'] = 'theo';
      row['sun-lunch-cook-1'] = 'ben';
      row['sun-lunch-server'] = 'ava';
    }
    return row;
  });
  return {
    id: shortAvailability ? 'rowan-until-eight' : 'rowan-until-ten',
    parameters: { remainingLaborBudgetMinor: 85600, minimumRestMinutes: 600 },
    tables: {
      employees: employees.map(person => ({ ...person,
        capacity: person.id === 'unfilled' ? 9 : 1,
        earlierWeekMinutes: ['rowan', 'unfilled'].includes(person.id) ? 0 : 1440,
        weeklyLimitMinutes: 2400,
        lastEarlierShiftEnd: ['rowan', 'unfilled'].includes(person.id) ? 0 : 3 * 1440 + 22 * 60,
      })),
      assignments,
      availability: employees.filter(person => !['nora', 'unfilled'].includes(person.id)).map(person => ({
        id: `availability-${person.id}`, employee: person.id,
        from: person.id === 'rowan' ? 5 * 1440 + 18 * 60 : 0,
        through: person.id === 'rowan' ? 5 * 1440 + (shortAvailability ? 20 : 22) * 60 : 7 * 1440,
      })),
      truthValues: [{ id: 'false', flag: false, count: 0, minutes: 0 }, { id: 'true', flag: true, count: 1, minutes: 240 }],
      scenarios: [{ id: 'recorded-week' }], bookings: [],
    },
    provenance: [{ id: 'fictional-roster-basis', description: 'Fictional restaurant. Week starts Monday at 00:00. Earlier-week work totals and last shift ends are retained; every remaining recorded service is compared. Nora’s cancelled Saturday shift is unpaid and removed from the expense baseline. Other retained work is paid at its declared flat four-hour fee. No payroll, booking, messaging or operating authority is issued.' }],
  };
}

export function makeModel(priority = 'feasibility-only', caseInputs = makeCase()) {
  const requirements = [
    ['COVERAGE', 'Every required position filled', 'Each recorded service has two distinct cook positions and one server position filled for its complete interval.'],
    ['QUALIFICATION', 'Required qualifications', 'The assigned employee has the declared qualification for the position.'],
    ['AVAILABILITY', 'Full-interval availability', 'Recorded availability, with any unavailable intervals omitted, covers every minute of each assignment.'],
    ['CAPACITY', 'One assignment at a time', 'No employee simultaneously fills two positions or overlaps a retained booking.'],
    ['REST', 'Declared rest between shifts', 'The gap from earlier work and between remaining assignments is at least the declared ten hours.'],
    ['HOURS', 'Declared weekly hours', 'Retained earlier-week minutes plus the candidate’s remaining assignments stay within the declared forty-hour limit.'],
    ['BUDGET', 'Remaining labor budget', 'Complete remaining payroll is at most $856; available additional labor is $200 against the retained $656 baseline.'],
    ['BASIS', 'Counting basis', 'Boolean counts map false to zero and true to one; assigned four-hour slots contribute zero or 240 minutes.'],
  ].map(([id, label, meaning]) => ({ id, label, meaning, waivable: false }));
  const constraints = [];
  const predicate = (id, requirement, expression) => constraints.push({ id, requirement, kind: 'predicate', predicate: expression });
  for (const value of [false, true]) {
    predicate(`count-${value}`, 'BASIS', O('eq', truthCount(L(value)), L(Number(value))));
    predicate(`minutes-${value}`, 'BASIS', O('eq', truthMinutes(L(value)), L(value ? 240 : 0)));
  }
  for (const slot of slots) {
    predicate(`filled-${slot.id}`, 'COVERAGE', O('ne', actor(slot), L('unfilled')));
    predicate(`qualified-${slot.id}`, 'QUALIFICATION', O('eq', employeeValue(actor(slot), slot.role), L(true)));
    predicate(`available-${slot.id}`, 'AVAILABILITY', {
      op: 'interval-covered', table: 'availability', where: { employee: actor(slot) },
      start: R(`activity.${slot.id}.start`), end: R(`activity.${slot.id}.end`), startColumn: 'from', endColumn: 'through',
    });
    predicate(`earlier-rest-${slot.id}`, 'REST', O('gte',
      O('sub', R(`activity.${slot.id}.start`), employeeValue(actor(slot), 'lastEarlierShiftEnd')),
      R('parameter.minimumRestMinutes')));
  }
  for (let first = 0; first < slots.length; first++) for (let second = first + 1; second < slots.length; second++) {
    const a = slots[first], b = slots[second];
    predicate(`rest-${a.id}-${b.id}`, 'REST', O('or', O('ne', actor(a), actor(b)),
      O('gte', O('sub', R(`activity.${b.id}.start`), R(`activity.${a.id}.end`)), R('parameter.minimumRestMinutes'))));
  }
  constraints.push({ id: 'employee-capacity', requirement: 'CAPACITY', kind: 'resource-capacity' });
  for (const employee of employees.filter(person => person.id !== 'unfilled')) {
    predicate(`hours-${employee.id}`, 'HOURS', O('lte', R(`derived.minutes-${employee.id}`), employeeValue(employee.id, 'weeklyLimitMinutes')));
  }
  predicate('remaining-payroll-budget', 'BUDGET', O('lte', R('finance.expense'), R('parameter.remainingLaborBudgetMinor')));
  const changes = R('derived.changedAssignments'), expense = R('finance.expense');
  const preference = priority === 'feasibility-only' ? { mode: 'feasibility-only' }
    : priority === 'stability-first' ? { direction: 'min', expression: changes, then: [{ direction: 'min', expression: expense }] }
      : { direction: 'min', expression: expense, then: [{ direction: 'min', expression: changes }] };
  return {
    format: 'complete-a-commitment/1',
    module: {
      id: `restaurant-roster-repair-${priority}`, version: '1.0.0', template: { id: 'complete-a-commitment', version: 1 },
      title: 'Repair the remaining restaurant roster', question: 'Which supplied complete repairs cover every remaining service within the recorded staffing and expense limits?',
      description: 'Compare four supplied complete repairs for the remaining Friday–Sunday services in one published week; this is not a generator for all possible rosters.',
      units: { time: 'minute', timeOrigin: 'Monday 00:00 of one fictional week; one local clock without a daylight-saving transition', money: 'USD cent', count: 'assignment' },
      assumptions: [
        'All people, availability, qualifications, flat fees, hours and limits are fictional authored inputs, not validated employment records.',
        'Fixed four-hour service positions need two qualified cooks and one qualified server throughout. No individual can fill simultaneous positions. This fixture has no in-shift breaks; a required break must be removed from available working intervals and covered by an explicitly supplied repair.',
        'The supplied comparison contains four complete remaining rosters, not every possible repair. A preferred result is established only within those four alternatives.',
        'Nora’s cancelled shift is unpaid and excluded from the retained $656 remaining-payroll baseline. Change count compares assigned people at each published position, including Nora’s replacement; it is not a count of individual employees or a measure of fairness.',
        'Earlier-week work is retained as per-person minute totals and the end of the latest earlier shift; this comparison does not retrospectively audit earlier assignments. The declared ten-hour rest and forty-hour limits are model assumptions, not labor-law compliance findings.',
        'The model checks the recorded intervals and roles. Demand forecasts, workload intensity, payroll premiums, consent, seniority, transport and actual publication require additional records, rules or integrations.',
      ],
      inputs: {
        parameters: { remainingLaborBudgetMinor: money, minimumRestMinutes: time },
        tables: {
          employees: table({ id: str, name: str, cook: bool, server: bool, fourHourFeeMinor: money, capacity: count, earlierWeekMinutes: time, weeklyLimitMinutes: time, lastEarlierShiftEnd: time }),
          assignments: table(Object.fromEntries([['id', str], ...slots.map(slot => [slot.id, { type: 'string', references: { table: 'employees', column: 'id' } }])])),
          availability: table({ id: str, employee: { type: 'string', references: { table: 'employees', column: 'id' } }, from: time, through: time }),
          truthValues: { key: ['flag'], columns: { id: str, flag: bool, count, minutes: time } },
          scenarios: table({ id: str }),
          bookings: table({ id: str, employee: { type: 'string', references: { table: 'employees', column: 'id' } }, from: time, through: time, amount: count }),
        },
      },
      choices: [{ id: 'repair', domain: { values: repairs.map(repair => repair.id) } }],
      scenarioDomain: { table: 'scenarios' },
      lookupCoverage: [{ table: 'assignments', keys: { id: { domain: { values: repairs.map(repair => repair.id) } } } }, { table: 'truthValues', keys: { flag: { domain: { values: [false, true] } } } }],
      derived: [
        { id: 'changedAssignments', type: 'integer', unit: 'count', expr: add(slots.map(slot => truthCount(O('ne', actor(slot), L(slot.published))))) },
        { id: 'retainedBaselineExpense', type: 'integer', unit: 'money', expr: add(slots.filter(slot => slot.id !== 'sat-dinner-cook-2').map(slot => employeeValue(slot.published, 'fourHourFeeMinor'))) },
        { id: 'additionalExpense', type: 'integer', unit: 'money', expr: O('sub', R('finance.expense'), R('derived.retainedBaselineExpense')) },
        ...employees.filter(employee => employee.id !== 'unfilled').map(employee => ({ id: `minutes-${employee.id}`, type: 'integer', unit: 'time', expr: add([
          employeeValue(employee.id, 'earlierWeekMinutes'), ...slots.map(slot => truthMinutes(O('eq', actor(slot), L(employee.id)))),
        ]) })),
      ],
      activities: slots.map(slot => ({
        id: slot.id, actor: lookup('assignments', { id: R('choice.repair') }, slot.id),
        start: L(slot.start), duration: L(slot.duration),
        resources: [{ resource: actor(slot), amount: L(1) }],
      })),
      resources: { definitions: { table: 'employees', idColumn: 'id', capacityColumn: 'capacity' }, bookings: { table: 'bookings', resourceColumn: 'employee', startColumn: 'from', endColumn: 'through', amountColumn: 'amount' } },
      requirements, constraints,
      finance: { mode: 'expense', charges: slots.map(slot => ({ id: `pay-${slot.id}`, amount: employeeValue(actor(slot), 'fourHourFeeMinor') })), holds: [] },
      preference,
      labels: {
        plan: 'Complete roster repair', actor: 'Employee', scenario: 'Recorded week', financeExpense: 'Remaining service payroll',
        'choice.repair': 'Supplied roster repair', 'view.schedule.title': 'Complete remaining roster',
        ...Object.fromEntries(slots.map(slot => [`activity.${slot.id}`, `${slot.serviceLabel}: ${slot.role === 'cook' ? 'cook' : 'server'}${slot.id.endsWith('cook-1') ? ' 1' : slot.id.endsWith('cook-2') ? ' 2' : ''}`])),
        ...Object.fromEntries(employees.map(employee => [`resource.${employee.id}`, employee.name])),
      },
    },
    case: structuredClone(caseInputs),
  };
}
