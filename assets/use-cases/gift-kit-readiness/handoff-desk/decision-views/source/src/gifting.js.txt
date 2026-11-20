import { commitment } from '@decision-lab/sdk';

const scopeFields = [
  'batchId', 'insertRevision', 'destinationRevision', 'checkoutRevision',
  'deviceScope', 'accountScope',
];
const recordFields = ['id', 'packageId', ...scopeFields, 'source', 'recordedBy'];
const timeFields = ['recordedAt', 'validFrom', 'validThrough'];
const setupFields = ['nowMinute', 'handoffDeadlineMinute', 'rehearsalMinutes', 'handoffMinutes'];
const intervalFields = {
  calendars: ['start', 'end'],
  bookings: ['start', 'end', 'amount'],
  permissions: ['validFrom', 'validThrough'],
};

export class FormError extends Error {
  constructor(issues) {
    super('Correct the input records before reviewing the gift kits.');
    this.name = 'FormError';
    this.issues = issues;
  }
}

export function formatMoney(value, config) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: config.currency,
  }).format(value / config.moneyDivisor);
}

// Durations and positions share canonical minutes, but have different labels.
export function formatMinutes(value) {
  if (!Number.isFinite(value)) return 'Not established';
  const magnitude = Math.abs(value);
  const hours = Math.floor(magnitude / 60);
  const minutes = magnitude % 60;
  const duration = hours ? `${hours} hr${minutes ? ` ${minutes} min` : ''}` : `${minutes} min`;
  return `${value < 0 ? '-' : ''}${duration}`;
}

// T+ is measured from the case's review origin; it is not a wall-clock date.
export function formatPosition(value) {
  return Number.isFinite(value)
    ? `T${value < 0 ? '-' : '+'}${formatMinutes(Math.abs(value))}`
    : 'Not established';
}

/** Read the fixed policy from the pinned public app rather than copying it. */
export function readTimingPolicy(appPackage) {
  const constraints = appPackage?.app?.model?.module?.constraints;
  const constraint = Array.isArray(constraints)
    ? constraints.find(row => row?.id === 'minimum-rehearsal') : null;
  const predicate = constraint?.predicate;
  const args = predicate?.args;
  if (constraint?.kind !== 'predicate' || predicate?.op !== 'gte'
    || !Array.isArray(args) || args.length !== 2
    || args[0]?.ref !== 'parameter.rehearsalMinutes'
    || Object.keys(args[0]).length !== 1 || Object.keys(args[1] ?? {}).length !== 1
    || !Number.isSafeInteger(args[1]?.literal) || args[1].literal < 0) {
    const error = new Error('This app has an incompatible rehearsal policy. The desk requires a published rehearsal-minutes minimum; it cannot infer one.');
    error.name = 'IncompatibleProfileError';
    throw error;
  }
  return { minimumRehearsalMinutes: args[1].literal };
}

function required(value) {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    throw new Error('Supply a value without surrounding whitespace.');
  }
  return value;
}

function whole(value) {
  required(value);
  if (!/^(0|[1-9]\d*)$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error('Enter a nonnegative whole number.');
  }
  return Number(value);
}

function starts(value) {
  required(value);
  const values = value.split(',').map(part => whole(part.trim()));
  if (new Set(values).size !== values.length) {
    throw new Error('List each candidate start once, in whole minutes separated by commas.');
  }
  return values;
}

function sameValue(left, right) {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length
    && keys.every(key => Object.hasOwn(right, key) && sameValue(left[key], right[key]));
}

export function cents(value) {
  required(value);
  if (!/^(0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) {
    throw new Error('Enter a nonnegative USD amount with at most two decimal places.');
  }
  const [dollars, fraction = ''] = value.split('.');
  const amount = BigInt(dollars) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('The amount exceeds the supported integer range.');
  }
  return Number(amount);
}

function decimal(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('The case contains an unsupported amount.');
  }
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
}

