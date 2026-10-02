#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const invitations = read('admin/invitations/index.html');
const compatibility = read('research/admin.html');
const legacyTools = read('research/admin-tools.html');
const config = JSON.parse(read('vercel.json'));

function check(label, condition) {
  assert.ok(condition, label);
  console.log(`  PASS  ${label}`);
}

console.log('phase4-invitation-admin.test.mjs');
check('canonical invitation page is noindex and noarchive', /noindex, nofollow, noarchive/.test(invitations));
check('canonical invitation URL is declared', /canonical" href="https:\/\/www\.turbulentground\.com\/admin\/invitations"/.test(invitations));
check('page uses capability language rather than the retired research silo', /Protected operations/.test(invitations) && !/Private research admin/.test(invitations));
check('one invitation heading and labelled form are present', (invitations.match(/<h1/g) || []).length === 1 && /aria-labelledby="invite-form-heading"/.test(invitations));
check('remember-key choice is explicit and off by default', /id="remember-key"[^>]*type="checkbox"/.test(invitations) && !/id="remember-key"[^>]*checked/.test(invitations) && /Anyone using this browser profile will be able to create invites/.test(invitations));
check('invitation API and success controls are preserved', /fetch\('\/api\/research-invite'/.test(invitations) && /id="invite-url"/.test(invitations) && /id="copy-button"/.test(invitations) && /id="message-output"/.test(invitations));
check('results preview and manual feedback are not exposed on the invitation page', !/id="preview-form"/.test(invitations) && !/id="feedback-admin-form"/.test(invitations));
check('protected operations links are present', /href="\/admin"/.test(invitations) && /href="\/research\/admin-tools"/.test(invitations));
check('legacy tools preserve results preview and feedback controls without duplicating invitations', /id="preview-form"/.test(legacyTools) && /id="feedback-admin-form"/.test(legacyTools) && !/id="invite-form"/.test(legacyTools));
check('static compatibility page discards query state', /window\.location\.replace\('\/admin\/invitations'\)/.test(compatibility) && !/location\.search/.test(compatibility));
check('hosted compatibility redirect reaches the canonical route temporarily', config.redirects.some(rule => rule.source === '/research/admin' && rule.destination === '/admin/invitations' && rule.permanent === false));
check('admin and compatibility pages send no-store/noarchive headers', config.headers.some(rule => rule.source === '/admin/(.*)' && rule.headers.some(header => header.key === 'Cache-Control' && header.value === 'no-store')) && config.headers.some(rule => rule.source === '/research/admin(.*)' && rule.headers.some(header => header.key === 'X-Robots-Tag' && /noarchive/.test(header.value))));

console.log('\nALL CHECKS PASSED');
