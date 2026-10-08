// The route manifest tests/fixtures/public-parity.json must stay consistent with what is actually deployed, in step
// with public-allowlist.json and vercel.json. This is a structural check (which routes exist, and why); it does not
// compare bytes, and it does not crawl anything. Added after the 8 Oct 2026 decommission, when the fixture was found
// to be read by no test at all (its byte hashes had been stale since 3 Oct without anything failing).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadAllowlist, expandAllowlist, loadVercel } from '../scripts/public-lib.mjs';
import { routesForFile } from '../scripts/audit/crawl-parity.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Pure check, so each rule can be shown to fail on a deliberate fault. Returns a list of problems. */
export function fixtureProblems(fixture, publicFiles, vercel) {
  const problems = [];
  const routeSet = new Set(fixture.routes.map((r) => r.route));
  const servedBy = new Map();   // route -> file
  for (const f of publicFiles) for (const r of routesForFile(f, vercel)) servedBy.set(r, f);
  const redirectSources = new Set((vercel.redirects || []).map((r) => r.source));

  for (const r of fixture.routes) {
    if (r.kind === 'public' && r.expect?.status === 200) {
      if (servedBy.get(r.route) !== r.file) problems.push(`${r.route}: expected to be served by ${r.file}, but the allowlist serves it from ${servedBy.get(r.route) ?? 'nothing'}`);
    } else if (r.kind === 'public' && r.expect?.status >= 300) {
      if (!redirectSources.has(r.route)) problems.push(`${r.route}: recorded as a ${r.expect.status} redirect but vercel.json has no redirect from it`);
    } else if (r.kind === 'absent') {
      if (servedBy.has(r.route)) problems.push(`${r.route}: recorded as must-404, but ${servedBy.get(r.route)} is allowlisted and serves it`);
    }
  }
  for (const f of publicFiles) {
    if (!routesForFile(f, vercel).some((r) => routeSet.has(r))) problems.push(`${f}: allowlisted but no route for it in the fixture (add it, or remove it from the allowlist)`);
  }
  return problems;
}

const fixture = JSON.parse(readFileSync(path.join(root, 'tests', 'fixtures', 'public-parity.json'), 'utf8'));
const vercel = loadVercel(root);
const { files, errors } = expandAllowlist(root, loadAllowlist(root), { preview: false });

test('the real fixture is consistent with the allowlist and vercel.json', () => {
  assert.deepEqual(errors, []);
  assert.deepEqual(fixtureProblems(fixture, [...files.keys()], vercel), []);
});

test('each rule fails on a deliberate fault', () => {
  const ok = { route: '/about', file: 'about.html', kind: 'public', expect: { status: 200 } };
  const v = { redirects: [{ source: '/old' }] };
  const base = { routes: [ok, { route: '/old', kind: 'public', file: 'vercel.json', expect: { status: 308 } }, { route: '/secret', kind: 'absent' }] };
  assert.deepEqual(fixtureProblems(base, ['about.html'], v), []);
  // a page removed from the allowlist but still recorded as served
  assert.match(fixtureProblems(base, [], v).join('\n'), /\/about: expected to be served by about\.html/);
  // an allowlisted page with no fixture route
  assert.match(fixtureProblems(base, ['about.html', 'new.html'], v).join('\n'), /new\.html: allowlisted but no route/);
  // a redirect recorded in the fixture that vercel.json no longer has
  assert.match(fixtureProblems(base, ['about.html'], { redirects: [] }).join('\n'), /\/old: recorded as a 308 redirect but vercel\.json has no redirect/);
  // a must-404 route that an allowlisted file now serves
  assert.match(fixtureProblems(base, ['about.html', 'secret.html'], v).join('\n'), /\/secret: recorded as must-404/);
});
