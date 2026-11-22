#!/usr/bin/env node
/**
 * A release owner has a Jira snapshot, not a qualified release plan. This adapter
 * imports only remaining work for the two authored work packages. Staffing,
 * acceptance, spending authority and revised promises need separate inputs.
 *
 * The profile makes column meanings, units and release scope explicit. It does
 * not discover a scheduler from arbitrary tickets or treat "Done" as accepted.
 * There is no Jira connection: keep the exported CSV with the generated snapshot
 * so another developer can reproduce exactly what entered the calculation.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, stat, unlink } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const IMPORT_LIMITS = Object.freeze({ bytes: 2 * 1024 * 1024, rows: 5000, columns: 64, fieldCharacters: 32768, links: 20000 });

export class ImportError extends Error {
  constructor(message) { super(message); this.name = 'ImportError'; }
}

const fail = message => { throw new ImportError(message); };
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const issueKeyPattern = /^[A-Z][A-Z0-9_]*-[1-9][0-9]*$/;
const requiredColumns = ['key', 'summary', 'updatedAt', 'status', 'remainingEstimate', 'packageId', 'releaseVersion'];
const optionalColumns = ['blocks', 'blockedBy'];

function exactKeys(value, allowed, label) {
  if (!plainObject(value)) fail(`${label} must be an object.`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${label}: unknown field ${JSON.stringify(key)}.`);
}

function nonempty(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.trim() !== value) fail(`${label} must be a nonempty string without surrounding whitespace.`);
  return value;
}

function timestamp(value, label) {
  // CSV exports vary by locale. This adapter deliberately requires ISO timestamps
  // rather than guessing whether 03/04 means March 4 or April 3.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) fail(`${label} must be an ISO 8601 timestamp with an explicit timezone.`);
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) fail(`${label} has an invalid calendar date.`);
  return value;
}

export function validateProfile(profile) {
  exactKeys(profile, ['schemaVersion', 'scope', 'columns', 'remainingEstimateUnit', 'packages', 'linkSeparator'], 'Import profile');
  if (profile.schemaVersion !== 1) fail('Import profile schemaVersion must be 1.');
  exactKeys(profile.scope, ['system', 'projectKey', 'releaseId', 'releaseVersion', 'buildReference', 'environment', 'capturedAt'], 'Import profile scope');
  if (profile.scope.system !== 'jira') fail('Import profile scope.system must be "jira".');
  for (const name of ['projectKey', 'releaseId', 'releaseVersion', 'buildReference', 'environment']) nonempty(profile.scope[name], `scope.${name}`);
  if (!/^[A-Z][A-Z0-9_]*$/.test(profile.scope.projectKey)) fail('scope.projectKey must be a Jira project key such as SHIP.');
  timestamp(profile.scope.capturedAt, 'scope.capturedAt');
  exactKeys(profile.columns, [...requiredColumns, ...optionalColumns], 'Import profile columns');
  for (const key of requiredColumns) nonempty(profile.columns[key], `columns.${key}`);
  for (const key of optionalColumns) if (profile.columns[key] !== undefined) nonempty(profile.columns[key], `columns.${key}`);
  const names = Object.values(profile.columns);
  if (new Set(names).size !== names.length) fail('Column mappings are ambiguous: each meaning must use a distinct CSV column.');
  if (/\bstory\b.*\bpoints?\b/i.test(profile.columns.remainingEstimate)) fail('Story points cannot be imported as hours. Supply a separately estimated remaining-work column.');
  if (!['hour', 'minute', 'second'].includes(profile.remainingEstimateUnit)) fail('remainingEstimateUnit must be "hour", "minute" or "second"; story points are never converted to time.');
  if (profile.linkSeparator !== ';') fail('linkSeparator must be ";". Use explicitly separated issue keys, not free-text link descriptions.');
  if (!Array.isArray(profile.packages) || profile.packages.length !== 2) fail('This bounded adapter requires exactly the authored core and reporting work packages.');
  const ids = new Set(), sourceValues = new Set();
  for (const item of profile.packages) {
    exactKeys(item, ['id', 'label', 'sourceValue'], 'Work package');
    if (!['core', 'reporting'].includes(item.id) || ids.has(item.id)) fail('Work package IDs must be exactly core and reporting.');
    ids.add(item.id);
    nonempty(item.label, 'Work package label'); nonempty(item.sourceValue, 'Work package sourceValue');
    if (sourceValues.has(item.sourceValue)) fail('Work package sourceValues must be unique.');
    sourceValues.add(item.sourceValue);
  }
  return profile;
}

/** Strict RFC-style subset: quoted commas/newlines, escaped quotes, CRLF and BOM. */
export function parseCsv(text) {
  if (typeof text !== 'string') fail('CSV input must be UTF-8 text.');
  if (Buffer.byteLength(text, 'utf8') > IMPORT_LIMITS.bytes) fail(`CSV exceeds the ${IMPORT_LIMITS.bytes}-byte limit.`);
  if (text.startsWith('\uFEFF')) text = text.slice(1);
  if (text.includes('\0')) fail('CSV contains a NUL character.');
  const records = [];
  let cells = [], value = '', quoted = false, afterQuote = false, started = false, line = 1, rowLine = 1;
  const error = message => fail(`CSV line ${line}: ${message}`);
  const finishCell = () => { cells.push(value); value = ''; afterQuote = false; if (cells.length > IMPORT_LIMITS.columns) error('Too many columns.'); };
  const finishRow = () => { finishCell(); records.push({ cells, line: rowLine }); cells = []; started = false; if (records.length > IMPORT_LIMITS.rows + 1) error('Too many data rows.'); };
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') { value += '"'; index += 1; }
        else { quoted = false; afterQuote = true; }
      } else {
        value += character;
        if (character === '\n') line += 1;
        else if (character === '\r' && text[index + 1] !== '\n') error('Use LF or CRLF line endings.');
      }
    } else if (character === ',') { finishCell(); started = true; }
    else if (character === '\n' || character === '\r') {
      if (character === '\r') { if (text[index + 1] !== '\n') error('Use LF or CRLF line endings.'); index += 1; }
      finishRow(); line += 1; rowLine = line;
    } else if (afterQuote) error('Only a comma or line ending may follow a closing quote.');
    else if (character === '"') { if (value) error('A quote must begin an empty field.'); quoted = true; started = true; }
    else { value += character; started = true; }
    if (value.length > IMPORT_LIMITS.fieldCharacters) error('Field exceeds the character limit.');
  }
  if (quoted) error('Unterminated quoted field.');
  if (started || cells.length || value || afterQuote) finishRow();
  if (!records.length) fail('CSV needs a header row.');
  const header = records.shift().cells;
  const seen = new Set();
  for (const name of header) {
    nonempty(name, 'CSV column name');
    if (seen.has(name)) fail(`Duplicate CSV header ${JSON.stringify(name)}; export or rename each mapped link column explicitly.`);
    seen.add(name);
  }
  const rows = records.map(record => {
    if (record.cells.length !== header.length) fail(`CSV line ${record.line}: expected ${header.length} columns; received ${record.cells.length}.`);
    return { line: record.line, values: Object.fromEntries(header.map((name, index) => [name, record.cells[index]])) };
  });
  if (!rows.length) fail('CSV contains no issues.');
  return { header, rows };
}

