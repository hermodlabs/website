#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { runJourneyPreflight } from './src/journeyPreflight.mjs';

try {
  const { values } = parseArgs({ options: {
    input: { type: 'string' }, output: { type: 'string' }, config: { type: 'string' },
    'as-of': { type: 'string' }, reviewer: { type: 'string' }, 'accept-fictional-demo': { type: 'boolean' }, help: { type: 'boolean' },
  } });
  if (values.help) console.log('node review-journeys.mjs --input fixtures/journey-v3/campaigns.json --output .output/journey-1 [--as-of ISO_TIMESTAMP] [--reviewer NAME] [--accept-fictional-demo]');
  else {
    const result = await runJourneyPreflight({ inputFile: values.input, outputDir: values.output,
      configFile: values.config, asOf: values['as-of'], reviewer: values.reviewer, acceptFictionalDemo: values['accept-fictional-demo'] });
    console.log(`${result.outputDir}/campaigns.html`); process.exitCode = result.exitCode;
  }
} catch (error) { console.error(error.message); process.exitCode = 2; }
