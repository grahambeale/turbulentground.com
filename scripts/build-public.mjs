#!/usr/bin/env node
// Builds public/: ONLY the files in public-allowlist.json, same layout, so vercel.json
// (rewrites, redirects, cleanUrls, headers) keeps working unchanged and vercel.json's
// "outputDirectory": "public" deploys exactly the public site. Run after the other build steps.
//
//   node scripts/build-public.mjs                 production variant (VERCEL_ENV unset or production)
//   VERCEL_ENV=preview node scripts/build-public.mjs   adds the research review pages, with noindex
//
// Fails closed: an allowlist entry that matches nothing is an error. The preview-only pages are
// included only when VERCEL_ENV is exactly "preview", so a missing variable can never leak them.
import { rmSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllowlist, expandAllowlist, includePreview } from './public-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOINDEX = '<meta name="robots" content="noindex, nofollow">';

/** Add noindex to a preview-only page copy if it does not already carry a robots meta. */
export function withNoindex(html) {
  if (/<meta[^>]+name=["']robots["']/i.test(html)) return html;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}\n  ${NOINDEX}`);
  return `${NOINDEX}\n${html}`;
}

export function buildPublic({ rootDir = root, outDir = path.join(rootDir, 'public'), env = process.env.VERCEL_ENV } = {}) {
  const allowlist = loadAllowlist(rootDir);
  const preview = includePreview(env);
  const { files, errors } = expandAllowlist(rootDir, allowlist, { preview });
  if (errors.length) throw new Error(errors.join('\n'));
  rmSync(outDir, { recursive: true, force: true });
  let publicCount = 0, previewCount = 0;
  for (const [rel, meta] of files) {
    const dest = path.join(outDir, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    if (meta.group === 'previewOnly' && rel.endsWith('.html')) {
      writeFileSync(dest, withNoindex(readFileSync(path.join(rootDir, rel), 'utf8')));
    } else {
      copyFileSync(path.join(rootDir, rel), dest);
    }
    if (meta.group === 'previewOnly') previewCount++; else publicCount++;
  }
  return { publicCount, previewCount, preview };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const r = buildPublic();
    console.log(`[public] built public/: ${r.publicCount} public file(s)${r.preview ? ` + ${r.previewCount} preview-only page(s) with noindex` : ' (production variant: no preview-only pages)'}`);
  } catch (e) {
    console.error(`[public] BUILD FAILED: ${e.message}`);
    process.exit(1);
  }
}
