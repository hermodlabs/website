import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseCsv } from './csv.mjs';
import { SLOT_CONFIRMATION_STATUS } from './semantics.mjs';

// These are complete snapshots, not patches or event logs. Absence from a
// snapshot must not silently leave yesterday's quote or slot in the new case.
export const ORDER_COLUMNS = Object.freeze([
  'shipment_id', 'order_id', 'order_revision', 'recipient', 'ship_date', 'profile_version',
  'quantity', 'currency', 'expense_limit', 'cash_limit', 'current_at', 'action_ready_at',
  'reservation_deadline_at', 'receipt_open_at', 'receipt_deadline_at', 'receipt_close_at',
  'owner', 'owner_email',
]);
export const QUOTE_COLUMNS = Object.freeze([
  'shipment_id', 'order_id', 'order_revision', 'arrangement', 'ship_point', 'currency',
  'total_cost', 'departure_at', 'travel_minutes', 'capacity',
]);
export const SLOT_COLUMNS = Object.freeze([
  'shipment_id', 'arrangement', 'ship_point', 'order_id', 'order_revision', 'recipient',
  'ship_date', 'profile_version', 'slot_reference', 'status', 'confirmed_at', 'known_at',
  'valid_from_at', 'valid_until_at',
]);

export class InputError extends Error {
  constructor(message) { super(message); this.name = 'InputError'; }
}

function required(value, column) {
  if (typeof value !== 'string' || value === '') throw new InputError(`${column} is required.`);
  if (value !== value.trim()) throw new InputError(`${column} must not contain surrounding whitespace.`);
  return value;
}

function integer(value, column, minimum = 0) {
  required(value, column);
  if (!/^(0|[1-9]\d*)$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < minimum) {
    throw new InputError(`${column} must be a whole number of at least ${minimum}.`);
  }
  return Number(value);
}

/** Decimal dollars are converted exactly. No floating-point currency math or FX. */
export function usdCents(value, column = 'amount') {
  required(value, column);
  if (!/^(0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) throw new InputError(`${column} must be a nonnegative USD amount with at most two decimal places.`);
  const [dollars, cents = ''] = value.split('.');
  const result = BigInt(dollars) * 100n + BigInt(cents.padEnd(2, '0'));
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new InputError(`${column} exceeds the supported integer range.`);
  return Number(result);
}

function dateOnly(value, column) {
  required(value, column);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new InputError(`${column} must be a valid YYYY-MM-DD date.`);
  }
  return value;
}

function instant(value, column) {
  required(value, column);
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):00(?:\.000)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) throw new InputError(`${column} must be an ISO timestamp with an explicit offset and whole-minute precision.`);
  dateOnly(match[1], column);
  const [, , hours, minutes, offset] = match;
  if (Number(hours) > 23 || Number(minutes) > 59 || (offset !== 'Z' && (Number(offset.slice(1, 3)) > 14 || Number(offset.slice(4)) > 59 || (Number(offset.slice(1, 3)) === 14 && Number(offset.slice(4)) !== 0)))) {
    throw new InputError(`${column} contains an invalid clock time or UTC offset.`);
  }
  const result = Date.parse(value);
  if (!Number.isFinite(result)) throw new InputError(`${column} is not a valid timestamp.`);
  return result;
}

export function relativeMinute(value, timeOrigin, column = 'timestamp') {
  const result = (instant(value, column) - instant(timeOrigin, 'timeOrigin')) / 60000;
  if (!Number.isSafeInteger(result) || result < 0) throw new InputError(`${column} must be a whole minute at or after the configured time origin.`);
  return result;
}

function checkColumns(csv, expected, source) {
  const missing = expected.filter(column => !csv.headers.includes(column));
  const unexpected = csv.headers.filter(column => !expected.includes(column));
  if (missing.length || unexpected.length) throw new InputError(`${source}: invalid columns.${missing.length ? ` Missing: ${missing.join(', ')}.` : ''}${unexpected.length ? ` Unexpected: ${unexpected.join(', ')}.` : ''}`);
}

function checkCurrency(value, expectedCurrency, column = 'currency') {
  required(value, column);
  if (value !== expectedCurrency || expectedCurrency !== 'USD') throw new InputError(`${column} must be USD; received ${JSON.stringify(value)}. Currency conversion is not supported.`);
}

function shipmentId(value) {
  required(value, 'shipment_id');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(value)) throw new InputError('shipment_id must be a filename-safe identifier of at most 80 characters.');
  return value;
}

function scope(row) {
  return {
    orderId: required(row.order_id, 'order_id'),
    orderRevision: required(row.order_revision, 'order_revision'),
    recipient: required(row.recipient, 'recipient'),
    shipDate: dateOnly(row.ship_date, 'ship_date'),
    profileVersion: required(row.profile_version, 'profile_version'),
  };
}

