#!/usr/bin/env node
// Injects the shared nav (partials/nav.html, nav.css, nav.js) into every
// page listed below. Run this after editing any partials/nav.* file.
//
//   node scripts/build-nav.mjs
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
];

const navHtml = readFileSync(path.join(root, 'partials/nav.html'), 'utf8').trimEnd();
const navCss = readFileSync(path.join(root, 'partials/nav.css'), 'utf8').trimEnd();
const navJs = readFileSync(path.join(root, 'partials/nav.js'), 'utf8').trimEnd();

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

function injectNav(content) {
  const withMarkers = replaceBetweenMarkers(content, '<!-- NAV_START -->', '<!-- NAV_END -->', navHtml);
  if (withMarkers) return withMarkers;

  // Bootstrap: main-site pattern (<nav class="nav" id="main-nav">...</nav> + mobile-menu div)
  const mainSitePattern = /<nav class="nav" id="main-nav">[\s\S]*?<div class="mobile-menu" id="mobile-menu">[\s\S]*?\n<\/div>\n/;
  if (mainSitePattern.test(content)) {
    return content.replace(mainSitePattern, `<!-- NAV_START -->\n${navHtml}\n<!-- NAV_END -->\n`);
  }

  // Bootstrap: plain pattern (<nav>...</nav>, no mobile menu)
  const plainPattern = /<nav>\n(?:.*\n)*?<\/nav>\n/;
  if (plainPattern.test(content)) {
    return content.replace(plainPattern, `<!-- NAV_START -->\n${navHtml}\n<!-- NAV_END -->\n`);
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

  const afterCss = injectCss(content);
  if (afterCss === null) {
    console.error(`[nav] ${rel}: could not locate nav CSS block (css)`);
    continue;
  }
  content = afterCss;

  const afterNav = injectNav(content);
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