function parseEstimate(raw, unit, key) {
  if (raw.trim() === '') return null;
  if (!/^\d+(?:\.\d+)?$/.test(raw)) fail(`${key}: remaining estimate must be a nonnegative decimal in declared ${unit} units, or blank when unknown.`);
  const sourceValue = Number(raw), minutes = unit === 'second' ? sourceValue / 60 : unit === 'hour' ? sourceValue * 60 : sourceValue;
  if (!Number.isFinite(minutes) || minutes > 60000000) fail(`${key}: remaining estimate is outside the supported range.`);
  if (!Number.isSafeInteger(minutes)) fail(`${key}: the declared ${unit} estimate cannot be represented as whole minutes. Review it explicitly; the adapter never rounds remaining work.`);
  return { value: sourceValue, unit, minutes };
}

function parseLinks(raw, key, label) {
  if (!raw.trim()) return [];
  const keys = raw.split(';').map(value => value.trim());
  if (keys.length > 100 || keys.some(value => !issueKeyPattern.test(value))) fail(`${key}: ${label} must contain at most 100 semicolon-separated issue keys.`);
  if (keys.includes(key)) fail(`${key}: a blocking link cannot refer to itself.`);
  if (new Set(keys).size !== keys.length) fail(`${key}: duplicate key in ${label}.`);
  return keys;
}

