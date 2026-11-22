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
const publishedMetadata=JSON.parse(await fs.readFile(path.join(root,'assets/use-cases/restaurant-roster-repair/current-ui/metadata.json'),'utf8'));
const output = path.join(root, 'assets/use-cases/restaurant-roster-repair/shared-report-preview');
const prefix = '/assets/use-cases/restaurant-roster-repair/shared-report-preview/';
const base = 'http://127.0.0.1:4193/';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lab = createDecisionLab();
const proof = { format: 'restaurant-roster-marketplace-ui/1', capturedAt: new Date().toISOString(), captureUrl: base,
  method: 'Unedited native Chrome element screenshots from a local Marketplace install link. Fictional starter data, ordinary Forms changes, Apply inputs, Calculate/Recalculate, report inspection and native SDK-run downloads. No local-file import, DOM/style/storage or result injection. Selected SDK output fields are projected read-only from the retained complete native exports.',
  provenance: 'local-production-preview', publicationClaimed: false, captures: [], artifacts: [], scenarios: {}, checks: [], errors: [], passed: false };
const figures = {};
await fs.mkdir(output, { recursive: true });
async function retain(file, bytes, origin) {
  await fs.mkdir(path.dirname(path.join(output, file)), { recursive: true });
  await fs.writeFile(path.join(output, file), bytes);
  const artifact = { file, sha256: sha(bytes), bytes: bytes.length, origin };
  proof.artifacts.push(artifact); return artifact;
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
  const artifact = await retain(file, bytes, 'Complete unmodified native SDK-run download from the local production preview');
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
  await page.goto(install.href, { waitUntil: 'domcontentloaded' });
  const entryDialog = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Explore example', exact: true }) });
  await page.waitForTimeout(2000);
  if (await entryDialog.count() && await entryDialog.isVisible()) await entryDialog.getByRole('button', { name: 'Explore example', exact: true }).click();
  await inputs.waitFor(); await ready();
  assert.equal(await reports.locator('[data-workflow-reports="true"]').count(),1);proof.presentation={component:'WorkflowReportsView',hostMarker:'[data-workflow-reports="true"]',hostMarkerVerified:true};
  assert.equal(await page.getByLabel('Reviewer name', { exact: true }).count(), 0);
  await scenario('starter');
  const full = await calculate('full'); checkFinding(full, ['relief', 'coupled'], []);
  assert.equal(full.run.case.roster.remainingPayrollLimitMinor, 85600);
  await layout('Reports'); await showSummary();
  await shot('full', summary(), 'Without a ranking priority, the current restaurant Decision summary presents two passing complete repairs: Rowan at $836 remaining payroll and the coordinated repair at $736.', 'Rowan can work 6–10 p.m. Two supplied repairs pass; Compare without ranking declares neither preferred.', 'full');

  await report('Supporting reports'); await reports.getByRole('tab', { name: 'Repair comparison', exact: true }).click();
  const repairDetails = reports.locator('[data-question-view="repair-details"]:visible');
  await repairDetails.getByLabel('Complete roster repair', { exact: true }).selectOption('string:move-only');
  await repairDetails.getByText('Requirements',{exact:true}).click();
  assert.match(await repairDetails.innerText(), /Sunday|sun-lunch/);
  await shot('blockers', repairDetails, 'Repair comparison inspects Move Theo only and identifies the unfilled Sunday cooking position among its unmet requirements.', 'Moving Theo fills Saturday but leaves Sunday short. Inspect the complete repair rather than just the replacement name.', 'full');

  // Capture the full graph at its native 100% scale. Fit width in a narrower
  // viewport shrinks node text before rasterization and loses readable detail.
  await page.setViewportSize({ width: 3000, height: 1200 }); await report('Decision process');
  const process = reports.locator('[data-decision-process]:visible');
  await process.locator('[data-decision-process-graph]').waitFor();
  await process.getByRole('button', { name: 'Fit width', exact: true }).click(); await page.waitForTimeout(250);
  const graph = await process.evaluate(element => ({ nodes: [...element.querySelectorAll('[data-decision-process-node]')].map(node => ({ id: node.dataset.decisionProcessNode, status: node.dataset.status })),
    edges: [...element.querySelectorAll('path[data-decision-process-edge]')].map(edge => ({ id: edge.dataset.decisionProcessEdge, from: edge.dataset.from, to: edge.dataset.to, kind: edge.dataset.kind, status: edge.dataset.status })) }));
  await shot('process', process, 'The restaurant Decision process graph connects complete-repair assessment to passing repairs, optional priority, revision and external staff agreement, with labeled current-case and reassessment paths.', 'The graph shows how the finding changes the available response. Inspection does not obtain staff agreement or publish a roster.', 'full');
  await process.locator('[data-decision-process-node="passing"]').click();
  await process.locator('[data-decision-process-detail="passing"]').waitFor();
  await process.getByRole('group', { name: 'Decision process representation', exact: true }).getByRole('button', { name: 'Table', exact: true }).click();
  const table = await process.evaluate(element => ({ nodes: [...element.querySelectorAll('[data-decision-process-row]')].map(node => ({ id: node.dataset.decisionProcessRow, status: node.dataset.status })), edges: [...element.querySelectorAll('[data-decision-process-path]')].map(edge => ({ id: edge.dataset.decisionProcessPath, status: edge.dataset.status })) }));
  const selectedNodeId = await process.locator('[data-decision-process-row][data-selected="true"]').getAttribute('data-decision-process-row');
  const inspected = await exported('inspection-after.run.json'); assert.deepEqual(inspected.run, full.run);
  proof.inspection = { before: proof.scenarios.full.run, after: inspected.record, graph, table, selectedNodeId };

  await page.setViewportSize({ width: 1120, height: 1100 });
  let availability = await card('relief-window');
  await availability.getByLabel('Available until on Saturday', { exact: true }).selectOption('1200'); await apply(availability);
  const stale = await scenario('stale'); assert.notEqual(stale.projected.decisionSummary.finding.availability, 'available');
  await layout('Reports'); await showSummary();
  await shot('stale', summary(), 'After Rowan’s earlier finish is applied, the Decision summary withholds the earlier answer and calls for a current calculation.', 'Applying a changed availability withdraws the previous finding. Recalculate before relying on the comparison.', 'stale');
  await layout('Both'); const short = await calculate('short'); checkFinding(short, ['coupled'], []);
  await layout('Reports'); await showSummary();
  await shot('short', summary(), 'With Rowan available only 6–8 p.m., the unranked restaurant Decision summary shows only the coordinated repair passing at $736 remaining payroll.', 'Only Rowan’s finish changes. The required assignment still runs until 10 p.m.; the coordinated repair remains feasible.', 'short');

  availability = await card('relief-window');
  await availability.getByLabel('Available until on Saturday', { exact: true }).selectOption('1320'); await apply(availability);
  const restored = await calculate('restored'); checkFinding(restored, ['relief', 'coupled'], []); assert.deepEqual(restored.run.case, full.run.case);
  let priority = await card('priority');
  await priority.getByLabel('Comparison priority', { exact: true }).selectOption('stability'); await apply(priority);
  const stability = await calculate('stability'); checkFinding(stability, ['relief', 'coupled'], ['relief']);
  await layout('Reports'); await showSummary();
  await shot('stability', summary(), 'Preserve published assignments first prefers Bring in Rowan, with $836 remaining payroll, $180 additional expense and one changed position.', 'Stability first: Rowan preserves the other published assignments. Payroll breaks ties after the changed-position count.', 'stability');
  priority = await card('priority');
  await priority.getByLabel('Comparison priority', { exact: true }).selectOption('cost'); await apply(priority);
  const cost = await calculate('cost'); checkFinding(cost, ['relief', 'coupled'], ['coupled']);
  assert.equal(feasibilityId(restored), feasibilityId(stability)); assert.equal(feasibilityId(restored), feasibilityId(cost));
  const a = structuredClone(stability.run.case), b = structuredClone(cost.run.case); delete a.roster.comparisonPriority; delete b.roster.comparisonPriority; assert.deepEqual(a, b);
  await layout('Reports'); await showSummary();
  await shot('cost', summary(), 'Minimize remaining payroll first prefers Repair three assignments, with $736 remaining payroll, $80 additional expense and three changed positions.', 'Cost first: the coordinated repair saves $100. Every staffing requirement and operating fact stays the same.', 'cost');

  priority = await card('priority');
  await priority.getByLabel('Comparison priority', { exact: true }).selectOption('stability'); await apply(priority);
  const chosenProfile = await calculate('roster'); checkFinding(chosenProfile, ['relief', 'coupled'], ['relief']);
  await layout('Reports'); await showSummary();
  await report('Supporting reports');
  await reports.getByRole('tab', { name: 'Complete roster', exact: true }).click();
  const timetable = reports.locator('[data-guided-report-tab="assignments"]:visible');
  await timetable.getByLabel('Service position', { exact: true }).selectOption('sat-dinner-cook-2');
  await timetable.getByRole('button', { name: 'Table', exact: true }).click();
  assert.equal(await timetable.getByLabel('Service position', { exact: true }).locator('option').count(), 9);
  assert.match(await timetable.locator('.drv-activity-assignments').innerText(), /Rowan/); assert.match(await timetable.locator('.drv-activity-assignments').innerText(), /Theo/);
  await shot('roster', timetable, 'Complete roster compares the Saturday dinner cooking position across all four supplied repairs, showing Rowan or Theo covering the recorded 6–10 p.m. interval and identifying the unfilled proposal.', 'Compare one service position across the supplied complete repairs, then switch positions to inspect the rest of the roster. These are retained schedules; selecting a position does not choose a repair or publish it.', 'roster');

  // A complete negative finding is verified separately, without turning the
  // one-cent boundary fixture into another business story.
  priority = await card('priority'); await priority.getByLabel('Comparison priority', { exact: true }).selectOption('feasibility'); await apply(priority);
  const payroll = await card('payroll-limit'); await payroll.getByLabel('Remaining payroll limit', { exact: true }).fill('735.99'); await apply(payroll);
  const negative = await calculate('noPassing'); checkFinding(negative, [], []);
  assert.equal(negative.projected.brief.complete, true);
  proof.comparisons = { priorityPreservesFeasibility: true, editsWithholdSummary: true, operatingFactsUnchanged: true,
    fullAndShortChangeOnlyReliefEnd: true, priorityFeasibilityEvaluationId: feasibilityId(restored) };
  const fullCase = structuredClone(full.run.case), shortCase = structuredClone(short.run.case); fullCase.roster.reliefWindow.throughMinute = 1200; assert.deepEqual(fullCase, shortCase);
  await page.setViewportSize({ width: 390, height: 844 }); await layout('Reports'); await showSummary();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'Native mobile page must contain the view');
  proof.mobile = { width: 390, noPageOverflow: true };
  assert.equal(sha(await publicFile('offline-build.json')), sha(buildBytes), 'Local preview runtime remained fixed throughout the capture');
  assert.deepEqual(proof.errors, []);
  proof.checks.push('Actual local preview Marketplace package and runtime assets verified by exact hashes.', 'Four supplied complete repairs assessed with full and shortened availability; only the relief finish changes.', 'Changing only priority reuses the same feasibility evaluation and mandatory operating facts.', 'Applied availability edits withhold a current summary until recalculation.', 'A complete calculation with no passing supplied repair remains distinct from an unavailable calculation.', 'Graph/table share native nodes and current statuses; inspection preserves the exact native export.', 'The activity-based Complete roster view compares a selected service position across the supplied repairs; all nine positions remain available for inspection and actual agreement/publication stays external.', 'Native mobile view has no horizontal page overflow.');
  proof.passed = true;
  await fs.writeFile(path.join(output,'README.md'),'# Local preview restaurant roster captures\n\nUnedited native Chrome captures of Repair a published restaurant roster '+definition.version+', frozen production build '+build.version+'. The shared-report preview has not been published; public install links retain '+publishedMetadata.workflowVersion+'.\n\nThe same four supplied repairs are assessed under full/shortened Rowan availability and two explicit comparison priorities. Native exports retain the complete calculations. Inspection changes neither findings nor operating choices; agreement and roster publication remain external. Individual requirement checks are expanded through the native Requirements disclosure.\n\nExact build/package identities, image hashes, scenarios and checks are retained in verification.json. Reproduce with node scripts/capture-shared-restaurant.mjs using the retained frozen local build. Earlier public captures and metadata remain in current-ui.\n');
  await fs.writeFile(path.join(root, 'src/_data/restaurantRosterMarketplace.json'), JSON.stringify({ workflowId: definition.id, workflowVersion: definition.version, appUrl: 'https://hermodlabs.github.io/review_lab/', previewAppUrl: base,
    installUrl: publishedMetadata.installUrl, publishedWorkflowVersion: publishedMetadata.workflowVersion, previewInstallUrl: install.href, provenance: 'local-production-preview', publicationClaimed: false, buildVersion: build.version, verificationUrl: prefix + 'verification.json', workflowUrl: prefix+'restaurant.workflow.json', notesUrl:prefix+'README.md', figures }, null, 2) + '\n');
} catch (error) {
  proof.errors.push(error.stack || String(error)); console.error(error); process.exitCode = 1;
  await page.screenshot({ path: '/private/tmp/restaurant-marketplace-failure.png', fullPage: true });
  console.error((await page.locator('main').innerText()).slice(-14000));
} finally {
  await retain('capture-procedure.mjs', await fs.readFile(fileURLToPath(import.meta.url)), 'Exact procedure used for these local-preview-app captures');
  await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify(proof, null, 2) + '\n');
  await browser.close();
}
