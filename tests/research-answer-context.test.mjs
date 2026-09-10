import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../research/index.html', import.meta.url), 'utf8');
const save = fs.readFileSync(new URL('../api/research-save-progress.js', import.meta.url), 'utf8');
const submit = fs.readFileSync(new URL('../api/research-submit.js', import.meta.url), 'utf8');

assert.doesNotMatch(html, /domainKey === 'd3' \|\| domainKey === 'd5'/, 'context must not be limited to selected domains');
assert.match(html, /orderedStatements\.forEach[\s\S]*var contextWrap = document\.createElement\('div'\)/, 'every rendered statement must receive a context control');
assert.match(html, /field \+ '_context'/, 'context must be stored against the exact statement field');
assert.match(html, /Add context to your answer \(optional\)/, 'context must be clearly optional');
assert.match(html, /statement-context textarea::placeholder[^{]*\{[^}]*font-style: italic/s, 'the context prompt must read visually as a prompt');
assert.match(html, /statement-context-continue[\s\S]*background: #b84215/, 'continue must be a visually prominent orange action');
assert.match(html, /class="statement-navigation"[\s\S]*id="back-btn"[\s\S]*id="question-continue"/, 'Back and Continue must share a stable navigation row in the main question content');
assert.doesNotMatch(html, /<div class="footer-bar"[^>]*>[\s\S]*?id="back-btn"/, 'Back must not sit inside the progress footer');
assert.match(html, /contextWrap\.hidden = false;[\s\S]*getElementById\('question-continue'\)\.hidden = false/, 'answering must reveal Continue without moving Back to another container');
assert.match(html, /contextBottom > visibleBottom[\s\S]*window\.scrollBy/, 'revealed context and its stable navigation row must be brought above the fixed footer');
assert.doesNotMatch(html, /id="guidance-btn"|id="survey-guidance"|There are no right answers/, 'redundant guidance must be removed');
assert.match(html, /p\.appendChild\(helpToggle\);\s*row\.appendChild\(p\);[\s\S]*row\.appendChild\(help\);[\s\S]*row\.appendChild\(scaleGrid\);/, 'explanation link and text must sit between the question and scale');
assert.match(html, /prefers-reduced-motion: reduce/, 'context continuation must respect reduced motion');
for (const source of [save, submit]) {
  assert.match(source, /contextKey.*1000/s, 'API must validate optional context length');
  assert.match(source, /phase3-v3-2026-09-08/, 'context POC must use its own instrument version');
}

console.log('Research answer context checks passed.');
