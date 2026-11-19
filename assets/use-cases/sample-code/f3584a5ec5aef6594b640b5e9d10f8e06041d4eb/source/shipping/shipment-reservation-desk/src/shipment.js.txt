import { commitment, EXECUTION_STATUS, inspectReportCompleteness } from '@decision-lab/sdk';
import { REVIEW_OUTCOME, SLOT_CONFIRMATION_STATUS } from './semantics.js';

const confirmationTimes = ['confirmedAt', 'knownAt', 'validFrom', 'validUntil'];
const confirmationFields = ['slotReference', 'orderId', 'orderRevision', 'recipient', 'shipPoint', 'profileVersion'];

export class FormError extends Error {
  constructor(issues) {
    super('Correct the input records before reassessing.');
    this.name = 'FormError';
    this.issues = issues;
  }
}

export function formatMoney(value, config) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: config.currency,
  }).format(value / config.moneyDivisor);
}

export function formatTime(minute, config) {
  if (!Number.isFinite(minute)) return 'Not established';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: config.timeZone, month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(Date.parse(config.timeOrigin) + minute * 60_000));
}

function offsetMinutes(config) {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(config.utcOffset ?? '');
  if (!match || Number(match[2]) > 14 || Number(match[3]) > 59
    || Number(match[2]) === 14 && Number(match[3]) !== 0) {
    throw new Error('Configure a valid fixed UTC offset for the shipment profile.');
  }
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
}

// datetime-local uses this profile's explicit offset, never the browser's zone.
export function localTime(minute, config) {
  if (!Number.isSafeInteger(minute)) throw new Error('The case contains an unsupported timestamp.');
  const instant = Date.parse(config.timeOrigin) + (minute + offsetMinutes(config)) * 60_000;
  return new Date(instant).toISOString().slice(0, 16);
}

export function minuteFromLocal(value, config) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value ?? '')) {
    throw new Error('Enter a date and time with whole-minute precision.');
  }
  const instant = Date.parse(`${value}:00${config.utcOffset}`);
  const minute = (instant - Date.parse(config.timeOrigin)) / 60_000;
  if (!Number.isSafeInteger(minute) || minute < 0 || localTime(minute, config) !== value) {
    throw new Error('Enter a valid time at or after the configured review origin.');
  }
  return minute;
}

