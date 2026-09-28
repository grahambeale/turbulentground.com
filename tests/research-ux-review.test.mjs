import fs from 'node:fs';

const journey = fs.readFileSync(new URL('../research/index.html', import.meta.url), 'utf8');
const review = fs.readFileSync(new URL('../research/ux-review.html', import.meta.url), 'utf8');
const stages = ['entry','profile','questions','final-question','submit','completion'];

function check(label, condition) {
  if (!condition) throw new Error(`FAIL  ${label}`);
  console.log(`  PASS  ${label}`);
}

console.log('research-ux-review.test.mjs');
check('offers every review stage', stages.every((stage) => review.includes(`id:'${stage}'`)));
check('uses the protected review route', /preview=ux-review&amp;stage=/.test(review) || /preview=ux-review&stage=/.test(review));
check('uses reliable captures rather than blocked frames', !review.includes('<iframe') && review.includes("function imageSrc(id)"));
check('includes a capture for every stage', stages.every((stage) => fs.existsSync(new URL(`../research/ux-review-assets/${stage}.png`, import.meta.url))));
check('offers each real screen in a separate tab', review.includes('id="interactive-link"') && review.includes('target="_blank"'));
check('stores notes locally rather than posting them', review.includes("localStorage.setItem('tg-ux-review-notes'") && !review.includes("fetch("));
check('suppresses analytics in UX review mode', /completionPreview \|\| uxReviewPreview \|\| researchEventsSent/.test(journey));
check('suppresses checkpoint and page-hide saves', /function scheduleCheckpointSave\(\) \{\s*if \(uxReviewPreview\) return;/.test(journey) && /function saveProgressOnHide\(\) \{\s*if \(uxReviewPreview\) return;/.test(journey));
check('prevents public entry creation in review mode', /if \(publicStartPreview \|\| uxReviewPreview\)/.test(journey));
check('prevents completion email and preference writes', (journey.match(/if \(uxReviewPreview\) \{/g) || []).length >= 4);

console.log('\nALL CHECKS PASSED');
