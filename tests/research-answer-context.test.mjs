import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../research/index.html', import.meta.url), 'utf8');
const save = fs.readFileSync(new URL('../api/research-save-progress.js', import.meta.url), 'utf8');
const submit = fs.readFileSync(new URL('../api/research-submit.js', import.meta.url), 'utf8');

assert.match(html, /domainKey === 'd3' \|\| domainKey === 'd5'/, 'POC must remain limited to two representative pairs');
assert.match(html, /field \+ '_context'/, 'context must be stored against the exact statement field');
assert.match(html, /Add context to your answer \(optional\)/, 'context must be clearly optional');
assert.match(html, /prefers-reduced-motion: reduce/, 'context continuation must respect reduced motion');
for (const source of [save, submit]) {
  assert.match(source, /contextKey.*1000/s, 'API must validate optional context length');
  assert.match(source, /phase3-v3-2026-09-08/, 'context POC must use its own instrument version');
}

console.log('Research answer context checks passed.');
