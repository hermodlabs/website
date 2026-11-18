#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { runPreflight } from './src/preflight.mjs';

// This executable is deliberately just argument handling. The importable runner
// below uses the public CLI handler, the same entry point as `decision-lab`.
try {
  const { values } = parseArgs({
    options: {
      input: { type: 'string' },
      output: { type: 'string' },
      config: { type: 'string' },
      'timeout-ms': { type: 'string' },
      'max-plans': { type: 'string' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log('node review-campaigns.mjs --input fixtures/campaigns.json --output .output/review-1\n'
      + '  [--config data/config.json] [--timeout-ms 30000] [--max-plans 5]');
  } else {
    if (!values.input || !values.output) {
      throw Object.assign(new Error('Supply --input and a fresh --output directory. Use --help for an example.'), { exitCode: 2 });
    }
    const number = (name, fallback, minimum) => {
      const value = values[name] === undefined ? fallback : Number(values[name]);
      if (value !== undefined && (!Number.isSafeInteger(value) || value < minimum)) {
        throw Object.assign(new Error(`--${name} must be an integer of at least ${minimum}.`), { exitCode: 2 });
      }
      return value;
    };
    const result = await runPreflight({
      inputFile: values.input,
      outputDir: values.output,
      configFile: values.config,
      timeoutMs: number('timeout-ms', 30000, 1),
      maxPlans: number('max-plans', undefined, 0),
    });
    console.log(`Review: ${result.outputDir}/campaigns.html`);
    console.log(`Results: ${JSON.stringify(result.manifest.summary)}`);
    process.exitCode = result.exitCode;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = error.exitCode ?? 4;
}
