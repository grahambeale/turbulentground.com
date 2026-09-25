const {chromium}=require('playwright');const assert=require('node:assert/strict');
const base=process.env.RESEARCH_PREVIEW_BASE||'http://127.0.0.1:8770';
(async()=>{const b=await chromium.launch({headless:true});const p=await b.newPage();
await p.route('**/api/**',r=>r.fulfill({json:{valid:true,savedState:{instrumentVersion:'phase3-v5-2026-09-25-examples',consent:{takingPart:true},pairResponses:{}}}}));
await p.goto(base+'/research/index.html?t=synthetic');await p.locator('#screen-pairs.active').waitFor();
await p.locator('.pair-item:visible').nth(0).locator('.scale-btn').nth(3).scrollIntoViewIfNeeded();
const before=await p.evaluate(()=>scrollY);
const samples=await p.locator('.pair-item:visible').nth(0).locator('.scale-btn').nth(3).evaluate(async e=>{
 const fill=document.getElementById('paired-progress-fill'),bar=document.querySelector('.paired-progress-track');
 const startY=scrollY,startWidth=bar.getBoundingClientRect().width;e.click();
 const values=[];for(const delay of [100,100,220]){await new Promise(r=>setTimeout(r,delay));values.push(new DOMMatrixReadOnly(getComputedStyle(fill).transform).a);}
 return {values,startY,endY:scrollY,startWidth,endWidth:bar.getBoundingClientRect().width};
});
assert.equal(samples.startY,before);assert.equal(samples.startY,samples.endY);assert.equal(samples.startWidth,samples.endWidth);
assert(samples.values[0]>0&&samples.values[0]<1/24);assert(samples.values[1]>samples.values[0]);assert(Math.abs(samples.values[2]-1/24)<.001);
assert.equal(await p.locator('#journey-progress').getAttribute('aria-valuenow'),'1');assert(await p.locator('#question-continue').isDisabled());
await p.locator('.pair-item:visible').nth(1).locator('.scale-btn').nth(2).click();await p.locator('#question-continue').click();assert((await p.locator('#pair-position').innerText()).startsWith('Pair 2 of 12'));await p.locator('#back-btn').click();
assert.equal(await p.locator('#journey-progress').getAttribute('aria-valuenow'),'2');assert.equal(await p.locator('.pair-item:visible').nth(0).locator('.statement-context-toggle').isVisible(),true);assert.equal(await p.locator('#statement-context-0').isVisible(),false);
await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('#paired-progress-fill').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
await p.setViewportSize({width:320,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert((await p.locator('#journey-progress').boundingBox()).y<(await p.locator('#pair-position').boundingBox()).y);await p.addStyleTag({content:'html{font-size:200%!important}'});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await b.close();console.log('PASS: top progress, actual smooth interpolation, no context scroll/layout jump, partial answers, forward/back counts, mobile and reduced motion');
})().catch(e=>{console.error(e);process.exit(1)});
