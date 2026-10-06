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

// ---- Graham's test completions are left out by record id (research/excluded-responses.json) ----
import { readFileSync } from 'node:fs';
import { loadExcludedIds } from '../lib/research-phase31/participation-count.js';

const LIST = JSON.parse(readFileSync(new URL('../research/excluded-responses.json', import.meta.url), 'utf8'));
const withId = (id, token, opts) => ({ id, ...rec(token, opts) });
// The state on 6 Oct 2026: 28 counted completions, of which 5 are Graham's tests.
const fixture28 = () => [
  ...LIST.excluded.map((e, i) => withId(e.id, `test-token-${i}`)),
  ...Array.from({ length: 23 }, (_, i) => withId(`recFixture${String(i).padStart(4, '0')}`, `real-token-${i}`)),
];

test('the exclusion list is complete: record id, reason, decision-log reference, approver', () => {
  assert.equal(LIST.excluded.length, 5);
  assert.deepEqual(LIST.excluded.map((e) => e.id).sort(), ['rec3L74uHSmNBHjMr', 'recCl7XWscZCUUbMy', 'recJ9ffZOxOK2j3IP', 'recSb8eWUrKUCQWdT', 'recTBBSB5qhlxbB3C']);
  for (const e of LIST.excluded) {
    assert.match(e.id, /^rec[A-Za-z0-9]{14}$/);
    for (const k of ['reason', 'decision_log', 'approved_by']) assert.ok(typeof e[k] === 'string' && e[k].trim(), `${e.id} has ${k}`);
  }
  assert.equal(new Set(LIST.excluded.map((e) => e.id)).size, LIST.excluded.length, 'no duplicate ids');
  assert.match(LIST._comment, /same list/i);
});

test('the counter returns 23 for the 6 Oct fixture (28 counted, 5 excluded)', () => {
  const s = summariseParticipation(fixture28(), new Date('2026-10-06T09:00:00Z'), loadExcludedIds());
  assert.equal(s.completed, 23);
  assert.equal(s.remaining, FIRST_FINDINGS_MILESTONE - 23);
});

test('without the list the same fixture counts 28 (the list is what makes it 23)', () => {
  assert.equal(summariseParticipation(fixture28(), new Date(), new Set()).completed, 28);
});

test('an excluded record is skipped by id even if its token is shared with a real record', () => {
  const s = summariseParticipation([withId('recJ9ffZOxOK2j3IP', 'shared'), withId('recFixture0001', 'shared'), withId('recFixture0002', 'other')], new Date(), loadExcludedIds());
  assert.equal(s.completed, 2);
});

test('the endpoint returns 23 end to end (mocked Airtable, 28 records)', async () => {
  process.env.AIRTABLE_RESEARCH_TOKEN = 'x';
  const realFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ records: fixture28() }) });
  const res = mockRes(); await participationCount({ method: 'GET' }, res);
  global.fetch = realFetch; delete process.env.AIRTABLE_RESEARCH_TOKEN;
  assert.equal(res.code, 200); assert.equal(res.body.completed, 23);
});

test('a missing or malformed list fails loudly rather than overcounting', () => {
  assert.throws(() => loadExcludedIds(new URL('./no-such-file.json', import.meta.url)));
  assert.throws(() => loadExcludedIds(new URL('../package.json', import.meta.url)), /no excluded array/);
});
