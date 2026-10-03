// Unit tests for the public/ allowlist build and checks (scripts/build-public.mjs, scripts/audit/check-public.mjs).
// Each check is shown to fail on a deliberate fault. Uses throwaway project directories; touches nothing in the repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildPublic } from '../scripts/build-public.mjs';
import { checkPublic } from '../scripts/audit/check-public.mjs';
import { extractReferences, includePreview } from '../scripts/public-lib.mjs';

function project(files, allowlist, vercel = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'pub-'));
  const put = (rel, text) => { mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); writeFileSync(path.join(dir, rel), text); };
  for (const [rel, text] of Object.entries(files)) put(rel, text);
  put('public-allowlist.json', JSON.stringify({
    public: [], previewOnly: { paths: [] }, ignoreReferences: [],
    forbidden: { prefixes: ['scripts/', 'tests/', 'lib/'], extensions: ['.md', '.mjs'], names: ['package.json', 'vercel.json'] },
    ...allowlist,
  }));
  put('vercel.json', JSON.stringify({ cleanUrls: true, ...vercel }));
  return dir;
}
const run = (dir, env) => { buildPublic({ rootDir: dir, env }); return checkPublic({ rootDir: dir, env }); };
const done = (dir) => rmSync(dir, { recursive: true, force: true });

const SITE = {
  'index.html': '<link rel="icon" href="/favicon.png"><a href="/about">About</a><a href="/take-part">Take part</a><script>fetch("/api/ping")</script>',
  'about.html': '<img src="/img/a.png"><a href="/">Home</a>',
  'favicon.png': 'x', 'img/a.png': 'x', 'research/index.html': '<p>study</p>',
  'api/ping.js': 'module.exports=1', 'scripts/build.mjs': 'x', 'tests/t.mjs': 'x', 'notes.md': 'x', 'package.json': '{}',
};
const ALLOW = { public: [{ reason: 'pages', paths: ['index.html', 'about.html', 'favicon.png', 'img/*.png', 'research/index.html'] }] };
const VERCEL = { rewrites: [{ source: '/take-part', destination: '/research' }] };

test('a clean build is exactly the allowlist and passes every check (cleanUrls, rewrites, api all resolve)', () => {
  const d = project(SITE, ALLOW, VERCEL);
  const r = run(d);
  assert.deepEqual(r.errors, []);
  for (const f of ['index.html', 'about.html', 'favicon.png', 'img/a.png', 'research/index.html']) assert.ok(existsSync(path.join(d, 'public', f)), f);
  for (const f of ['scripts/build.mjs', 'tests/t.mjs', 'notes.md', 'package.json', 'api/ping.js', 'vercel.json']) assert.ok(!existsSync(path.join(d, 'public', f)), `${f} must not be copied`);
  done(d);
});

test('FAILS on a missing referenced asset', () => {
  const d = project({ ...SITE, 'about.html': '<img src="/img/missing.png">' }, ALLOW, VERCEL);
  const r = run(d);
  assert.ok(r.errors.some((e) => e.includes('BROKEN REFERENCE') && e.includes('/img/missing.png')), r.errors.join('\n'));
  done(d);
});

test('FAILS on an extra file in public/', () => {
  const d = project(SITE, ALLOW, VERCEL);
  buildPublic({ rootDir: d });
  writeFileSync(path.join(d, 'public', 'stray.txt'), 'x');
  const r = checkPublic({ rootDir: d });
  assert.ok(r.errors.some((e) => e.startsWith('EXTRA in public/') && e.includes('stray.txt')), r.errors.join('\n'));
  done(d);
});

