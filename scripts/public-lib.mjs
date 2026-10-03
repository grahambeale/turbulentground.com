// Shared by scripts/build-public.mjs, scripts/audit/check-public.mjs and tests/public-allowlist.test.mjs.
// See research/openspec/changes/public-allowlist-output/ (approved 3 Oct 2026, no release yet).
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

export const SKIP_DIRS = new Set(['node_modules', '.git', 'public', 'test-results', 'playwright-report', '.vercel']);

export function loadAllowlist(root) {
  return JSON.parse(readFileSync(path.join(root, 'public-allowlist.json'), 'utf8'));
}

/** Preview-only pages are included ONLY when VERCEL_ENV is exactly "preview". Unset means production-like. */
export function includePreview(env = process.env.VERCEL_ENV) {
  return env === 'preview';
}

export function walk(dir, base = dir, skip = SKIP_DIRS) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full, base, skip));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out.sort();
}

export function globToRegExp(glob) {
  const esc = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
  return new RegExp(`^${esc}$`);
}

/**
 * Expand the allowlist against the files under `root`.
 * Returns Map(relativePath -> { group: 'public'|'previewOnly', reason, dynamic, referencedFrom }).
 * A pattern that matches nothing is an error: the allowlist must not silently go stale.
 */
export function expandAllowlist(root, allowlist, { preview = false } = {}) {
  const files = walk(root);
  const out = new Map();
  const errors = [];
  const add = (pattern, meta) => {
    const re = globToRegExp(pattern);
    const hits = files.filter((f) => re.test(f));
    if (hits.length === 0) errors.push(`allowlist entry matches no file: ${pattern}`);
    for (const f of hits) out.set(f, meta);
  };
  for (const g of allowlist.public || []) {
    for (const p of g.paths) add(p, { group: 'public', reason: g.reason, dynamic: !!g.dynamic, referencedFrom: g.referencedFrom });
  }
  if (preview) {
    for (const p of allowlist.previewOnly?.paths || []) add(p, { group: 'previewOnly', reason: 'research review page (preview deployments only)', dynamic: false });
  }
  return { files: out, errors };
}

/** Forbidden-path rules from the allowlist file. Returns a reason string, or null. */
export function forbiddenReason(rel, allowlist) {
  const f = allowlist.forbidden || {};
  for (const p of f.prefixes || []) if (rel.startsWith(p)) return `under forbidden prefix ${p}`;
  const base = rel.split('/').pop();
  if ((f.names || []).includes(base)) return `forbidden file name ${base}`;
  for (const e of f.extensions || []) if (base.endsWith(e) && base !== '.env.example') return `forbidden extension ${e}`;
  if (base.startsWith('.env')) return 'forbidden .env file';
  return null;
}

const ASSET_EXT = 'mp4|webm|mov|jpg|jpeg|png|webp|gif|svg|ico|css|js|mjs|json|yml|yaml|woff2?|ttf|otf|html|xml|txt|pdf';
const JS_PATH_RE = new RegExp(`(['"\`])((?:\\.{0,2}/)?[A-Za-z0-9_@%~+\\-./]*[A-Za-z0-9_@%~+\\-]\\.(?:${ASSET_EXT}))(?:[?#][^'"\`]*)?\\1`, 'g');
const JS_API_RE = /(['"`])(\/api\/[A-Za-z0-9_\-/]+)(?:\?[^'"`]*)?\1/g;
const HOST_LIKE = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/|$)/i;

function stripComments(js) {
  return js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}

function isLocalRef(ref) {
  if (!ref) return false;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref)) return false;   // http:, mailto:, data:, //cdn, #anchor
  return true;
}

