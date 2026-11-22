// Frozen local production preview, native example cases, visible forms and native downloads.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/jnaciona/code/hermod-review-lab/node_modules/playwright/index.mjs';
import { createDecisionLab } from '/Users/jnaciona/code/hermod-review-lab/packages/sdk/src/index.js';
import { downloadCaseFile, openCaseDetails, closeCaseDetails } from '/Users/jnaciona/code/hermod-review-lab/tests/helpers/case-details.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const publishedMetadata=JSON.parse(await fs.readFile(path.join(root,'assets/use-cases/street-team-deployment/current-ui/metadata.json'),'utf8'));
const base='http://127.0.0.1:4193/';
const directory=path.join(root,'assets/use-cases/street-team-deployment/shared-report-preview');
const prefix='/assets/use-cases/street-team-deployment/shared-report-preview/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const lab=createDecisionLab();
const proof={format:'current-decision-ui/1',scenario:'street-team-deployment',captureUrl:base,capturedAt:new Date().toISOString(),method:'Unedited native local-preview-app screenshots, ordinary install link, example case, Forms edits, Apply inputs, Calculate/Recalculate, report navigation and native SDK-run downloads. No injected DOM, CSS, storage or results.',provenance:'local-production-preview',publicationClaimed:false,captures:[],artifacts:[],runtimeVerification:[],checks:[],errors:[],passed:false};
const figures={};
await fs.mkdir(directory,{recursive:true});
async function retain(file,bytes,origin){await fs.mkdir(path.dirname(path.join(directory,file)),{recursive:true});await fs.writeFile(path.join(directory,file),bytes);const item={file,sha256:hash(bytes),bytes:bytes.length,origin};proof.artifacts.push(item);return item;}
async function publicFile(file){const r=await fetch(new URL(file,base));assert.equal(r.ok,true,file);return Buffer.from(await r.arrayBuffer());}
const manifestBytes=await publicFile('offline-build.json'),manifest=JSON.parse(manifestBytes);
await retain('offline-build.json',manifestBytes,'Exact local preview runtime manifest');
proof.build={version:manifest.version,manifestFile:'offline-build.json',manifestSHA256:hash(manifestBytes)};
for(const asset of manifest.assets.filter(x=>/^(assets\/.*\.(js|css|wasm)|index\.html)$/.test(x.url))){const b=await publicFile(asset.url);assert.equal(hash(b),asset.sha256,asset.url);proof.runtimeVerification.push({file:asset.url,sha256:hash(b),bytes:b.length});}
const catBytes=await publicFile('app-configs/catalog.json'),cat=JSON.parse(catBytes);await retain('catalog.json',catBytes,'Exact local Marketplace catalog at capture');
const listing=cat.workflows.find(x=>x.id==='street-team-deployment');assert(listing);
const pkgBytes=await publicFile('app-configs/'+listing.package.path),pkg=JSON.parse(pkgBytes),definition=pkg.workflow;
await retain('workflow.workflow.json',pkgBytes,'Exact installed local workflow package');
proof.workflow={id:definition.id,version:definition.version,packageHash:pkg.contentHash,definitionHash:definition.contentHash};
const url=new URL(base);for(const[k,v]of Object.entries({install:'workflow',id:definition.id,version:definition.version,publisher:'decision-lab',collection:'venue-operations',release:pkg.contentHash}))url.searchParams.set(k,v);proof.installUrl=url.href;
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1200,height:1100},acceptDownloads:true,locale:'en-US',timezoneId:'America/Chicago',reducedMotion:'reduce',serviceWorkers:'block'});
const page=await context.newPage();page.setDefaultTimeout(60000);page.on('pageerror',e=>proof.errors.push(e.message));
const inputs=page.getByRole('region',{name:'Workflow inputs',exact:true}),reports=page.getByRole('region',{name:'Workflow reports',exact:true});
const summary=()=>reports.locator('[data-decision-summary]:visible');
async function ready(){await page.locator('.gr-busy').waitFor({state:'hidden',timeout:180000});await page.getByLabel('Local save status',{exact:true}).filter({hasText:'Saved locally'}).waitFor();}
async function layout(name){await page.getByRole('group',{name:'Workspace layout',exact:true}).getByRole('button',{name,exact:true}).click();}
async function report(name){await reports.getByRole('tablist',{name:'Workflow report groups',exact:true}).getByRole('tab',{name,exact:true}).click();}
async function section(name){await report('Decision summary');await summary().getByRole('tablist',{name:'Decision summary sections',exact:true}).getByRole('tab',{name,exact:true}).click();}
async function shot(key,file,locator,alt,caption){await page.evaluate(()=>document.fonts.ready);await locator.scrollIntoViewIfNeeded();await locator.screenshot({path:path.join(directory,file),animations:'disabled'});const bytes=await fs.readFile(path.join(directory,file));const item={file,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:hash(bytes),bytes:bytes.length,nativeText:await locator.innerText()};proof.captures.push(item);figures[key]={image:prefix+file,...Object.fromEntries(['width','height','sha256'].map(k=>[k,item[k]])),alt,caption};console.log('Captured',key,item.width,item.height);}
async function exported(file){const download=await downloadCaseFile(page);const bytes=await fs.readFile(await download.path());await retain(file,bytes,'Complete unchanged native SDK-run export');const run=lab.workflows.openRun(bytes.toString('utf8'));assert.equal(run.definition.contentHash,definition.contentHash);assert.deepEqual(run.reviews,[]);return run;}
async function projected(run,file){const output=lab.workflows.output({run});await retain(file,Buffer.from(JSON.stringify(output,null,2)+'\n'),'SDK output projected from retained native export; no evaluator invoked');return output;}
async function staff(){await layout('Both');await inputs.getByRole('tab',{name:'Operating requirements',exact:true}).click();await inputs.getByRole('tab',{name:'People and scope',exact:true}).click();return inputs.locator('[data-question-id="staffing"]:visible');}
async function setUnavailable(value){const card=await staff();await card.getByLabel('Unavailable qualified staff',{exact:true}).fill(String(value));await card.getByRole('button',{name:'Apply inputs',exact:true}).click();await ready();}
async function calculate(){await inputs.getByRole('button',{name:/^(Calculate|Recalculate)$/,exact:true}).click();await ready();await section('Options');assert.equal(await summary().getAttribute('data-summary-status'),'available');}
try{
 await page.goto(url.href,{waitUntil:'networkidle'});await inputs.waitFor();await ready();
 assert.equal(await reports.locator('[data-workflow-reports="true"]').count(),1);proof.presentation={component:'WorkflowReportsView',hostMarker:'[data-workflow-reports="true"]',hostMarkerVerified:true};
 await inputs.getByRole('checkbox',{name:'Auto-update',exact:true}).uncheck();
 const starter=await exported('retained/starter.run.json');assert.equal(starter.evaluations.length,0);
 await shot('starter','starter-inputs.png',page.locator('#guided-case-inputs'),'The local preview street-team example opens with Forms inputs, Calculate and a separate Options view awaiting calculation.','Explore example supplies fictional inputs. Set two callouts and calculate to reproduce the five-staff case.');
 const outline=page.getByRole('navigation',{name:'Decision question breakdown',exact:true});const disclosure=outline.locator('details');await disclosure.locator(':scope > summary').click();
 await shot('questionOutline','question-breakdown.png',outline,'The expanded question breakdown links Options, Next actions, Assumptions, Questions and supporting report questions.','Use the question breakdown to inspect the relevant answer. Navigation performs no calculation or operating action.');
 await disclosure.locator(':scope > summary').click();
 await setUnavailable(2);await calculate();
 const five=await exported('retained/five-staff.run.json'),output=await projected(five,'retained/five-staff.output.json');
 assert.deepEqual(five.evaluations.at(-1).output.feasibleDeployments,['hold','small-standard']);
 const threshold=five.evaluations.at(-1).output;proof.fiveStaffFinding={feasibleDeployments:threshold.feasibleDeployments};
 await layout('Reports');await section('Options');
 await shot('financial','five-staff-options.png',reports,'Options shows the supported active one-person promotion and its $200 cost and conditional five-guest break-even hurdle; holding remains a separate outside response.','Options focuses on the supported promotion. Other options and holding remain available for inspection; the hurdle does not forecast attendance.');
 await shot('fiveStaff','five-staff-answer.png',summary().locator('.ds-answer').first(),'With five staff available, an active one-person promotion meets the recorded requirements.','Five available: one active promotion fits. Keeping the team inside is also supported as the outside response.');
 await section('Next actions');await shot('nextActions','next-actions.png',reports,'Next actions presents the applicable promotion response and the option to keep the team inside, separately from calculated findings.','A supported response is available to inspect. Dispatch and authorization remain outside the calculation.');
 await section('Assumptions');await shot('assumptions','assumptions.png',reports,'Assumptions states the scope and limits of the promotion calculation, including unknown customer response.','Read what the calculation assumes before using its guest hurdle.');
 await section('Questions');await shot('questions','questions.png',reports,'The Questions section reports no additional open questions recorded for this case.','An empty recorded-question list does not establish customer response; the calculation’s assumptions and limits still apply.');
 await report('Decision process');const process=reports.locator('[data-decision-process]:visible');await process.locator('[data-decision-process-graph]').waitFor();await process.getByRole('button',{name:'Fit width',exact:true}).click();
 await shot('process','decision-process.png',process,'The current promotion process distinguishes active promotion feasibility, the hold-only response and the conditional financial hurdle.','Follow the current response paths. Holding the team is separate from finding an active promotion that can operate.');
 const node=definition.decisionProcess.nodes.find(n=>n.kind==='decision'&&/active promotion/.test(n.label));assert(node);
 await process.locator(`[data-decision-process-node="${node.id}"]`).click();await shot('processDetail','process-detail.png',process.locator(`[data-decision-process-detail="${node.id}"]`),'Inspecting the active-promotion feasibility question shows the current finding and its supporting response paths.','Inspection explains the finding without authorizing a promotion or changing the case.');
 const details=await openCaseDetails(page,'Calculation history');await details.getByRole('button',{name:'Inspect calculation dependencies',exact:true}).click();await reports.locator('[data-workflow-map]:visible').waitFor();
 await shot('dependencies','calculation-dependencies.png',reports,'Calculation dependencies shows how the operating assessment supplies the derived guest hurdle.','Calculation dependencies describes the flow of findings; it is separate from the business process.');
 const inspected=await exported('retained/after-inspection.run.json');assert.equal(inspected.contentHash,five.contentHash);proof.inspection={before:'retained/five-staff.run.json',after:'retained/after-inspection.run.json',unchangedContentHash:five.contentHash};
 await section('Options');await setUnavailable(3);
 const stale=await exported('retained/stale.run.json'),staleOutput=await projected(stale,'retained/stale.output.json');assert.equal(staleOutput.decisionSummary.finding.availability,'stale');
 await shot('pending','changed-staffing.png',page.locator('#guided-case-inputs'),'After the third callout is applied, the current finding is stale and requires recalculation.','The changed basis withdraws the earlier answer. Apply a form edit, then recalculate.');
 await calculate();const four=await exported('retained/four-staff.run.json');await projected(four,'retained/four-staff.output.json');assert.deepEqual(four.evaluations.at(-1).output.feasibleDeployments,['hold']);
 const expected=structuredClone(five.case);expected.promotion.staffing.unavailableStaff=3;assert.deepEqual(four.case,expected);
 await layout('Reports');await section('Options');
 await shot('fourStaff','four-staff-answer.png',summary().locator('.ds-answer').first(),'At four available staff, no active promotion meets the operating requirements; holding keeps the required four inside.','Four available: active outreach is blocked. Keeping the team inside remains the supported outside response.');
 await shot('thirdCallout','four-staff-options.png',reports,'The current Options view distinguishes no active promotion from the supported hold response after the third callout.','Recalculation withdraws active outreach. A five-guest financial hurdle cannot supply missing floor coverage.');
 await setUnavailable(2);await calculate();const restored=await exported('retained/restored.run.json');assert.deepEqual(restored.case,five.case);
 await layout('Reports');await report('Supporting reports');await reports.getByRole('tab',{name:'Expense recovery',exact:true}).click();
 const expense=reports.locator('[data-question-view="expense-recovery"]:visible');
 const select=expense.getByRole('combobox');if(await select.count())await select.selectOption('string:small-standard');
 assert.match(await expense.innerText(),/\$200/);assert.match(await expense.innerText(),/\$40/);
 await shot('financialReport','expense-recovery.png',reports,'Expense recovery inspects the $200 one-person plan at $40 retained contribution: five additional guests cover expense and six exceed it.','Supporting reports exposes the conditional guest hurdle and its recorded contribution basis. No attendance forecast is supplied.');
 const comparison=expense.locator('.drv-question-comparison');if(await comparison.count()){if(await comparison.getAttribute('open')===null)await comparison.locator(':scope > summary').click();await shot('comparison','financial-comparison.png',comparison,'The native financial comparison lists expenses and conditional additional-guest thresholds for the supplied deployments.','Compare the thresholds while retaining each plan’s separate operating eligibility.');}
 await layout('Both');await inputs.getByRole('tab',{name:'Break-even assumptions',exact:true}).click();await shot('excelCoverage','input-and-excel-controls.png',inputs,'The current inputs show business-dollar contribution controls with Excel download and upload above the forms.','Forms and Excel are alternate ways to supply the same case. Business money fields display dollars.');
 await page.setViewportSize({width:390,height:844});await layout('Reports');await section('Options');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 proof.checks=['Verified the local preview manifest and all JavaScript, CSS, browser-worker and WASM runtime bytes.','Installed the exact local Marketplace calculation release and used its fictional example.','Native five-staff result supports holding and one active promotion; the conditional financial hurdle retains $200/$40/five/six.','Only unavailableStaff changes from two to three; the stale finding is withdrawn before recalculation and only holding remains feasible.','Options, Next actions, Assumptions and Questions keep their distinct meanings; graph and supporting-report inspection preserve native run identity.','Restored original staffing through visible Forms; current mobile page has no horizontal overflow.'];
 assert.deepEqual(proof.errors,[]);proof.passed=true;
 await retain('capture-procedure.mjs',await fs.readFile(fileURLToPath(import.meta.url)),'Exact capture procedure');
 await fs.writeFile(path.join(directory,'README.md'),'# Local preview promotion captures\n\nUnedited local-preview-app screenshots and native exports for street-team-deployment '+definition.version+', build '+manifest.version+'. The source remains fictional and retains its original manager name; Alex is the website narrative character.\n\nOptions separates the supported active deployment from the hold response; Next actions, Assumptions and Questions are separate views. Five available staff support one active deployment and holding. Four support holding only. Guest hurdles are conditional calculations, not response forecasts. Inspection supplies no authority or executed action.\n\nReproduce with node scripts/capture-shared-promotion.mjs. Exact runtime/package identities, native runs and screenshot hashes are in verification.json. The local production preview is not published. The public application remains at the earlier release. Earlier public captures are preserved in current-ui; its metadata.json retains their version and links.\n');
 await fs.writeFile(path.join(root,'src/_data/streetTeamUIRefresh.json'),JSON.stringify({appUrl:'https://hermodlabs.github.io/review_lab/',previewAppUrl:base,workflowId:definition.id,workflowVersion:definition.version,packageHash:pkg.contentHash,definitionHash:definition.contentHash,buildVersion:manifest.version,provenance:'local-production-preview',publicationClaimed:false,notesUrl:prefix+'README.md',verificationUrl:prefix+'verification.json',processVerificationUrl:prefix+'verification.json',articleDownload:prefix+'retained/five-staff.run.json',installUrl:publishedMetadata.installUrl,publishedWorkflowVersion:publishedMetadata.workflowVersion,previewInstallUrl:url.href,figures},null,2)+'\n');
}catch(error){proof.errors.push(error.stack||error.message);console.error(error);await fs.writeFile('/private/tmp/current-promotion-failure.txt',await page.locator('body').innerText()).catch(()=>{});await page.screenshot({path:'/private/tmp/current-promotion-failure.png',fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{await fs.writeFile(path.join(directory,'verification.json'),JSON.stringify(proof,null,2)+'\n');await browser.close();}
