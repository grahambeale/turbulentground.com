#!/usr/bin/env node
// Injects the sitewide feedback tab (partials/feedback.html/css/js) into
// every page listed below. Run after editing any partials/feedback.* file.
//
//   node scripts/build-feedback.mjs
//
// Marker-based, same convention as build-nav.mjs: CSS comments for the
// stylesheet region (HTML comments inside <style> can silently eat the
// adjacent rule in some browsers — confirmed the hard way on this repo).

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
  'learnings/chatgpt-starts-this-week.html',
  'learnings/make-my-ai-team-take-risks.html',
  'learnings/seven-copies-of-the-rules.html',
  'learnings/signals-added-to-the-pile.html',
  'diagnostic/index.html',
];

const feedbackHtml = readFileSync(path.join(root, 'partials/feedback.html'), 'utf8').trimEnd();
const feedbackCss = readFileSync(path.join(root, 'partials/feedback.css'), 'utf8').trimEnd();
const feedbackJs = readFileSync(path.join(root, 'partials/feedback.js'), 'utf8').trimEnd();

function replaceBetweenMarkers(content, startMarker, endMarker, replacement) {
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return null;
  const before = content.slice(0, startIdx + startMarker.length);
  const after = content.slice(endIdx);
  return `${before}\n${replacement}\n${after}`;
}

function injectCss(content) {
  const withMarkers = replaceBetweenMarkers(content, '/* FEEDBACK_CSS_START */', '/* FEEDBACK_CSS_END */', feedbackCss);
  if (withMarkers) return withMarkers;
  if (!content.includes('</style>')) return null;
  return content.replace('</style>', `/* FEEDBACK_CSS_START */\n${feedbackCss}\n/* FEEDBACK_CSS_END */\n</style>`);
}

function injectHtml(content) {
  const withMarkers = replaceBetweenMarkers(content, '<!-- FEEDBACK_START -->', '<!-- FEEDBACK_END -->', feedbackHtml);
  if (withMarkers) return withMarkers;
  if (!content.includes('</body>')) return null;
  return content.replace('</body>', `<!-- FEEDBACK_START -->\n${feedbackHtml}\n<!-- FEEDBACK_END -->\n\n</body>`);
}

function injectJs(content) {
  const withMarkers = replaceBetweenMarkers(content, '<!-- FEEDBACK_JS_START -->', '<!-- FEEDBACK_JS_END -->', feedbackJs);
  if (withMarkers) return withMarkers;
  if (!content.includes('</body>')) return null;
  return content.replace('</body>', `<!-- FEEDBACK_JS_START -->\n${feedbackJs}\n<!-- FEEDBACK_JS_END -->\n\n</body>`);
}

let changedCount = 0;
for (const rel of TARGET_FILES) {
  const filePath = path.join(root, rel);
  const original = readFileSync(filePath, 'utf8');
  let content = original;

  const afterCss = injectCss(content);
  if (afterCss === null) {
    console.error(`[feedback] ${rel}: could not locate </style> (css)`);
    continue;
  }
  content = afterCss;

  const afterHtml = injectHtml(content);
  if (afterHtml === null) {
    console.error(`[feedback] ${rel}: could not locate </body> (html)`);
    continue;
  }
  content = afterHtml;

  const afterJs = injectJs(content);
  if (afterJs === null) {
    console.error(`[feedback] ${rel}: could not locate </body> (js)`);
    continue;
  }
  content = afterJs;

  if (content !== original) {
    writeFileSync(filePath, content, 'utf8');
    changedCount++;
    console.log(`[feedback] updated ${rel}`);
  } else {
    console.log(`[feedback] unchanged ${rel}`);
  }
}

console.log(`\n[feedback] done — ${changedCount}/${TARGET_FILES.length} file(s) updated.`);
