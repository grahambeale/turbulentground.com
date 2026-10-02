#!/usr/bin/env node

import fs from 'node:fs';

const root = fs.readFileSync(new URL('../privacy.html', import.meta.url), 'utf8');
const research = fs.readFileSync(new URL('../research/index.html', import.meta.url), 'utf8');
const compatibility = fs.readFileSync(new URL('../research/privacy.html', import.meta.url), 'utf8');
const sourceNote = fs.readFileSync(new URL('../research/privacy.md', import.meta.url), 'utf8');
const legacy = fs.readFileSync(new URL('../research/legacy-v3.html', import.meta.url), 'utf8');
const purpose = fs.readFileSync(new URL('../research/purpose-preview.html', import.meta.url), 'utf8');

function check(label, condition) {
  if (!condition) throw new Error(`FAIL  ${label}`);
  console.log(`  PASS  ${label}`);
}

console.log('phase4-privacy-consolidation.test.mjs');
check('canonical notice stays out of search indexes', /name="robots" content="noindex, nofollow"/.test(root));
check('canonical notice has the stable participation anchor', /<section class="privacy-section privacy-panel" id="participation"/.test(root));
check('canonical notice has accessible content tabs', /role="tablist"/.test(root) && /role="tab"/.test(root) && /role="tabpanel"/.test(root) && /aria-controls="participation"/.test(root));
check('section navigation uses the referral-style selected state', /class="privacy-contents-tabs"/.test(root) && /border-color: var\(--orange-light\)/.test(root) && /border-top-width: 4px/.test(root));
check('inactive tab hover stays clear of the orange rule', /button:not\(\[aria-selected="true"\]\) \{[^}]*margin-bottom: 2px;[^}]*padding-bottom: 10px/.test(root));
check('selected tab opens into the dark panel without a bottom line', /margin-bottom: -1px/.test(root) && /\.privacy-contents-tabs \{[^}]*border-bottom: 0;[^}]*linear-gradient\(var\(--orange-light\)/.test(root) && /button\[aria-selected="true"\]::after[^}]*bottom: 0;[^}]*background: var\(--bg\)/.test(root) && /\.privacy-panel \{[^}]*background: var\(--bg\)/.test(root));
check('tabs switch panels in place and preserve direct-link state', /activateTab/.test(root) && /panel\.hidden/.test(root) && /history\.replaceState/.test(root));
check('tabs support standard keyboard navigation', /ArrowRight/.test(root) && /ArrowLeft/.test(root) && /Home/.test(root) && /End/.test(root));
check('printing restores every privacy panel', /\.privacy-panel, \.privacy-panel\[hidden\] \{ display: block;/.test(root));
check('reduced-motion visitors do not get smooth scrolling', /prefers-reduced-motion: reduce/.test(root) && /scroll-behavior: auto/.test(root));
check('anchors account for the fixed masthead', /scroll-margin-top: 104px/.test(root));
check('compatibility navigation actively positions the requested section', /target\.scrollIntoView\(\{ block: 'start' \}\)/.test(root));
check('anchor positioning is repeated after web fonts settle', /document\.fonts\.ready\.then\(placeAnchoredSection\)/.test(root));
check('public, referral and invited participation are described', /direct invitation, through a referral or through the public study page/.test(root));
check('consent choices remain separate', /separate, optional checkbox on the same screen/.test(root));
check('retention promises remain explicit', /up to 14 days/.test(root) && /up to 24 months/.test(root) && /three years from submission/.test(root));
check('identity link remains described as pseudonymous', /pseudonymous, not anonymous/.test(root));
check('referral privacy is explicit', /random referral code/.test(root) && /does not contain your name, email, answers or results/.test(root));
check('participant modal uses the canonical notice', /fetch\('\/privacy\.html'\)/.test(research) && /querySelector\('#participation'\)/.test(research));
check('compatibility route drops query state and targets the anchor', /window\.location\.replace\('\/privacy#participation'\)/.test(compatibility));
check('old source identifies the canonical maintained source', /compatibility evidence only/.test(sourceNote));
check('historical participant links remain functional', legacy.includes('href="/privacy#participation"') && purpose.includes('href="/privacy#participation"'));
check('obsolete invite-only claim is removed', !research.includes('invite-only research') && !legacy.includes('invite-only research') && !purpose.includes('invite-only research'));

console.log('\nALL CHECKS PASSED');
