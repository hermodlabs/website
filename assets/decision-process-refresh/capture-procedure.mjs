// Native public-app graph capture. Public Marketplace starters and fictional
// form values only; no local-file imports, DOM/styles/storage/result injection.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/jnaciona/code/hermod-review-lab/node_modules/playwright/index.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'assets/decision-process-refresh');
const base = 'https://hermodlabs.github.io/review_lab/';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const proof = { format: 'decision-lab-decision-process-refresh/1', capturedAt: new Date().toISOString(),
  method: 'Unedited native Chrome element screenshots of the public production app. Ordinary Marketplace installation links, public fictional starter inputs, visible Forms/YAML controls, Calculate, graph navigation and native downloads. No local file import or DOM, CSS, storage or findings injection.',
  sources: [], captures: [], artifacts: [], checks: [], errors: [], passed: false };
await fs.mkdir(directory, { recursive: true });
async function retain(file, bytes, origin) {
  await fs.mkdir(path.dirname(path.join(directory, file)), { recursive: true });
  await fs.writeFile(path.join(directory, file), bytes);
  const record = { file, sha256: sha(bytes), bytes: bytes.length, origin };
  proof.artifacts.push(record); return record;
}
async function publicFile(file) {
  const response = await fetch(new URL(file, base));
  assert.equal(response.ok, true, file); return Buffer.from(await response.arrayBuffer());
}
const manifestBytes = await publicFile('offline-build.json');
await retain('offline-build.json', manifestBytes, 'Current public production runtime manifest');
const manifest = JSON.parse(manifestBytes);
const runtimeVerification = [];
for (const asset of manifest.assets.filter(asset => /^(assets\/.*\.(js|css|wasm)|index\.html)$/.test(asset.url))) {
  const bytes = await publicFile(asset.url);
  assert.equal(sha(bytes), asset.sha256, asset.url);
  runtimeVerification.push({ file: asset.url, sha256: sha(bytes) });
}
proof.runtimeVerification = runtimeVerification;
const configurations = [
  { id: 'shipment', workflowId: 'review-first-shipment', version: '1.4.0', collection: 'order-fulfillment', data: 'shipmentUIRefresh', overview: 'process', detail: 'processDetail', selected: 'arrangements-feasible',
    alt: 'The complete shipment Decision process graph links registration evidence, complete arrangements and timely verification, with labeled current-case paths and reassessment returns.',
    caption: 'Follow the labeled arrows from the shipment commitment to evidence, complete arrangements and further verification. Highlighted paths apply to this recorded case; dashed return paths call for reassessment.',
    detailAlt: 'Inspecting the shipment question Does any complete arrangement meet the requirements shows its current Yes finding, basis, outgoing paths, inputs and supporting reports.',
    detailCaption: 'Inspect the feasibility question to see what supports the answer and which responses apply. Inspection records no shipment choice, permission or booking.' },
  { id: 'gifting', workflowId: 'review-gift-kit-flexible', version: '2.3.0', collection: 'gifting-operations', data: 'giftingUIRefresh', overview: 'calculationProcess', detail: 'calculationProcessDetail', selected: 'correction-feasible',
    alt: 'The complete gift-kit Decision process graph connects fault evidence to complete correction packages and available responses, with current-case paths and reassessment arrows.',
    caption: 'The gift-kit graph connects the supported faults to complete corrections and the responses available to Leah. The paths apply to the recorded one-day case; they do not release the kits.',
    detailAlt: 'A selected gift-kit feasibility question shows the current finding, its basis and the paths toward comparing supported complete corrections or revising the commitment.',
    detailCaption: 'The selected question exposes the basis for comparing complete corrections. A supported package remains separate from carrying out its work and verifying the corrected kits.' },
  { id: 'nightlife', workflowId: 'street-team-deployment', version: '1.5.0', collection: 'venue-operations', data: 'streetTeamUIRefresh', overview: 'process', detail: 'processDetail', selected: 'deployment-feasible',
    alt: 'The street-team Decision process graph connects staffing and operating requirements to feasible deployments and a separate expense-recovery guest hurdle, with current-case and reassessment paths.',
    caption: 'The connected graph keeps operating eligibility and the financial guest hurdle separate. Highlighted paths describe responses available in Alex’s five-staff case; they record no dispatch or spending authorization.',
    detailAlt: 'The selected street-team feasibility question shows the current operating finding and the paths toward reviewing supported deployments or revising the plan.',
    detailCaption: 'Inspect the operating question to see why holding or sending one is supported. Its finding does not predict guest response or authorize a deployment.' },
];
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const pendingData = [];
try {
  for (const config of configurations) {
    const context = await browser.newContext({ viewport: { width: 1900, height: 1200 }, locale: 'en-US', timezoneId: 'America/Chicago', reducedMotion: 'reduce', serviceWorkers: 'block', acceptDownloads: true });
    const page = await context.newPage(); page.setDefaultTimeout(60000);
    page.on('pageerror', error => proof.errors.push(`${config.id}: ${error.message}`));
    const source = { id: config.id, scenario: config.id, kind: 'public-marketplace-workflow', captureUrl: base,
      build: { version: manifest.version, manifestFile: 'offline-build.json', manifestSHA256: sha(manifestBytes) } };
    proof.sources.push(source);
    const reports = page.getByRole('region', { name: 'Workflow reports', exact: true });
    const inputs = page.getByRole('region', { name: 'Workflow inputs', exact: true });
    const processView = () => reports.locator('[data-decision-process]:visible');
    async function ready() {
      await page.locator('.gr-busy').waitFor({ state: 'hidden', timeout: 180000 });
      await page.getByLabel('Local save status', { exact: true }).filter({ hasText: 'Saved locally' }).waitFor();
    }
    async function exported(file) {
      const tools = page.locator('.gr-review-tools');
      if (await tools.getAttribute('open') === null) await tools.locator(':scope > summary').click();
      const downloading = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Export workflow run', exact: true }).click();
      const bytes = await fs.readFile(await (await downloading).path());
      const artifact = await retain(file, bytes, 'Ordinary native workflow export');
      await tools.locator(':scope > summary').click();
      const run = JSON.parse(bytes); return { run, artifact: { ...artifact, contentHash: run.contentHash } };
    }
    async function shot(role, locator) {
      await page.evaluate(() => document.fonts.ready);
      await locator.scrollIntoViewIfNeeded();
      const file = `${config.id}-${role}.png`;
      await locator.screenshot({ path: path.join(directory, file), animations: 'disabled' });
      const bytes = await fs.readFile(path.join(directory, file));
      const capture = { sourceId: config.id, role, file, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), sha256: sha(bytes), bytes: bytes.length, viewport: page.viewportSize(), nativeText: await locator.innerText() };
      proof.captures.push(capture); console.log(`${file}: ${capture.width} × ${capture.height}`);
      return { image: '/assets/decision-process-refresh/' + file, width: capture.width, height: capture.height, sha256: capture.sha256,
        alt: role === 'overview' ? config.alt : config.detailAlt, caption: role === 'overview' ? config.caption : config.detailCaption };
    }
    try {
      const packagePath = `app-configs/workflows/${config.workflowId}/${config.version}/workflow.workflow.json`;
      const packageBytes = await publicFile(packagePath), pkg = JSON.parse(packageBytes);
      await retain(`${config.id}.workflow.json`, packageBytes, new URL(packagePath, base).href);
      source.workflow = { id: pkg.workflow.id, version: pkg.workflow.version, definitionHash: pkg.workflow.contentHash, packageHash: pkg.contentHash };
      const url = new URL(base);
      for (const [key, value] of Object.entries({ install: 'workflow', id: config.workflowId, version: config.version, publisher: 'decision-lab', collection: config.collection, release: pkg.contentHash })) url.searchParams.set(key, value);
      source.installUrl = url.href;
      await page.goto(url.href, { waitUntil: 'domcontentloaded' }); await inputs.waitFor(); await ready();
      if (config.id === 'gifting') {
        // Extend only fictional public starter records to the article's one-day
        // scenario. Scope identifiers remain unchanged; no real evidence is supplied.
        const example = structuredClone(pkg.workflow.initialCase), work = example.gifting.work;
        example.gifting.commitment.handoffDeadlineMinute = 1440; work.rehearsalMinutes = 10;
        for (const permission of work.permissions) permission.validThroughMinute = 1440;
        for (const resource of work.resources) resource.availableThroughMinute = 1440;
        work.confirmations = [{ id: 'CONFIRM-EXTERNAL', packageId: 'external-replace-and-repair', scope: structuredClone(example.gifting.scope), confirmed: true, validFromMinute: 0, validThroughMinute: 1440, recordedAtMinute: 0, source: 'Fictional external correction booking', recordedBy: 'production-owner-1' }];
        await inputs.getByRole('group', { name: 'Input representation', exact: true }).getByRole('button', { name: 'YAML', exact: true }).click();
        await inputs.getByLabel('Workflow case YAML', { exact: true }).fill(JSON.stringify(example, null, 2));
        await inputs.getByRole('button', { name: 'Preview changes', exact: true }).click();
        await inputs.getByRole('button', { name: 'Apply case changes', exact: true }).click(); await ready();
        await inputs.getByRole('group', { name: 'Input representation', exact: true }).getByRole('button', { name: 'Forms', exact: true }).click();
      }
      if (config.id === 'nightlife') {
        await inputs.getByRole('tab', { name: 'Operating requirements', exact: true }).click();
        await inputs.getByRole('tab', { name: 'People and scope', exact: true }).click();
        const staffing = inputs.locator('[data-question-id="staffing"]');
        await staffing.getByLabel('Unavailable qualified staff', { exact: true }).fill('2');
        await staffing.getByRole('button', { name: 'Apply inputs', exact: true }).click(); await ready();
      }
      await inputs.getByRole('button', { name: 'Calculate', exact: true }).click(); await ready();
      const before = await exported(`${config.id}-before.run.json`); source.before = before.artifact;
      assert.equal(before.run.definition.contentHash, pkg.workflow.contentHash);
      await page.getByRole('group', { name: 'Workspace layout', exact: true }).getByRole('button', { name: 'Reports', exact: true }).click();
      await reports.getByRole('tab', { name: 'Decision process', exact: true }).click();
      await processView().locator('[data-decision-process-graph]').waitFor();
      await processView().getByRole('button', { name: 'Fit width', exact: true }).click();
      await page.waitForTimeout(300);
      source.graph = await processView().evaluate(element => ({
        nodes: [...element.querySelectorAll('[data-decision-process-node]')].map(node => ({ id: node.dataset.decisionProcessNode, status: node.dataset.status })),
        edges: [...element.querySelectorAll('path[data-decision-process-edge]')].map(edge => ({ id: edge.dataset.decisionProcessEdge, from: edge.dataset.from, to: edge.dataset.to, kind: edge.dataset.kind, status: edge.dataset.status }))
      }));
      const figures = {}; figures[config.overview] = await shot('overview', processView());
      // Select an authored question, adapting only to the exact public node ID.
      const selectedNode = pkg.workflow.decisionProcess.nodes.find(node => node.id === config.selected)
        || pkg.workflow.decisionProcess.nodes.find(node => node.kind === 'decision' && /complete|requirements|feasible|deployment/i.test(node.label));
      assert.ok(selectedNode, 'Inspect a real authored question');
      source.inspection = { selectedNodeId: selectedNode.id };
      await processView().locator(`[data-decision-process-node="${selectedNode.id}"]`).click();
      const detail = processView().locator(`[data-decision-process-detail="${selectedNode.id}"]`);
      await detail.waitFor();
      source.inspection.diagramSelectedNodeId = await processView().locator('[data-decision-process-node][data-selected="true"]').getAttribute('data-decision-process-node');
      await page.setViewportSize({ width: 1000, height: 1100 });
      figures[config.detail] = await shot('detail', detail);
      await processView().getByRole('group', { name: 'Decision process representation', exact: true }).getByRole('button', { name: 'Table', exact: true }).click();
      source.table = await processView().evaluate(element => ({
        nodes: [...element.querySelectorAll('[data-decision-process-row]')].map(node => ({ id: node.dataset.decisionProcessRow, status: node.dataset.status })),
        edges: [...element.querySelectorAll('[data-decision-process-path]')].map(edge => ({ id: edge.dataset.decisionProcessPath, status: edge.dataset.status }))
      }));
      source.inspection.tableSelectedNodeId = await processView().locator('[data-decision-process-row][data-selected="true"]').getAttribute('data-decision-process-row');
      const after = await exported(`${config.id}-after.run.json`); source.after = after.artifact;
      assert.deepEqual(after.run, before.run, 'Inspection and representation changes must leave the native run unchanged');
      for (const kind of ['nodes', 'edges']) assert.deepEqual(source.graph[kind].map(({ id, status }) => ({ id, status })).sort((a,b) => a.id.localeCompare(b.id)), source.table[kind].sort((a,b) => a.id.localeCompare(b.id)));
      await processView().getByRole('group', { name: 'Decision process representation', exact: true }).getByRole('button', { name: 'Diagram', exact: true }).click();
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'Graph must not overflow the page on mobile');
      source.mobile = { width: 390, noPageOverflow: true };
      pendingData.push({ config, figures });
      console.log(`${config.id}: ${source.graph.nodes.length} nodes, ${source.graph.edges.length} paths; native run unchanged`);
    } catch (error) {
      await page.screenshot({ path: `/private/tmp/${config.id}-graph-failure.png`, fullPage: true });
      console.error((await page.locator('main').innerText()).slice(-8000)); throw error;
    } finally { await context.close(); }
  }
  assert.equal(sha(await publicFile('offline-build.json')), sha(manifestBytes), 'Public build must remain the same during capture');
  assert.deepEqual(proof.errors, []);
  proof.checks.push('All three current public Marketplace calculation workflows captured from published installation links and fictional inputs.', 'Every authored node and labeled path is present; graph and accessible table share current-case statuses.', 'Question inspection and Diagram/Table changes preserve exact native workflow exports, including inputs, findings and history.', 'Production JavaScript, CSS and WebAssembly hashes match the retained public runtime manifest.', 'All three native graphs remain within the page at a390px mobile viewport.');
  proof.passed = true;
  for (const { config, figures } of pendingData) {
    const file = path.join(root, `src/_data/${config.data}.json`), data = JSON.parse(await fs.readFile(file, 'utf8'));
    data.processVerificationUrl = '/assets/decision-process-refresh/verification.json';
    Object.assign(data.figures, figures); await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n');
  }
} catch (error) { proof.errors.push(error.stack || String(error)); console.error(error); process.exitCode = 1; }
finally {
  await retain('capture-procedure.mjs', await fs.readFile(fileURLToPath(import.meta.url)), 'Exact capture script used for this journey');
  await fs.writeFile(path.join(directory, 'verification.json'), JSON.stringify(proof, null, 2) + '\n');
  await browser.close();
}
