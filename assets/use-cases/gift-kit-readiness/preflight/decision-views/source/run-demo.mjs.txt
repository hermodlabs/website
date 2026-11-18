#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { runPreflight } from './src/preflight.mjs';

try {
  const { values } = parseArgs({ options: { output: { type: 'string' } } });
  const result = await runPreflight({
    inputFile: fileURLToPath(new URL('./fixtures/campaigns.json', import.meta.url)),
    outputDir: values.output ?? fileURLToPath(new URL('./.output/demo', import.meta.url)),
  });
  const actual = result.manifest.campaigns.map(row => row.status);
  const expected = ['eligible', 'eligible', 'blocked', 'input-error'];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected demo outcomes: ${actual.join(', ')}`);
  }
  console.log(`Verified four intended outcomes. Open ${result.outputDir}/campaigns.html`);
  console.log('The ordinary review command returns exit 2 for this intentionally invalid fourth case.');
} catch (error) {
  console.error(error.message);
  process.exitCode = error.exitCode ?? 4;
}
