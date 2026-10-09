// scripts/release-health.sh (the post-deploy API health check) and how scripts/release.sh uses it.
// A local HTTP server stands in for production, so a 5xx can be simulated. No network, nothing real is called.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HEALTH = path.join(root, 'scripts', 'release-health.sh');
const releaseSh = readFileSync(path.join(root, 'scripts', 'release.sh'), 'utf8');

/** A fake production: `responses` maps a path prefix to { status, headers }. Records every request. */
function fake(responses = {}) {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push(req.url);
    const key = Object.keys(responses).find((k) => req.url.startsWith(k));
    const r = responses[key] || { status: 200 };
    res.writeHead(r.status, r.headers || { 'content-type': 'application/json' });
    res.end('{}');
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, seen, url: `http://127.0.0.1:${server.address().port}` })));
}
const run = (cmd, args, opts = {}) => new Promise((resolve) => {
  const p = spawn(cmd, args, opts); let out = '', err = '';
  p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d));
  p.on('close', (code) => resolve({ code, out, err }));
});
const health = (url) => run('bash', [HEALTH, url]);

test('all three routes healthy: passes, and lookup is called with a dummy token', async () => {
  const f = await fake();
  const r = await health(f.url);
  f.server.close();
  assert.equal(r.code, 0, r.err);
  assert.equal(f.seen.length, 3);
  assert.deepEqual(f.seen.map((u) => u.split('?')[0]), ['/api/research-participation', '/api/research-public-start', '/api/research-lookup']);
  assert.match(f.seen[2], /\?t=synthetic-release-health-check$/);
});

test('4xx is fine: a dummy token is expected to be refused', async () => {
  const f = await fake({ '/api/research-lookup': { status: 403 }, '/api/research-participation': { status: 404 } });
  const r = await health(f.url);
  f.server.close();
  assert.equal(r.code, 0, r.err);
});

for (const [route, status] of [['/api/research-participation', 500], ['/api/research-public-start', 500], ['/api/research-lookup', 500], ['/api/research-public-start', 503], ['/api/research-participation', 502]]) {
  test(`a simulated ${status} on ${route} fails the check and names the route`, async () => {
    const f = await fake({ [route]: { status } });
    const r = await health(f.url);
    f.server.close();
    assert.notEqual(r.code, 0);
    assert.match(r.err, new RegExp(`FAIL +GET ${route.replace(/[/]/g, '\\/')}.*${status}`));
    assert.equal(f.seen.length, 3, 'all three routes are still checked, so every failure is reported');
  });
}

test('no response at all (connection refused) fails', async () => {
  const f = await fake(); const url = f.url; await new Promise((r) => f.server.close(r));
  const r = await health(url);
  assert.notEqual(r.code, 0);
  assert.match(r.err, /no response/);
});

test("a Vercel Security Checkpoint challenge fails: it proves nothing about the route", async () => {
  const f = await fake({ '/api/research-participation': { status: 403, headers: { 'x-vercel-mitigated': 'challenge' } } });
  const r = await health(f.url);
  f.server.close();
  assert.notEqual(r.code, 0);
  assert.match(r.err, /Security Checkpoint/);
});

// ---- release.sh wiring: a failed health check fails the release loudly and leaves the lease held ----
/** Runs release.sh's own api_health() against a fake production, with the same say/die and cleanup behaviour. */
function apiHealthHarness(prodUrl) {
  const fn = releaseSh.match(/^api_health\(\) \{[\s\S]*?^\}/m)?.[0];
  const say = releaseSh.match(/^say\(\).*$/m)?.[0];
  const die = releaseSh.match(/^die\(\).*$/m)?.[0];
  assert.ok(fn && say && die, 'api_health, say and die are defined in release.sh');
  const script = [
    'set -euo pipefail', `script_dir='${path.join(root, 'scripts')}'`, `PROD_URL='${prodUrl}'`, 'lease_keep=0', 'state=x',
    say, die, fn,
    `trap 'echo "LEASE_KEEP=$lease_keep"' EXIT`, 'api_health 1234567890abcdef',
  ].join('\n');
  return run('bash', ['-c', script]);
}

test('release.sh: a 5xx makes api_health exit non-zero, sets lease_keep, and says what to do', async () => {
  const f = await fake({ '/api/research-public-start': { status: 500 } });
  const r = await apiHealthHarness(f.url);
  f.server.close();
  assert.notEqual(r.code, 0);
  assert.match(r.out, /LEASE_KEEP=1/);
  assert.match(r.err, /production API health check FAILED for 1234567/);
  assert.match(r.err, /do not push again/);
});

test('release.sh: healthy production lets api_health pass without keeping the lease', async () => {
  const f = await fake();
  const r = await apiHealthHarness(f.url);
  f.server.close();
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /LEASE_KEEP=0/);
});

test('release.sh: both the release path and --verify-only run the check, and the cleanup honours lease_keep', () => {
  assert.equal((releaseSh.match(/^\s*api_health "\$/gm) || []).length, 2, 'called once for a release and once for --verify-only');
  assert.match(releaseSh, /wait_for_production "\$pushed_sha"\napi_health "\$pushed_sha"\nrun_specs/);
  assert.match(releaseSh, /wait_for_production "\$full"\n\s+api_health "\$full"\n\s+run_specs/);
  assert.match(releaseSh, /if \[ "\$lease_keep" = 1 \]; then[\s\S]*?LEFT HELD[\s\S]*?else\s+lease_release \|\| true\s+fi/);
});