test('FAILS on a forbidden path in public/ (script, markdown, tests folder)', () => {
  const d = project(SITE, ALLOW, VERCEL);
  buildPublic({ rootDir: d });
  mkdirSync(path.join(d, 'public', 'scripts'), { recursive: true });
  writeFileSync(path.join(d, 'public', 'scripts', 'x.mjs'), 'x');
  writeFileSync(path.join(d, 'public', 'notes.md'), 'x');
  const r = checkPublic({ rootDir: d });
  assert.ok(r.errors.some((e) => e.includes('FORBIDDEN') && e.includes('scripts/x.mjs')), r.errors.join('\n'));
  assert.ok(r.errors.some((e) => e.includes('FORBIDDEN') && e.includes('notes.md')), r.errors.join('\n'));
  done(d);
});

test('FAILS when an allowlisted file is missing from public/ and when an allowlist pattern matches nothing', () => {
  const d = project(SITE, ALLOW, VERCEL);
  buildPublic({ rootDir: d });
  rmSync(path.join(d, 'public', 'favicon.png'));
  assert.ok(checkPublic({ rootDir: d }).errors.some((e) => e.startsWith('MISSING from public/') && e.includes('favicon.png')));
  const d2 = project(SITE, { public: [{ reason: 'x', paths: ['nope.html'] }] }, VERCEL);
  assert.throws(() => buildPublic({ rootDir: d2 }), /matches no file: nope\.html/);
  done(d); done(d2);
});

test('JS-only assets: found in script strings, FAIL when missing, and a stale dynamic entry FAILS', () => {
  const files = { ...SITE, 'research/index.html': '<script>var v="/research/media/intro.mp4";</script>', 'research/media/intro.mp4': 'v' };
  const allow = { public: [...ALLOW.public, { reason: 'video', paths: ['research/media/intro.mp4'], dynamic: true, referencedFrom: 'research/index.html' }] };
  const d = project(files, allow, VERCEL);
  assert.deepEqual(run(d).errors, []);
  rmSync(path.join(d, 'research/media/intro.mp4'));
  assert.throws(() => buildPublic({ rootDir: d }), /matches no file/);   // allowlisted file gone
  done(d);
  const gone = project({ ...files, 'research/index.html': '<p>no reference any more</p>' }, allow, VERCEL);
  const r = run(gone);
  assert.ok(r.errors.some((e) => e.startsWith('STALE dynamic entry') && e.includes('intro.mp4')), r.errors.join('\n'));
  done(gone);
  const { 'research/media/intro.mp4': _omit, ...withoutVideo } = files;
  const unlisted = project(withoutVideo, { public: ALLOW.public }, VERCEL);
  mkdirSync(path.join(unlisted, 'research/media'), { recursive: true });
  writeFileSync(path.join(unlisted, 'research/media/intro.mp4'), 'v');   // exists in the repo but is not allowlisted
  const r2 = run(unlisted);
  assert.ok(r2.errors.some((e) => e.includes('BROKEN REFERENCE') && e.includes('/research/media/intro.mp4')), r2.errors.join('\n'));
  done(unlisted);
});

test('built paths (string concatenation and template literals) must have files under the directory', () => {
  const concat = project({ ...SITE, 'about.html': '<script>function src(id){ return \'/gallery/\' + id + \'.png\'; }</script>' }, ALLOW, VERCEL);
  assert.ok(run(concat).errors.some((e) => e.includes('/gallery/') && e.includes('built path')), 'concatenated path with no files must fail');
  const tmpl = project({ ...SITE, 'about.html': '<script>var u = `/gallery/${id}.png`;</script>' }, ALLOW, VERCEL);
  assert.ok(run(tmpl).errors.some((e) => e.includes('/gallery/') && e.includes('built path')), 'template-literal path with no files must fail');
  const ok = project({ ...SITE, 'gallery/a.png': 'x', 'about.html': '<script>function src(id){ return \'/gallery/\' + id + \'.png\'; }</script>' },
    { public: [...ALLOW.public, { reason: 'gallery', paths: ['gallery/*.png'] }] }, VERCEL);
  assert.deepEqual(run(ok).errors, []);
  for (const d of [concat, tmpl, ok]) done(d);
});