/** Fill the team's form from a native case without upgrading older records. */
export function toDraft(inputs, config) {
  const records = inputs.tables.confirmations;
  if (!Array.isArray(records) || records.length > 1
    || records.some(record => record.packageId !== config.confirmationPackage)) {
    throw new Error('This desk supports one current external-booking record. Reconcile the case before importing it.');
  }
  const record = records[0];
  if (record && typeof record.confirmed !== 'boolean') {
    throw new Error('The confirmation must explicitly state whether the package is confirmed.');
  }
  const confirmation = {
    status: record ? (record.confirmed ? 'positive' : 'negative') : 'none',
  };
  for (const field of recordFields) confirmation[field] = record?.[field] ?? '';
  // Only the package being booked is known from the form's fixed context.
  // A missing record does not establish its scope, source or responsible person.
  confirmation.packageId = record?.packageId ?? config.confirmationPackage;
  for (const field of timeFields) {
    confirmation[field] = record ? String(record[field]) : '';
  }
  return {
    setup: {
      ...Object.fromEntries(setupFields.map(field => [field, String(inputs.parameters[field])])),
      startOptions: inputs.parameters.startOptions.join(', '),
    },
    availability: Object.fromEntries(Object.entries(intervalFields).map(([table, fields]) => [
      table,
      inputs.tables[table].map(row => ({
        ...structuredClone(row),
        ...Object.fromEntries(fields.map(field => [field, String(row[field])])),
      })),
    ])),
    quotes: inputs.tables.packages.map(row => ({
      id: row.id,
      quantity: String(row.quantity),
      repairMinutes: String(row.repairMinutes),
      totalCost: decimal(row.repairCostMinor),
      currency: config.currency,
    })),
    confirmation,
  };
}

/** Convert form units; the pinned app, rather than this function, checks rules. */
export function buildCase(base, draft, config) {
  const issues = [];
  function read(path, value, convert = required) {
    try { return convert(value); }
    catch (error) { issues.push({ path, message: error.message }); }
  }

  const result = structuredClone(base);
  for (const field of setupFields) {
    result.parameters[field] = read(`setup.${field}`, draft.setup?.[field], whole);
  }
  result.parameters.startOptions = read('setup.startOptions', draft.setup?.startOptions, starts);

  // Editing a deadline is not evidence that existing records were renewed.
  // Only the explicitly edited numeric cells change; scope and source stay put.
  for (const [table, fields] of Object.entries(intervalFields)) {
    const rows = draft.availability?.[table];
    if (!Array.isArray(rows) || rows.length !== base.tables[table].length) {
      issues.push({ path: `availability.${table}`, message: 'Keep the existing record rows. Import another case to add or remove records.' });
      continue;
    }
    result.tables[table] = base.tables[table].map((original, index) => {
      const row = rows[index];
      const metadata = value => Object.fromEntries(Object.entries(value ?? {}).filter(([key]) => !fields.includes(key)));
      if (!sameValue(metadata(original), metadata(row))) {
        issues.push({ path: `availability.${table}.${index}`, message: 'Keep the recorded identity, scope and source unchanged. Import another case to replace these records.' });
      }
      return {
        ...original,
        ...Object.fromEntries(fields.map(field => [
          field, read(`availability.${table}.${index}.${field}`, row?.[field], whole),
        ])),
      };
    });
  }
  const quotes = Array.isArray(draft.quotes) ? draft.quotes : [];
  const ids = base.tables.packages.map(row => row.id);
  if (quotes.length !== ids.length || new Set(quotes.map(row => row.id)).size !== ids.length
    || quotes.some(row => !ids.includes(row.id))) {
    issues.push({ path: 'quotes', message: 'Supply exactly one quote for each published correction package.' });
  }
  result.tables.packages = base.tables.packages.map(original => {
    const row = quotes.find(quote => quote.id === original.id);
    if (!row) return original;
    const path = `quotes.${row.id}`;
    read(`${path}.currency`, row.currency, value => {
      if (value !== 'USD' || config.currency !== 'USD' || config.moneyDivisor !== 100) {
        throw new Error('This review accepts USD quotes only; foreign-exchange conversion is not supported.');
      }
      return value;
    });
    return {
      ...original,
      quantity: read(`${path}.quantity`, row.quantity, whole),
      repairMinutes: read(`${path}.repairMinutes`, row.repairMinutes, whole),
      repairCostMinor: read(`${path}.totalCost`, row.totalCost, cents),
    };
  });

  const row = draft.confirmation ?? {};
  if (!['none', 'positive', 'negative'].includes(row.status)) {
    issues.push({ path: 'confirmation.status', message: 'Select a supported current record status.' });
  }
  result.tables.confirmations = [];
  if (row.status === 'positive' || row.status === 'negative') {
    const confirmation = { ...base.tables.confirmations[0], confirmed: row.status === 'positive' };
    for (const field of recordFields) {
      confirmation[field] = read(`confirmation.${field}`, row[field]);
    }
    if (row.packageId !== config.confirmationPackage) {
      issues.push({ path: 'confirmation.packageId', message: 'This form records the external package booking only.' });
    }
    for (const field of timeFields) {
      confirmation[field] = read(`confirmation.${field}`, row[field], whole);
    }
    result.tables.confirmations = [confirmation];
  }
  // A new confirmation is not permission, a repair record, a reduced fault set,
  // or evidence that production work has been completed.
  if (issues.length) throw new FormError(issues);
  return result;
}

