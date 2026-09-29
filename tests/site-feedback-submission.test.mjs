import test from 'node:test';
import assert from 'node:assert/strict';
import saveSiteSubmission, { prepareSiteSubmission, SITE_FEEDBACK_VERSION } from '../lib/site-feedback-submission.js';

const now = Date.parse('2026-09-29T10:00:00Z');
const base = { submissionId: '3f2b1c9e-8d4a-4b6f-9a1e-2c3d4e5f6a7b', feedback: 'The globe is lovely', page: '/learnings', submittedAt: '2026-09-29T09:59:00Z' };

test('prepares a main-site record in the shared feedback table shape', () => {
  const p = prepareSiteSubmission(base, now);
  assert.match(p.id, /^SITE-[0-9A-F]{32}$/);
  assert.equal(p.fields.fldA2YfDmo2PeMf4S, 'Main site');
  assert.equal(p.fields.fldCMmg1EGpixD2PH, 'site:/learnings');
  assert.equal(p.fields.fldnyOtEivKnWxC2Z, SITE_FEEDBACK_VERSION);
});

test('is idempotent for the same submission', () => {
  assert.equal(prepareSiteSubmission(base, now).id, prepareSiteSubmission({ ...base }, now).id);
});

test('rejects bad input loudly', () => {
  assert.throws(() => prepareSiteSubmission({ ...base, submissionId: 'x' }, now), /submission ID/);
  assert.throws(() => prepareSiteSubmission({ ...base, feedback: '   ' }, now), /feedback/);
  assert.throws(() => prepareSiteSubmission({ ...base, feedback: 'a'.repeat(5001) }, now), /feedback/);
  assert.throws(() => prepareSiteSubmission({ ...base, page: 'https://evil.example' }, now), /page/);
  assert.throws(() => prepareSiteSubmission({ ...base, page: '/../x' }, now), /page/);
  assert.throws(() => prepareSiteSubmission({ ...base, page: '/research' }, now), /research/);
  assert.throws(() => prepareSiteSubmission({ ...base, submittedAt: '2020-01-01T00:00:00Z' }, now), /submission time/);
});

function mockRes() {
  return { code: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
}

test('refuses outside production unless explicitly enabled', async () => {
  const prev = { ...process.env };
  delete process.env.SITE_FEEDBACK_CAPTURE_ENABLED; process.env.VERCEL_ENV = 'preview';
  const res = mockRes();
  await saveSiteSubmission({ method: 'POST', headers: {} }, res, { ...base, submittedAt: new Date().toISOString() });
  assert.equal(res.code, 503);
  process.env = prev;
});

test('rejects cross-origin posts', async () => {
  const prev = { ...process.env };
  process.env.SITE_FEEDBACK_CAPTURE_ENABLED = 'true';
  const res = mockRes();
  await saveSiteSubmission({ method: 'POST', headers: { origin: 'https://evil.example', host: 'turbulentground.com' } }, res, { ...base, submittedAt: new Date().toISOString() });
  assert.equal(res.code, 403);
  process.env = prev;
});
