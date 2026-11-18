/** Exercise the real production worker, public CLI and canonical-case handoff. */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, createServer, preview } from 'vite';
import { chromium } from 'playwright';
import { runCLI } from '@decision-lab/cli';
import { commitment } from '@decision-lab/sdk';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.output');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'gift-desk-browser-'));
const config = JSON.parse(await fs.readFile(path.join(root, 'public/data/config.json'), 'utf8'));
const checks = [], errors = [], workers = [];
const originalNodeEnv = process.env.NODE_ENV;
let server, devServer, browser;
const json = async file => JSON.parse(await fs.readFile(file, 'utf8'));

// Select calculated values through the public resolver. Do not duplicate the
// gift-kit rules or independently decide which package ought to be feasible.
function outcome(run) {
  assert.equal(run.format, 'decision-lab-run/1');
  assert.equal(run.execution.status, 'completed');
  assert.equal(run.report.completeness.assessmentComplete, true);
  assert.equal(run.report.completeness.truncated, false);
  const assessment = commitment.resolveCommitmentAssessment(run.assessment, run.report);
  assert.equal(assessment.coverage.complete, true);
  const preferred = assessment.recommendation?.tiedPlanIds ?? [];
  return {
    finding: assessment.finding,
    scenarios: assessment.coverage.totalScenarios,
    plans: assessment.plans.map(plan => ({
      choices: plan.choices, feasible: plan.feasible, expense: plan.expense,
      finish: plan.activities.find(activity => activity.id === 'handoff').end,
      preferred: preferred.includes(plan.id),
      blockers: plan.blockers.map(({ constraintId, scenarioId }) => ({ constraintId, scenarioId })),
    })),
  };
}

async function cliRun(caseFile, name) {
  const filename = path.join(temporary, `${name}.run.json`);
  let stderr = '';
  const exit = await runCLI(['run', '--app', path.join(root, 'public/data/gifting.app.json'),
    '--case', caseFile, '--reports', 'all', '--timeout-ms', '30000', '--output', filename], {
    stdout: { write() {} }, stderr: { write(value) { stderr += value; } },
  });
  assert.equal(exit, 0, `CLI ${name}: ${stderr}`);
  return json(filename);
}

async function downloadRun(page) {
  const button = page.getByRole('button', { name: 'Download SDK run', exact: true });
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 45000 }), button.click({ timeout: 45000 }),
  ]);
  return json(await download.path());
}

const review = page => page.getByRole('button', { name: 'Review packages', exact: true }).click({ timeout: 45000 });
async function selectCase(page, id) {
  const entry = config.cases.find(entry => entry.id === id);
  const picker = page.getByLabel('Scenario set', { exact: true });
  if (await picker.inputValue() !== entry.scenarioGroup) await picker.selectOption(entry.scenarioGroup);
  await page.getByRole('button', { name: entry.label, exact: true }).click({ timeout: 45000 });
}

async function reassessEdited(page, name) {
  await review(page);
  const run = await downloadRun(page);
  const file = path.join(temporary, `${name}.case.json`);
  await fs.writeFile(file, JSON.stringify(run.input.inputs));
  assert.deepEqual(outcome(run), outcome(await cliRun(file, name)));
  return run;
}

async function parity(page, caseFile, name) {
  await review(page);
  const actual = await downloadRun(page);
  assert.deepEqual(actual.input.inputs, await json(caseFile), 'The worker retains the full canonical case unchanged.');
  assert.deepEqual(outcome(actual), outcome(await cliRun(caseFile, name)));
  assert.equal(outcome(actual).scenarios, 8);
  return actual;
}

async function layout(page, viewport, filename) {
  await page.setViewportSize(viewport);
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  const size = await page.evaluate(() => ({
    viewport: innerWidth, width: document.documentElement.scrollWidth,
    nested: [...document.querySelectorAll('main, section, article, aside, [role="region"]')]
      .filter(element => ['auto', 'scroll'].includes(getComputedStyle(element).overflowY)
        && element.scrollHeight > element.clientHeight + 2).map(element => element.className),
  }));
  assert.ok(size.width <= size.viewport + 1, `Layout at ${viewport.width}px: ${JSON.stringify(size)}`);
  assert.deepEqual(size.nested, [], 'Panels use normal page scrolling.');
  await page.screenshot({ path: path.join(output, filename), fullPage: true, animations: 'disabled' });
}

