import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../research/index.html', import.meta.url), 'utf8');
const save = fs.readFileSync(new URL('../api/research-save-progress.js', import.meta.url), 'utf8');
const submit = fs.readFileSync(new URL('../api/research-submit.js', import.meta.url), 'utf8');

assert.doesNotMatch(html, /domainKey === 'd3' \|\| domainKey === 'd5'/, 'context must not be limited to selected domains');
assert.match(html, /orderedStatements\.forEach[\s\S]*var contextWrap = document\.createElement\('div'\)/, 'every rendered statement must receive a context control');
assert.match(html, /field \+ '_context'/, 'context must be stored against the exact statement field');
assert.match(html, /contextToggle\.textContent = existingContext \? 'Edit context' : 'Add context'/, 'answered statements must offer an explicit context control');
assert.match(html, /statement-context textarea::placeholder[^{]*\{[^}]*font-style: italic/s, 'the context prompt must read visually as a prompt');
assert.match(html, /statement-context-continue[\s\S]*background: #b84215/, 'continue must be a visually prominent orange action');
assert.match(html, /class="statement-navigation"[\s\S]*id="back-btn"[\s\S]*id="question-continue"/, 'Back and Continue must share a stable navigation row in the main question content');
assert.doesNotMatch(html, /<div class="footer-bar"[^>]*>[\s\S]*?id="back-btn"/, 'Back must not sit inside the progress footer');
assert.match(html, /contextWrap\.hidden = false;[\s\S]*getElementById\('question-continue'\)\.hidden = false/, 'answering must reveal Continue without moving Back to another container');
assert.doesNotMatch(html, /contextWrap\.hidden = false;[\s\S]{0,180}querySelector\('textarea'\)\.focus/, 'answering must not focus the textarea or open a mobile keyboard');
assert.match(html, /contextToggle\.addEventListener\('click'[\s\S]*contextInput\.focus\(\{ preventScroll: true \}\)/, 'textarea focus must follow an explicit Add context action');
assert.match(html, /var INSTRUMENT_VERSION = 'phase3-v5-2026-09-25-examples'/, 'concrete examples must have a distinct instrument version');
assert.match(html, /HELP_CLOSED_LABEL = 'See an example'/, 'the disclosure must describe its concrete content');
assert.match(html, /V4_HELP = \[/, 'unfinished v4 responses must retain their original explanations');
assert.equal((html.match(/"help":/g) || []).length, 24, 'all 24 current statements must have contextual examples');
// Context/navigation placement and visibility are verified by the paired browser journey test.
assert.doesNotMatch(html, /id="guidance-btn"|id="survey-guidance"|There are no right answers/, 'redundant guidance must be removed');
assert.match(html, /p\.appendChild\(helpToggle\);\s*row\.appendChild\(p\);[\s\S]*row\.appendChild\(help\);[\s\S]*row\.appendChild\(scaleGrid\);/, 'explanation link and text must sit between the question and scale');
assert.match(html, /prefers-reduced-motion: reduce/, 'context continuation must respect reduced motion');
for (const source of [save, submit]) {
  assert.match(source, /contextKey.*1000/s, 'API must validate optional context length');
  assert.match(source, /phase3-v3-2026-09-08/, 'context POC must use its own instrument version');
}

console.log('Research answer context checks passed.');
