#!/usr/bin/env node
// Explicit demonstration judgments only. The ordinary review command never
// silently accepts a person's input review, app finding or operating authority.
import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { runJourneyPreflight } from './src/journeyPreflight.mjs';

try {
  const { values } = parseArgs({ options: { output: { type: 'string' } } });
  console.log('Running six fictional campaigns through CLI evaluation and explicit synthetic reviews.');
  console.log('The complete retained-history demonstration can take several minutes.');
  const result = await runJourneyPreflight({
    inputFile: fileURLToPath(new URL('./fixtures/journey-v3/campaigns.json', import.meta.url)),
    outputDir: values.output ?? fileURLToPath(new URL('./.output/demo', import.meta.url)),
    acceptFictionalDemo: true,
  });
  assert.deepEqual(result.manifest.campaigns.map(row => row.status), ['eligible', 'eligible', 'blocked', 'blocked', 'eligible', 'blocked']);
  assert.equal(result.manifest.campaigns[0].preferred[0].expenseMinor, 30000);
  assert.equal(result.manifest.campaigns[1].preferred[0].expenseMinor, 40000);
  assert.equal(result.manifest.campaigns[4].preferred[0].expenseMinor, 10000);
  console.log(`Verified six fictional outcomes. Open ${result.outputDir}/campaigns.html`);
  console.log('No operating decisions, spending authorizations, successful rehearsals or completed handoffs were invented.');
} catch (error) { console.error(error.message); process.exitCode = 2; }
