#!/usr/bin/env node
import { lstat, mkdir, rmdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBatch, batchErrorCode, BatchError } from './src/batch.mjs';

// The baseline and morning snapshots are teaching fixtures. Their calculation
// times match deliberately: the differences come from recorded order changes,
// not an implicit advancing clock. A production export must supply current times.
const directory = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
try {
  if (args.length && (args.length !== 2 || args[0] !== '--output' || !args[1])) throw new BatchError('Usage: node run-demo.mjs [--output NEW_DIRECTORY]', 2);
  const output = path.resolve(args[1] ?? path.join(directory, '.output/demo'));
  try { await lstat(output); throw new BatchError(`Demo output already exists: ${output}. Choose a fresh --output directory.`, 2); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  // Reserve the demo root, but never replace an existing reviewed output.
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output);
  let baseline;
  try {
    baseline = await runBatch({ inputDir: path.join(directory, 'fixtures/baseline'),
      retainedDir: path.join(directory, 'fixtures/retained/baseline'), outputDir: path.join(output, 'baseline'),
      createdAt: '2026-11-17T14:00:00Z' });
  } catch (error) { await rmdir(output).catch(() => {}); throw error; }
  if (baseline.exitCode !== 0) throw new BatchError('The baseline did not complete successfully.', baseline.exitCode);
  const morning = await runBatch({ inputDir: path.join(directory, 'fixtures/morning'),
    retainedDir: path.join(directory, 'fixtures/retained/morning'), outputDir: path.join(output, 'morning'),
    previousFile: path.join(output, 'baseline/manifest.json'), createdAt: '2026-11-17T14:05:00Z' });
  const expected = ['unchanged', 'recommendation-changed', 'blocked', 'input-error'];
  if (morning.manifest.rows.length !== expected.length || morning.manifest.rows.some((row, index) => row.status !== expected[index])) {
    throw new BatchError('The demo did not produce its documented outcomes. Inspect the retained reports.');
  }
  process.stdout.write(`Baseline: ${path.join(output, 'baseline/shipments.html')}\nMorning: ${path.join(output, 'morning/shipments.html')}\n`);
  process.stdout.write('Verified: unchanged Consolidated; switch to Direct; blocked revised order; rejected EUR quote.\n');
  // The demo harness passes when the intended error is demonstrated. The batch
  // command itself returns 2 for this morning input; never mask it in production.
} catch (error) {
  process.stderr.write(`${error.message}\n`); process.exitCode = batchErrorCode(error);
}
