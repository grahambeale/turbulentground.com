#!/usr/bin/env node
// Injects the shared, configurable footer (partials/footer.html,
// footer.css) into every page listed in TARGET_FILES. Run this after
// editing partials/footer.* or after changing a page's entry in
// FOOTER_CONFIG below.
//
//   node scripts/build-footer.mjs
//
// One shared pattern, configured per page — mirrors scripts/build-nav.mjs.
// This exists because index.html, writing.html, about.html and
// care-capital.html each had their own hand-authored footer (different
// markup, different inline styles, care-capital's even used
// onmouseover/onmouseout JS instead of a CSS class because it never
// defined .footer-link), and the learnings article template had a third,
// unrelated layout again. FOOTER_CONFIG below is the fix: partials/
// footer.html is a token template (see LINKS/NOTE below), rendered per
// file by renderFooter() from that file's config, so every page's footer
// comes from the same markup and the same CSS.
//
// Uses comment markers so re-runs are pure find/replace, matching
// build-nav.mjs's convention:
//   /* FOOTER_CSS_START */ ... /* FOOTER_CSS_END */   (inside <style>)
//   <!-- FOOTER_START -->  ... <!-- FOOTER_END -->     (the <footer> itself)
//
// Unlike build-nav.mjs this has no bootstrap fallback: the markers were
// hand-placed in every target file (including learnings/_article-
// template.html, so every generated article inherits them) as part of
// the migration that introduced this script. Run build-learnings.mjs
// first if you're regenerating the learnings articles from scratch.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const BEALE_NOTE =
  'Originally built by <a href="https://beale.co.uk" target="_blank" rel="noopener">Graham Beale</a>. AI product team from Sprint 1 — a live experiment. <a href="/learnings/zero-humans-in-the-loop">Read about it</a>.';

// Homepage: its own note (mentions this page was written outside the AI
// team's experiment) plus the research-recruitment CTA in its link row.
const HOME_FOOTER_CONFIG = {
  links: [
    { href: '/research', label: 'The study', dataResearchCta: 'footer' },
    { href: '/learnings', label: 'Learnings' },
    { href: 'https://www.linkedin.com/in/grahambeale/', label: 'Graham&rsquo;s LinkedIn', external: true },
    { href: 'https://www.youtube.com/@TurbulentGround', label: 'YouTube', external: true },
    { href: '/privacy', label: 'Privacy' },
  ],
  note:
    'Run by <a href="https://beale.co.uk" target="_blank" rel="noopener">Graham Beale</a>. Much of this site is built by an AI product team as a live experiment, <a href="/learnings/zero-humans-in-the-loop">read about it</a>. This homepage was written and built outside that experiment.',
};

const WRITING_FOOTER_CONFIG = {
  links: [
    { href: '/research', label: 'The study' },
    { href: 'writing.html', label: 'Writing' },
    { href: 'https://www.linkedin.com/in/grahambeale/', label: 'LinkedIn', external: true },
    { href: 'https://www.youtube.com/@TurbulentGround', label: 'YouTube', external: true },
    { href: 'privacy.html', label: 'Privacy' },
  ],
  note: BEALE_NOTE,
};

// about.html and care-capital.html share the same link set (no Writing
// link) and the same note.
const SECONDARY_PAGE_FOOTER_CONFIG = {
  links: [
    { href: '/research', label: 'The study' },
    { href: 'https://www.linkedin.com/in/grahambeale/', label: 'LinkedIn', external: true },
    { href: 'https://www.youtube.com/@TurbulentGround', label: 'YouTube', external: true },
    { href: 'privacy.html', label: 'Privacy' },
  ],
  note: BEALE_NOTE,
};

// Individual learnings articles: link back to /learnings itself.
const LEARNINGS_ARTICLE_FOOTER_CONFIG = {
  links: [
    { href: '/research', label: 'The study' },
    { href: '/learnings', label: 'Learnings' },
    { href: 'https://linkedin.com/in/grahambeale', label: 'LinkedIn', external: true },
    { href: '/privacy', label: 'Privacy' },
  ],
  note: `${BEALE_NOTE} &copy; 2026 Turbulent Ground`,
};

// The learnings index itself doesn't link back to /learnings.
const LEARNINGS_INDEX_FOOTER_CONFIG = {
  links: [
    { href: '/research', label: 'The study' },
    { href: 'https://linkedin.com/in/grahambeale', label: 'LinkedIn', external: true },
    { href: '/privacy', label: 'Privacy' },
  ],
  note: `${BEALE_NOTE} &copy; 2026 Turbulent Ground`,
};

const TARGET_FILES = [
  'index.html',
  'writing.html',
  'about.html',
  'care-capital.html',
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
];

const FOOTER_CONFIG = {
  'index.html': HOME_FOOTER_CONFIG,
  'writing.html': WRITING_FOOTER_CONFIG,
  'about.html': SECONDARY_PAGE_FOOTER_CONFIG,
  'care-capital.html': SECONDARY_PAGE_FOOTER_CONFIG,
  'learnings/index.html': LEARNINGS_INDEX_FOOTER_CONFIG,
};

function configFor(rel) {
  return FOOTER_CONFIG[rel] || LEARNINGS_ARTICLE_FOOTER_CONFIG;
}

const footerTemplate = readFileSync(path.join(root, 'partials/footer.html'), 'utf8').trimEnd();
const footerCss = readFileSync(path.join(root, 'partials/footer.css'), 'utf8').trimEnd();

function renderFooter(config) {
  const links = config.links
    .map((l) => {
      const external = l.external ? ' target="_blank" rel="noopener"' : '';
      const cta = l.dataResearchCta ? ` data-research-cta="${l.dataResearchCta}"` : '';
      return `    <a href="${l.href}" class="footer-link"${external}${cta}>${l.label}</a>`;
    })
    .join('\n');

  return footerTemplate
    .replace('{{LINKS}}', links)
    .replace('{{NOTE}}', config.note)
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

let changedCount = 0;
for (const rel of TARGET_FILES) {
  const filePath = path.join(root, rel);
  const original = readFileSync(filePath, 'utf8');
  let content = original;
  const config = configFor(rel);

  const afterCss = replaceBetweenMarkers(content, '/* FOOTER_CSS_START */', '/* FOOTER_CSS_END */', footerCss);
  if (afterCss === null) {
    console.error(`[footer] ${rel}: could not find FOOTER_CSS markers`);
    continue;
  }
  content = afterCss;

  const rendered = renderFooter(config);
  const afterFooter = replaceBetweenMarkers(content, '<!-- FOOTER_START -->', '<!-- FOOTER_END -->', rendered);
  if (afterFooter === null) {
    console.error(`[footer] ${rel}: could not find FOOTER markers`);
    continue;
  }
  content = afterFooter;

  if (content !== original) {
    writeFileSync(filePath, content, 'utf8');
    changedCount++;
    console.log(`[footer] updated ${rel}`);
  } else {
    console.log(`[footer] unchanged ${rel}`);
  }
}

console.log(`\n[footer] done — ${changedCount}/${TARGET_FILES.length} file(s) updated.`);
