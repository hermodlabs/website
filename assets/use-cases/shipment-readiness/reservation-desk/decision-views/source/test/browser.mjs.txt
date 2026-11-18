/**
 * Exercise the copied, production-built client through its public interface.
 *
 * The CLI is only a test oracle here. The browser application never imports it:
 * its worker executes the installed SDK, and this test compares the resulting
 * retained reports with the same cases evaluated by the public CLI command.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, createServer, preview } from 'vite';
import { chromium } from 'playwright';
import { runCLI } from '@decision-lab/cli';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.output');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'reservation-desk-browser-'));
const checks = [];
const originalNodeEnv = process.env.NODE_ENV;
let browser, server, devServer;

const json = async filename => JSON.parse(await fs.readFile(filename, 'utf8'));
const cells = row => Object.fromEntries(Object.entries(row.cells).map(([key, cell]) => [key, cell.raw]));
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Read the SDK's prepared report. These are calculated facts, not shipment rules.
function outcome(run) {
  assert.equal(run.format, 'decision-lab-run/1');
  assert.equal(run.execution.status, 'completed');
  assert.equal(run.report.completeness.assessmentComplete, true);
  assert.equal(run.report.completeness.truncated, false);
  const report = run.report;
  const dataset = report.datasets.commitment;
  assert.equal(dataset.assessment.coverage.complete, true);
  const contexts = report.contextIndexes.planScenarios.entries;
  const sectionTables = sectionId => dataset.sections[sectionId].map(section => report.datasets[section.datasetId]).filter(table => table?.kind === 'table');
  const tableWith = (sectionId, keys) => {
    const tables = sectionTables(sectionId).filter(table => keys.every(key => table.columns.some(column => column.id === key)));
    assert.equal(tables.length, 1);
    return tables[0];
  };
  const preferred = dataset.summary.recommendation?.tiedPlanIds ?? [];
  const plans = report.datasets['commitment:comparison'].rows.map(row => {
    const comparison = cells(row);
    const plan = dataset.plans.find(candidate => candidate.id === row.id);
    const situations = contexts.filter(context => context.planId === row.id).map(context => {
      const failedChecks = tableWith(context.sections.checks, ['check', 'status']).rows
        .filter(check => check.cells.status.raw === false).map(check => check.id).sort();
      const arrival = tableWith(context.sections.schedule, ['value', 'result']).rows.find(value => value.id === 'arrival');
      assert.ok(arrival);
      return { scenarioId: context.scenarioId, arrival: arrival.cells.result.raw, failedChecks };
    });
    return { arrangement: comparison['choice:arrangement'], feasible: plan.feasible, preferred: preferred.includes(row.id), expense: comparison.expense, situations };
  }).sort((a, b) => a.arrangement.localeCompare(b.arrangement));
  return { finding: run.assessment.finding, plans };
}

async function cliRun(caseFile, name) {
  const filename = path.join(temporary, `${name}.run.json`);
  let stderr = '';
  const code = await runCLI(['run', '--app', path.join(root, 'public/data/shipment-review.app.json'), '--case', caseFile,
    '--reports', 'all', '--run-id', `reservation-desk-browser-${name}`, '--created-at', '2026-11-17T14:00:00.000Z',
    '--timeout-ms', '30000', '--output', filename], {
    stdout: { write() {} }, stderr: { write(chunk) { stderr += chunk; } },
  });
  assert.equal(code, 0, `CLI ${name}: ${stderr}`);
  return json(filename);
}

async function downloadRun(page) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 45_000 }),
    page.getByRole('button', { name: 'Download SDK run', exact: true }).click({ timeout: 45_000 }),
  ]);
  const filename = await download.path();
  assert.ok(filename, 'The browser retained the complete review download.');
  const run = await json(filename);
  assert.equal(run.format, 'decision-lab-run/1');
  assert.ok(run.report, 'The download retains the native SDK report, not an application-specific wrapper.');
  return run;
}

const reviewArrangements = page => page.getByRole('button', { name: 'Review arrangements', exact: true }).click({ timeout: 45_000 });

/** Dispatch two user actions before the worker can deliver a result task. */
async function interruptReview(page, action) {
  await page.waitForFunction(() => [...document.querySelectorAll('button')]
    .some(value => value.textContent.trim() === 'Review arrangements' && !value.disabled));
  await page.evaluate(async action => {
    const button = text => [...document.querySelectorAll('button')].find(value => value.textContent.trim() === text);
    const review = button('Review arrangements');
    if (!review || review.disabled) throw new Error('The current records must be ready for review.');
    review.click();
    // Flush the discrete React event update; worker messages arrive in later tasks.
    await Promise.resolve();
    if (action.kind === 'cancel') {
      const cancel = button('Cancel review');
      if (!cancel) throw new Error('The running review must offer cancellation.');
      cancel.click();
    } else if (action.kind === 'case') {
      const next = [...document.querySelectorAll('button')].find(value => value.textContent.includes(action.label));
      if (!next || next.disabled) throw new Error('A worked case must remain selectable while a review is running.');
      next.click();
    } else {
      const label = [...document.querySelectorAll('label')].find(value => value.textContent === 'Complete quote amount');
      const input = document.getElementById(label.htmlFor);
      if (input.disabled || input.closest('fieldset')?.disabled) throw new Error('A changed record must be able to supersede a running review.');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, action.value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, action);
}

async function assertPageFlow(page, viewport) {
  await page.setViewportSize(viewport);
  const layout = await page.evaluate(() => {
    const nestedScroll = [...document.querySelectorAll('main, section, article, aside, [role="region"]')]
      .filter(element => ['auto', 'scroll'].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight + 2)
      .map(element => `${element.tagName.toLowerCase()}.${element.className}`);
    return { viewport: innerWidth, width: document.documentElement.scrollWidth, nestedScroll };
  });
  assert.ok(layout.width <= layout.viewport + 1, `The ${viewport.width}px layout overflows horizontally: ${JSON.stringify(layout)}`);
  assert.deepEqual(layout.nestedScroll, [], 'The page scrolls normally; report panels do not trap vertical scrolling.');
}

async function screenshot(page, filename) {
  // A downloaded file restores focus differently across Chrome versions. Reset
  // focus and scroll before capturing the layout, rather than a hover/focus state.
  await page.evaluate(async () => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.screenshot({ path: path.join(output, filename), fullPage: true, animations: 'disabled', caret: 'hide' });
}

try {
  await fs.mkdir(output, { recursive: true });
  await build({ configFile: path.join(root, 'vite.config.mjs') });
  server = await preview({ configFile: path.join(root, 'vite.config.mjs'), preview: { host: '127.0.0.1', port: 0, strictPort: false } });
  const address = server.httpServer.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/`;
  const response = await fetch(base);
  assert.equal(response.status, 200, 'The production preview serves a successful response.');
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.HERMOD_CHROMIUM_PATH || (existsSync(chrome) ? chrome : undefined), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ acceptDownloads: true, serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [], workers = [], requested = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('worker', worker => workers.push(worker.url()));
  page.on('request', request => requested.push(request.url()));
  await page.goto(base);

  const config = await json(path.join(root, 'public/data/config.json'));
  const selectCase = id => page.getByRole('button', { name: new RegExp(escapeRegex(config.cases.find(value => value.id === id).label)) }).click({ timeout: 45_000 });
  const expected = { confirmed: ['consolidated'], revised: ['direct'], permissions: [] };
  for (const [id, preferred] of Object.entries(expected)) {
    await selectCase(id);
    await reviewArrangements(page);
    const run = await downloadRun(page);
    const reference = await cliRun(path.join(root, `public/data/cases/${id}.json`), id);
    const actual = outcome(run);
    assert.deepEqual(actual, outcome(reference), `${id}: SDK browser and public CLI return the same costs, arrivals, eligibility, preference and failed conditions.`);
    assert.deepEqual(actual.plans.filter(plan => plan.preferred).map(plan => plan.arrangement).sort(), preferred);
    assert.deepEqual(run.input.inputs, await json(path.join(root, `public/data/cases/${id}.json`)), 'The native run retains exactly the selected complete case.');
    checks.push(`${id}: browser worker and CLI agree on every arrangement and failed condition`);
    if (id === 'confirmed') {
      const complete = page.locator('.results-panel > [data-decision-view]');
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
      await assertPageFlow(page, { width: 1440, height: 1000 });
      await screenshot(page, 'browser-desktop.png');
      await assertPageFlow(page, { width: 390, height: 844 });
      await screenshot(page, 'browser-mobile.png');
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }

  await selectCase('confirmed');
  await reviewArrangements(page);
  await downloadRun(page);
  await page.getByRole('group', { name: 'Arrangement to edit', exact: true }).getByRole('button', { name: 'Consolidated', exact: true }).click();
  await page.getByLabel('Complete quote amount', { exact: true }).fill('5100');
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  await page.getByText('Records changed. Review again.', { exact: true }).waitFor();
  assert.equal(await page.locator('.results-panel > [data-decision-view]').count(), 0, 'Superseded arrangements are not shown as a current result.');
  await page.locator('.previous-review > summary').waitFor();
  await reviewArrangements(page);
  const changed = await downloadRun(page);
  const changedFile = path.join(temporary, 'changed-case.json');
  await fs.writeFile(changedFile, JSON.stringify(changed.input.inputs));
  assert.deepEqual(outcome(changed), outcome(await cliRun(changedFile, 'changed-quote')));
  assert.deepEqual(outcome(changed).plans.filter(plan => plan.preferred).map(plan => plan.arrangement), ['direct']);
  await page.locator('.previous-review > summary').waitFor();
  checks.push('A changed quote invalidates the displayed recommendation; reassessment agrees with the CLI and retains the earlier basis');

  await page.getByLabel('Quote currency', { exact: true }).selectOption('EUR');
  await reviewArrangements(page);
  await page.getByRole('alert').filter({ hasText: /USD/ }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  assert.equal(await page.locator('.results-panel > [data-decision-view]').count(), 0, 'Unsupported currency never falls back to an older favorable recommendation.');
  checks.push('Unsupported quote currency produces an input error and withholds the current review');

  await page.getByLabel('Import canonical case JSON', { exact: true }).setInputFiles(path.join(root, 'public/data/cases/revised.json'));
  await reviewArrangements(page);
  const imported = await downloadRun(page);
  const importedReference = await cliRun(path.join(root, 'public/data/cases/revised.json'), 'imported-case');
  assert.deepEqual(outcome(imported), outcome(importedReference));
  checks.push('A complete canonical case can be imported and evaluated without changing its permission or confirmation scope');
  await screenshot(page, 'browser-imported.png');

  await page.getByLabel('Import canonical case JSON', { exact: true }).setInputFiles({ name: 'bound.case.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(changed.input)) });
  await page.waitForFunction(orderId => document.querySelector('[aria-label="Shipment commitment"]')?.textContent.includes(orderId), changed.input.inputs.parameters.orderId);
  await reviewArrangements(page);
  const bound = await downloadRun(page);
  assert.deepEqual(bound.input.inputs, changed.input.inputs);
  assert.deepEqual(outcome(bound), outcome(changed));
  checks.push('A native SDK-bound case imports with its exact reviewed app binding and canonical inputs');

  const wrongBinding = { ...bound.input, binding: { ...bound.input.binding, release: 999 } };
  await page.getByLabel('Import canonical case JSON', { exact: true }).setInputFiles({ name: 'wrong-release.case.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(wrongBinding)) });
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  assert.equal(await page.locator('.results-panel > [data-decision-view]').count(), 0);
  checks.push('An SDK-bound case from a different release is rejected without reusing its saved result');

  await selectCase('confirmed');
  await interruptReview(page, { kind: 'cancel' });
  await page.getByText('Records changed. Review again.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  assert.equal(await page.locator('.results-panel > [data-decision-view]').count(), 0);

  await page.getByRole('group', { name: 'Arrangement to edit', exact: true }).getByRole('button', { name: 'Consolidated', exact: true }).click();
  await interruptReview(page, { kind: 'edit', value: '4950' });
  await page.getByText('Records changed. Review again.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Download SDK run', exact: true }).isDisabled(), true);
  await reviewArrangements(page);
  const latest = await downloadRun(page);
  assert.equal(latest.input.inputs.tables.arrangements.find(row => row.id === 'consolidated').fee, 495000);
  const latestFile = path.join(temporary, 'latest-case.json');
  await fs.writeFile(latestFile, JSON.stringify(latest.input.inputs));
  assert.deepEqual(outcome(latest), outcome(await cliRun(latestFile, 'latest-edit')));
  checks.push('Cancellation and edits supersede an in-flight SDK job; only the latest reviewed records become current');

  await interruptReview(page, { kind: 'case', label: config.cases.find(value => value.id === 'revised').label });
  await reviewArrangements(page);
  const switched = await downloadRun(page);
  assert.deepEqual(switched.input.inputs, await json(path.join(root, 'public/data/cases/revised.json')));
  assert.deepEqual(outcome(switched), outcome(importedReference));
  checks.push('Switching cases during evaluation cancels the earlier job and retains only the selected shipment result');

  await selectCase('confirmed');
  await page.getByRole('group', { name: 'Arrangement to edit', exact: true }).getByRole('button', { name: 'Direct', exact: true }).click();
  await page.getByLabel('Complete quote amount', { exact: true }).fill('5000');
  await page.getByLabel('Travel time (minutes)', { exact: true }).fill('2520');
  await reviewArrangements(page);
  const tied = await downloadRun(page);
  const tiedFile = path.join(temporary, 'tied-case.json');
  await fs.writeFile(tiedFile, JSON.stringify(tied.input.inputs));
  assert.deepEqual(outcome(tied), outcome(await cliRun(tiedFile, 'tied-arrangements')));
  assert.deepEqual(outcome(tied).plans.filter(plan => plan.preferred).map(plan => plan.arrangement), ['consolidated', 'direct']);
  assert.equal(await page.locator('.results-panel > [data-decision-view] [data-decision-option]').filter({ hasText: 'Equally preferred complete plan' }).count(), 2, 'The team view retains the SDK preference tie rather than inventing a winner.');
  checks.push('A genuine calculated preference tie is retained in both the native run and the team view');

  assert.ok(workers.length > 0, 'The real browser worker ran.');
  assert.ok(workers.every(url => url.startsWith(base) && new URL(url).pathname.startsWith('/assets/') && !url.includes('/src/')), `Workers are emitted production assets: ${JSON.stringify(workers)}`);
  assert.ok(requested.some(url => new URL(url).pathname.startsWith('/assets/') && url.endsWith('.js')), 'The production build serves the emitted JavaScript assets.');
  assert.deepEqual(errors, []);
  checks.push('Production worker assets load from the built client; desktop/mobile panels use normal page scrolling');

  // React replays effect setup/cleanup in development StrictMode, not in a
  // minified production build. Use the same entry point to check that lifecycle.
  await context.close();
  await new Promise(resolve => server.httpServer.close(resolve));
  server = null;
  // Vite's programmatic production build sets NODE_ENV in this process. Reset
  // it deliberately so this second server actually serves development React.
  process.env.NODE_ENV = 'development';
  devServer = await createServer({ configFile: path.join(root, 'vite.config.mjs'), mode: 'development', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await devServer.listen();
  const devAddress = devServer.httpServer.address();
  assert.ok(devAddress && typeof devAddress !== 'string');
  const devBase = `http://127.0.0.1:${devAddress.port}/`;
  const devContext = await browser.newContext({ acceptDownloads: true, serviceWorkers: 'block' });
  await devContext.route('**/*', route => route.request().url().startsWith(devBase) ? route.continue() : route.abort());
  const devPage = await devContext.newPage();
  const devErrors = [], devRequests = [];
  // Observe calls, not just network events: StrictMode may abort the first
  // setup's fetch before Chrome emits a request event. Every invocation still
  // delegates unchanged to the real browser fetch; no response is substituted.
  await devPage.addInitScript(() => {
    const original = window.fetch;
    const calls = [];
    Object.defineProperty(window, '__reservationDeskFetchCalls', { value: calls });
    window.fetch = function (...args) {
      calls.push(String(args[0]));
      return Reflect.apply(original, this, args);
    };
  });
  devPage.on('pageerror', error => devErrors.push(error.message));
  devPage.on('request', request => devRequests.push(request.url()));
  await devPage.goto(devBase);
  await reviewArrangements(devPage);
  const strictModeRun = await downloadRun(devPage);
  assert.deepEqual(outcome(strictModeRun), outcome(await cliRun(path.join(root, 'public/data/cases/confirmed.json'), 'strict-mode')));
  const configLoads = await devPage.evaluate(() => window.__reservationDeskFetchCalls.filter(url => new URL(url).pathname === '/data/config.json').length);
  assert.ok(configLoads >= 2,
    'Development StrictMode replays the initialization effect; the cleaned-up instance cannot publish into the current one.');
  assert.ok(devRequests.some(url => new URL(url).pathname === '/data/config.json'), 'The current setup loads configuration from the real HTTP server.');
  assert.deepEqual(devErrors, []);
  checks.push('Development StrictMode effect cleanup/setup still produces a complete browser SDK run with CLI parity');
  await devContext.close();
  const result = { suite: 'Shipment Reservation Desk production browser', checks, workers: workers.map(url => new URL(url).pathname) };
  await fs.writeFile(path.join(output, 'browser-results.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (browser) await browser.close();
  if (server?.httpServer.listening) await new Promise(resolve => server.httpServer.close(resolve));
  if (devServer) await devServer.close();
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  await fs.rm(temporary, { recursive: true, force: true });
}
