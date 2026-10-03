#!/usr/bin/env node
// Fails the build unless public/ is exactly the allowlist and everything it references is present.
//   node scripts/audit/check-public.mjs                       (VERCEL_ENV as in the environment)
//   VERCEL_ENV=preview node scripts/audit/check-public.mjs    (expects the preview-only pages too)
//
// Checks (research/openspec/changes/public-allowlist-output/design.md):
//   1 exactness: public/ equals the expanded allowlist, nothing extra, nothing missing
//   2 forbidden paths: no tests, scripts, lib, content, partials, operations, agent config, markdown, scripts...
//   3 referenced assets: every local reference in HTML, CSS and JavaScript resolves inside public/
//      (relative to the page or its <base>, cleanUrls, vercel.json rewrites and redirects; /api/ routes
//      must match an api/*.js file or a rewrite)
//   4 dynamic assets: every allowlist entry marked dynamic is still referenced somewhere
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  globToRegExp, loadAllowlist, expandAllowlist, includePreview, walk, forbiddenReason,
  extractReferences, resolveReference, loadVercel, apiFileSet, baseHref,
} from '../public-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function checkPublic({ rootDir = root, publicDir = path.join(rootDir, 'public'), env = process.env.VERCEL_ENV } = {}) {
  const errors = [];
  if (!existsSync(publicDir)) return { errors: [`public/ does not exist (${publicDir}); run scripts/build-public.mjs first`], externals: [], stats: {} };
  const allowlist = loadAllowlist(rootDir);
  const preview = includePreview(env);
  const { files: expected, errors: expandErrors } = expandAllowlist(rootDir, allowlist, { preview });
  errors.push(...expandErrors);
  const actual = new Set(walk(publicDir, publicDir, new Set()));

  // 1 exactness
  for (const f of expected.keys()) if (!actual.has(f)) errors.push(`MISSING from public/: ${f}`);
  for (const f of actual) if (!expected.has(f)) errors.push(`EXTRA in public/ (not in the allowlist${preview ? '' : ' for the production variant'}): ${f}`);

  // 2 forbidden paths
  for (const f of actual) {
    const why = forbiddenReason(f, allowlist);
    if (why) errors.push(`FORBIDDEN in public/: ${f} (${why})`);
  }

  // 3 referenced assets (and gather every referenced path for check 4)
  const vercel = loadVercel(rootDir);
  const apiFiles = apiFileSet(rootDir);
  const has = (p) => actual.has(p);
  const ignore = allowlist.ignoreReferences || [];
  const externals = new Set();
  const referencedTexts = [];
  const referencedPaths = new Set();
  for (const f of [...actual].filter((x) => /\.(html|css|js|mjs)$/.test(x))) {
    const text = readFileSync(path.join(publicDir, f), 'utf8');
    referencedTexts.push(text);
    const base = f.endsWith('.html') ? baseHref(text) : null;
    for (const m of text.matchAll(/https?:\/\/[^\s"'<>)`]+/g)) externals.add(m[0].replace(/[.,;]+$/, ''));
    for (const { ref, kind } of extractReferences(f, text)) {
      if (ignore.some((i) => i.ref === ref && globToRegExp(i.from).test(f))) continue;
      const res = resolveReference(ref, f, { has, vercel, apiFiles, base });
      if (res.ok) { if (!res.how.includes(' ') && has(res.how)) referencedPaths.add(res.how); continue; }
      errors.push(`BROKEN REFERENCE in ${f}: ${ref} (${kind}; ${res.how})`);
    }
  }

  // 4 dynamic assets: still referenced by name somewhere in the public HTML/CSS/JS
  const haystack = referencedTexts.join('\n');
  for (const [rel, meta] of expected) {
    if (!meta.dynamic) continue;
    const name = rel.split('/').pop();
    if (!haystack.includes(name)) errors.push(`STALE dynamic entry: ${rel} is in the allowlist as referenced from ${meta.referencedFrom || 'JavaScript'} but nothing in public/ mentions ${name}`);
  }
  return { errors, externals: [...externals].sort(), stats: { files: actual.size, expected: expected.size, preview, referenced: referencedPaths.size } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = checkPublic();
  if (r.errors.length) {
    console.error(`[public] CHECK FAILED (${r.errors.length}):\n  ${r.errors.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`[public] check passed: ${r.stats.files} file(s) = allowlist${r.stats.preview ? ' incl. preview-only pages' : ' (production variant)'}; every local reference resolves; ${r.externals.length} external URL(s) not followed`);
}