function orderParameters(row, timeOrigin, expectedCurrency) {
  checkCurrency(row.currency, expectedCurrency);
  return {
    ...scope(row), quantity: integer(row.quantity, 'quantity', 1),
    expenseLimit: usdCents(row.expense_limit, 'expense_limit'),
    cashLimit: usdCents(row.cash_limit, 'cash_limit'),
    currentTime: relativeMinute(row.current_at, timeOrigin, 'current_at'),
    actionReady: relativeMinute(row.action_ready_at, timeOrigin, 'action_ready_at'),
    reservationDeadline: relativeMinute(row.reservation_deadline_at, timeOrigin, 'reservation_deadline_at'),
    receiptOpen: relativeMinute(row.receipt_open_at, timeOrigin, 'receipt_open_at'),
    receiptDeadline: relativeMinute(row.receipt_deadline_at, timeOrigin, 'receipt_deadline_at'),
    receiptClose: relativeMinute(row.receipt_close_at, timeOrigin, 'receipt_close_at'),
  };
}

function quote(row, order, timeOrigin, expectedCurrency) {
  if (required(row.order_id, 'order_id') !== order.order_id || required(row.order_revision, 'order_revision') !== order.order_revision) {
    throw new InputError('The quote does not cover the current order ID and revision. Obtain a current complete quote.');
  }
  checkCurrency(row.currency, expectedCurrency);
  return {
    id: required(row.arrangement, 'arrangement'), shipPoint: required(row.ship_point, 'ship_point'),
    fee: usdCents(row.total_cost, 'total_cost'),
    departure: relativeMinute(row.departure_at, timeOrigin, 'departure_at'),
    travelDuration: integer(row.travel_minutes, 'travel_minutes'), capacity: integer(row.capacity, 'capacity'),
  };
}

function slot(row, timeOrigin) {
  const status = required(row.status, 'status');
  if (!Object.values(SLOT_CONFIRMATION_STATUS).includes(status)) throw new InputError('status must be confirmed, cancelled, or conflicting. Resolve an ambiguous current-status export before evaluating it.');
  return {
    arrangement: required(row.arrangement, 'arrangement'), shipPoint: required(row.ship_point, 'ship_point'),
    ...scope(row), slotReference: required(row.slot_reference, 'slot_reference'), status,
    confirmedAt: relativeMinute(row.confirmed_at, timeOrigin, 'confirmed_at'),
    knownAt: relativeMinute(row.known_at, timeOrigin, 'known_at'),
    validFrom: relativeMinute(row.valid_from_at, timeOrigin, 'valid_from_at'),
    validUntil: relativeMinute(row.valid_until_at, timeOrigin, 'valid_until_at'),
  };
}

