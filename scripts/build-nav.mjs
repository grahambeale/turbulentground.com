#!/usr/bin/env node
// Injects the shared, configurable nav (partials/nav.html, nav.css, nav.js)
// into every page listed in TARGET_FILES. Run this after editing any
// partials/nav.* file, or after changing a page's entry in NAV_CONFIG below.
//
//   node scripts/build-nav.mjs
//
// One shared pattern, configured per page — not two diverging copies. This
// exists because the research pages (research/index.html, research/admin.html,
// research/privacy.html) originally got their own hand-authored, stripped-down
// nav (no links, non-clickable logo, a strapline) duplicated three times
// rather than sourced from partials/nav.*, and it visibly drifted from the
// main site's nav as a result. NAV_CONFIG below is the fix: partials/nav.html
// is now a token template (see LOGO_OPEN/LOGO_CLOSE/STRAPLINE/NAV_LINKS/
// MOBILE_MENU below), rendered per file by renderNav() from that file's
// config, so every page's nav — links or no links, clickable logo or not,
// strapline or not — comes from the same source and the same script.
//
// Uses comment markers so re-runs are pure find/replace (CSS comments for
// the stylesheet block — HTML comments there silently eat the adjacent
// rule in some browsers):
//   /* NAV_CSS_START */ ... /* NAV_CSS_END */   (inside <style>)
//   <!-- NAV_START -->     ... <!-- NAV_END -->        (nav + mobile menu)
//   <!-- NAV_JS_START -->  ... <!-- NAV_JS_END -->     (scroll/toggle script)
//
// First run on a page that doesn't have markers yet: falls back to
// locating the legacy nav blocks (either the "main-site" pattern used by
// index/writing/about/care-capital, or the plain pattern used by
// privacy/learnings pages) and wraps them in markers.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Default config: the full main-site nav, exactly as it's always looked —
// Home, Learnings, the diagnostic CTA, a clickable logo, no strapline.
// Every file in TARGET_FILES gets this unless it has its own entry below.
const DEFAULT_NAV_CONFIG = {
  logoHref: '/',
  strapline: '',
  links: [
    { href: '/', label: 'Home' },
    { href: '/learnings', label: 'Learnings' },
  ],
  cta: { href: '/diagnostic', label: 'Take the diagnostic &rarr;' },
};

// Stripped config for the three research pages: no links anywhere except
// the logo itself, which links to "/" — the main site homepage — same as
// every other page on the site. (An earlier pass made the logo
// non-clickable here too, on the reasoning that even a same-page link
// mid-survey would trigger a full reload; overridden — the logo should
// behave normally, only the surrounding nav links are stripped.) The
// strapline lives here instead of the main site, for now.
const RESEARCH_NAV_CONFIG = {
  logoHref: '/',
  strapline: 'Helping teams navigate the AI shift, together.',
  links: [],
  cta: null,
};

const TARGET_FILES = [
  'index.html',
  'writing.html',
  'about.html',
  'care-capital.html',
  'privacy.html',
  'learnings/index.html',
  'learnings/the-silent-veto.html',
  'learnings/what-zero-intervention-actually-means.html',
  'learnings/analytics-data-mean-what-you-think.html',
  'learnings/zero-humans-in-the-loop.html',
  'learnings/how-does-an-ai-team-miss-a-failure-this-big.html',
  'learnings/eleven-sprints-in.html',
  'research/index.html',
  'research/admin.html',
  'research/privacy.html',
];

const NAV_CONFIG = {
  'research/index.html': RESEARCH_NAV_CONFIG,
  'research/admin.html': RESEARCH_NAV_CONFIG,
  'research/privacy.html': RESEARCH_NAV_CONFIG,
};

function configFor(rel) {
  return NAV_CONFIG[rel] || DEFAULT_NAV_CONFIG;
}

const navTemplate = readFileSync(path.join(root, 'partials/nav.html'), 'utf8').trimEnd();
const navCss = readFileSync(path.join(root, 'partials/nav.css'), 'utf8').trimEnd();
const navJs = readFileSync(path.join(root, 'partials/nav.js'), 'utf8').trimEnd();

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Renders the nav.html template against one page's config. logoHref null
// renders plain markup (a <div>) instead of a link — available for a page
// that wants the logo non-clickable too, though nothing currently sets
// it; every page's logo links somewhere. An empty links array drops the
// links block, the hamburger toggle, and the mobile menu entirely
// (nothing to toggle).
function renderNav(config) {
  const logoOpen = config.logoHref
    ? `<a href="${escapeHtml(config.logoHref)}" class="nav-logo">`
    : `<div class="nav-logo">`;
  const logoClose = config.logoHref ? `</a>` : `</div>`;

  const strapline = config.strapline
    ? `\n      <span class="nav-strapline">${escapeHtml(config.strapline)}</span>`
    : '';

  let navLinks = '';
  let mobileMenu = '';
  if (config.links && config.links.length) {
    const linkEls = config.links
      .map((l) => `<a href="${escapeHtml(l.href)}" class="nav-link">${l.label}</a>`)
      .join('\n    ');
    const ctaEl = config.cta
      ? `\n    <div class="nav-btn-wrap"><a href="${escapeHtml(config.cta.href)}" class="nav-btn">${config.cta.label}</a></div>`
      : '';
    navLinks =
      `<div class="nav-links">\n    ${linkEls}${ctaEl}\n  </div>\n` +
      `  <button class="nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">\n` +
      `    <span></span><span></span><span></span>\n  </button>`;

    const mobileLinks = config.links.map((l) => `  <a href="${escapeHtml(l.href)}">${l.label}</a>`).join('\n');
    const mobileCta = config.cta
      ? `\n  <a href="${escapeHtml(config.cta.href)}" class="mobile-menu-btn">${config.cta.label}</a>`
      : '';
    mobileMenu = `<div class="mobile-menu" id="mobile-menu">\n${mobileLinks}${mobileCta}\n</div>`;
  }

  return navTemplate
    .replace('{{LOGO_OPEN}}', logoOpen)
    .replace('{{LOGO_CLOSE}}', logoClose)
    .replace('{{STRAPLINE}}', strapline)
    .replace('{{NAV_LINKS}}', navLinks)
    .replace('{{MOBILE_MENU}}', mobileMenu)
    .trimEnd();
}

