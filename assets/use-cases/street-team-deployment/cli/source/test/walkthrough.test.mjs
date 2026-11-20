import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { verify } from '../verify.mjs';

const execute = promisify(execFile);
const runner = fileURLToPath(new URL('../walkthrough.mjs', import.meta.url));

test('the complete public CLI journey publishes reviewed rules, records a bounded decision, then invalidates its basis', { timeout: 180000 }, async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'street-team-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const options = { timeout: 170000, maxBuffer: 5000000 };
  await assert.rejects(execute(process.execPath, [runner, 'all', '--output-root', directory], options), error => /accept-fictional-demo/.test(error.stderr));
  assert.deepEqual(await fs.readdir(directory), [], 'No scripted review is recorded without explicit fixture consent.');
  await execute(process.execPath, [runner, 'all', '--output-root', directory, '--accept-fictional-demo'], options);
  await verify(directory);
  const packageFile = path.join(directory, 'author/promotion.workflow.json');
  const original = await fs.readFile(packageFile);
  await assert.rejects(execute(process.execPath, [runner, 'author', '--output-root', directory, '--accept-fictional-demo'], options), error => /Stage already started/.test(error.stderr));
  assert((await fs.readFile(packageFile)).equals(original), 'Repeating a stage cannot silently replace a reviewed release.');
});
