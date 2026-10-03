// FB-20261003-OG-IMAGE-RELATIVE: every article's og:image is an absolute https://www.turbulentground.com/... URL that
// exists. Covers the resolver, the source articles, the generated pages, the template and the CMS default.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveOgImage, SITE_ORIGIN } from '../scripts/og-image.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const articles = readdirSync(path.join(root, 'learnings')).filter((f) => f.endsWith('.html') && f !== 'index.html' && f !== '_article-template.html');
const ogOf = (html) => (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1];

test('there are articles to check', () => assert.ok(articles.length >= 10, `found ${articles.length}`));

for (const file of articles) {
  test(`og:image is absolute https://www.turbulentground.com/... and the file exists: ${file}`, () => {
    const v = ogOf(readFileSync(path.join(root, 'learnings', file), 'utf8'));
    assert.ok(v, 'no og:image meta');
    assert.match(v, /^https:\/\/www\.turbulentground\.com\/[A-Za-z0-9_\-./]+\.(png|jpe?g|webp)$/, v);
    assert.ok(existsSync(path.join(root, new URL(v).pathname)), `${new URL(v).pathname} does not exist in the repo`);
  });
}

test('every source article (content/learnings) uses the absolute form, so a rebuild cannot regress', () => {
  for (const f of readdirSync(path.join(root, 'content/learnings')).filter((x) => x.endsWith('.md'))) {
    const m = readFileSync(path.join(root, 'content/learnings', f), 'utf8').match(/^ogImage:\s*"([^"]*)"/m);
    assert.ok(m, `${f}: no ogImage`);
    assert.match(m[1], /^https:\/\/www\.turbulentground\.com\//, `${f}: ${m[1]}`);
  }
});

test('the template passes the token straight to og:image and the CMS default is absolute', () => {
  assert.match(readFileSync(path.join(root, 'learnings/_article-template.html'), 'utf8'), /<meta property="og:image" content="\{\{OG_IMAGE\}\}">/);
  const cfg = readFileSync(path.join(root, 'admin/config.yml'), 'utf8');
  assert.match(cfg, /name: "ogImage"[^\n]*default: "https:\/\/www\.turbulentground\.com\/og-image\.png"/);
});

test('resolver: bare filenames, site paths and apex URLs all become the absolute www form; bad values fail', () => {
  const d = mkdtempSync(path.join(tmpdir(), 'og-'));
  mkdirSync(path.join(d, 'learnings/images'), { recursive: true });
  writeFileSync(path.join(d, 'og-image.png'), 'x');
  writeFileSync(path.join(d, 'learnings/images/a.png'), 'x');
  assert.equal(resolveOgImage('og-image.png', d), `${SITE_ORIGIN}/og-image.png`);            // the old relative value
  assert.equal(resolveOgImage('/og-image.png', d), `${SITE_ORIGIN}/og-image.png`);
  assert.equal(resolveOgImage('https://turbulentground.com/og-image.png', d), `${SITE_ORIGIN}/og-image.png`);
  assert.equal(resolveOgImage('https://www.turbulentground.com/og-image.png', d), `${SITE_ORIGIN}/og-image.png`);
  assert.equal(resolveOgImage('images/a.png', d), `${SITE_ORIGIN}/learnings/images/a.png`);   // relative to learnings/, the CMS wording
  assert.equal(resolveOgImage('https://cdn.example.com/x.png', d), 'https://cdn.example.com/x.png');
  assert.throws(() => resolveOgImage('missing.png', d), /not found/);
  assert.throws(() => resolveOgImage('https://www.turbulentground.com/nope.png', d), /does not exist/);
  assert.throws(() => resolveOgImage('http://www.turbulentground.com/og-image.png', d), /must be https/);
  assert.throws(() => resolveOgImage('', d), /empty/);
  rmSync(d, { recursive: true, force: true });
});
