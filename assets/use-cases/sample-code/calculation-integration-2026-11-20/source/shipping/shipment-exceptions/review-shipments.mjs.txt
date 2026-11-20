#!/usr/bin/env node
import { CLI_EXIT_CODE } from '@decision-lab/cli';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runBatch, batchErrorCode } from './src/batch.mjs';

const usage = `Review changed shipment proposals using the existing Decision Lab CLI.

node review-shipments.mjs --input DIRECTORY --retained DIRECTORY --output NEW_DIRECTORY
  [--previous MANIFEST.json] [--config CONFIG.json] [--as-of ISO_TIMESTAMP] [--created-at ISO_TIMESTAMP]
  [--timeout-ms INTEGER] [--max-plans INTEGER]

Input directories contain complete current snapshots, not incremental events.
Output must be a fresh directory. No freight is booked or approved.
Exit: 0 complete (including blocked), 2 input errors, 3 unavailable, 4 operational failure.
`;

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { process.stdout.write(usage); return CLI_EXIT_CODE.COMPLETED; }
  const names = { '--input': 'inputDir', '--retained': 'retainedDir', '--output': 'outputDir',
    '--previous': 'previousFile', '--config': 'configFile', '--created-at': 'createdAt',
    '--as-of': 'asOf',
    '--timeout-ms': 'timeoutMs', '--max-plans': 'maxPlans' };
  try {
    const options = {};
    for (let index = 0; index < args.length; index += 2) {
      const key = names[args[index]], value = args[index + 1];
      if (!key || value === undefined || value.startsWith('--') || Object.hasOwn(options, key)) {
        throw Object.assign(new Error(`Unknown, duplicate, or incomplete argument: ${args[index]}. Use --help.`), { exitCode: CLI_EXIT_CODE.INVALID_INPUT });
      }
      if (key === 'maxPlans' || key === 'timeoutMs') {
        if (!/^(0|[1-9]\d*)$/.test(value)) throw Object.assign(new Error(`${args[index]} must be a whole number.`), { exitCode: CLI_EXIT_CODE.INVALID_INPUT });
        options[key] = Number(value);
      } else options[key] = value;
    }
    const result = await runBatch(options);
    process.stdout.write(`Shipment report: ${path.join(result.outputDir, 'shipments.html')}\n`);
    process.stdout.write(`${Object.entries(result.manifest.summary).map(([status, count]) => `${count} ${status}`).join(', ')}\n`);
    return result.exitCode;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return batchErrorCode(error);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await main();
}