export function importJiraSnapshot(csv, profile, { sourceName = 'jira.csv' } = {}) {
  validateProfile(profile);
  const { header, rows } = parseCsv(csv);
  for (const name of Object.values(profile.columns)) if (!header.includes(name)) fail(`Mapped CSV column ${JSON.stringify(name)} is missing.`);
  const packageBySource = new Map(profile.packages.map(item => [item.sourceValue, item]));
  const keys = new Set(), issues = [], linkClaims = [];
  for (const { values, line } of rows) {
    const cell = name => values[profile.columns[name]];
    const key = cell('key');
    if (!issueKeyPattern.test(key)) fail(`CSV line ${line}: invalid issue key ${JSON.stringify(key)}.`);
    if (!key.startsWith(`${profile.scope.projectKey}-`)) fail(`${key}: issue is outside declared project ${profile.scope.projectKey}. Export only the scoped release.`);
    if (keys.has(key)) fail(`${key}: duplicate issue key.`);
    keys.add(key);
    if (cell('releaseVersion') !== profile.scope.releaseVersion) fail(`${key}: release version ${JSON.stringify(cell('releaseVersion'))} does not exactly match ${JSON.stringify(profile.scope.releaseVersion)}. Multi-version or unrelated rows need deliberate scoping.`);
    const workPackage = packageBySource.get(cell('packageId'));
    if (!workPackage) fail(`${key}: work package ${JSON.stringify(cell('packageId'))} is outside the authored core/reporting catalog.`);
    nonempty(cell('summary'), `${key} summary`); nonempty(cell('status'), `${key} status`);
    timestamp(cell('updatedAt'), `${key} updatedAt`);
    if (Date.parse(cell('updatedAt')) > Date.parse(profile.scope.capturedAt)) fail(`${key}: updatedAt is later than the declared snapshot capture time.`);
    const estimate = parseEstimate(cell('remainingEstimate'), profile.remainingEstimateUnit, key);
    issues.push({ key, summary: cell('summary'), packageId: workPackage.id, releaseVersion: cell('releaseVersion'), sourceStatus: cell('status'), sourceUpdatedAt: cell('updatedAt'), sourceLine: line, sourceEstimate: estimate && { value: estimate.value, unit: estimate.unit }, remainingMinutes: estimate?.minutes ?? null, acceptance: 'not-established-by-import' });
    for (const direction of optionalColumns) {
      if (!profile.columns[direction]) continue;
      for (const other of parseLinks(cell(direction), key, direction)) {
        linkClaims.push({ from: direction === 'blocks' ? key : other, to: direction === 'blocks' ? other : key, declaredBy: key, sourceColumn: profile.columns[direction], sourceLine: line });
        if (linkClaims.length > IMPORT_LIMITS.links) fail('CSV exceeds the blocking-link limit.');
      }
    }
  }
  const linkByPair = new Map();
  for (const claim of linkClaims) {
    const id = `${claim.from}\0${claim.to}`;
    if (!linkByPair.has(id)) linkByPair.set(id, { from: claim.from, to: claim.to, relation: 'blocks', fromIncluded: keys.has(claim.from), toIncluded: keys.has(claim.to), assertions: [] });
    linkByPair.get(id).assertions.push({ declaredBy: claim.declaredBy, sourceColumn: claim.sourceColumn, sourceLine: claim.sourceLine });
  }
  const blockingLinks = [...linkByPair.values()];
  const workPackages = profile.packages.map(item => {
    const members = issues.filter(issue => issue.packageId === item.id);
    if (!members.length) fail(`No issues were exported for work package ${item.id}; absence does not establish zero work.`);
    const unknownEstimateKeys = members.filter(issue => issue.remainingMinutes === null).map(issue => issue.key);
    const memberKeys = new Set(members.map(issue => issue.key));
    const inbound = blockingLinks.filter(link => memberKeys.has(link.to));
    return { id: item.id, label: item.label, issueKeys: members.map(issue => issue.key), remainingMinutes: unknownEstimateKeys.length ? null : members.reduce((sum, issue) => sum + issue.remainingMinutes, 0), estimateStatus: unknownEstimateKeys.length ? 'unknown' : 'supplied', unknownEstimateKeys, prerequisiteStatus: 'unreviewed', externalPrerequisiteKeys: [...new Set(inbound.filter(link => !link.fromIncluded).map(link => link.from))] };
  });
  const byId = Object.fromEntries(workPackages.map(item => [item.id, item]));
  const diagnostics = workPackages.flatMap(item => [
    ...(item.unknownEstimateKeys.length ? [{ severity: 'blocking', code: 'unknown-estimate', packageId: item.id, issueKeys: item.unknownEstimateKeys, message: 'The package total is unknown until all remaining-work estimates are supplied.' }] : []),
    ...(item.externalPrerequisiteKeys.length ? [{ severity: 'blocking', code: 'external-prerequisite', packageId: item.id, issueKeys: item.externalPrerequisiteKeys, message: 'These prerequisites are outside the snapshot. Review their scope and satisfaction before confirming prerequisites.' }] : []),
  ]);
  if (blockingLinks.length) diagnostics.push({ severity: 'information', code: 'dependency-review-required', issueKeys: [...new Set(blockingLinks.flatMap(link => [link.from, link.to]))], message: 'Review these directed links against the fixed authored validation phases. The import retains relationships; it does not apply an arbitrary dependency graph or establish that the release prerequisites are satisfied.' });
  const snapshot = {
    schemaVersion: 1,
    kind: 'decision-lab.jira-release-snapshot',
    scope: { ...profile.scope },
    provenance: { sourceName: basename(sourceName), sourceSha256: createHash('sha256').update(csv, 'utf8').digest('hex'), profileSha256: createHash('sha256').update(JSON.stringify(profile)).digest('hex'), importedColumns: { ...profile.columns }, remainingEstimateUnit: profile.remainingEstimateUnit },
    issues, blockingLinks, workPackages, diagnostics,
    requiredOperatingInputs: ['originalDeadline', 'proposedDeadline', 'acceptedRevisedDeadline', 'budgetMinor', 'extraFeeMinor', 'scopeRevisionAccepted', 'dateRevisionAccepted', 'prerequisiteConfirmed', 'releaseAuthorized', 'availability', 'qualifications', 'bookings'],
    limitations: ['Only core and reporting remaining work is imported; no arbitrary issue scheduler is constructed.', 'Imported blocking links are retained for deliberate review against the fixed authored phases; arbitrary dependencies and cycles are not evaluated by this adapter. A different dependency structure requires an adapted authored app.', 'Source status does not establish acceptance or prerequisite satisfaction.', 'Qualified capacity, permissions, costs, deadlines and accepted commitment revisions must be supplied separately.'],
  };
  // This is intentionally incomplete. It is a starting input file, not authority
  // to calculate a release from ticket status alone. Nulls must remain unknown.
  const caseData = { release: { coreMinutes: byId.core.remainingMinutes, reportingMinutes: byId.reporting.remainingMinutes } };
  return { snapshot, caseData };
}