function required(value) {
  if (typeof value !== 'string' || !value || value.trim() !== value) {
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

export function cents(value) {
  required(value);
  if (!/^(0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) {
    throw new Error('Enter a nonnegative USD amount with at most two decimal places.');
  }
  const [dollars, fraction = ''] = value.split('.');
  const amount = BigInt(dollars) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('The amount exceeds the supported integer range.');
  return Number(amount);
}

function decimal(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('The case contains an unsupported amount.');
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
}

/** Populate the form from an admitted case, preserving each record's own scope. */
export function toDraft(inputs, config) {
  const records = inputs.tables.slotConfirmations;
  const arrangement = config.slotArrangement ?? 'consolidated';
  if (!Array.isArray(records) || records.length > 1 || records.some(record => record.arrangement !== arrangement)) {
    throw new Error('This desk supports one current consolidation-slot record. Reconcile the case before importing it.');
  }
  const record = records[0];
  const quote = inputs.tables.arrangements.find(row => row.id === arrangement);
  const confirmation = {
    status: record?.status ?? SLOT_CONFIRMATION_STATUS.NONE,
    slotReference: record?.slotReference ?? '',
    orderId: record?.orderId ?? inputs.parameters.orderId,
    orderRevision: record?.orderRevision ?? '',
    recipient: record?.recipient ?? '',
    shipPoint: record?.shipPoint ?? quote?.shipPoint ?? '',
    shipDate: record?.shipDate ?? '',
    profileVersion: record?.profileVersion ?? inputs.parameters.profileVersion,
  };
  for (const field of confirmationTimes) {
    confirmation[field] = record ? localTime(record[field], config) : '';
  }
  return {
    asOf: localTime(inputs.parameters.currentTime, config),
    quotes: inputs.tables.arrangements.map(row => ({
      id: row.id, shipPoint: row.shipPoint, currency: config.currency,
      totalCost: decimal(row.fee), departure: localTime(row.departure, config),
      travelMinutes: String(row.travelDuration), capacity: String(row.capacity),
      quoteId: row.quoteId, quoteRevision: row.quoteRevision,
      quoteOrderId: row.quoteOrderId, quoteOrderRevision: row.quoteOrderRevision,
      quoteKnownAt: localTime(row.quoteKnownAt, config),
      quoteValidFrom: localTime(row.quoteValidFrom, config),
      quoteValidUntil: localTime(row.quoteValidUntil, config),
      bookingCutoff: localTime(row.bookingCutoff, config),
    })),
    confirmation,
  };
}

/** Convert the form's units; the SDK evaluates the supplied business records. */
export function buildCase(base, draft, config) {
  const issues = [];
  function read(path, value, convert = required) {
    try { return convert(value); }
    catch (error) { issues.push({ path, message: error.message }); }
  }

  // Cloning preserves readiness, resources and permissions exactly as supplied.
  // A changed quote or confirmation must never re-scope those other records.
  const result = structuredClone(base);
  result.parameters.currentTime = read('asOf', draft.asOf, value => minuteFromLocal(value, config));
  if (result.parameters.currentTime < base.parameters.currentTime) {
    issues.push({ path: 'asOf', message: 'Assessment time cannot precede the imported case time.' });
  }
  result.parameters.actionReady = Math.max(base.parameters.actionReady, result.parameters.currentTime);
  result.tables.arrangements = base.tables.arrangements.map(original => {
    const row = draft.quotes.find(quote => quote.id === original.id);
    if (!row) {
      issues.push({ path: original.id, message: 'The complete quote is missing.' });
      return original;
    }
    const path = `quotes.${row.id}`;
    read(`${path}.currency`, row.currency, value => {
      if (value !== 'USD' || config.currency !== 'USD') {
        throw new Error('This review accepts USD quotes only; foreign-exchange conversion is not supported.');
      }
      return value;
    });
    return {
      ...original,
      shipPoint: read(`${path}.shipPoint`, row.shipPoint),
      fee: read(`${path}.totalCost`, row.totalCost, cents),
      departure: read(`${path}.departure`, row.departure, value => minuteFromLocal(value, config)),
      travelDuration: read(`${path}.travelMinutes`, row.travelMinutes, whole),
      capacity: read(`${path}.capacity`, row.capacity, whole),
      quoteId: read(`${path}.quoteId`, row.quoteId), quoteRevision: read(`${path}.quoteRevision`, row.quoteRevision),
      quoteOrderId: read(`${path}.quoteOrderId`, row.quoteOrderId),
      quoteOrderRevision: read(`${path}.quoteOrderRevision`, row.quoteOrderRevision),
      ...Object.fromEntries(['quoteKnownAt', 'quoteValidFrom', 'quoteValidUntil', 'bookingCutoff'].map(field =>
        [field, read(`${path}.${field}`, row[field], value => minuteFromLocal(value, config))])),
    };
  });

  const row = draft.confirmation;
  if (!Object.values(SLOT_CONFIRMATION_STATUS).includes(row.status)) {
    issues.push({ path: 'confirmation.status', message: 'Select a supported current record status.' });
  }
  result.tables.slotConfirmations = [];
  if (row.status !== SLOT_CONFIRMATION_STATUS.NONE) {
    const confirmation = {
      ...base.tables.slotConfirmations[0],
      arrangement: config.slotArrangement ?? 'consolidated', status: row.status,
    };
    for (const field of confirmationFields) {
      confirmation[field] = read(`confirmation.${field}`, row[field]);
    }
    confirmation.shipDate = read('confirmation.shipDate', row.shipDate, value => {
      required(value);
      const date = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d\d-\d\d$/.test(value) || !Number.isFinite(date.getTime())
        || date.toISOString().slice(0, 10) !== value) throw new Error('Enter a valid ship date.');
      return value;
    });
    for (const field of confirmationTimes) {
      confirmation[field] = read(`confirmation.${field}`, row[field], value => minuteFromLocal(value, config));
    }
    result.tables.slotConfirmations = [confirmation];
  }
  if (issues.length) throw new FormError(issues);
  return result;
}

/** Add a received record without copying the current revision onto an old grant.
 * The supplied revision, location and interval remain the document's scope.
 * Source authentication belongs to the team's integration, not this form.
 */
export function replaceSupportingRecord(base, record, config) {
  const result = structuredClone(base), p = base.parameters;
  for (const field of ['reference', 'orderId', 'orderRevision', 'recipient', 'shipDate', 'profileVersion', 'shipPoint']) required(record[field]);
  if (!base.tables.arrangements.some(row => row.id === record.arrangement)) throw new Error('Choose a reviewed arrangement.');
  const scope = { orderId: record.orderId, orderRevision: record.orderRevision, recipient: record.recipient,
    shipDate: record.shipDate, profileVersion: record.profileVersion };
  if (record.kind === 'readiness') {
    if (base.tables.states.length !== 1) throw new Error('This desk requires one reviewed registration state; use a separately authored evidence review for unresolved states.');
    if (!['true', 'false'].includes(record.registered)) throw new Error('Supply the actual registration finding.');
    const value = { ...scope, stateId: base.tables.states[0].id, shipPoint: record.shipPoint, registered: record.registered === 'true' };
    result.tables.readiness = [...result.tables.readiness.filter(row => !(row.stateId === value.stateId && row.shipPoint === value.shipPoint)), value];
  } else {
    const start = minuteFromLocal(record.start, config), end = minuteFromLocal(record.end, config);
    if (end <= start) throw new Error('Permission validity must end after it begins.');
    if (record.kind === 'reservation') {
      const value = { ...scope, arrangement: record.arrangement, shipPoint: record.shipPoint, start, end };
      result.tables.arrangementAuthorities = [...result.tables.arrangementAuthorities.filter(row => row.arrangement !== record.arrangement), value];
    } else if (record.kind === 'release') {
      const value = { ...scope, id: record.reference, actor: required(record.actor), action: 'release', arrangement: record.arrangement,
        shipPoint: record.shipPoint, start, end };
      result.tables.grants = [...result.tables.grants.filter(row => row.arrangement !== record.arrangement), value];
    } else throw new Error('Choose a supported received-record type.');
  }
  if (result.provenance.some(row => row.id === record.reference)) throw new Error('This source reference is already retained. Import a distinct replacement record.');
  result.provenance.push({ id: record.reference, description: `Received ${record.kind} record; scope and values supplied by the reviewer: ${JSON.stringify(record)}` });
  return result;
}

/** Read SDK results into this screen's labels without calculating any rules. */
export function summarizeRun(run, config) {
  function unavailable(message) {
    return {
      available: false, status: REVIEW_OUTCOME.UNAVAILABLE, issues: [message], identity: run.identity,
      scope: null, finding: run.assessment?.finding, preferredIds: [], preferred: [], plans: [],
    };
  }
  // Report availability and computation completion are separate contracts.
  if (run.execution?.status !== EXECUTION_STATUS.COMPLETED
    || !inspectReportCompleteness(run.report).complete) {
    return unavailable('The calculation or its report is incomplete. Reassess before choosing an arrangement.');
  }

  // The public resolver restores the SDK's retained assessment. Consumers do
  // not need to traverse normalized report tables or implement the decoder.
  const assessment = commitment.resolveCommitmentAssessment(run.assessment, run.report);
  if (!commitment.isAssessmentComplete(assessment)) {
    return unavailable('The calculation has not checked every admitted arrangement and situation.');
  }
  const hasWitness = commitment.hasFeasibleWitness(assessment);
  const recommendation = assessment.recommendation;
  // An unverified positive claim is unavailable, not evidence that every plan is blocked.
  if (assessment.feasiblePlanIds.length && !commitment.hasEstablishedPreference(assessment)) {
    return unavailable('The calculation has not established a preferred arrangement.');
  }

  const preferredPlanIds = recommendation?.tiedPlanIds ?? [];
  const plans = [];
  for (const plan of assessment.plans) {
    const arrangementId = plan.choices.arrangement;
    const arrivals = plan.scenarios.map(scenario => scenario.derived.arrival);
    if (!plan.complete || typeof plan.feasible !== 'boolean' || !Number.isFinite(plan.expense)
      || !arrivals.length || !Number.isFinite(arrivals[0])
      || arrivals.some(arrival => arrival !== arrivals[0])
      || plans.some(existing => existing.arrangementId === arrangementId)) {
      return unavailable('This screen needs one complete plan and one arrival time per arrangement.');
    }
    plans.push({
      id: plan.id, arrangementId, label: config.labels.arrangements[arrangementId] ?? arrangementId,
      feasible: plan.feasible, preferred: preferredPlanIds.includes(plan.id),
      expense: plan.expense, expenseDisplay: formatMoney(plan.expense, config),
      arrivalMinutes: arrivals[0], arrival: formatTime(arrivals[0], config),
      blockers: plan.blockers.map(blocker => ({
        id: blocker.constraintId,
        label: config.labels.checks[blocker.constraintId] ?? blocker.constraintId,
        requirement: blocker.requirement, scenarioId: blocker.scenarioId,
      })),
    });
  }
  const preferred = plans.filter(plan => plan.preferred);
  const parameters = run.input.inputs.parameters;
  return {
    available: true, status: hasWitness ? REVIEW_OUTCOME.ELIGIBLE : REVIEW_OUTCOME.BLOCKED, issues: [],
    identity: run.identity,
    scope: { orderId: parameters.orderId, orderRevision: parameters.orderRevision,
      recipient: parameters.recipient, shipDate: parameters.shipDate, profileVersion: parameters.profileVersion },
    finding: assessment.finding, preferredIds: preferred.map(plan => plan.arrangementId), preferred, plans,
  };
}