test('FAILS when .vercelignore hides an allowlisted file (Vercel would remove it before the build)', () => {
  const d = project(SITE, ALLOW, VERCEL);
  writeFileSync(path.join(d, '.vercelignore'), '/img/\n');
  const r = run(d);
  assert.ok(r.errors.some((e) => e.startsWith('HIDDEN BY .vercelignore') && e.includes('img/a.png')), r.errors.join('\n'));
  done(d);
});

test('REGRESSION: git hook environment (GIT_DIR) must not leak into the temp-dir git commands', async () => {
  // The pre-push hook runs the build with GIT_DIR set. `git init` / `git check-ignore` in a temp directory then acted on
  // the real repository and set core.bare=true in its config. Simulate with a decoy repository.
  // These git calls themselves must run with a clean environment: npm test runs inside the pre-push hook, where GIT_DIR is
  // set, and a bare `git init` here would re-initialise the REAL repository (this test once did exactly that).
  const { execFileSync } = await import('node:child_process');
  const { vercelIgnored, cleanGitEnv } = await import('../scripts/public-lib.mjs');
  const git = (args) => execFileSync('git', args, { encoding: 'utf8', env: cleanGitEnv() });
  const decoy = mkdtempSync(path.join(tmpdir(), 'decoy-'));
  git(['init', '-q', decoy]);
  const before = git(['-C', decoy, 'config', '--local', '--list']);
  const proj = project({ 'a.html': 'x', 'secret/b.txt': 'x' }, { public: [{ reason: 'x', paths: ['a.html'] }] });
  writeFileSync(path.join(proj, '.vercelignore'), '/secret/\n');
  const saved = { GIT_DIR: process.env.GIT_DIR, GIT_WORK_TREE: process.env.GIT_WORK_TREE };
  process.env.GIT_DIR = path.join(decoy, '.git');
  process.env.GIT_WORK_TREE = decoy;
  try {
    assert.deepEqual([...vercelIgnored(proj, ['a.html', 'secret/b.txt'])], ['secret/b.txt']);
    assert.ok(!Object.keys(cleanGitEnv()).some((k) => k.startsWith('GIT_')));
  } finally {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
  const after = git(['-C', decoy, 'config', '--local', '--list']);
  assert.equal(after, before, 'the decoy repository config must be untouched');
  done(proj); done(decoy);
});

test('FAILS on an /api/ call with no function', () => {
  const d = project({ ...SITE, 'index.html': '<script>fetch("/api/missing-route")</script>' }, ALLOW, VERCEL);
  assert.ok(run(d).errors.some((e) => e.includes('/api/missing-route')));
  done(d);
});

test('preview-only pages: absent unless VERCEL_ENV is exactly "preview"; noindex added to the copy only', () => {
  const files = { ...SITE, 'research/ux-review.html': '<html><head><title>x</title></head><body>review</body></html>' };
  const allow = { ...ALLOW, previewOnly: { paths: ['research/ux-review.html'] } };
  const d = project(files, allow, VERCEL);
  for (const env of [undefined, 'production', 'development', '', 'Preview']) {
    assert.deepEqual(run(d, env).errors, [], String(env));
    assert.ok(!existsSync(path.join(d, 'public/research/ux-review.html')), `leaked with VERCEL_ENV=${env}`);
  }
  assert.equal(includePreview('preview'), true);
  assert.deepEqual(run(d, 'preview').errors, []);
  const copy = readFileSync(path.join(d, 'public/research/ux-review.html'), 'utf8');
  assert.match(copy, /<meta name="robots" content="noindex, nofollow">/);
  assert.doesNotMatch(readFileSync(path.join(d, 'research/ux-review.html'), 'utf8'), /noindex/, 'the source file is never edited');
  // checking the production variant against a preview build is an error (extra file)
  assert.ok(checkPublic({ rootDir: d, env: 'production' }).errors.some((e) => e.startsWith('EXTRA')));
  done(d);
});

test('extraction: ignores external URLs, anchors, mailto and CSS selector strings; follows <base> and srcset', () => {
  const html = '<a href="https://x.test/a.png"></a><a href="#top"></a><a href="mailto:a@b.c"></a><img srcset="/a.png 1x, /b.png 2x">'
    + '<script>q.querySelectorAll(\'a[href$="diagnostic/index.html"]\'); var u="plausible.io/js/script.js"; var v="/real.mp4";</script>';
  const refs = extractReferences('p.html', html).map((r) => r.ref).sort();
  assert.deepEqual(refs, ['/a.png', '/b.png', '/real.mp4']);
  const d = project({ 'admin/index.html': '<base href="/admin/"><script>load("config.yml")</script>', 'admin/config.yml': 'x' },
    { public: [{ reason: 'admin', paths: ['admin/index.html', 'admin/config.yml'] }] });
  assert.deepEqual(run(d).errors, []);
  done(d);
});

// ---- crawl-and-hash parity (scripts/audit/crawl-parity.mjs) ----
import { compare, hashBody, routesForFile } from '../scripts/audit/crawl-parity.mjs';

test('parity: routes follow cleanUrls, index files and rewrites', () => {
  const v = { rewrites: [{ source: '/take-part', destination: '/research' }, { source: '/learnings', destination: '/learnings/index.html' }] };
  assert.deepEqual(routesForFile('about.html', v), ['/about']);
  assert.deepEqual(routesForFile('index.html', v), ['/']);
  assert.deepEqual(routesForFile('research/index.html', v).sort(), ['/research', '/take-part']);
  assert.deepEqual(routesForFile('learnings/index.html', v).sort(), ['/learnings']);
  assert.deepEqual(routesForFile('favicon.png', v), ['/favicon.png']);
});

test('parity: the preview toolbar tag is stripped before hashing HTML (and only HTML)', () => {
  const page = '<html><body>x</body></html>\n';
  const withTag = page + '<script async data-explicit-opt-in="true" data-deployment-id="dpl_x" src="https://vercel.live/_next-live/feedback/feedback.js"></script>';
  assert.deepEqual(hashBody('/', 'text/html', Buffer.from(withTag)), hashBody('/', 'text/html', Buffer.from(page)));
  assert.notDeepEqual(hashBody('/a.png', 'image/png', Buffer.from(withTag)), hashBody('/a.png', 'image/png', Buffer.from(page)));
});

test('parity: compare reports a changed byte, a leaked non-public file, and preview-only rules per environment', () => {
  const ok = { status: 200, contentType: 'text/html', length: 10, sha256: 'aa' };
  const manifest = { routes: [
    { route: '/', kind: 'public', expect: ok },
    { route: '/research/ux-review', kind: 'previewOnly' },
    { route: '/scripts/build-nav.mjs', kind: 'absent' },
  ] };
  const good = [{ route: '/', ...ok }, { route: '/research/ux-review', status: 404 }, { route: '/scripts/build-nav.mjs', status: 404 }];
  assert.deepEqual(compare(manifest, good, 'production').problems, []);
  assert.equal(compare(manifest, good, 'preview').problems.length, 1);   // preview must serve the review page
  const preview = [{ route: '/', ...ok }, { route: '/research/ux-review', status: 200 }, { route: '/scripts/build-nav.mjs', status: 404 }];
  assert.deepEqual(compare(manifest, preview, 'preview').problems, []);
  assert.equal(compare(manifest, preview, 'production').problems.length, 1);   // production must not serve it
  const bad = [{ route: '/', ...ok, sha256: 'bb', length: 11 }, { route: '/research/ux-review', status: 404 }, { route: '/scripts/build-nav.mjs', status: 200 }];
  const probs = compare(manifest, bad, 'production').problems.join('\n');
  assert.match(probs, /\/: length 10 -> 11/);
  assert.match(probs, /\/: sha256 aa -> bb/);
  assert.match(probs, /\/scripts\/build-nav\.mjs: must 404, got 200/);
});