// Both events happen before a worker-result task, exercising cancellation and
// replacement rather than relying on whether an unusually fast job wins a race.
async function interruptReview(page, action) {
  await page.waitForFunction(() => [...document.querySelectorAll('button')]
    .some(button => button.textContent.trim() === 'Review packages' && !button.disabled));
  await page.evaluate(async action => {
    const button = name => [...document.querySelectorAll('button')]
      .find(item => item.getAttribute('aria-label') === name || item.textContent.trim() === name);
    button('Review packages').click();
    await Promise.resolve();
    if (action.kind === 'cancel') button('Cancel review').click();
    else if (action.kind === 'case') button(action.label).click();
    else {
      const label = [...document.querySelectorAll('label')].find(item => item.textContent === 'Total package amount');
      const input = document.getElementById(label.htmlFor);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, action.value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, action);
}

try {
  await fs.mkdir(output, { recursive: true });
  await build({ configFile: path.join(root, 'vite.config.mjs') });
  server = await preview({ configFile: path.join(root, 'vite.config.mjs'), preview: { host: '127.0.0.1', port: 0 } });
  const base = `http://127.0.0.1:${server.httpServer.address().port}/`;
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true,
    executablePath: process.env.HERMOD_CHROMIUM_PATH || (existsSync(chrome) ? chrome : undefined),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ acceptDownloads: true, serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('worker', worker => workers.push(worker.url()));
  await page.goto(base);
  const expected = {
    confirmed: ['external-replace-and-repair'], stale: ['replace-and-repair'], permissions: [],
    'one-day-confirmed': ['external-replace-and-repair'], 'one-day-stale': ['replace-and-repair'],
    'one-day-expired': [], 'one-day-late': ['external-replace-and-repair'],
  };
  for (const [id, preferred] of Object.entries(expected)) {
    await selectCase(page, id);
    const run = await parity(page, path.join(root, `public/data/cases/${id}.json`), id);
    assert.deepEqual(outcome(run).plans.filter(plan => plan.preferred).map(plan => plan.choices.packageId), preferred);
    checks.push(`${id}: production browser and CLI agree on every package, cost, finish and failed condition`);
    if (id === 'confirmed') {
      const complete = page.locator('.results > [data-decision-view]');
      assert.equal(await complete.locator('[data-decision-comparison] table').count(), 1, 'The concise result uses the public DecisionView.');
      assert.equal(await complete.locator('[data-saved-report]').count(), 0, 'Complete reports are not mounted on the default decision screen.');
      await complete.locator('.dv-technical > summary').click();
      await complete.getByRole('button', { name: 'Inspect complete report', exact: true }).click();
      const family = run.report.navigation.find(item => item.id === 'plans');
      await complete.getByRole('tablist', { name: 'Commitment report families', exact: true })
        .getByRole('tab', { name: family.title, exact: true }).click();
      await complete.locator('[data-commitment-report="plans:schedule"]').waitFor();
      const schedule = complete.locator('[data-learning-view]').first();
      await schedule.getByRole('button', { name: 'Table', exact: true }).click();
      assert.equal(await schedule.getAttribute('data-view-representation'), 'table');
      await complete.getByRole('button', { name: 'Return to decision', exact: true }).click();
      assert.equal(await complete.locator('[data-saved-report]').count(), 0);
      checks.push('Public DecisionView shows a concise decision, with complete native schedule and representation controls on explicit inspection');
      await layout(page, { width: 1440, height: 1000 }, 'browser-desktop.png');
      await layout(page, { width: 390, height: 844 }, 'browser-mobile.png');
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    if (id === 'one-day-late') {
      assert.equal(outcome(run).plans.find(plan => plan.preferred).finish, 1405);
      assert.equal(await page.getByLabel('Handoff cutoff (minute)', { exact: true }).inputValue(), '1440');
      await page.locator('.results > [data-decision-view] [data-decision-option]').filter({ hasText: '1,405 minute' }).first().waitFor();
      await layout(page, { width: 1440, height: 1000 }, 'browser-one-day-desktop.png');
      await layout(page, { width: 390, height: 844 }, 'browser-one-day-mobile.png');
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }

  // The combined test supplies the new CLI application's actual exported case.
  // A copied, standalone React example can run the same test using its fixture.
  const handoff = process.env.GIFT_PREFLIGHT_CASE || path.join(root, 'public/data/cases/stale.json');
  await page.getByLabel('Import case', { exact: true }).setInputFiles(handoff);
  const imported = await parity(page, handoff, 'cli-handoff');
  checks.push(process.env.GIFT_PREFLIGHT_CASE
    ? 'Imported the actual Gift-kit Preflight canonical case; SDK output equals its CLI assessment'
    : 'Canonical-case import preserves the old booking and current permissions');
  await page.getByLabel('Confirmation insert revision', { exact: true }).fill('insert-4');
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  await review(page);
  const corrected = await downloadRun(page);
  assert.deepEqual(corrected.input.inputs.tables.permissions, imported.input.inputs.tables.permissions);
  assert.deepEqual(corrected.input.inputs.tables.scenarios, imported.input.inputs.tables.scenarios);
  assert.deepEqual(outcome(corrected).plans.filter(plan => plan.preferred).map(plan => plan.choices.packageId), ['external-replace-and-repair']);
  const changed = path.join(temporary, 'updated-booking.json');
  await fs.writeFile(changed, JSON.stringify(corrected.input.inputs));
  assert.deepEqual(outcome(corrected), outcome(await cliRun(changed, 'updated-booking')));
  checks.push('A newly supplied matching booking changes the preferred package without modifying permissions or fault possibilities');

  await page.getByLabel('Package quote', { exact: true }).selectOption('external-replace-and-repair');
  await page.getByLabel('Quote currency', { exact: true }).selectOption('EUR');
  await review(page);
  await page.getByRole('alert').filter({ hasText: /USD/ }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  checks.push('Unsupported currency withholds the current result');

  await page.getByLabel('Import case', { exact: true }).setInputFiles({
    name: 'native.case.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(corrected.input)),
  });
  const bound = await parity(page, changed, 'bound-case');
  assert.deepEqual(bound.input.binding, corrected.input.binding);
  await page.getByLabel('Import case', { exact: true }).setInputFiles({ name: 'wrong.case.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...bound.input, binding: { ...bound.input.binding, release: 999 } })),
  });
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  checks.push('Native SDK-bound cases import; a mismatched release is rejected');

  await selectCase(page, 'confirmed');
  await interruptReview(page, { kind: 'cancel' });
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  await interruptReview(page, { kind: 'edit', value: '450' });
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  await review(page);
  const latest = await downloadRun(page);
  // The quote selector remains on the external package after the case changes.
  assert.equal(latest.input.inputs.tables.packages.find(row => row.id === 'external-replace-and-repair').repairCostMinor, 45000);
  await interruptReview(page, { kind: 'case', label: config.cases.find(entry => entry.id === 'permissions').label });
  await parity(page, path.join(root, 'public/data/cases/permissions.json'), 'switched-case');
  checks.push('Cancellation, edits and switching cases prevent an earlier worker result from becoming current');

  const oneDayHandoff = process.env.GIFT_PREFLIGHT_ONE_DAY_CASE || path.join(root, 'public/data/cases/one-day-stale.json');
  await page.getByLabel('Import case', { exact: true }).setInputFiles(oneDayHandoff);
  const dayImported = await parity(page, oneDayHandoff, 'one-day-cli-handoff');
  assert.equal(outcome(dayImported).plans.find(plan => plan.preferred).finish, 40);
  await page.getByLabel('Planned rehearsal (minutes)', { exact: true }).fill('5');
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  await page.locator('.previous > summary').waitFor();
  const fiveMinutes = await reassessEdited(page, 'five-minute-rehearsal');
  assert.equal(outcome(fiveMinutes).plans.find(plan => plan.preferred).finish, 35);
  assert.deepEqual(fiveMinutes.input.inputs.tables.permissions, dayImported.input.inputs.tables.permissions);
  await page.getByLabel('Planned rehearsal (minutes)', { exact: true }).fill('4');
  const tooShort = await reassessEdited(page, 'below-published-minimum');
  assert.equal(outcome(tooShort).plans.filter(plan => plan.preferred).length, 0);
  assert.ok(outcome(tooShort).plans.every(plan => plan.blockers.some(check => check.constraintId === 'minimum-rehearsal')));
  checks.push('The actual one-day CLI case imports; five versus ten minutes changes the schedule while four minutes fails the unchanged published rule');

  await selectCase(page, 'one-day-late');
  await page.getByLabel('Handoff cutoff (minute)', { exact: true }).fill('1400');
  const missedCutoff = await reassessEdited(page, 'missed-cutoff');
  assert.equal(outcome(missedCutoff).plans.filter(plan => plan.preferred).length, 0);
  await page.getByLabel('Handoff cutoff (minute)', { exact: true }).fill('1440');
  const restoredCutoff = await reassessEdited(page, 'restored-cutoff');
  assert.equal(outcome(restoredCutoff).plans.find(plan => plan.preferred).finish, 1405);
  assert.deepEqual(restoredCutoff.input.inputs.tables, missedCutoff.input.inputs.tables);
  checks.push('Changing the cutoff changes native eligibility and slack without extending any records');

  await selectCase(page, 'one-day-expired');
  await page.getByLabel('Handoff cutoff (minute)', { exact: true }).fill('2880');
  const stillExpired = await reassessEdited(page, 'longer-cutoff-expired-records');
  assert.equal(outcome(stillExpired).plans.filter(plan => plan.preferred).length, 0);
  assert.equal(stillExpired.input.inputs.tables.calendars[0].end, 120);
  assert.equal(stillExpired.input.inputs.tables.confirmations[0].validThrough, 60);
  await page.locator('summary').filter({ hasText: 'Production availability' }).click();
  await page.getByLabel('Availability 1 ends (minute)', { exact: true }).fill('1440');
  await page.locator('summary').filter({ hasText: 'Operating permission validity' }).click();
  for (const record of stillExpired.input.inputs.tables.permissions) {
    await page.getByLabel(`Permission ${record.id} valid through (minute)`, { exact: true }).fill('1440');
  }
  await page.getByText('Recorded time and validity', { exact: true }).click();
  await page.getByLabel('Valid through (minute)', { exact: true }).fill('1440');
  const renewed = await reassessEdited(page, 'deliberately-renewed-intervals');
  assert.equal(outcome(renewed).plans.find(plan => plan.preferred).finish, 1405);
  for (const [index, record] of renewed.input.inputs.tables.permissions.entries()) {
    const original = stillExpired.input.inputs.tables.permissions[index];
    assert.deepEqual({ ...record, validThrough: original.validThrough }, original);
  }
  assert.deepEqual(renewed.input.inputs.tables.scenarios, stillExpired.input.inputs.tables.scenarios);
  checks.push('A longer cutoff does not repair expired records; explicitly edited intervals can restore a plan without changing scope or faults');

  await page.getByLabel('Recorded review time (minute)', { exact: true }).fill('1390');
  const pastStart = await reassessEdited(page, 'candidate-start-in-past');
  assert.equal(outcome(pastStart).plans.filter(plan => plan.preferred).length, 0);
  assert.deepEqual(pastStart.input.inputs.parameters.startOptions, [1380]);
  await page.getByLabel('Candidate starts (minutes)', { exact: true }).fill('1390');
  const laterStart = await reassessEdited(page, 'explicit-later-candidate');
  assert.equal(outcome(laterStart).plans.find(plan => plan.preferred).finish, 1415);
  checks.push('Changing review time preserves candidate starts; supplying a later candidate explicitly restores a usable start');

  assert.ok(workers.length > 0);
  assert.ok(workers.every(url => url.startsWith(base) && new URL(url).pathname.startsWith('/assets/') && !url.includes('/src/')));
  assert.deepEqual(errors, []);
  checks.push('Production worker assets load; desktop and mobile use page scrolling without horizontal overflow');
  await context.close();
  await new Promise(resolve => server.httpServer.close(resolve)); server = null;

  // Development React replays setup/cleanup in StrictMode. Test a real second
  // server because a minified production build does not perform that replay.
  process.env.NODE_ENV = 'development';
  devServer = await createServer({ configFile: path.join(root, 'vite.config.mjs'), mode: 'development', server: { host: '127.0.0.1', port: 0 } });
  await devServer.listen();
  const devBase = `http://127.0.0.1:${devServer.httpServer.address().port}/`;
  const devContext = await browser.newContext({ acceptDownloads: true, serviceWorkers: 'block' });
  await devContext.route('**/*', route => route.request().url().startsWith(devBase) ? route.continue() : route.abort());
  const devPage = await devContext.newPage();
  devPage.on('pageerror', error => errors.push(error.message));
  await devPage.goto(devBase);
  await parity(devPage, path.join(root, 'public/data/cases/confirmed.json'), 'development-strict-mode');
  assert.deepEqual(errors, []);
  checks.push('Development StrictMode cleanup/setup produces a complete SDK result with CLI parity');
  await devContext.close();
  const result = { suite: 'Gift-kit Handoff Desk browser', checks, workers: workers.map(url => new URL(url).pathname) };
  await fs.writeFile(path.join(output, 'browser-results.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (browser) await browser.close();
  if (server?.httpServer.listening) await new Promise(resolve => server.httpServer.close(resolve));
  if (devServer) await devServer.close();
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
  await fs.rm(temporary, { recursive: true, force: true });
}
