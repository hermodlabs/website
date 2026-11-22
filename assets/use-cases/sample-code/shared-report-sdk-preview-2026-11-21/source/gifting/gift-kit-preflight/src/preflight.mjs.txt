import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { CLI_EXIT_CODE, runCLI } from '@decision-lab/cli';
import { readTimingPolicy, summarizeRun } from './gifting.js';
import { renderHTML } from './report.mjs';
import { PREFLIGHT_STATUS } from './preflightStatus.js';

const defaultConfig = fileURLToPath(new URL('../data/config.json', import.meta.url));
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const inside = (child, parent) => child === parent || child.startsWith(`${parent}${path.sep}`);
const fail = (message, exitCode = CLI_EXIT_CODE.INVALID_INPUT) => Object.assign(new Error(message), { exitCode });

// Unlike shell commands, runCLI accepts literal arguments. A campaign ID or
// path cannot become executable shell text. This is the public CLI handler,
// rather than an SDK evaluator hidden behind a CLI-shaped function.
async function invoke(args, commands) {
  let stdout = '', stderr = '';
  const exitCode = await runCLI(args, {
    stdout: { write(chunk) { stdout += chunk; } },
    stderr: { write(chunk) { stderr += chunk; } },
  });
  commands.push({ args, exitCode, stdout, stderr });
  return { exitCode, stdout, stderr };
}

