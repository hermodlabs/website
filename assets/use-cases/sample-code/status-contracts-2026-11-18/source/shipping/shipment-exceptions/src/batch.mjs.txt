import { CLI_EXIT_CODE } from '@decision-lab/cli';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { loadBatch, InputError } from './inputs.mjs';
import { invokeCLI } from './cli.mjs';
import { projectRun, renderHTML, renderCSV } from './report.mjs';
import { classify, nextAction } from './classify.mjs';
import { BATCH_STATUS } from './semantics.mjs';

export const defaultConfig = fileURLToPath(new URL('../config.json', import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const safeID = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(value);
const inside = (child, parent) => child === parent || child.startsWith(`${parent}${path.sep}`);

export class BatchError extends Error {
  constructor(message, exitCode = CLI_EXIT_CODE.OPERATIONAL_ERROR) { super(message); this.name = 'BatchError'; this.exitCode = exitCode; }
}

async function optionalJSON(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

// Resolve existing ancestors too: an output parent can itself be a symlink.
async function prospectiveRealPath(target) {
  let cursor = path.resolve(target);
  const suffix = [];
  for (;;) {
    try { return path.join(await realpath(cursor), ...suffix); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) throw error;
      suffix.unshift(path.basename(cursor)); cursor = parent;
    }
  }
}

async function assertFreshOutput(output, protectedPaths) {
  try { await lstat(output); throw new BatchError(`Output already exists: ${output}. Choose a fresh directory.`, CLI_EXIT_CODE.INVALID_INPUT); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const resolved = await prospectiveRealPath(output);
  for (const source of protectedPaths) {
    const canonical = await prospectiveRealPath(source);
    if (inside(resolved, canonical) || inside(canonical, resolved)) {
      throw new BatchError(`Output overlaps retained input or a previous batch: ${source}`, CLI_EXIT_CODE.INVALID_INPUT);
    }
  }
}

async function fileReceipt(file) {
  try {
    const bytes = await readFile(file);
    return { file, bytes: bytes.length, sha256: sha256(bytes) };
  } catch (error) {
    if (error.code === 'ENOENT') return { file, missing: true };
    throw error;
  }
}

function compareInputs(before, after, prefix = '') {
  if (isDeepStrictEqual(before, after)) return [];
  // Tables retain their row order and scope. Report complete changed rows rather
  // than pretending that CSV row positions are durable database primary keys.
  if (Array.isArray(before) || Array.isArray(after)) {
    const left = Array.isArray(before) ? before : [], right = Array.isArray(after) ? after : [];
    return Array.from({ length: Math.max(left.length, right.length) }, (_, index) =>
      compareInputs(left[index], right[index], `${prefix}[${index}]`)).flat();
  }
  const object = value => value !== null && typeof value === 'object';
  if (object(before) && object(after)) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort().flatMap(key =>
      compareInputs(before[key], after[key], prefix ? `${prefix}.${key}` : key));
  }
  return [{ path: prefix, before: before ?? null, after: after ?? null }];
}

function diagnostics(result, fallback) {
  try {
    const value = JSON.parse(result.stderr || result.stdout);
    return [{ code: value.error?.code ?? fallback, message: value.error?.message ?? JSON.stringify(value) }];
  } catch { return [{ code: fallback, message: result.stderr || result.stdout || `CLI exited ${result.exitCode}.` }]; }
}

async function checkedPrevious(file, config) {
  if (!file) return { rows: new Map(), receipts: [] };
  const manifest = await optionalJSON(file);
  if (manifest?.format !== 'shipment-exceptions-batch/1' || !Array.isArray(manifest.rows)) {
    throw new BatchError('The previous file is not a shipment-exceptions batch manifest.', CLI_EXIT_CODE.INVALID_INPUT);
  }
  if (!isDeepStrictEqual(manifest.binding, config.binding)) {
    throw new BatchError('The previous batch uses different app rules. Compare the same pinned app release, or start a new baseline.', CLI_EXIT_CODE.INVALID_INPUT);
  }
  const root = await realpath(path.dirname(file));
  const rows = new Map(), receipts = [];
  for (const row of manifest.rows) {
    if (!safeID(row.shipmentId) || rows.has(row.shipmentId)) throw new BatchError('The previous batch repeats or has an invalid shipment ID.', CLI_EXIT_CODE.INVALID_INPUT);
    // Never trust saved summary booleans. Verify the full retained run's bytes
    // and reconstruct the previous proposal from its report. These receipts
    // detect changed local files; they do not authenticate a publisher.
    const receipt = row.artifacts?.run;
    if (!receipt) { rows.set(row.shipmentId, { projection: null, inputs: null }); continue; }
    const name = receipt.file;
    if (typeof name !== 'string' || path.isAbsolute(name) || name.split(/[\\/]/).some(part => part === '..' || part === '') || !/^[a-f0-9]{64}$/.test(receipt.sha256)) {
      throw new BatchError('The previous batch contains an unsafe artifact reference.', CLI_EXIT_CODE.INVALID_INPUT);
    }
    const artifactPath = await realpath(path.join(root, name));
    if (!inside(artifactPath, root)) throw new BatchError('A previous artifact resolves outside its batch.', CLI_EXIT_CODE.INVALID_INPUT);
    const stat = await lstat(artifactPath);
    if (!stat.isFile() || stat.size > 50_000_000) throw new BatchError('The previous run is not a supported regular artifact.', CLI_EXIT_CODE.INVALID_INPUT);
    const bytes = await readFile(artifactPath);
    if (bytes.length !== receipt.bytes || sha256(bytes) !== receipt.sha256) throw new BatchError(`The previous run changed: ${name}`, CLI_EXIT_CODE.INVALID_INPUT);
    receipts.push({ file: artifactPath, bytes: bytes.length, sha256: sha256(bytes) });
    const run = JSON.parse(bytes);
    const projection = projectRun(run, { ...config, expectedBinding: config.binding });
    if (run.input?.inputs?.id !== row.shipmentId || run.input?.inputs?.parameters?.orderId !== row.orderId) {
      throw new BatchError('A previous run belongs to a different shipment or order.', CLI_EXIT_CODE.INVALID_INPUT);
    }
    rows.set(row.shipmentId, { projection, inputs: run.input.inputs });
  }
  return { rows, receipts };
}

/**
 * Run every imported shipment through the pinned CLI app. Importing a current
 * snapshot does not perform reviews, book freight, or allocate shared resources.
 * Results are calculated proposals. Every run gets a fresh output directory so
 * a changed order never overwrites the basis of an earlier proposal.
 */
export async function runBatch(options) {
  if (!options.inputDir || !options.retainedDir || !options.outputDir) throw new BatchError('--input, --retained and --output are required.', CLI_EXIT_CODE.INVALID_INPUT);
  const configFile = path.resolve(options.configFile ?? defaultConfig);
  const configBytes = await readFile(configFile);
  const config = JSON.parse(configBytes);
  if (config.format !== 'shipment-exceptions-config/1' || !config.appFile || !config.binding) throw new BatchError('Unsupported batch configuration.', CLI_EXIT_CODE.INVALID_INPUT);
  const appFile = path.resolve(path.dirname(configFile), config.appFile);
  const appBytes = await readFile(appFile);
  if (sha256(appBytes) !== config.appFileSHA256) throw new BatchError('The pinned app file changed. Review its release and configuration before running.', CLI_EXIT_CODE.INVALID_INPUT);
  const createdAt = options.createdAt ?? new Date().toISOString();
  if (!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(createdAt) || !Number.isFinite(Date.parse(createdAt))) throw new BatchError('--created-at needs an ISO timestamp with an offset.', CLI_EXIT_CODE.INVALID_INPUT);
  if (options.maxPlans !== undefined && (!Number.isSafeInteger(options.maxPlans) || options.maxPlans < 0 || options.maxPlans > 100000)) throw new BatchError('--max-plans must be a whole number from 0 to 100000.', CLI_EXIT_CODE.INVALID_INPUT);
  if (options.timeoutMs !== undefined && (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs < 1)) throw new BatchError('--timeout-ms must be a positive whole number.', CLI_EXIT_CODE.INVALID_INPUT);
  const output = path.resolve(options.outputDir);
  const previousFile = options.previousFile && path.resolve(options.previousFile);
  const protectedPaths = [path.resolve(options.inputDir), path.resolve(options.retainedDir), configFile, appFile,
    ...(previousFile ? [path.dirname(previousFile)] : [])];
  await assertFreshOutput(output, protectedPaths);
  const batch = await loadBatch({ inputDir: options.inputDir, retainedDir: options.retainedDir, timeOrigin: config.timeOrigin, expectedCurrency: config.currency });
  // Individual read aliases may point beyond their containing input directory.
  await assertFreshOutput(output, [...protectedPaths, ...batch.sourceFiles]);
  const previousReceipt = previousFile && await fileReceipt(previousFile);
  const prior = await checkedPrevious(previousFile, config);
  const previous = prior.rows;
  const receipts = [...batch.sourceReceipts,
    { file: configFile, bytes: configBytes.length, sha256: sha256(configBytes) },
    { file: appFile, bytes: appBytes.length, sha256: sha256(appBytes) },
    ...(previousReceipt ? [previousReceipt] : []), ...prior.receipts];
  for (const receipt of receipts) {
    if (!isDeepStrictEqual(receipt, await fileReceipt(receipt.file))) throw new BatchError(`Source changed during import: ${receipt.file}. Export a stable snapshot and rerun.`, CLI_EXIT_CODE.INVALID_INPUT);
  }
  await mkdir(path.dirname(output), { recursive: true });
  const stage = await mkdtemp(path.join(path.dirname(output), '.shipment-batch-'));
  const transcript = [], rows = [];
  let published = false, reserved = false;
  const artifact = async file => {
    const receipt = await fileReceipt(path.join(stage, file));
    return receipt.missing ? null : { ...receipt, file };
  };
  try {
    // Verify the complete package with the installed CLI, not just JSON.parse.
    const opened = await invokeCLI(['app', 'open', appFile, '--output', path.join(stage, 'app.json')], transcript);
    if (opened.exitCode !== CLI_EXIT_CODE.COMPLETED) throw new BatchError(`The CLI rejected the pinned app: ${opened.stderr}`, opened.exitCode);
    const openedApp = await optionalJSON(path.join(stage, 'app.json'));
    if (openedApp?.app?.id !== config.binding.appId || openedApp.app.version !== config.binding.release || openedApp.app.contentHash !== config.binding.appHash || openedApp.contentHash !== config.binding.packageHash) {
      throw new BatchError('The pinned app identity does not match config.json.', CLI_EXIT_CODE.INVALID_INPUT);
    }
    const version = await invokeCLI(['--version'], transcript);
    for (const job of batch.jobs) {
      const row = {
        shipmentId: job.shipmentId, orderId: job.orderId, orderRevision: job.orderRevision,
        owner: job.owner, deadline: null, reviewState: 'calculated-awaiting-review',
        status: BATCH_STATUS.INPUT_ERROR, before: previous.get(job.shipmentId)?.projection ?? null, current: null,
        diagnostics: job.errors.map(error => ({ code: 'SOURCE_INPUT', message: error.message, path: `${path.basename(error.source)}:${error.line}` })),
        changes: [], sources: job.sourceFiles.map(file => ({ file })), links: [], artifacts: {},
      };
      rows.push(row);
      // An invalid filename from an import must never control an output path.
      if (!safeID(job.shipmentId)) { row.nextAction = nextAction(row); continue; }
      const relative = `shipments/${job.shipmentId}`;
      const directory = path.join(stage, relative);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, 'sources.json'), json({ sources: receipts.filter(receipt => job.sourceFiles.includes(receipt.file)), inputErrors: job.errors }));
      row.links.push({ label: 'Source receipts', href: `${relative}/sources.json` });
      row.artifacts.sources = await artifact(`${relative}/sources.json`);
      if (!job.caseData || job.errors.length) { row.nextAction = nextAction(row); continue; }
      if (previous.get(job.shipmentId)?.inputs?.parameters?.orderId && previous.get(job.shipmentId).inputs.parameters.orderId !== job.orderId) {
        row.diagnostics.push({ code: 'SHIPMENT_ID_REASSIGNED', message: 'This shipment ID belonged to a different order in the previous batch. Use a new shipment ID.' });
        row.nextAction = nextAction(row); continue;
      }
      row.changes = previous.get(job.shipmentId)?.inputs ? compareInputs(previous.get(job.shipmentId).inputs, job.caseData) : [];
      row.deadline = new Date(Date.parse(config.timeOrigin) + job.caseData.parameters.reservationDeadline * 60_000).toISOString();
      const caseFile = path.join(directory, 'case.json');
      await writeFile(caseFile, json(job.caseData));
      row.links.push({ label: 'Canonical inputs', href: `${relative}/case.json` });
      const validated = await invokeCLI(['case', 'validate', '--app', appFile, '--case', caseFile, '--output', path.join(directory, 'validation.json')], transcript);
      const validation = await optionalJSON(path.join(directory, 'validation.json'));
      if (validation) row.links.push({ label: 'Input validation', href: `${relative}/validation.json` });
      if (validated.exitCode !== CLI_EXIT_CODE.COMPLETED || validation?.valid !== true) {
        row.status = validated.exitCode === CLI_EXIT_CODE.OPERATIONAL_ERROR ? BATCH_STATUS.UNAVAILABLE : BATCH_STATUS.INPUT_ERROR;
        if (validated.exitCode === CLI_EXIT_CODE.OPERATIONAL_ERROR) row.failureKind = 'operational';
        row.diagnostics.push(...(validation?.diagnostics?.length ? validation.diagnostics : diagnostics(validated, 'CASE_INVALID')));
      } else {
        const args = ['run', '--app', appFile, '--case', caseFile, '--reports', 'all', '--locale', 'en-US',
          '--timeout-ms', String(options.timeoutMs ?? 30000), '--max-output-bytes', '50000000',
          '--run-id', `batch-${job.shipmentId}`, '--created-at', createdAt, '--output', path.join(directory, 'run.json')];
        if (options.maxPlans !== undefined) args.push('--max-plans', String(options.maxPlans));
        const evaluated = await invokeCLI(args, transcript);
        const run = await optionalJSON(path.join(directory, 'run.json'));
        if (run) {
          row.links.push({ label: 'Full CLI report', href: `${relative}/run.json` });
          row.current = projectRun(run, { ...config, expectedBinding: config.binding });
          if (!isDeepStrictEqual(run.input?.inputs, job.caseData)) {
            row.current = null; row.diagnostics.push({ code: 'INPUT_MISMATCH', message: 'The CLI result does not retain the exact imported case.' });
          }
        }
        row.status = classify(row.current, row.before, row.changes);
        if (evaluated.exitCode !== CLI_EXIT_CODE.COMPLETED || !row.current?.available) {
          row.status = evaluated.exitCode === CLI_EXIT_CODE.INVALID_INPUT ? BATCH_STATUS.INPUT_ERROR : BATCH_STATUS.UNAVAILABLE;
          if (evaluated.exitCode === CLI_EXIT_CODE.OPERATIONAL_ERROR) row.failureKind = 'operational';
          row.diagnostics.push(...(row.current?.issues?.map(message => ({ code: 'ASSESSMENT_UNAVAILABLE', message })) ?? diagnostics(evaluated, 'CLI_RUN_FAILED')));
        }
      }
      row.nextAction = nextAction(row);
      for (const [key, name] of [['case', 'case.json'], ['validation', 'validation.json'], ['run', 'run.json'], ['sources', 'sources.json']]) {
        const receipt = await artifact(`${relative}/${name}`);
        if (receipt) row.artifacts[key] = receipt;
      }
    }
    // Refuse to publish a mixed snapshot if an exporter changed a source file
    // while the batch was running. Source files are always read-only here.
    for (const receipt of receipts) {
      if (!isDeepStrictEqual(receipt, await fileReceipt(receipt.file))) throw new BatchError(`Source changed during assessment: ${receipt.file}. Export a stable snapshot and rerun.`, CLI_EXIT_CODE.INVALID_INPUT);
    }
    const counts = Object.fromEntries([...new Set(rows.map(row => row.status))].map(status => [status, rows.filter(row => row.status === status).length]));
    const metadata = { ...config, createdAt, app: { id: config.binding.appId, release: config.binding.release, appHash: config.binding.appHash } };
    const exitCode = rows.some(row => row.failureKind === 'operational') ? CLI_EXIT_CODE.OPERATIONAL_ERROR
      : rows.some(row => row.status === BATCH_STATUS.UNAVAILABLE) ? CLI_EXIT_CODE.UNAVAILABLE
        : rows.some(row => row.status === BATCH_STATUS.INPUT_ERROR) ? CLI_EXIT_CODE.INVALID_INPUT : CLI_EXIT_CODE.COMPLETED;
    const manifest = {
      format: 'shipment-exceptions-batch/1', createdAt, reviewState: 'calculated-awaiting-review',
      binding: config.binding, appFileSHA256: config.appFileSHA256, cliVersion: version.stdout.trim(),
      previousManifest: previousFile ?? null, inputSources: receipts, summary: counts, exitCode, rows,
    };
    await writeFile(path.join(stage, 'manifest.json'), json(manifest));
    await writeFile(path.join(stage, 'shipments.html'), renderHTML(rows, metadata));
    await writeFile(path.join(stage, 'shipments.csv'), renderCSV(rows, metadata));
    // Keep the actual invocation as well as paths after publication. Replaying
    // a calculation still requires a fresh --output file; we never pass --force.
    await writeFile(path.join(stage, 'cli-commands.json'), json({ cliVersion: version.stdout.trim(), commands: transcript.map(command => ({ ...command,
      publishedArgs: command.args.map(arg => inside(arg, stage) ? `${output}${arg.slice(stage.length)}` : arg),
    })) }));
    await mkdir(output); reserved = true;
    await rename(stage, output); published = true;
    return { outputDir: output, exitCode, manifest };
  } finally {
    if (!published) {
      await rm(stage, { recursive: true, force: true });
      if (reserved) await rmdir(output).catch(() => {});
    }
  }
}

export function batchErrorCode(error) {
  return error instanceof InputError || error.name === 'CsvError' || error instanceof SyntaxError ? CLI_EXIT_CODE.INVALID_INPUT : error.exitCode ?? CLI_EXIT_CODE.OPERATIONAL_ERROR;
}