/** Select public SDK findings for this team's table; never re-evaluate rules. */
export function summarizeRun(run, config) {
  const parameters = run?.input?.inputs?.parameters;
  const timing = parameters ? {
    ...Object.fromEntries(setupFields.map(field => [field, parameters[field]])),
    startOptions: structuredClone(parameters.startOptions),
  } : null;
  function unavailable(message) {
    return {
      available: false, status: 'unavailable', issues: [message],
      identity: run?.identity, finding: run?.assessment?.finding,
      preferredIds: [], preferred: [], plans: [], scenarioCount: 0, timing,
    };
  }
  const completeness = run?.report?.completeness;
  if (run?.execution?.status !== 'completed' || completeness?.materialized !== true
    || completeness.allRequestedViews !== true || completeness.allRetainedContexts !== true
    || completeness.truncated !== false || completeness.assessmentComplete !== true) {
    return unavailable('The calculation or its report is incomplete. Review again before proposing a package.');
  }
  if (Object.entries(config.binding).some(([key, value]) => run.identity?.[key] !== value)) {
    return unavailable('The result belongs to a different app release. Review this case with the pinned app.');
  }
  if (!parameters || setupFields.some(field => !Number.isFinite(parameters[field]))
    || !Array.isArray(parameters.startOptions)) {
    return unavailable('The result does not retain the complete review timing. Review this case again.');
  }

  // This public resolver restores a retained native assessment from its report.
  // Consumers do not need to decode the SDK's normalized table representation.
  let assessment;
  try { assessment = commitment.resolveCommitmentAssessment(run.assessment, run.report); }
  catch { return unavailable('The complete package assessment is unavailable in this result.'); }
  if (assessment.status !== 'complete' || assessment.coverage.complete !== true
    || assessment.coverage.admissionComplete !== true) {
    return unavailable('The calculation has not checked every admitted package and fault scenario.');
  }
  const recommendation = assessment.recommendation;
  if (assessment.feasiblePlanIds.length && (assessment.preference.optimalityEstablished !== true
    || recommendation?.preferenceEstablished !== true)) {
    return unavailable('The calculation has not established a preferred package.');
  }

  const preferredPlanIds = recommendation?.tiedPlanIds ?? [];
  const plans = [];
  for (const plan of assessment.plans) {
    const handoff = plan.activities?.find(activity => activity.id === 'handoff');
    if (!plan.complete || typeof plan.feasible !== 'boolean'
      || !Number.isFinite(plan.expense) || !Number.isFinite(handoff?.end)
      || !Number.isFinite(plan.choices.startMinute)) {
      return unavailable('This desk needs a complete cost and handoff schedule for every package.');
    }
    const packageId = plan.choices.packageId;
    plans.push({
      id: plan.id, packageId,
      label: config.labels.packages[packageId] ?? packageId,
      startMinute: plan.choices.startMinute, finishMinute: handoff.end,
      deadlineSlackMinute: parameters.handoffDeadlineMinute - handoff.end,
      expense: plan.expense, expenseDisplay: formatMoney(plan.expense, config),
      feasible: plan.feasible, preferred: preferredPlanIds.includes(plan.id),
      blockers: plan.blockers.map(blocker => ({
        id: blocker.constraintId,
        label: config.labels.checks[blocker.constraintId] ?? blocker.constraintId,
        requirement: blocker.requirement, scenarioId: blocker.scenarioId,
      })),
    });
  }
  const preferred = plans.filter(plan => plan.preferred);
  return {
    available: true,
    status: assessment.feasiblePlanIds.length ? 'eligible' : 'blocked',
    issues: [], identity: run.identity, finding: assessment.finding,
    preferredIds: preferred.map(plan => plan.packageId), preferred, plans,
    scenarioCount: assessment.coverage.totalScenarios,
    timing,
  };
}
