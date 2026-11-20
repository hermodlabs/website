import test from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from '../src/csv.mjs';
import { loadBatch, relativeMinute, usdCents } from '../src/inputs.mjs';

const fixtures = fileURLToPath(new URL('../fixtures/', import.meta.url));
const timeOrigin = '2026-11-17T00:00:00-06:00';
const batch = name => ({ inputDir: path.join(fixtures, name), retainedDir: path.join(fixtures, 'retained', name), timeOrigin });

async function editedBatch(t, edit) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'shipment-inputs-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await cp(path.join(fixtures, 'baseline'), path.join(directory, 'input'), { recursive: true });
  await cp(path.join(fixtures, 'retained/baseline'), path.join(directory, 'retained'), { recursive: true });
  await edit(path.join(directory, 'input'), path.join(directory, 'retained'));
  return loadBatch({ inputDir: path.join(directory, 'input'), retainedDir: path.join(directory, 'retained'), timeOrigin });
}

test('CSV supports BOM, quoted commas/newlines, escaped quotes and CRLF', () => {
  const parsed = parseCsv('\uFEFFid,note\r\n104,"Quote, received\r\nby ""Maya"""\r\n');
  assert.deepEqual(parsed.headers, ['id', 'note']);
  assert.deepEqual(parsed.rows, [{ line: 2, values: { id: '104', note: 'Quote, received\r\nby "Maya"' } }]);
});

test('CSV rejects ambiguous columns, malformed quoting and incorrect row width', () => {
  for (const input of ['id,id\nx,y', 'id,note\nx,"unfinished', 'id,note\nx,"closed"suffix', 'id,note\nx,bad"quote', 'id,note\nx', 'id,note\rx,y']) {
    assert.throws(() => parseCsv(input), { name: 'CsvError' });
  }
});

test('USD decimal conversion is exact and distinguishes missing values from zero', () => {
  assert.equal(usdCents('0'), 0);
  assert.equal(usdCents('0.01'), 1);
  assert.equal(usdCents('5000.10'), 500010);
  for (const value of ['', ' ', '-1', '1e3', '1,000.00', '$1.00', '0.001', 'NaN', '9007199254740992']) assert.throws(() => usdCents(value));
});

test('timestamps have explicit offsets, valid dates and an exact minute basis', () => {
  assert.equal(relativeMinute('2026-11-17T08:00:00-06:00', timeOrigin), 480);
  assert.equal(relativeMinute('2026-11-17T14:00:00Z', timeOrigin), 480);
  for (const value of ['2026-11-17T08:00:00', '2026-11-17T08:00:01-06:00', '2026-02-30T08:00:00-06:00', '2026-11-17T24:00:00-06:00', '2026-11-17T08:00:00+15:00', '2026-11-16T23:59:00-06:00']) assert.throws(() => relativeMinute(value, timeOrigin));
});

test('all baseline shipments prepare complete inputs without mutating retained records', async () => {
  const result = await loadBatch(batch('baseline'));
  assert.equal(result.jobs.length, 4);
  assert.equal(result.sourceFiles.length, 7);
  assert.equal(result.sourceReceipts.length, 7);
  for (const receipt of result.sourceReceipts) {
    const bytes = await readFile(receipt.file);
    assert.equal(receipt.bytes, bytes.length);
    assert.equal(receipt.sha256, createHash('sha256').update(bytes).digest('hex'));
  }
  for (const job of result.jobs) {
    assert.deepEqual(job.errors, []);
    assert.deepEqual(job.caseData, job.retainedCase);
    assert.notEqual(job.caseData, job.retainedCase);
    assert.equal(job.sourceFiles.length, 4);
  }
});

test('a missing retained case records its original absence and isolates the shipment', async t => {
  const result = await editedBatch(t, async (_directory, retained) => {
    await rm(path.join(retained, 'SHIP-104.json'));
  });
  const receipt = result.sourceReceipts.find(item => item.file.endsWith('SHIP-104.json'));
  assert.equal(receipt.missing, true);
  assert.equal(result.jobs[0].caseData, undefined);
  assert.match(result.jobs[0].errors[0].message, /Cannot load retained case/);
  assert(result.jobs.slice(1).every(job => job.caseData));
});

test('revised scopes retain only explicitly supplied grants and original slot scope', async () => {
  const { jobs } = await loadBatch(batch('morning'));
  const supplied = jobs.find(job => job.shipmentId === 'SHIP-105');
  const missing = jobs.find(job => job.shipmentId === 'SHIP-106');
  assert.deepEqual(supplied.errors, []);
  assert.equal(supplied.caseData.parameters.orderRevision, '2');
  assert(supplied.caseData.tables.readiness.every(row => row.orderRevision === '2'));
  assert(supplied.caseData.tables.grants.every(row => row.orderRevision === '2'));
  assert(supplied.caseData.tables.arrangementAuthorities.every(row => row.orderRevision === '2'));
  assert.equal(supplied.caseData.tables.slotConfirmations[0].orderRevision, '1');
  assert.deepEqual(supplied.caseData.tables.grants, supplied.retainedCase.tables.grants);
  assert.deepEqual(missing.errors, []);
  assert(missing.caseData.tables.grants.every(row => row.orderRevision === '1'));
  assert(missing.caseData.tables.arrangementAuthorities.every(row => row.orderRevision === '1'));
  assert.deepEqual(missing.caseData.tables.readiness, missing.retainedCase.tables.readiness);
  assert.deepEqual(missing.caseData.tables.grants, missing.retainedCase.tables.grants);
  const invalid = jobs.find(job => job.shipmentId === 'SHIP-107');
  assert.equal(invalid.caseData, undefined);
  assert.match(invalid.errors[0].message, /must be USD/);
});

