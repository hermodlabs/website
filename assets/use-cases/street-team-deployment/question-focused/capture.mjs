// Capture the authored question view using ordinary UI import and inspection.
// node capture.mjs /absolute/path/to/hermod-review-lab
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
const repo = path.resolve(process.argv[2]);
const here = path.dirname(fileURLToPath(import.meta.url));
const read = async file => JSON.parse(await fs.readFile(path.join(here,file), 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const pkg = await read('retained/author/promotion.workflow.json');
const snapshots = await read('snapshot-files.json');
process.chdir(repo);
const { createStoryBrowser } = await import(pathToFileURL(path.join(repo,'tests/helpers/decision-story-browser.mjs')));
const { openCollectionsOverview } = await import(pathToFileURL(path.join(repo,'tests/helpers/marketplace-navigation.mjs')));
const captures = [];
const checks = [];
async function capture(locator, file, scenario, region) {
  const nativeText = await locator.innerText();
  await locator.screenshot({path:path.join(here,file)});
  const bytes = await fs.readFile(path.join(here,file));
  captures.push({file,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length,sha256:sha256(bytes),origin:'new-local-production-ui-capture',procedure:'capture.mjs',qualification:'browser-qualification.json',retainedCase:scenario,uiRegion:region,viewport:locator.page().viewportSize(),nativeText});
}
for (const scenario of [
  {file:'retained/decision/run.json', options:2,prefix:'promotion-five-staff'},
  {file:'retained/changed-staffing/run.json', options:1,prefix:'promotion-four-staff'},
]) {
  const story = await createStoryBrowser({name:'promotion-question-views', serviceWorkers:'block',viewport:{width:1512,height:1100}});
  const {page} = story;
  const brief = () => page.locator('[data-guided-decision-brief]:visible');
  const focusView = () => brief().locator('[data-brief-lead="guest-thresholds"] [data-question-view="expense-recovery"]');
  const ready = () => page.locator('.gr-busy').waitFor({state:'hidden'});
  const saved = () => page.getByLabel('Local save status',{exact:true}).filter({hasText:'Saved locally'}).waitFor();
  const stage = async kind => {
    await page.getByRole('tablist',{name:'Review stages',exact:true}).getByRole('tab',{name:pkg.workflow.metadata.presentation.groups.find(row=>row.kind===kind).label,exact:true}).click();
    await saved();
  };
  const expand = async locator => {if(await locator.getAttribute('open')===null)await locator.locator(':scope > summary').click();};
  const exported = async () => {
    await expand(page.locator('.gr-review-tools'));
    const waiting=page.waitForEvent('download');
    await page.getByRole('button',{name:'Export workflow run',exact:true}).click();
    const run=JSON.parse(await fs.readFile(await(await waiting).path(),'utf8'));await ready();return run;
  };
  try {
    await openCollectionsOverview(page);
    const pkgChooser = page.waitForEvent('filechooser');
    await page.getByRole('button',{name:'Import app, workflow or case',exact:true}).click();
    await (await pkgChooser).setFiles(path.join(here,'retained/author/promotion.workflow.json'));
    console.log('Package chosen', scenario.file);
    await page.waitForFunction(label=>document.querySelector('.pah-error')?.textContent||[...document.querySelectorAll('nav button')].some(button=>button.textContent.trim()===label),pkg.catalog.domain.label);
    assert.equal(await page.locator('.pah-error').count(),0);
    await openCollectionsOverview(page);
    const runChooser = page.waitForEvent('filechooser');
    await page.getByRole('button',{name:'Import app, workflow or case',exact:true}).click();
    await (await runChooser).setFiles(path.join(here,scenario.file));
    console.log('Case chosen',scenario.file);
    await page.getByRole('tablist',{name:'Review stages',exact:true}).waitFor();
    await stage('brief');
    console.log('Brief opened',scenario.file);
    const original=await read(scenario.file);
    assert.deepEqual(await exported(), original);
    await focusView().getByLabel('Item to inspect',{exact:true}).selectOption('string:small-standard');
    assert.deepEqual(await focusView().locator('.drv-question-summary dd').allTextContents(),['$200.00','$40.00','5','6']);
    assert.match(await focusView().locator('.drv-question-focus').innerText(),new RegExp(`Meets operating requirements\\s+${scenario.options===2?'Yes':'No'}`));
    await capture(focusView().locator('.drv-question-focus'),`${scenario.prefix}-financial-answer.png`,scenario.file,'Focused authored expense recovery answer, unchanged $200/$40/5/6 thresholds and current operating eligibility.');
    if(scenario.options===2){
      await expand(focusView().locator('.drv-question-comparison'));
      assert.equal(await focusView().getByRole('table').getByRole('columnheader').count(),4);
      await capture(focusView().locator('.drv-question-comparison'), 'promotion-financial-comparison.png',scenario.file,'Focused financial answer with expanded authored four-column comparison; assumptions remain collapsed.');
      await focusView().getByLabel('Item to inspect',{exact:true}).selectOption('string:large-discount');
      await stage('evaluations');
      await expand(page.locator('.gr-overview-disclosure'));
      await page.locator('.gr-configured-reports').getByRole('tab',{name:'Expense recovery',exact:true}).click();
      const reportView=page.locator('[data-guided-report-tab] [data-question-view="expense-recovery"]:visible');
      assert.equal(await reportView.getByLabel('Item to inspect',{exact:true}).inputValue(),'string:large-discount');
      assert.deepEqual(await reportView.locator('.drv-question-summary dd').allTextContents(),['$400.00','$25.00','16','17']);
      await stage('brief');
      assert.equal(await focusView().getByLabel('Item to inspect',{exact:true}).inputValue(),'string:large-discount');
      await saved();await page.reload();await ready();
      await page.getByRole('tablist',{name:'Review stages',exact:true}).waitFor();
      assert.equal(await focusView().getByLabel('Item to inspect',{exact:true}).inputValue(),'string:large-discount');
      const inspectionOnlyRun = await exported();
      assert.deepEqual(inspectionOnlyRun, original);
      await fs.writeFile(path.join(here,'retained/decision/inspection-only-export.run.json'), JSON.stringify(inspectionOnlyRun, null, 2)+'\n');
      checks.push('The inspected deployment stays synchronized between brief and report across reload, while the complete exported run, including choice and authorization, remains byte-equivalent as JSON.');
      await focusView().getByLabel('Item to inspect',{exact:true}).selectOption('string:small-standard');
      await capture(brief().locator('[data-brief-lead="decision"]'),'promotion-current-choice.png',scenario.file,'Authored decision fields: current choice, matching authorization, $200 expense and four qualified people inside.');
    }
    await page.setViewportSize({width:720,height:1100});
    await stage('evaluations');
    await page.getByRole('button',{name:'Inspect result',exact:true}).click();
    const finding=page.locator('[data-decision-view][data-decision-mode="decision"] .dv-finding');
    await finding.getByRole('heading',{name:'Eligible options are available for your decision',exact:true}).waitFor();
    assert.match(await finding.innerText(),new RegExp(`${scenario.options} fully checked option`));
    assert.match(await finding.innerText(),/does not rank the eligible options/);
    await capture(finding,`${scenario.prefix}-options.png`,scenario.file,'Native operating finding; current eligible option count without automatic ranking.');
    checks.push(`${scenario.file}: imported current qualified workflow and case; verified ${scenario.options} fully checked operating option(s), $200/$40/5/6 financial answer and current eligibility.`);
    assert.deepEqual(story.errors,[]);
  }catch(error){console.error('BODY', (await page.locator('body').innerText()).slice(-14000));console.error('ERRORS', story.errors);throw error;}finally{await story.close();}
}
const pkgHash=sha256(await fs.readFile(path.join(here,'retained/author/promotion.workflow.json')));
for(const capture of captures)capture.inputSHA256=sha256(await fs.readFile(path.join(here,capture.retainedCase)));
const receipt={format:'promotion-question-view-browser-capture/1',status:'passed',capturedAt:new Date().toISOString(),workflowPackageHash:pkg.contentHash,workflowDefinitionHash:pkg.workflow.contentHash,packageFileSHA256:pkgHash,procedure:'capture.mjs',viewport:{width:1512,height:1100},checks:[...checks,'No DOM, text, style or application-state injection; unaltered native element screenshots.','No browser page errors.'],captures};
await fs.writeFile(path.join(here,'browser-qualification.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,captures:captures.map(({file,width,height})=>({file,width,height})),checks},null,2));