function duplicates(rows, key) {
  const counts = new Map();
  for (const row of rows) counts.set(row.values[key], (counts.get(row.values[key]) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value);
}

/**
 * Prepare canonical inputs; do not assess business feasibility here.
 *
 * Retained files are supplied per shipment. They contain reviewed readiness,
 * grants, resources, calendars and other obligations outside these exports.
 * The adapter deliberately never re-scopes those records to a new revision.
 * A new order may therefore become blocked even though it is valid input.
 */
export async function loadBatch({ inputDir, retainedDir, timeOrigin, expectedCurrency = 'USD' }) {
  if (!inputDir || !retainedDir) throw new InputError('inputDir and retainedDir are required.');
  instant(timeOrigin, 'timeOrigin');
  if (expectedCurrency !== 'USD') throw new InputError('This adapter only supports USD.');
  inputDir = path.resolve(inputDir);
  retainedDir = path.resolve(retainedDir);
  const specs = [['orders.csv', ORDER_COLUMNS], ['quotes.csv', QUOTE_COLUMNS], ['slot-confirmations.csv', SLOT_COLUMNS]];
  const csvFiles = specs.map(([name]) => path.join(inputDir, name));
  const sourceFiles = [...csvFiles];
  const sourceReceipts = new Map();
  // Hash the very bytes being interpreted, rather than reopening a file after
  // intake. Otherwise an exporter could change it between parsing and hashing,
  // making the retained provenance describe a different snapshot from the run.
  const readSource = async file => {
    try {
      const bytes = await readFile(file);
      sourceReceipts.set(file, { file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
      return bytes.toString('utf8');
    } catch (error) {
      if (error.code === 'ENOENT') sourceReceipts.set(file, { file, missing: true });
      throw error;
    }
  };
  const snapshots = await Promise.all(specs.map(async ([name, columns]) => {
    const csv = parseCsv(await readSource(path.join(inputDir, name)), { source: name });
    checkColumns(csv, columns, name);
    return csv.rows;
  }));
  const [orders, quotes, slots] = snapshots;
  if (!orders.length) throw new InputError('orders.csv must contain at least one shipment.');
  const ids = [...new Set([...orders, ...quotes, ...slots].map(row => row.values.shipment_id))];
  const jobs = [];
  for (const id of ids) {
    const orderRows = orders.filter(row => row.values.shipment_id === id);
    const quoteRows = quotes.filter(row => row.values.shipment_id === id);
    const slotRows = slots.filter(row => row.values.shipment_id === id);
    const row = orderRows[0]?.values;
    const job = { shipmentId: id, orderId: row?.order_id ?? '', orderRevision: row?.order_revision ?? '', owner: row?.owner ?? '', ownerEmail: row?.owner_email ?? '', sourceFiles: [...csvFiles], errors: [] };
    jobs.push(job);
    const capture = (source, line, action) => {
      try { return action(); }
      catch (error) { job.errors.push({ source, line, message: error.message }); return undefined; }
    };
    if (!capture('orders.csv', orderRows[0]?.line ?? 1, () => shipmentId(id))) continue;
    if (orderRows.length !== 1) {
      job.errors.push({ source: 'orders.csv', line: orderRows[0]?.line ?? 1, message: orderRows.length ? 'Duplicate shipment_id: supply exactly one current order per shipment.' : 'No current order exists for this shipment_id.' });
      continue;
    }
    const parameters = capture('orders.csv', orderRows[0].line, () => orderParameters(row, timeOrigin, expectedCurrency));
    capture('orders.csv', orderRows[0].line, () => required(row.owner, 'owner'));
    capture('orders.csv', orderRows[0].line, () => required(row.owner_email, 'owner_email'));
    const retainedPath = path.join(retainedDir, `${id}.json`);
    sourceFiles.push(retainedPath); job.sourceFiles.push(retainedPath);
    let retainedCase;
    try {
      retainedCase = JSON.parse(await readSource(retainedPath));
      if (!retainedCase || retainedCase.id !== id || !retainedCase.parameters || typeof retainedCase.parameters !== 'object' || !retainedCase.tables || typeof retainedCase.tables !== 'object' || !Array.isArray(retainedCase.tables.arrangements)) throw new InputError('Expected a canonical input object with matching shipment id, parameters and tables.arrangements.');
      if (retainedCase.parameters.orderId !== row.order_id) throw new InputError('The retained case belongs to a different order. Supply the correct case; order identity is never reassigned by the adapter.');
      job.retainedCase = retainedCase;
    } catch (error) { job.errors.push({ source: retainedPath, line: 1, message: `Cannot load retained case: ${error.message}` }); }
    const duplicateQuotes = duplicates(quoteRows, 'arrangement');
    for (const value of duplicateQuotes) job.errors.push({ source: 'quotes.csv', line: quoteRows.find(item => item.values.arrangement === value).line, message: `Duplicate current quote for arrangement ${JSON.stringify(value)}. Reconcile the export instead of selecting its last row.` });
    for (const value of duplicates(slotRows, 'arrangement')) job.errors.push({ source: 'slot-confirmations.csv', line: slotRows.find(item => item.values.arrangement === value).line, message: `Duplicate current slot records for arrangement ${JSON.stringify(value)}. Resolve them to one current status.` });
    const arrangements = quoteRows.map(item => capture('quotes.csv', item.line, () => quote(item.values, row, timeOrigin, expectedCurrency)));
    const slotConfirmations = slotRows.map(item => capture('slot-confirmations.csv', item.line, () => slot(item.values, timeOrigin)));
    if (retainedCase) {
      const expected = retainedCase.tables.arrangements.map(item => item.id).sort();
      const actual = arrangements.filter(Boolean).map(item => item.id).sort();
      if (!duplicateQuotes.length && arrangements.every(Boolean) && (actual.length !== expected.length || actual.some((value, index) => value !== expected[index]))) job.errors.push({ source: 'quotes.csv', line: 1, message: 'The complete quote snapshot must contain exactly the arrangements in the retained case. Adding or removing an option requires an explicit case/model review.' });
      const declared = new Set(expected);
      for (const [index, confirmation] of slotConfirmations.entries()) if (confirmation && !declared.has(confirmation.arrangement)) job.errors.push({ source: 'slot-confirmations.csv', line: slotRows[index].line, message: 'Slot arrangement is not present in the retained case.' });
    }
    if (!job.errors.length) {
      // Only the stated dynamic fields are replaced. Keep original evidence and
      // permissions byte-for-byte in value, including their old revision IDs.
      job.caseData = structuredClone(retainedCase);
      job.caseData.parameters = { ...job.caseData.parameters, ...parameters };
      job.caseData.tables.arrangements = arrangements;
      job.caseData.tables.slotConfirmations = slotConfirmations;
    }
  }
  return { inputDir, retainedDir, sourceFiles: [...new Set(sourceFiles)], sourceReceipts: [...new Set(sourceFiles)].map(file => sourceReceipts.get(file)).filter(Boolean), jobs };
}
