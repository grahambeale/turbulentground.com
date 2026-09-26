import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../research/referral-sharing-preview.html', import.meta.url), 'utf8');

assert.match(html, /Synthetic prototype:/);
assert.match(html, /Your personal sharing link/);
assert.match(html, /Share publicly/);
assert.match(html, /Invite someone privately/);
assert.match(html, /These details stay in this browser/);
assert.match(html, /does not receive or save them/);
assert.match(html, /prefers-reduced-motion/);
assert.match(html, /@media\(max-width:620px\)/);

for (const forbidden of [
  /localStorage/,
  /sessionStorage/,
  /indexedDB/,
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /sendBeacon/,
  /plausible\s*\(/,
  /api\/research-/
]) {
  assert.doesNotMatch(html, forbidden, `prototype must not use ${forbidden}`);
}

assert.match(html, /type="email"[^>]+autocomplete="off"/);
assert.match(html, /name="share-mode"/);
assert.match(html, /role="status" aria-live="polite"/);

console.log('Synthetic referral-sharing prototype safety checks passed.');