async function optionalJSON(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

// Resolve an output's existing ancestors, including symlinks. Refusing an
// overlapping location protects the source snapshots and the installed app.
async function canonicalPath(target) {
  try { return await realpath(target); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = path.dirname(target);
    if (parent === target) throw error;
    return path.join(await canonicalPath(parent), path.basename(target));
  }
}

async function assertOutput(output, protectedDirectories) {
  try { await lstat(output); throw fail(`Output already exists: ${output}. Choose a fresh directory.`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const resolved = await canonicalPath(output);
  for (const directory of protectedDirectories) {
    const source = await canonicalPath(directory);
    if (inside(resolved, source) || inside(source, resolved)) {
      throw fail(`Output overlaps an input or app directory: ${directory}`);
    }
  }
}

function messages(result, validation) {
  const issues = validation?.issues ?? validation?.diagnostics;
  if (issues?.length) {
    return issues.map(item => `${item.path ? `${item.path}: ` : ''}${item.message}`);
  }
  try {
    const detail = JSON.parse(result.stderr || result.stdout);
    return [detail.error?.message ?? detail.message ?? JSON.stringify(detail)];
  } catch {
    return [result.stderr.trim() || result.stdout.trim() || `CLI exited ${result.exitCode}.`];
  }
}

// These are display receipts from the supplied case, not inferred extensions of
// availability or authority. Moving a cutoff never edits the source records.
function reviewBasis(inputs) {
  const parameters = inputs.parameters ?? {};
  return {
    timing: Object.fromEntries([
      'nowMinute', 'handoffDeadlineMinute', 'rehearsalMinutes', 'handoffMinutes', 'startOptions',
    ].map(field => [field, structuredClone(parameters[field])])),
    calendars: structuredClone(inputs.tables?.calendars ?? []),
    bookings: structuredClone(inputs.tables?.bookings ?? []),
    permissions: structuredClone(inputs.tables?.permissions ?? []),
    confirmations: structuredClone(inputs.tables?.confirmations ?? []),
  };
}

/**
 * The event team already has complete, reviewed cases. Batch preflight tells
 * the coordinator which cases need attention; a flagged case can then be
 * opened in the React desk for one-record-at-a-time correction and reassessment.
 *
 * This script owns files and orchestration only. Package feasibility, the
 * confirmation's scope, and the preference between complete packages all come
 * from the pinned app through `case validate` and `run --reports all`.
 */
export async function runPreflight({ inputFile, outputDir, configFile = defaultConfig, timeoutMs = 30000, maxPlans } = {}) {
  if (!inputFile || !outputDir) throw fail('Supply an input campaign manifest and an output directory.');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || (maxPlans !== undefined && (!Number.isSafeInteger(maxPlans) || maxPlans < 0))) {
    throw fail('timeoutMs must be positive and maxPlans must be a nonnegative integer.');
  }
  inputFile = path.resolve(inputFile);
  outputDir = path.resolve(outputDir);
  configFile = path.resolve(configFile);
  const sources = new Map();
  const read = async file => {
    const bytes = await readFile(file);
    sources.set(file, digest(bytes));
    return bytes;
  };
  let config, source;
  try {
    config = JSON.parse(await read(configFile));
    source = JSON.parse(await read(inputFile));
  } catch (error) { throw fail(`Cannot read the configuration or campaign manifest: ${error.message}`); }
  if (!Array.isArray(source.campaigns) || !source.campaigns.length) throw fail('The manifest needs a nonempty campaigns array.');
  const ids = new Set();
  for (const campaign of source.campaigns) {
    if (!campaign || typeof campaign.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(campaign.id) || ids.has(campaign.id)) {
      throw fail('Each campaign needs a unique, filename-safe ID.');
    }
    ids.add(campaign.id);
    if (typeof campaign.owner !== 'string' || !campaign.owner.trim()) throw fail(`Campaign ${campaign.id} needs an owner.`);
    if (typeof campaign.case !== 'string' || path.isAbsolute(campaign.case) || campaign.case.split(/[\\/]/).some(part => !part || part === '..')) {
      throw fail(`Campaign ${campaign.id} needs a relative case path within the manifest directory.`);
    }
  }
  if (config.format !== 'gifting-example/1' || !config.binding || typeof config.appFile !== 'string') {
    throw fail('Use a gifting-example/1 configuration with appFile and the pinned app binding.');
  }
  const appFile = path.resolve(path.dirname(configFile), config.appFile);
  const inputRoot = await realpath(path.dirname(inputFile));
  await assertOutput(outputDir, [inputRoot, path.dirname(configFile), path.dirname(appFile)]);
  await read(appFile);
  await mkdir(path.dirname(outputDir), { recursive: true });
  const stage = await mkdtemp(path.join(path.dirname(outputDir), '.gift-preflight-'));
  const commands = [], campaigns = [];
  let published = false, reserved = false;
  try {
    const opened = await invoke(['app', 'open', appFile, '--output', path.join(stage, 'app.json')], commands);
    const app = await optionalJSON(path.join(stage, 'app.json'));
    if (opened.exitCode !== CLI_EXIT_CODE.COMPLETED || !app) throw fail(`The CLI rejected the configured app: ${messages(opened).join('; ')}`);
    const expected = config.binding;
    if (app.app?.id !== expected.appId || app.app?.version !== expected.release || app.app?.contentHash !== expected.appHash || app.contentHash !== expected.packageHash) {
      throw fail('The app does not match the configured release and content hashes.');
    }
    const policy = readTimingPolicy(app);
    for (const campaign of source.campaigns) {
      const row = { id: campaign.id, owner: campaign.owner, status: PREFLIGHT_STATUS.INPUT_ERROR, messages: [], case: null, validation: null, run: null, review: null };
      campaigns.push(row);
      const directory = path.join(stage, 'campaigns', campaign.id);
      await mkdir(directory, { recursive: true });
      let inputs;
      try {
        const file = await realpath(path.join(inputRoot, campaign.case));
        if (!inside(file, inputRoot)) throw fail('The case resolves outside the manifest directory.');
        inputs = JSON.parse(await read(file));
      } catch (error) {
        row.messages.push(`Cannot load this campaign's case: ${error.message}`);
        continue;
      }
      if (inputs?.id !== campaign.id || inputs?.parameters?.batchId !== campaign.id) {
        row.messages.push('The case ID and batch ID must both match the campaign ID in the manifest.');
        continue;
      }
      // Copy the complete native case without changing faults, permissions, or
      // evidence scopes. An old confirmation must remain old until replaced by
      // a genuinely new source record; changing a revision is not a repair.
      row.basis = reviewBasis(inputs);
      row.case = `campaigns/${campaign.id}/case.json`;
      const caseFile = path.join(stage, row.case);
      await writeFile(caseFile, json(inputs));
      const validationFile = path.join(directory, 'validation.json');
      const validated = await invoke(['case', 'validate', '--app', appFile, '--case', caseFile, '--output', validationFile], commands);
      const validation = await optionalJSON(validationFile);
      if (validation) row.validation = `campaigns/${campaign.id}/validation.json`;
      if (validated.exitCode !== CLI_EXIT_CODE.COMPLETED || validation?.valid !== true) {
        row.status = validated.exitCode === CLI_EXIT_CODE.OPERATIONAL_ERROR ? PREFLIGHT_STATUS.UNAVAILABLE : PREFLIGHT_STATUS.INPUT_ERROR;
        row.failureCode = validated.exitCode === CLI_EXIT_CODE.OPERATIONAL_ERROR
          ? CLI_EXIT_CODE.OPERATIONAL_ERROR : CLI_EXIT_CODE.INVALID_INPUT;
        row.messages = messages(validated, validation);
        continue;
      }
      const runFile = path.join(directory, 'run.json');
      const args = ['run', '--app', appFile, '--case', caseFile, '--reports', 'all', '--locale', 'en-US',
        '--timeout-ms', String(timeoutMs), '--max-output-bytes', '50000000',
        '--run-id', `gift-preflight-${campaign.id}`, '--output', runFile];
      if (maxPlans !== undefined) args.push('--max-plans', String(maxPlans));
      const evaluated = await invoke(args, commands);
      const run = await optionalJSON(runFile);
      if (run) {
        row.run = `campaigns/${campaign.id}/run.json`;
        row.review = summarizeRun(run, config);
        if (!isDeepStrictEqual(run.input?.inputs, inputs)) {
          row.review = null;
          row.messages.push('The retained CLI run does not contain the supplied case.');
        }
      }
      // Exit zero can mean a completed assessment with no feasible package.
      // Conversely, a partial search must not become a recommendation simply
      // because it happened to retain one attractive candidate.
      if (evaluated.exitCode !== CLI_EXIT_CODE.COMPLETED || !row.review?.available) {
        row.status = evaluated.exitCode === CLI_EXIT_CODE.INVALID_INPUT ? PREFLIGHT_STATUS.INPUT_ERROR : PREFLIGHT_STATUS.UNAVAILABLE;
        row.failureCode = evaluated.exitCode === CLI_EXIT_CODE.OPERATIONAL_ERROR ? CLI_EXIT_CODE.OPERATIONAL_ERROR
          : evaluated.exitCode === CLI_EXIT_CODE.INVALID_INPUT ? CLI_EXIT_CODE.INVALID_INPUT : CLI_EXIT_CODE.UNAVAILABLE;
        row.messages.push(...(row.review?.issues?.length ? row.review.issues : messages(evaluated)));
      } else {
        row.status = row.review.status;
      }
    }
    // Fail the batch if an exporter changed a file during execution. The next
    // attempt should use one stable snapshot, rather than mixed revisions.
    for (const [file, hash] of sources) {
      if (digest(await readFile(file)) !== hash) throw fail(`Source changed during preflight: ${file}`);
    }
    const exitCode = campaigns.some(row => row.failureCode === CLI_EXIT_CODE.OPERATIONAL_ERROR) ? CLI_EXIT_CODE.OPERATIONAL_ERROR
      : campaigns.some(row => row.status === PREFLIGHT_STATUS.UNAVAILABLE) ? CLI_EXIT_CODE.UNAVAILABLE
        : campaigns.some(row => row.status === PREFLIGHT_STATUS.INPUT_ERROR) ? CLI_EXIT_CODE.INVALID_INPUT : CLI_EXIT_CODE.COMPLETED;
    const manifest = {
      format: 'gift-kit-preflight/1', createdAt: new Date().toISOString(),
      reviewState: 'calculated-awaiting-review', binding: config.binding,
      policy,
      sources: [...sources].map(([file, sha256]) => ({ file, sha256 })),
      summary: Object.fromEntries([...new Set(campaigns.map(row => row.status))].map(status => [status, campaigns.filter(row => row.status === status).length])),
      exitCode, campaigns,
    };
    await writeFile(path.join(stage, 'manifest.json'), json(manifest));
    await writeFile(path.join(stage, 'campaigns.html'), renderHTML(manifest));
    // Preserve real command diagnostics. The paths show the temporary staging
    // location used during execution; each native artifact also has a stable
    // relative path in manifest.json after this directory is published.
    await writeFile(path.join(stage, 'commands.json'), json(commands));
    await mkdir(outputDir); reserved = true;
    await rename(stage, outputDir); published = true;
    return { exitCode, outputDir, manifest };
  } finally {
    if (!published) {
      await rm(stage, { recursive: true, force: true });
      if (reserved) await rmdir(outputDir).catch(() => {});
    }
  }
}