function replaceBetweenMarkers(content, startMarker, endMarker, replacement) {
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return null;
  const before = content.slice(0, startIdx + startMarker.length);
  const after = content.slice(endIdx);
  return `${before}\n${replacement}\n${after}`;
}

function injectCss(content) {
  const withMarkers = replaceBetweenMarkers(content, '/* NAV_CSS_START */', '/* NAV_CSS_END */', navCss);
  if (withMarkers) return withMarkers;

  // Bootstrap: main-site pattern (.nav { ... } ... .mobile-menu .mobile-menu-btn { ... } [+ adjacent media query])
  const mainSitePattern = /\.nav \{[\s\S]*?\.mobile-menu \.mobile-menu-btn \{[\s\S]*?\n\}\n(@media\(max-width:720px\)[^\n]*\n)?/;
  if (mainSitePattern.test(content)) {
    return content.replace(mainSitePattern, `/* NAV_CSS_START */\n${navCss}\n/* NAV_CSS_END */\n`);
  }

  // Bootstrap: plain pattern (privacy/learnings 7-line block)
  const plainPattern = /  nav \{[^\n]*\}\n  \.nav-logo \{[^\n]*\}\n  \.nav-links \{[^\n]*\}\n  \.nav-links a \{[^\n]*\}\n  \.nav-links a:hover \{[^\n]*\}\n  \.nav-cta \{[^\n]*\}\n  \.nav-cta:hover \{[^\n]*\}\n/;
  if (plainPattern.test(content)) {
    return content.replace(plainPattern, `/* NAV_CSS_START */\n${navCss}\n/* NAV_CSS_END */\n`);
  }

  return null;
}

function injectNav(content, config) {
  const rendered = renderNav(config);
  const withMarkers = replaceBetweenMarkers(content, '<!-- NAV_START -->', '<!-- NAV_END -->', rendered);
  if (withMarkers) return withMarkers;

  // Bootstrap: main-site pattern (<nav class="nav" id="main-nav">...</nav> + mobile-menu div)
  const mainSitePattern = /<nav class="nav" id="main-nav">[\s\S]*?<div class="mobile-menu" id="mobile-menu">[\s\S]*?\n<\/div>\n/;
  if (mainSitePattern.test(content)) {
    return content.replace(mainSitePattern, `<!-- NAV_START -->\n${rendered}\n<!-- NAV_END -->\n`);
  }

  // Bootstrap: plain pattern (<nav>...</nav>, no mobile menu)
  const plainPattern = /<nav>\n(?:.*\n)*?<\/nav>\n/;
  if (plainPattern.test(content)) {
    return content.replace(plainPattern, `<!-- NAV_START -->\n${rendered}\n<!-- NAV_END -->\n`);
  }

  return null;
}

function injectJs(content) {
  const withMarkers = replaceBetweenMarkers(content, '<!-- NAV_JS_START -->', '<!-- NAV_JS_END -->', navJs);
  if (withMarkers) return withMarkers;

  // Bootstrap: main-site pattern already has a nav scroll/toggle <script> block
  const mainSitePattern = /<script>\n\(function\(\)\{\n  var nav=document\.getElementById\('main-nav'\);[\s\S]*?\n<\/script>\n/;
  if (mainSitePattern.test(content)) {
    return content.replace(mainSitePattern, `<!-- NAV_JS_START -->\n${navJs}\n<!-- NAV_JS_END -->\n`);
  }

  // Bootstrap: plain pattern has no nav script yet — insert one before </body>
  if (content.includes('</body>')) {
    return content.replace('</body>', `<!-- NAV_JS_START -->\n${navJs}\n<!-- NAV_JS_END -->\n\n</body>`);
  }

  return null;
}

let changedCount = 0;
for (const rel of TARGET_FILES) {
  const filePath = path.join(root, rel);
  const original = readFileSync(filePath, 'utf8');
  let content = original;
  const config = configFor(rel);

  const afterCss = injectCss(content);
  if (afterCss === null) {
    console.error(`[nav] ${rel}: could not locate nav CSS block (css)`);
    continue;
  }
  content = afterCss;

  const afterNav = injectNav(content, config);
  if (afterNav === null) {
    console.error(`[nav] ${rel}: could not locate nav HTML block (html)`);
    continue;
  }
  content = afterNav;

  const afterJs = injectJs(content);
  if (afterJs === null) {
    console.error(`[nav] ${rel}: could not locate nav JS block (js)`);
    continue;
  }
  content = afterJs;

  if (content !== original) {
    writeFileSync(filePath, content, 'utf8');
    changedCount++;
    console.log(`[nav] updated ${rel}`);
  } else {
    console.log(`[nav] unchanged ${rel}`);
  }
}

console.log(`\n[nav] done — ${changedCount}/${TARGET_FILES.length} file(s) updated.`);
