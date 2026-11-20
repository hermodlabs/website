// Capture the same native operating finding for two retained fictional cases.
// Usage: node capture-business.mjs /path/to/hermod-review-lab
// Uses only visible import and assessment controls against the existing build.
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(process.argv[2]);
const here = path.dirname(fileURLToPath(import.meta.url));
const read = async filename => JSON.parse(await fs.readFile(path.join(here, filename), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
process.chdir(repo);
const { createStoryBrowser } = await import(pathToFileURL(path.join(repo, 'tests/helpers/decision-story-browser.mjs')));
const { openCollectionsOverview } = await import(pathToFileURL(path.join(repo, 'tests/helpers/marketplace-navigation.mjs')));
const pkg = await read('retained/author/promotion.workflow.json');
const captures = [];
for (const scenario of [
  { source: 'retained/decision/run.json', file: 'promotion-five-staff-options.png', unavailable: 2, options: 2 },
  { source: 'retained/changed-staffing/run.json', file: 'promotion-four-staff-options.png', unavailable: 3, options: 1 },
]) {
  const story = await createStoryBrowser({ name: 'promotion-business-comparison', serviceWorkers: 'block', viewport: { width: 720, height: 1100 } });
  const { page } = story;
  try {
    await openCollectionsOverview(page);
    await page.getByLabel('Import app, workflow or case file', { exact: true }).setInputFiles(path.join(here, 'retained/author/promotion.workflow.json'));
    await page.waitForFunction(label => document.querySelector('.pah-error')?.textContent
      || [...document.querySelectorAll('nav button')].some(button => button.textContent.trim() === label), pkg.catalog.domain.label);
    assert.equal(await page.locator('.pah-error').count(), 0);
    const run = await read(scenario.source);
    assert.equal(run.case.promotion.staffing.unavailableStaff, scenario.unavailable);
    await openCollectionsOverview(page);
    await page.getByLabel('Import app, workflow or case file', { exact: true }).setInputFiles(path.join(here, scenario.source));
    await page.getByRole('tablist', { name: 'Review stages', exact: true }).waitFor();
    await page.getByRole('tablist', { name: 'Review stages', exact: true }).getByRole('tab', { name: 'Operating findings', exact: true }).click();
    await page.getByRole('button', { name: 'Inspect result', exact: true }).click();
    const finding = page.locator('[data-decision-view][data-decision-mode="decision"] .dv-finding');
    await finding.getByRole('heading', { name: 'Eligible options are available for your decision', exact: true }).waitFor();
    const text = await finding.innerText();
    assert.match(text, new RegExp(`${scenario.options} fully checked option`));
    assert.match(text, /does not rank the eligible options/);
    await page.getByLabel('Local save status', { exact: true }).filter({ hasText: 'Saved locally' }).waitFor();
    const box = await finding.boundingBox();
    await finding.screenshot({ path: path.join(here, scenario.file) });
    const bytes = await fs.readFile(path.join(here, scenario.file));
    captures.push({ ...scenario, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), cssBounds: { width: box.width, height: box.height }, bytes: bytes.length, sha256: sha256(bytes), nativeText: text, inputSHA256: sha256(await fs.readFile(path.join(here, scenario.source))) });
    assert.deepEqual(story.errors, []);
  } catch (error) { console.error(scenario.file, (await page.locator('main').innerText()).slice(-10000)); throw error; } finally { await story.close(); }
}
const receipt = {
  format: 'decision-lab-promotion-business-capture/1', status: 'passed', capturedAt: new Date().toISOString(),
  viewport: { width: 720, height: 1100 }, workflowPackageHash: pkg.contentHash,
  procedure: 'capture-business.mjs', uiRegion: 'Focused operating assessment; native Decision finding card only.',
  checks: ['Imported the retained runnable workflow through Collections into a fresh browser context for each case.', 'Imported each retained case through Collections and opened its current operating assessment through Inspect result.', 'Verified two available options with two callouts and one available option with three callouts.', 'No DOM, text, styles or application state injected; images are unaltered native element screenshots.', 'No browser page errors.'], captures,
};
await fs.writeFile(path.join(here, 'retained/business-browser-qualification.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
