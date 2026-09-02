#!/usr/bin/env node
// Renders content/learnings/*.md (front matter + markdown body) against
// learnings/_article-template.html into the final learnings/*.html files.
// Run this before build-nav.mjs and build-feedback.mjs — it regenerates
// each article from scratch, including the NAV_*/FEEDBACK_* marker
// comments those two scripts inject into afterwards. Chained together in
// `npm run build`.
//
//   node scripts/build-learnings.mjs
//
// This exists so an article's actual prose lives as plain markdown, not
// buried inside a full hand-authored HTML document — the two-step
// pipeline (this script pre-fills the shell, build-nav/build-feedback
// inject the shared chrome) is what makes editing an article through
// Decap CMS (see /admin) mean editing a handful of front-matter fields
// and a markdown textarea, not hand-editing HTML.
//
// content/learnings/<slug>.md front matter fields:
//   title            — <title> tag text, before " · Turbulent Ground"
//   description      — meta description + JSON-LD description
//   ogTitle          — og:title (can differ slightly from title)
//   ogDescription    — og:description (can differ from description)
//   ogImage          — og:image, relative to learnings/ (e.g. og-image.png)
//   heroImage        — hero <img> src, relative to learnings/
//   heroAlt          — hero <img> alt text
//   eyebrow          — small label above the headline (e.g. "The Experiment")
//   h1               — headline as it renders (HTML entities like &rsquo; OK)
//   bylineMeta       — e.g. "Sprint 11" or "Sprints 2–5"
// Body (everything after the "---" front-matter block) is Markdown,
// rendered with marked. Raw HTML blocks (e.g. a .cold-open callout) pass
// through unchanged, same as any CommonMark renderer.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { marked } from 'marked';
import { load as yamlLoad } from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content/learnings');
const outDir = path.join(root, 'learnings');
const template = readFileSync(path.join(outDir, '_article-template.html'), 'utf8');

marked.setOptions({ gfm: true, breaks: false });

// Real YAML parsing, not a hand-rolled line splitter — Decap CMS (see
// /admin) re-serializes this front matter with its own YAML writer on
// every save, which won't necessarily match a bespoke quoting scheme.
function parseFrontMatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('Missing front matter (expected --- ... --- at the top of the file)');
  const [, fmBlock, body] = match;
  const fields = yamlLoad(fmBlock) || {};
  return { fields, body: body.trim() };
}

// Escapes a string for safe embedding inside a JSON string literal
// that's itself embedded directly in the HTML template (the JSON-LD
// script tag) — not full HTML-escaping, just what JSON.stringify needs.
function jsonEscape(s) {
  return JSON.stringify(s).slice(1, -1);
}

// Escapes a string for safe embedding inside an HTML attribute value
// (content="...") or plain HTML text (e.g. <title>...</title>) — needed
// for any front-matter field that isn't already author-written HTML
// (h1/eyebrow/bylineMeta deliberately allow literal entities like
// &mdash; and are left unescaped; this is for the fields that go inside
// quoted attributes, where an unescaped literal `"` in the source text —
// e.g. a title containing a quoted phrase — would otherwise break out
// of the attribute and corrupt the tag).
function htmlAttrEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function render(fields, bodyHtml) {
  const required = [
    'title', 'description', 'ogTitle', 'ogDescription', 'ogImage',
    'heroImage', 'heroAlt', 'eyebrow', 'h1', 'bylineMeta', 'slug',
  ];
  for (const key of required) {
    if (!fields[key]) throw new Error(`Missing required front-matter field: ${key}`);
  }
  return template
    .replaceAll('{{TITLE}}', htmlAttrEscape(fields.title))
    .replaceAll('{{SLUG}}', fields.slug)
    .replaceAll('{{HEADLINE_JSON}}', jsonEscape(fields.title))
    .replaceAll('{{DESCRIPTION_JSON}}', jsonEscape(fields.description))
    .replaceAll('{{DESCRIPTION}}', htmlAttrEscape(fields.description))
    .replaceAll('{{OG_TITLE}}', htmlAttrEscape(fields.ogTitle))
    .replaceAll('{{OG_DESCRIPTION}}', htmlAttrEscape(fields.ogDescription))
    .replaceAll('{{OG_IMAGE}}', htmlAttrEscape(fields.ogImage))
    .replaceAll('{{HERO_IMAGE}}', htmlAttrEscape(fields.heroImage))
    .replaceAll('{{HERO_IMAGE_POSITION}}', fields.heroImagePosition || 'center')
    .replaceAll('{{HERO_ALT}}', htmlAttrEscape(fields.heroAlt))
    .replaceAll('{{EYEBROW}}', fields.eyebrow)
    .replaceAll('{{H1}}', fields.h1)
    .replaceAll('{{BYLINE_META}}', fields.bylineMeta)
    .replace('{{BODY_HTML}}', bodyHtml);
}

const files = readdirSync(contentDir).filter((f) => f.endsWith('.md'));
let count = 0;
for (const file of files) {
  const slugFromFile = file.replace(/\.md$/, '');
  const raw = readFileSync(path.join(contentDir, file), 'utf8');
  let fields, body;
  try {
    ({ fields, body } = parseFrontMatter(raw));
  } catch (err) {
    console.error(`[learnings] ${file}: ${err.message}`);
    continue;
  }
  if (!fields.slug) fields.slug = slugFromFile;
  if (fields.slug !== slugFromFile) {
    console.error(`[learnings] ${file}: slug "${fields.slug}" doesn't match filename — using filename to be safe`);
    fields.slug = slugFromFile;
  }
  const bodyHtml = marked.parse(body).trim();
  const html = render(fields, bodyHtml);
  writeFileSync(path.join(outDir, `${fields.slug}.html`), html, 'utf8');
  count++;
  console.log(`[learnings] wrote learnings/${fields.slug}.html`);
}

console.log(`\n[learnings] done — ${count}/${files.length} article(s) rendered.`);
