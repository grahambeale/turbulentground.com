#!/usr/bin/env node
// Crawl-and-hash parity for the public/ migration (research/openspec/changes/public-allowlist-output, D4).
//
//   node scripts/audit/crawl-parity.mjs routes                    print the route manifest skeleton (JSON)
//   node scripts/audit/crawl-parity.mjs record  --base URL --out FILE      measure a LIVE site, write the baseline
//   node scripts/audit/crawl-parity.mjs compare --base URL --manifest FILE [--env preview|production]
//   node scripts/audit/crawl-parity.mjs compare --results FILE --manifest FILE [--env ...]   (results gathered elsewhere)
//
// Previews are behind Vercel authentication, so crawl them from the authenticated browser pane or the Vercel
// connector and feed the JSON to `compare --results`; this script's own fetcher is for public hosts.
// THROTTLED on purpose (operations/workflow.md, Verification crawls): at most 4 requests at a time, about 1 s
// apart per worker, so Vercel's Security Checkpoint is not tripped. HTML is hashed with the preview toolbar
// <script> tag removed (Vercel appends it to preview HTML only).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllowlist, expandAllowlist, loadVercel, vercelIgnored } from '../public-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TOOLBAR_RE = /<script async data-explicit-opt-in="true"[^>]*><\/script>\s*$/;
const CONCURRENCY = 4;
const DELAY_MS = 1000;

/** Public URL(s) for a file inside public/ (cleanUrls, index files, vercel.json rewrites). */
export function routesForFile(rel, vercel) {
  if (!rel.endsWith('.html')) return ['/' + rel];
  let clean = '/' + rel.replace(/\.html$/, '');
  if (clean.endsWith('/index')) clean = clean.slice(0, -'/index'.length) || '/';
  const routes = new Set([clean]);
  for (const r of vercel.rewrites || []) {
    const dest = (r.destination || '').split('?')[0];
    if (dest === '/' + rel || dest === clean) routes.add(r.source);
  }
  return [...routes];
}

/** Manifest skeleton from the repo: public routes, preview-only routes, and routes that must 404. */
export function buildRouteManifest(rootDir = root) {
  const allowlist = loadAllowlist(rootDir);
  const vercel = loadVercel(rootDir);
  const { files: pub } = expandAllowlist(rootDir, allowlist, { preview: false });
  const { files: withPreview } = expandAllowlist(rootDir, allowlist, { preview: true });
  const tracked = execFileSync('git', ['ls-files'], { cwd: rootDir, encoding: 'utf8' }).split('\n').filter(Boolean);
  const routes = [];
  for (const rel of pub.keys()) for (const r of routesForFile(rel, vercel)) routes.push({ route: r, file: rel, kind: 'public' });
  for (const rel of withPreview.keys()) if (!pub.has(rel)) for (const r of routesForFile(rel, vercel)) routes.push({ route: r, file: rel, kind: 'previewOnly' });
  const served = new Set(withPreview.keys());
  const hidden = vercelIgnored(rootDir, tracked);   // already 404 through the second layer; not what this change newly hides
  const WITHHELD = new Set(['package.json', 'package-lock.json', '.env.example']);   // Vercel already 404s these
  for (const rel of tracked) {
    if (served.has(rel) || rel.startsWith('api/') || WITHHELD.has(rel) || hidden.has(rel)) continue;
    // Only files that production could have served matter; ignored-by-.vercelignore files are 404 already but cheap to check.
    for (const r of routesForFile(rel, vercel)) routes.push({ route: r, file: rel, kind: 'absent' });
  }
  const seen = new Set();
  return routes.filter((x) => !seen.has(x.kind + x.route) && seen.add(x.kind + x.route));
}

export function hashBody(route, contentType, bytes) {
  let buf = Buffer.from(bytes);
  if (/html/.test(contentType || '')) {
    const text = buf.toString('utf8');
    if (TOOLBAR_RE.test(text)) buf = Buffer.from(text.replace(TOOLBAR_RE, ''));
  }
  return { length: buf.length, sha256: createHash('sha256').update(buf).digest('hex') };
}

