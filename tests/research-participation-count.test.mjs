import test from 'node:test';
import assert from 'node:assert/strict';
import participationCount, { summariseParticipation, FIRST_FINDINGS_MILESTONE } from '../lib/research-phase31/participation-count.js';
import { PAIRED_VERSION } from '../api/_research-instruments.js';

const rec = (token, opts = {}) => ({ fields: { flduL4PmBEfH9rLpz: token, fld8sYjswX21vvVXz: opts.done === false ? undefined : '2026-09-20T10:00:00Z', fldc1EMbDAHAO99Av: opts.floor !== false, fldHJ4KNzMbpzdob6: opts.v || 'phase3-v1' } });

test('counts unique completed tokens that meet the floor', () => {
  const s = summariseParticipation([rec('a'), rec('a'), rec('b', { v: PAIRED_VERSION }), rec('c', { floor: false }), rec('d', { done: false }), rec('')]);
  assert.equal(s.completed, 2);
  assert.equal(s.currentVersionCompleted, 1);
  assert.equal(s.milestone, FIRST_FINDINGS_MILESTONE);
  assert.equal(s.remaining, FIRST_FINDINGS_MILESTONE - 2);
});

test('returns counts only, never tokens or answers', () => {
  const s = summariseParticipation([rec('secret-token')]);
  assert.ok(!JSON.stringify(s).includes('secret-token'));
  assert.deepEqual(Object.keys(s).sort(), ['benchmarkMin', 'completed', 'currentVersion', 'currentVersionCompleted', 'milestone', 'remaining', 'updatedAt']);
});

function mockRes() { return { code: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } }; }

test('fails loudly without a token and never caches the failure', async () => {
  const prev = process.env.AIRTABLE_RESEARCH_TOKEN; delete process.env.AIRTABLE_RESEARCH_TOKEN;
  const res = mockRes(); await participationCount({ method: 'GET' }, res);
  assert.equal(res.code, 503); assert.equal(res.headers['Cache-Control'], 'no-store');
  if (prev) process.env.AIRTABLE_RESEARCH_TOKEN = prev;
});

test('paginates and caches a success briefly', async () => {
  process.env.AIRTABLE_RESEARCH_TOKEN = 'x';
  const pages = [{ records: [rec('a')], offset: 'o1' }, { records: [rec('b')] }];
  const realFetch = global.fetch; let calls = 0;
  global.fetch = async () => ({ ok: true, json: async () => pages[calls++] });
  const res = mockRes(); await participationCount({ method: 'GET' }, res);
  global.fetch = realFetch; delete process.env.AIRTABLE_RESEARCH_TOKEN;
  assert.equal(res.code, 200); assert.equal(res.body.completed, 2); assert.equal(calls, 2);
  assert.match(res.headers['Cache-Control'], /s-maxage=300/);
});

test('rejects non-GET', async () => {
  const res = mockRes(); await participationCount({ method: 'POST' }, res);
  assert.equal(res.code, 405);
});
