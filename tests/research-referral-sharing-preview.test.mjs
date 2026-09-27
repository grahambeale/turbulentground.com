import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../research/referral-sharing-preview.html', import.meta.url), 'utf8');

assert.match(html, /Synthetic prototype:/);
assert.match(html, /Know someone with a perspective on the AI shift at work\?/);
assert.match(html, /Your response is complete\. Invite them to take part too\./);
assert.match(html, /Your personal invitation link/);
assert.match(html, /Share publicly/);
assert.match(html, /Invite someone privately/);
assert.match(html, /Share or invite someone/);
assert.match(html, /Share using this device/);
assert.match(html, /Share to LinkedIn/);
assert.match(html, /Share to X/);
assert.match(html, /Share to Facebook/);
assert.match(html, /Share via WhatsApp/);
assert.match(html, /Invite via Facebook Messenger/);
assert.match(html, /Invite via LinkedIn message/);
assert.match(html, /Invite via WhatsApp/);
assert.match(html, /platform-icon/);
assert.match(html, /recipient-preview/);
assert.match(html, /updateRecipientPreview/);
assert.doesNotMatch(html, /Post the invitation to your wider network\./);
assert.doesNotMatch(html, /Personalise a message for one person\./);
assert.match(html, /These details stay in this browser/);
assert.match(html, /does not receive or save them/);
assert.match(html, /I thought you’d have an interesting perspective/);
assert.match(html, /you’ll also receive a personal benchmark comparison/);
assert.doesNotMatch(html, /you might have an interesting perspective/);
assert.doesNotMatch(html, /it also gives you/);
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
