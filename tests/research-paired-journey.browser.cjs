const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const previewBase=process.env.RESEARCH_PREVIEW_BASE || 'http://127.0.0.1:8770';
// Approved public statement text only; private approval/review history stays local.
const expected=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/research-paired-approved.json'),'utf8'));
assert.equal(expected.length,12);assert.equal(expected[0][0],'Judgement');assert.equal(expected[11][0],'Job security');
(async()=>{const b=await chromium.launch({headless:true});const p=await b.newPage();const errors=[],writes=[];p.on('pageerror',e=>errors.push(e.message));let saved={instrumentVersion:'phase3-v4-2026-09-13-paired',startedAt:'2026-09-13T00:00:00Z',consent:{takingPart:true},context:{},pairResponses:{d1:{contribution:3,contribution_context:'Synthetic judgement note'}}};
await p.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'){await route.abort();return;}if(u.pathname==='/api/research-lookup'){await route.fulfill({json:{valid:true,hasEmail:false,savedState:saved}});return;}if(u.pathname.startsWith('/api/')){writes.push({url:u.pathname,data:route.request().postDataJSON()});await route.fulfill({json:{success:true}});return;}await route.continue();});
await p.goto(previewBase+'/research/index.html?t=synthetic');await p.locator('#screen-pairs.active').waitFor();
const progress=p.locator('#journey-progress');
assert.equal(await progress.evaluate(e=>e.closest('section').id),'screen-pairs');
assert((await progress.boundingBox()).y < (await p.locator('#pair-position').boundingBox()).y);
assert.equal(await p.locator('.paired-progress-track').evaluate(e=>parseFloat(getComputedStyle(e).height)),12);
assert.equal(await p.locator('#footer-bar').isVisible(),false);
assert.equal(await p.locator('#paired-progress-fill').evaluate(e=>getComputedStyle(e).transitionProperty),'transform');
assert(!p.url().includes('synthetic'));assert(await p.locator('#question-continue').isDisabled());assert.equal(await p.locator('#statement-context-0').inputValue(),'Synthetic judgement note');
for(let i=0;i<12;i++){
 const rows=p.locator('#pairs-list .pair-item:visible');assert.equal(await rows.count(),2);assert((await p.locator('#pair-position').innerText()).endsWith(expected[i][0]));
 for(let j=0;j<2;j++){const row=rows.nth(j);const text=await row.locator('p').first().evaluate(e=>e.firstChild.textContent.trim());assert.equal(text,expected[i][j+1]);await row.locator('.statement-help-toggle').click();assert(await row.locator('.statement-help').isVisible());await row.locator('.scale-btn').nth(j===0?3:1).click();await row.locator('textarea').fill('Synthetic pair '+i+' statement '+j);}
 assert(!await p.locator('#question-continue').isDisabled());if(i===0){const bb=await p.locator('#back-btn').boundingBox(),cb=await p.locator('#pairs-list').boundingBox();assert(bb.y>=cb.y+cb.height);await p.screenshot({path:process.env.SCREENSHOT || '/private/tmp/research-paired-desktop.png',fullPage:true});}
 await p.locator('#question-continue').click();
}
assert(await p.locator('#open-comment-fieldset').isVisible());assert.equal(await p.locator('#journey-progress').getAttribute('aria-valuenow'),'24');await p.locator('#back-btn').click();assert((await p.locator('#pair-position').innerText()).endsWith('Job security'));assert.equal(await p.locator('#statement-context-23').inputValue(),'Synthetic pair 11 statement 1');await p.locator('#question-continue').click();await p.locator('#open-comment').fill('Synthetic optional comment');await p.locator('#submit-btn').click();await p.locator('#screen-done.active').waitFor();
const submission=writes.find(x=>x.url==='/api/research-submit');assert.equal(submission.data.instrumentVersion,'phase3-v4-2026-09-13-paired');assert.equal(submission.data.pairResponses.d2.conditions,4);assert.equal(submission.data.pairResponses.d2.contribution,2);assert.equal(submission.data.pairResponses.d1.contribution_context,'Synthetic pair 0 statement 0');assert.equal(submission.data.pairsAnswered,12);assert.equal(submission.data.openComment,'Synthetic optional comment');assert(!writes.some(x=>x.url.includes('results-email')));
saved={...saved,pairResponses:{d1:{contribution:4,contribution_context:'Synthetic restore note'}}};await p.goto(previewBase+'/research/index.html?t=synthetic');await p.locator('#screen-pairs.active').waitFor();assert(await p.locator('#question-continue').isDisabled());assert.equal(await p.locator('#statement-context-0').inputValue(),'Synthetic restore note');
await p.setViewportSize({width:320,height:900});await p.emulateMedia({reducedMotion:'reduce'});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator('.pair-item:visible').nth(1).locator('.scale-btn').nth(2).click();await p.screenshot({path:'/private/tmp/research-paired-mobile.png',fullPage:true});
saved={...saved,instrumentVersion:'phase3-v3-2026-09-08'};await p.goto(previewBase+'/research/index.html?t=synthetic');await p.waitForURL('**/legacy-v3.html*');await p.locator('#screen-pairs.active').waitFor();assert.equal(await p.locator('.pair-item:visible').count(),1);
saved={...saved,instrumentVersion:null};await p.goto(previewBase+'/research/index.html?t=synthetic');await p.locator('#screen-invalid.active').waitFor();
assert.deepEqual(errors,[]);await b.close();console.log('PASS: approved visible wording, pair guards, item mapping, per-item context, full submission, final comment, partial resume, legacy redirect, unknown-version block, mobile/reduced motion; no browser errors or email calls');})().catch(e=>{console.error(e);process.exit(1)});
