/** Real browser worker, native continuation, explicit reviews and actual records. */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import { createDecisionLab } from '@decision-lab/sdk';
import { inspectGiftingJourney } from '../src/giftingJourney.js';
import { openReviewJourney } from '../src/reviewJourney.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.output');
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const config = await read(path.join(root, 'public/data/journey-config.json'));
const definition = await read(path.join(root, 'public/data', config.definitionUrl));
const app = await read(path.join(root, 'public/data', config.appUrl));
const lab = createDecisionLab(), errors = [];
let server, browser;
async function downloaded(page) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download continuing review', exact: true }).click()]);
  return openReviewJourney({ lab, value: await fs.readFile(await download.path(), 'utf8'), app, definition });
}
const fill = (page, label, value) => page.getByLabel(label, { exact: true }).fill(String(value));
async function scope(page, prefix, values) {
  const names = { batchId: 'Campaign', insertRevision: 'Insert revision', destinationRevision: 'Destination revision', checkoutRevision: 'Checkout revision', deviceScope: 'Test device', accountScope: 'Intended account' };
  for (const [key, name] of Object.entries(names)) await fill(page, `${prefix}${name}`, values[key]);
}
async function record(page, { kind, reference, minute, recorded = minute, related, amount, duration, quantity, started }) {
  await page.getByLabel('Operating event', { exact: true }).selectOption(kind);
  await fill(page, 'External record reference', reference);
  await fill(page, 'External record source', `Fictional browser fixture record ${reference}`);
  await fill(page, 'Event time (elapsed minute)', minute); await fill(page, 'Recorded time (elapsed minute)', recorded);
  await page.getByLabel('Actual recorded result', { exact: true }).selectOption('yes');
  if (amount !== undefined) await fill(page, 'Authorized amount (USD)', amount);
  if (duration !== undefined) await fill(page, 'Actual rehearsal duration (minutes)', duration);
  if (quantity !== undefined) await fill(page, 'Actual quantity stated in this record (kits)', quantity);
  if (started !== undefined) await fill(page, 'Actual correction start (elapsed minute)', started);
  if (related) await fill(page, kind === 'rehearsal' ? 'Correction completion reference' : 'Passed rehearsal reference', related);
}
async function layout(page, width, height, filename) {
  await page.setViewportSize({ width, height });
  const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth,
    nested: [...document.querySelectorAll('main,section,article,aside')].filter(element => ['auto', 'scroll'].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight + 2).map(element => element.className) }));
  assert.ok(size.width <= size.viewport + 1, `Page overflow: ${JSON.stringify(size)}`); assert.deepEqual(size.nested, []);
  await page.screenshot({ path: path.join(output, filename), fullPage: true, animations: 'disabled' });
}
try {
  await fs.mkdir(output, { recursive: true });
  await build({ configFile: path.join(root, 'vite.config.mjs') });
  server = await preview({ configFile: path.join(root, 'vite.config.mjs'), preview: { host: '127.0.0.1', port: 0 } });
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`);
  await page.getByRole('heading', { name: '1. Current commitment and source records' }).waitFor();
  await fill(page, 'Person recording input and finding reviews', 'Fictional browser reviewer');
  await page.getByRole('button', { name: 'Review current inputs', exact: true }).click();
  for (const step of ['evidence', 'planning']) {
    await page.getByRole('button', { name: `Calculate ${step}`, exact: true }).click();
    await page.getByRole('button', { name: `Accept ${step} finding`, exact: true }).waitFor({ timeout: 60000 });
    await page.getByRole('button', { name: `Accept ${step} finding`, exact: true }).click();
    await page.getByRole('button', { name: `Calculate ${step}`, exact: true }).waitFor({ state: 'detached' });
  }
  let run = await downloaded(page), view = inspectGiftingJourney({ lab, run, config });
  assert.equal(view.review.preferred[0].expense, 30000); assert.equal(view.evidence.states.length, 1); assert.equal(view.closure.completed, false);
  await page.getByRole('button', { name: 'Choose Replace and repair in-house', exact: true }).click();
  await record(page, { kind: 'authorization', reference: 'BROWSER-AUTH', minute: 0, amount: '300.00' });
  await scope(page, 'Source ', run.case.gifting.scope);
  await page.getByRole('button', { name: 'Record external event', exact: true }).click();
  const corrected = { ...run.case.gifting.scope, insertRevision: 'insert-5', destinationRevision: 'destination-3', checkoutRevision: 'checkout-2' };
  await record(page, { kind: 'correction', reference: 'BROWSER-WORK', started: 0, minute: 25, quantity: 120 });
  await scope(page, 'Actual ', corrected);
  await page.getByRole('button', { name: 'Record external event', exact: true }).click();
  await record(page, { kind: 'rehearsal', reference: 'BROWSER-TEST', minute: 35, duration: 10, related: 'BROWSER-WORK' });
  await page.getByRole('button', { name: 'Record external event', exact: true }).click();
  await record(page, { kind: 'handoff', reference: 'BROWSER-HANDOFF', minute: 40, quantity: 120, related: 'BROWSER-TEST' });
  await page.getByRole('button', { name: 'Record external event', exact: true }).click();
  run = await downloaded(page); view = inspectGiftingJourney({ lab, run, config });
  assert.equal(view.closure.completed, true); assert.equal(run.case.gifting.commitment.nowMinute, 0);
  await page.getByRole('button', { name: 'Save locally', exact: true }).click();
  await fill(page, 'Review time (elapsed minute)', 1410);
  const changed = await downloaded(page);
  assert.equal(changed.case.gifting.commitment.nowMinute, 1410); assert.equal(changed.answers.commitment.status, 'awaiting-review');
  assert.equal(inspectGiftingJourney({ lab, run: changed, config }).decision, null);
  await page.getByRole('button', { name: 'Reopen saved review', exact: true }).click();
  assert.equal((await downloaded(page)).contentHash, run.contentHash);
  if (process.env.GIFT_PREFLIGHT_REVIEW) {
    const external = openReviewJourney({ lab, value: await fs.readFile(process.env.GIFT_PREFLIGHT_REVIEW, 'utf8'), app, definition });
    await page.getByLabel('Open continuing review', { exact: true }).setInputFiles(process.env.GIFT_PREFLIGHT_REVIEW);
    await page.waitForFunction(id => [...document.querySelectorAll('input')].some(element => element.value === id), String(external.case.gifting.commitment.nowMinute));
    const imported = await downloaded(page);
    assert.equal(imported.contentHash, external.contentHash, 'Import must preserve the exact native CLI review, including unaccepted answers and retained screening.');
  }
  await layout(page, 1440, 1050, 'journey-desktop.png');
  await layout(page, 390, 844, 'journey-mobile.png');
  assert.deepEqual(errors, []);
  console.log('Verified native evidence/planning, explicit reviews, actual-event closure, dirty export, local recovery, CLI handoff and page scrolling.');
} finally { await browser?.close(); await server?.close(); }