test('an empty current slot snapshot removes yesterday\'s confirmation', async t => {
  const result = await editedBatch(t, async directory => {
    const file = path.join(directory, 'slot-confirmations.csv');
    await writeFile(file, `${(await readFile(file, 'utf8')).split(/\r?\n/)[0]}\n`);
  });
  assert.deepEqual(result.jobs[0].caseData.tables.slotConfirmations, []);
  assert.equal(result.jobs[0].retainedCase.tables.slotConfirmations.length, 1);
});

test('duplicate current quotes and slots fail the affected shipment without selecting a row', async t => {
  const result = await editedBatch(t, async directory => {
    for (const name of ['quotes.csv', 'slot-confirmations.csv']) {
      const file = path.join(directory, name);
      const input = await readFile(file, 'utf8');
      await writeFile(file, input + input.split(/\r?\n/)[1] + '\n');
    }
  });
  assert.equal(result.jobs[0].caseData, undefined);
  assert.equal(result.jobs[0].errors.length, 2);
  assert.match(result.jobs[0].errors[0].message, /Duplicate current quote/);
  assert.match(result.jobs[0].errors[1].message, /Duplicate current slot/);
  assert(result.jobs.slice(1).every(job => job.caseData));
});

test('duplicate current orders are isolated and a missing quote does not inherit an old offer', async t => {
  const result = await editedBatch(t, async directory => {
    const ordersFile = path.join(directory, 'orders.csv');
    const orders = await readFile(ordersFile, 'utf8');
    await writeFile(ordersFile, orders + orders.split(/\r?\n/)[1] + '\n');
    const quoteFile = path.join(directory, 'quotes.csv');
    const quotes = (await readFile(quoteFile, 'utf8')).split(/\r?\n/).filter(line => !line.startsWith('SHIP-105,ORD-105,1,direct,'));
    await writeFile(quoteFile, quotes.join('\n'));
  });
  assert.equal(result.jobs[0].caseData, undefined);
  assert.match(result.jobs[0].errors[0].message, /Duplicate shipment_id/);
  assert.equal(result.jobs[1].caseData, undefined);
  assert.match(result.jobs[1].errors[0].message, /complete quote snapshot/);
  assert(result.jobs.slice(2).every(job => job.caseData));
});

test('duplicate headers reject the whole batch before inputs are returned', async t => {
  await assert.rejects(editedBatch(t, async directory => {
    const file = path.join(directory, 'orders.csv');
    const data = await readFile(file, 'utf8');
    await writeFile(file, data.replace('shipment_id,order_id,', 'shipment_id,shipment_id,'));
  }), /Duplicate column/);
});

test('an old quote is not re-scoped and a different order cannot borrow the retained registry', async t => {
  const result = await editedBatch(t, async directory => {
    const file = path.join(directory, 'quotes.csv');
    await writeFile(file, (await readFile(file, 'utf8')).replace('SHIP-104,ORD-104,1,direct,', 'SHIP-104,ORD-104,0,direct,'));
    const ordersFile = path.join(directory, 'orders.csv');
    await writeFile(ordersFile, (await readFile(ordersFile, 'utf8')).replace('SHIP-105,ORD-105,', 'SHIP-105,ORD-999,'));
  });
  assert.equal(result.jobs[0].caseData, undefined);
  assert.match(result.jobs[0].errors[0].message, /current order ID and revision/);
  assert.equal(result.jobs[1].caseData, undefined);
  assert(result.jobs[1].errors.some(error => /different order/.test(error.message)));
  assert(result.jobs.slice(2).every(job => job.caseData));
});

test('cancelled and conflicting statuses remain visible; an unknown status is an input error', async t => {
  const result = await editedBatch(t, async directory => {
    const file = path.join(directory, 'slot-confirmations.csv');
    let data = await readFile(file, 'utf8');
    data = data.replace('SLOT-C104,confirmed,', 'SLOT-C104,cancelled,')
      .replace('SLOT-C105,confirmed,', 'SLOT-C105,conflicting,')
      .replace('SLOT-C106,confirmed,', 'SLOT-C106,pending,');
    await writeFile(file, data);
  });
  assert.equal(result.jobs[0].caseData.tables.slotConfirmations[0].status, 'cancelled');
  assert.equal(result.jobs[1].caseData.tables.slotConfirmations[0].status, 'conflicting');
  assert.equal(result.jobs[2].caseData, undefined);
  assert.match(result.jobs[2].errors[0].message, /status must be/);
  assert(result.jobs[3].caseData);
});