async function readBounded(path, label, limit = IMPORT_LIMITS.bytes) {
  const info = await stat(path);
  if (!info.isFile() || info.size > limit) fail(`${label} must be a regular file no larger than ${limit} bytes.`);
  const bytes = await readFile(path);
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { fail(`${label} must be valid UTF-8.`); }
}

export async function runCli(args) {
  const usage = 'Usage: node import-jira.mjs --source jira.csv --mapping import-profile.json --output source-snapshot.json --case-output case-inputs.json';
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) { process.stdout.write(`${usage}\n\nCreates two new files; existing files are never overwritten. The case inputs remain incomplete until the release owner supplies operational facts.\n`); return; }
  const flags = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index], value = args[index + 1];
    if (!['--source', '--mapping', '--output', '--case-output'].includes(key) || !value || value.startsWith('--') || flags.has(key)) fail(usage);
    flags.set(key, value);
  }
  if (flags.size !== 4) fail(usage);
  const input = resolve(flags.get('--source')), mapping = resolve(flags.get('--mapping')), output = resolve(flags.get('--output')), caseOutput = resolve(flags.get('--case-output'));
  if (new Set([input, mapping, output, caseOutput]).size !== 4) fail('Source, mapping and the two output paths must be distinct.');
  for (const path of [output, caseOutput]) {
    try { await stat(path); fail(`Output already exists: ${path}. Choose a new path; imports never overwrite a saved input file.`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const [csv, profileText] = await Promise.all([readBounded(input, 'Source CSV'), readBounded(mapping, 'Import profile', 65536)]);
  let profile;
  try { profile = JSON.parse(profileText); } catch { fail('Import profile must be valid JSON.'); }
  const { snapshot, caseData } = importJiraSnapshot(csv, profile, { sourceName: input });
  await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx' });
  try { await writeFile(caseOutput, `${JSON.stringify(caseData, null, 2)}\n`, { flag: 'wx' }); }
  catch (error) { await unlink(output); throw error; }
  process.stdout.write(`Imported ${snapshot.issues.length} issues into ${snapshot.workPackages.length} work packages.\nSnapshot: ${output}\nPartial case inputs: ${caseOutput}\nSupply qualified capacity, acceptance, permissions, costs and deadlines before calculating.\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCli(process.argv.slice(2)).catch(error => { process.stderr.write(`${error.name}: ${error.message}\n`); process.exitCode = 1; });
}
