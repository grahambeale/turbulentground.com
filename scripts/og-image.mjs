// Resolves an article's social image (front-matter ogImage) to the absolute URL scrapers need.
// FB-20261003-OG-IMAGE-RELATIVE: articles carried the relative value "og-image.png", which resolves to
// /learnings/og-image.png (404); scrapers expect an absolute https URL anyway.
import { existsSync } from 'node:fs';
import path from 'node:path';

export const SITE_ORIGIN = 'https://www.turbulentground.com';

/**
 * Accepts: an absolute https URL on turbulentground.com (any host spelling; normalised to www),
 * an absolute https URL on another host (kept), a site-root path ("/og-image.png"), or a bare or
 * relative filename ("og-image.png", "images/x.png"), which is looked up at the site root first
 * and then under learnings/. Throws when a local file does not exist, so a bad value fails the build.
 */
export function resolveOgImage(value, rootDir) {
  const v = String(value || '').trim();
  if (!v) throw new Error('ogImage is empty');
  const localPath = (p) => {
    const clean = p.split('?')[0].split('#')[0];
    if (!existsSync(path.join(rootDir, clean))) throw new Error(`ogImage points at a file that does not exist: ${clean}`);
    return `${SITE_ORIGIN}${clean.startsWith('/') ? '' : '/'}${clean}`;
  };
  if (/^http:\/\//i.test(v)) throw new Error(`ogImage must be https: ${v}`);
  if (/^https:\/\//i.test(v)) {
    const u = new URL(v);
    if (u.hostname === 'turbulentground.com' || u.hostname === 'www.turbulentground.com') return localPath(u.pathname) + u.search;
    return v;   // another host: cannot be verified here
  }
  if (v.startsWith('/')) return localPath(v);
  const rel = v.replace(/^\.\//, '');
  if (existsSync(path.join(rootDir, rel))) return localPath('/' + rel);
  if (existsSync(path.join(rootDir, 'learnings', rel))) return localPath('/learnings/' + rel);
  throw new Error(`ogImage "${v}" not found at the site root or under learnings/`);
}
