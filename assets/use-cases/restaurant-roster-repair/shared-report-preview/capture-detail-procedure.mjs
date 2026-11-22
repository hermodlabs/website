// Local Marketplace starters, ordinary controls and native downloads only.
// SDK output below is a read-only projection of those downloaded native runs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/jnaciona/code/hermod-review-lab/node_modules/playwright/index.mjs';
import { createDecisionLab, SDK_VERSION } from '/Users/jnaciona/code/hermod-review-lab/packages/sdk/dist/index.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'assets/use-cases/restaurant-roster-repair/shared-report-preview');
const prefix = '/assets/use-cases/restaurant-roster-repair/shared-report-preview/';
const base = 'http://127.0.0.1:4193/';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lab = createDecisionLab();
const proof = JSON.parse(await fs.readFile(path.join(output, 'verification.json'), 'utf8'));
assert.equal(proof.passed, true);
const previousBuild = proof.build.version;
proof.captures = proof.captures.filter(row => row.key !== 'roster');
const metadata = JSON.parse(await fs.readFile(path.join(root, 'src/_data/restaurantRosterMarketplace.json'), 'utf8'));
const figures = metadata.figures;
await fs.mkdir(output, { recursive: true });
async function retain(file, bytes, origin) {
  await fs.mkdir(path.dirname(path.join(output, file)), { recursive: true });
  await fs.writeFile(path.join(output, file), bytes);
  const artifact = { file, sha256: sha(bytes), bytes: bytes.length, origin };
  proof.artifacts = proof.artifacts.filter(row => row.file !== file); proof.artifacts.push(artifact); return artifact;
}
async function publicFile(file) {
  const response = await fetch(new URL(file, base));
  assert.equal(response.ok, true, file); return Buffer.from(await response.arrayBuffer());
}
const buildBytes = await publicFile('offline-build.json'), build = JSON.parse(buildBytes);
await retain('offline-build.json', buildBytes, 'Exact local preview runtime manifest');
proof.build = { version: build.version, manifestFile: 'offline-build.json', manifestSHA256: sha(buildBytes) };
proof.runtimeVerification = [];
for (const asset of build.assets.filter(row => /^(?:assets\/.*\.(?:js|css|wasm)|index\.html)$/.test(row.url))) {
  const bytes = await publicFile(asset.url); assert.equal(sha(bytes), asset.sha256, asset.url);
  proof.runtimeVerification.push({ file: asset.url, sha256: sha(bytes), bytes: bytes.length });
}
const catalogBytes = await publicFile('app-configs/catalog.json');
await retain('catalog.json', catalogBytes, 'Exact local Marketplace catalog');
const entry = JSON.parse(catalogBytes).workflows.find(row => row.id === 'repair-published-restaurant-roster');
const packagePath = 'app-configs/' + entry.package.path;
const pkgBytes = await publicFile(packagePath), pkg = JSON.parse(pkgBytes), definition = pkg.workflow;
assert.equal(definition.execution.mode, 'calculation'); assert.equal(definition.version, entry.version);
await retain('restaurant.workflow.json', pkgBytes, new URL(packagePath, base).href);
proof.workflow = { id: definition.id, version: definition.version, packageHash: pkg.contentHash, definitionHash: definition.contentHash };
proof.sdkProjection = { version: SDK_VERSION, method: 'workflows.openRun followed by workflows.output; no evaluator invoked', entrySHA256: sha(await fs.readFile('/Users/jnaciona/code/hermod-review-lab/packages/sdk/dist/index.js')) };
const install = new URL(base);
for (const [key, value] of Object.entries({ install: 'workflow', id: definition.id, version: definition.version, publisher: 'decision-lab', collection: 'restaurant-operations', release: pkg.contentHash })) install.searchParams.set(key, value);
proof.installUrl = install.href;

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1120, height: 1100 }, locale: 'en-US', timezoneId: 'America/Chicago', reducedMotion: 'reduce', serviceWorkers: 'block', acceptDownloads: true });
const page = await context.newPage(); page.setDefaultTimeout(90000);
page.on('pageerror', error => proof.errors.push(error.message));
const inputs = page.getByRole('region', { name: 'Workflow inputs', exact: true });
const reports = page.getByRole('region', { name: 'Workflow reports', exact: true });
const summary = () => reports.locator('[data-decision-summary]:visible');
async function ready() {
  await page.locator('.gr-busy').waitFor({ state: 'hidden', timeout: 180000 });
  await page.getByLabel('Local save status', { exact: true }).filter({ hasText: 'Saved locally' }).waitFor();
}
async function layout(name) { await page.getByRole('group', { name: 'Workspace layout', exact: true }).getByRole('button', { name, exact: true }).click(); }
async function report(name) { await reports.getByRole('tablist', { name: 'Workflow report groups', exact: true }).getByRole('tab', { name, exact: true }).click(); }
async function showSummary() { await report('Decision summary'); await summary().waitFor(); }
async function card(id) {
  await layout('Both');
  const group = definition.metadata.presentation.groups.find(row => row.subtabs?.some(tab => tab.questionIds?.includes(id)));
  const subtab = group.subtabs.find(row => row.questionIds?.includes(id));
  await inputs.getByRole('tablist', { name: 'Workflow input groups', exact: true }).getByRole('tab', { name: group.label, exact: true }).click();
  await inputs.getByRole('tab', { name: subtab.label, exact: true }).click();
  return inputs.locator(`[data-question-id="${id}"]:visible`);
}
async function apply(target) { await target.getByRole('button', { name: 'Apply inputs', exact: true }).click(); await ready(); }
async function exported(file) {
  await page.getByRole('button', { name: 'Case details', exact: true }).click();
  const tools = page.getByRole('dialog', { name: 'Case details', exact: true });
  await tools.getByRole('tab', { name: 'Files', exact: true }).click();
  const advanced = tools.getByRole('button', { name: 'Export SDK run (.json)', exact: true, includeHidden: true }).locator('xpath=ancestor::details[1]');
  if (await advanced.getAttribute('open') === null) await advanced.locator(':scope > summary').click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export SDK run (.json)', exact: true }).click();
  const bytes = await fs.readFile(await (await pending).path());
  const artifact = await retain(file, bytes, 'Complete unmodified native SDK-run download from the local preview');
  await tools.getByRole('button', { name: 'Close case details', exact: true }).click();
  const run = lab.workflows.openRun(bytes.toString('utf8'));
  assert.equal(run.definition.contentHash, definition.contentHash); assert.deepEqual(run.reviews, []);
  return { run, record: { ...artifact, contentHash: run.contentHash } };
}
async function scenario(key) {
  const { run, record } = await exported(`${key}.run.json`), projected = lab.workflows.output({ run });
  const active = run.case.roster.comparisonPriority;
  const selected = run.evaluations.filter(row => row.stepId === active).at(-1)?.output;
  const selection = { format: 'restaurant-roster-ui-output-selection/1', sourceRunHash: run.contentHash,
    steps: projected.steps.map(({ id, status, evaluationId }) => ({ id, status, evaluationId })),
    decisionSummary: projected.decisionSummary, decisionProcess: projected.decisionProcess,
    plans: selected?.plans || [], preferenceEstablished: selected?.preferenceEstablished };
  const artifact = await retain(`${key}.output.json`, Buffer.from(JSON.stringify(selection, null, 2) + '\n'), 'Selected fields from SDK workflows.output plus the native active handoff; complete calculation retained in the matching native run');
  proof.scenarios[key] = { run: record, output: artifact };
  return { run, projected, selection };
}
async function calculate(key) {
  await inputs.getByRole('button', { name: /^(Calculate|Recalculate)$/, exact: true }).click(); await ready();
  return scenario(key);
}
function passing(value) { return value.selection.plans.filter(row => row.feasible).map(row => row.id).sort(); }
function preferred(value) { return value.selection.plans.filter(row => row.feasible && row.preferred).map(row => row.id).sort(); }
function feasibilityId(value) { return value.run.evaluations.filter(row => row.stepId === 'feasibility').at(-1)?.id; }
function checkFinding(value, supported, preference) {
  assert.deepEqual(passing(value), [...supported].sort()); assert.deepEqual(preferred(value), [...preference].sort());
  assert.equal(value.selection.plans.length, 4); assert.equal(value.projected.decisionSummary.finding.availability, 'available');
  for (const plan of value.selection.plans) assert.equal(plan.baselineMinor, 65600);
}
async function shot(key, locator, alt, caption, sourceCase) {
  await page.evaluate(() => document.fonts.ready); await locator.scrollIntoViewIfNeeded();
  const file = `${key}.png`; await locator.screenshot({ path: path.join(output, file), animations: 'disabled' });
  const bytes = await fs.readFile(path.join(output, file));
  const capture = { key, file, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), sha256: sha(bytes), bytes: bytes.length,
    viewport: page.viewportSize(), nativeText: await locator.innerText(), scenario: sourceCase };
  proof.captures.push(capture);
  figures[key] = { image: prefix + file, width: capture.width, height: capture.height, sha256: capture.sha256, alt, caption };
  console.log(`${key}: ${capture.width} × ${capture.height}`);
}
try {
  assert.equal(build.version, previousBuild, 'The corrective detail session uses the same frozen local build.');
  await page.goto(install.href, { waitUntil: 'domcontentloaded' }); await inputs.waitFor(); await ready();
  const full = await calculate('rosterCorrectionFull'); checkFinding(full, ['relief', 'coupled'], []);
  const priority = await card('priority');
  await priority.getByLabel('Comparison priority', { exact: true }).selectOption('stability'); await apply(priority);
  const current = await calculate('rosterCorrection'); checkFinding(current, ['relief', 'coupled'], ['relief']);
  await layout('Reports'); await report('Supporting reports');
  await reports.getByRole('tab', { name: 'Complete roster', exact: true }).click();
  const timetable = reports.locator('[data-guided-report-tab="assignments"]:visible');
  await timetable.getByLabel('Complete plan to inspect',{exact:true}).selectOption('string:relief');
  await timetable.getByLabel('Service position', { exact: true }).selectOption('sat-dinner-cook-2');
  await timetable.getByRole('button', { name: 'Table', exact: true }).click();
  assert.equal(await timetable.getByLabel('Service position', { exact: true }).locator('option').count(), 9);
  const assignments = await timetable.locator('.drv-activity-assignments').innerText();
  assert.match(assignments, /Rowan/); assert.match(assignments, /Theo/); assert.match(assignments, /Unfilled/);
  await shot('roster', timetable, 'Complete roster compares Saturday dinner cooking position 2 across all four supplied repairs, showing Rowan or Theo covering the recorded 6–10 p.m. interval and identifying the unfilled proposal.', 'Compare the disrupted service position across the supplied complete repairs, then switch positions to inspect the rest of the roster. These are retained schedules; selecting a position does not choose a repair or publish it.', 'rosterCorrection');
  assert.equal(sha(await publicFile('offline-build.json')), sha(buildBytes)); assert.deepEqual(proof.errors, []);
  const inspected=await exported('roster-detail-inspected.run.json');assert.equal(inspected.run.contentHash,current.run.contentHash);
  proof.rosterDetailSession = { capturedAt: new Date().toISOString(), scenario: 'rosterCorrection', position: 'sat-dinner-cook-2', optionCount: 9,
    reason: 'The native activity comparison shows the disrupted position while inspecting Bring in Rowan, matching the priority story; inspection does not select an operating plan.', procedure: 'capture-detail-procedure.mjs' };
  metadata.figures = figures;
  await fs.writeFile(path.join(root, 'src/_data/restaurantRosterMarketplace.json'), JSON.stringify(metadata, null, 2) + '\n');
} catch(error) {
  proof.passed = false; proof.errors.push(error.stack || String(error)); console.error(error); process.exitCode = 1;
  await page.screenshot({ path: '/private/tmp/restaurant-detail-failure.png', fullPage: true });
} finally {
  await retain('capture-detail-procedure.mjs', await fs.readFile(fileURLToPath(import.meta.url)), 'Exact native screenshot follow-up procedure selecting the disrupted service position.');
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify(proof, null, 2) + '\n');
  await browser.close();
}
