// Capture the real authoring workspace from an existing Decision Lab build.
// Usage: node capture-author.mjs /path/to/hermod-review-lab
// Uses the checkout's existing browser-test dependencies; never edits it.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';

const repo = path.resolve(process.argv[2]);
const here = path.dirname(fileURLToPath(import.meta.url));
process.chdir(repo);
const { createStoryBrowser } = await import(pathToFileURL(path.join(repo, 'tests/helpers/decision-story-browser.mjs')));
const story = await createStoryBrowser({ name: 'promotion-author-article', serviceWorkers: 'block', viewport: { width: 1512, height: 1100 } });
const { page } = story;
try {
  const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await navigation.getByRole('button', { name: 'Workspaces', exact: true }).click();
  await page.getByRole('button', { name: 'Create workflow', exact: true }).click();
  await page.getByLabel('Import workflow definition, package or draft', { exact: true })
    .setInputFiles(path.join(here, 'retained/author/reviewed.workflow-draft.json'));
  await page.getByLabel('Workflow draft save status', { exact: true }).filter({ hasText: /Saved/ }).waitFor();
  await page.getByRole('tab', { name: 'Preview & publish', exact: true }).click();
  await page.getByRole('button', { name: 'Export workflow package', exact: true }).waitFor();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export workflow package', exact: true }).click();
  const exported = JSON.parse(await fs.readFile(await (await download).path(), 'utf8'));
  const expected = JSON.parse(await fs.readFile(path.join(here, 'retained/author/promotion.workflow.json'), 'utf8'));
  assert.deepEqual(exported, expected);
  assert.deepEqual(story.errors, []);
  const validation = page.locator('.wa-card').filter({ has: page.getByRole('heading', { name: 'Validate and preview', exact: true }) });
  const publication = page.locator('.wa-card').filter({ has: page.getByRole('heading', { name: 'Publish an immutable release', exact: true }) });
  await validation.scrollIntoViewIfNeeded();
  const first = await validation.boundingBox(), last = await publication.boundingBox();
  const clip = { x: Math.floor(first.x), y: Math.floor(first.y), width: Math.ceil(first.width), height: Math.ceil(last.y + last.height - first.y) };
  await page.screenshot({ path: path.join(here, 'promotion-author-reviewed.png'), clip });
  const receipt = { format: 'decision-lab-promotion-author-capture/1', status: 'passed', capturedAt: new Date().toISOString(), packageHash: exported.contentHash, screenshot: 'promotion-author-reviewed.png', uiRegion: 'Validate and preview; Publish an immutable release', checks: ['Imported retained reviewed authoring draft through the visible UI.', 'Exported the exact retained runnable workflow package through Preview & publish.', 'No browser page errors.'] };
  await fs.writeFile(path.join(here, 'retained/author-browser-qualification.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt, null, 2));
} finally {
  await story.close();
}