async function measure(base, entry) {
  const res = await fetch(base.replace(/\/$/, '') + entry.route, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 parity-check' } });
  const contentType = (res.headers.get('content-type') || '').split(';')[0];
  const body = new Uint8Array(await res.arrayBuffer());
  const h = hashBody(entry.route, contentType, body);
  return { route: entry.route, status: res.status, contentType, ...h, location: res.headers.get('location') || undefined };
}

async function crawl(base, entries) {
  const out = new Array(entries.length);
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= entries.length) return;
      out[i] = await measure(base, entries[i]);
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return out;
}

/**
 * Compare measured results with the manifest.
 * env 'production': public routes must match the baseline exactly; previewOnly and absent routes must 404.
 * env 'preview':    public routes must match; previewOnly must be 200; absent routes must 404.
 * Returns { problems: string[], checked: number }.
 */
export function compare(manifest, results, env = 'production') {
  const byRoute = new Map(results.map((r) => [r.route, r]));
  const problems = [];
  let checked = 0;
  for (const m of manifest.routes) {
    const got = byRoute.get(m.route);
    checked++;
    if (!got) { problems.push(`${m.route}: not measured`); continue; }
    if (m.kind === 'public') {
      const exp = m.expect;
      for (const k of ['status', 'contentType', 'length', 'sha256']) {
        if (exp[k] !== got[k]) problems.push(`${m.route}: ${k} ${exp[k]} -> ${got[k]}`);
      }
    } else if (m.kind === 'previewOnly') {
      const want = env === 'preview' ? 200 : 404;
      if (got.status !== want) problems.push(`${m.route}: preview-only page should be ${want} on ${env}, got ${got.status}`);
    } else if (m.kind === 'absent') {
      if (got.status !== 404) problems.push(`${m.route}: must 404, got ${got.status}`);
    }
  }
  return { problems, checked };
}

function arg(name) { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; }

async function main() {
  const cmd = process.argv[2];
  if (cmd === 'routes') { console.log(JSON.stringify(buildRouteManifest(), null, 2)); return; }
  if (cmd === 'record') {
    const base = arg('--base'); const out = arg('--out');
    if (!base || !out) throw new Error('record needs --base and --out');
    const skeleton = buildRouteManifest();
    const toMeasure = skeleton.filter((x) => x.kind === 'public');
    const measured = await crawl(base, toMeasure);
    const routes = skeleton.map((x) => {
      if (x.kind !== 'public') return x;
      const m = measured[toMeasure.indexOf(x)];
      return { ...x, expect: { status: m.status, contentType: m.contentType, length: m.length, sha256: m.sha256 } };
    });
    const bad = routes.filter((r) => r.kind === 'public' && r.expect.status >= 300);
    if (bad.length) console.error('WARNING: public routes that are not 2xx on the baseline:', bad.map((b) => `${b.route} ${b.expect.status}`).join(', '));
    writeFileSync(out, JSON.stringify({ recordedFrom: base, recordedAt: new Date().toISOString(), note: 'public = expected bytes; previewOnly = 200 on previews, 404 on production; absent = served on the baseline site but must 404 after the migration (files .vercelignore already hides are not listed).', routes }, null, 2) + '\n');
    console.log(`[parity] recorded ${routes.length} route(s) from ${base} to ${out}`);
    return;
  }
  if (cmd === 'compare') {
    const manifest = JSON.parse(readFileSync(arg('--manifest'), 'utf8'));
    const env = arg('--env') || 'production';
    let results;
    if (arg('--results')) results = JSON.parse(readFileSync(arg('--results'), 'utf8'));
    else results = await crawl(arg('--base'), manifest.routes);
    const r = compare(manifest, results, env);
    if (r.problems.length) { console.error(`[parity] ${r.problems.length} difference(s) in ${r.checked} route(s):\n  ${r.problems.join('\n  ')}`); process.exit(1); }
    console.log(`[parity] identical: ${r.checked} route(s) match the baseline (${env})`);
    return;
  }
  console.error('usage: crawl-parity.mjs routes | record --base URL --out FILE | compare --manifest FILE (--base URL | --results FILE) [--env preview|production]');
  process.exit(2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