/** Extract { ref, kind } pairs from one file's text. Kinds: attr, css, js, api. */
export function extractReferences(file, text) {
  const refs = [];
  const ext = file.split('.').pop().toLowerCase();
  const pushCss = (css) => {
    for (const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) refs.push({ ref: m[2].trim(), kind: 'css' });
    for (const m of css.matchAll(/@import\s+(?:url\(\s*)?(['"])([^'"]+)\1/g)) refs.push({ ref: m[2].trim(), kind: 'css' });
  };
  const pushJs = (js) => {
    const code = stripComments(js);
    for (const m of code.matchAll(JS_API_RE)) refs.push({ ref: m[2], kind: 'api' });
    // Built paths: '/dir/' + id + '.png'  and  `/dir/${id}.png`. The directory must contain at least one matching file.
    const CONCAT = new RegExp(`(['"])(\\/[A-Za-z0-9_@%~+\\-./]*\\/)\\1\\s*\\+[^;\\n]*?\\+\\s*(['"])(\\.[A-Za-z0-9]{2,5})\\3`, 'g');
    for (const m of code.matchAll(CONCAT)) if (!m[2].startsWith('/api/')) refs.push({ ref: m[2], kind: 'dynamic', suffix: m[4] });
    const TEMPLATE = new RegExp('`(\\/[A-Za-z0-9_@%~+\\-./]*\\/)\\$\\{[^}]*\\}([A-Za-z0-9_@%~+\\-./]*(\\.[A-Za-z0-9]{2,5}))`', 'g');
    for (const m of code.matchAll(TEMPLATE)) if (!m[1].startsWith('/api/')) refs.push({ ref: m[1], kind: 'dynamic', suffix: m[3] });
    for (const m of code.matchAll(JS_PATH_RE)) {
      const r = m[2];
      // a quoted value inside a CSS selector string, e.g. a[href$="diagnostic/index.html"], is not a URL reference
      if (/\[[A-Za-z_:-]+[$^*~|]?=\s*$/.test(code.slice(Math.max(0, m.index - 24), m.index))) continue;
      if (HOST_LIKE.test(r) && !r.startsWith('/') && !r.startsWith('.')) continue;   // e.g. plausible.io/js/script.js
      refs.push({ ref: r, kind: 'js' });
    }
  };
  if (ext === 'css') pushCss(text);
  else if (ext === 'js' || ext === 'mjs') pushJs(text);
  else if (ext === 'html') {
    for (const m of text.matchAll(/<(?:script|style)\b[^>]*>([\s\S]*?)<\/(script|style)>/gi)) {
      if (m[2].toLowerCase() === 'style') pushCss(m[1]); else pushJs(m[1]);
    }
    const markup = text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (s) => s.replace(/>[\s\S]*<\/(script|style)>/i, '></$1>'));
    for (const m of markup.matchAll(/\b(?:src|href|poster|data-src|action|data-href)\s*=\s*(['"])(.*?)\1/gi)) refs.push({ ref: m[2].trim(), kind: 'attr' });
    for (const m of markup.matchAll(/\bsrcset\s*=\s*(['"])(.*?)\1/gi)) for (const part of m[2].split(',')) refs.push({ ref: part.trim().split(/\s+/)[0], kind: 'attr' });
    for (const m of markup.matchAll(/<meta\b[^>]*(?:property|name)\s*=\s*['"](?:og:image|twitter:image)['"][^>]*content\s*=\s*(['"])(.*?)\1/gi)) refs.push({ ref: m[2].trim(), kind: 'attr' });
    for (const m of markup.matchAll(/\bstyle\s*=\s*(['"])(.*?)\1/gis)) pushCss(m[2]);
  }
  return refs.filter((r) => isLocalRef(r.ref));
}

/** The <base href> of a page, if any (admin/index.html sets /admin/). */
function baseHref(text) {
  const m = text.match(/<base\b[^>]*\bhref\s*=\s*(['"])(.*?)\1/i);
  return m ? m[2] : null;
}

/**
 * Does `ref`, found in `fromRel` (a path inside public/), resolve to something deployed?
 * Applies vercel.json redirects and rewrites, cleanUrls, and the page's <base>.
 * `has(path)` says whether a path (no leading slash) exists in public/. `apiFiles` is a Set of 'name' for api/name.js.
 */
export function resolveReference(ref, fromRel, { has, vercel, apiFiles, base = null }) {
  const clean = ref.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return { ok: true, how: 'root' };
  let url;
  if (clean.startsWith('/')) url = clean;
  else {
    const fileDir = path.posix.dirname('/' + fromRel);
    const dirs = [];
    if (base) dirs.push(base.endsWith('/') ? base : path.posix.dirname(base) + '/');
    dirs.push(fileDir === '/' ? '/' : fileDir + '/');
    // Accept a relative reference that resolves under the page's base or its file directory.
    for (const d of dirs) {
      const r = resolveReference(path.posix.normalize(d + clean), fromRel, { has, vercel, apiFiles, base: null });
      if (r.ok) return r;
    }
    return { ok: false, how: `relative to ${dirs.join(' or ')}` };
  }
  url = path.posix.normalize(url);
  for (let hop = 0; hop < 5; hop++) {
    const redirect = (vercel.redirects || []).find((r) => r.source === url);
    const rewrite = (vercel.rewrites || []).find((r) => r.source === url);
    const target = redirect?.destination ?? rewrite?.destination;
    if (target === undefined) break;
    if (/^https?:\/\//i.test(target)) return { ok: true, how: 'external redirect' };
    url = path.posix.normalize(target.split('?')[0]);
    if (url.startsWith('/api/')) break;
  }
  if (url.startsWith('/api/')) {
    const name = url.slice(5).replace(/\/$/, '');
    return apiFiles.has(name) ? { ok: true, how: 'api function' } : { ok: false, how: 'no api/' + name + '.js' };
  }
  const p = url.slice(1);
  const trimmed = p.replace(/\/$/, '');
  for (const c of [p, trimmed + '.html', trimmed + '/index.html', trimmed.replace(/\.html$/, '') + '.html']) {
    if (c && has(c)) return { ok: true, how: c };
  }
  return { ok: false, how: 'not in public/' };
}

export function loadVercel(root) {
  return JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
}

export function apiFileSet(root) {
  const dir = path.join(root, 'api');
  if (!existsSync(dir)) return new Set();
  return new Set(readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, '')));
}

export { baseHref };

/** Paths .vercelignore already hides (Vercel removes them before the build). Evaluated with git's ignore rules in an empty repo. */
export function vercelIgnored(rootDir, files) {
  if (!existsSync(path.join(rootDir, '.vercelignore'))) return new Set();
  const tmp = mkdtempSync(path.join(tmpdir(), 'vi-'));
  try {
    execFileSync('git', ['init', '-q', tmp]);
    copyFileSync(path.join(rootDir, '.vercelignore'), path.join(tmp, '.gitignore'));
    const out = execFileSync('git', ['check-ignore', '--no-index', '--stdin'], { cwd: tmp, input: files.join('\n'), encoding: 'utf8' });
    return new Set(out.split('\n').filter(Boolean));
  } catch (e) {
    if (e.status === 1) return new Set();   // nothing ignored
    throw e;
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
