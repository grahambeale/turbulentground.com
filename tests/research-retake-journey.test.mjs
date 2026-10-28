// Retake journey (decision log 2026-10-27, benchmark compatibility revision 2, D4; tasks.md 13c, 13d, 13e, 13g).
// Synthetic tokens and names only.
import assert from 'node:assert/strict';
import invite from '../api/research-invite.js';
import lookup from '../api/research-lookup.js';
import save from '../api/research-save-progress.js';
import submit from '../api/research-submit.js';
import { computeStatementBenchmark } from '../api/_research-benchmarks.js';

const oldFetch = global.fetch, oldEnv = { ...process.env };
process.env.RESEARCH_ADMIN_KEY = 'test-admin-key'; process.env.AIRTABLE_RESEARCH_TOKEN = 'synthetic';
const v3 = 'phase3-v3-2026-09-08', v5 = 'phase3-v5-2026-09-25-examples';
const PREVIOUS = 'synthetic-previous-token', RETAKE = 'synthetic-retake-token';
const F = { token: 'fld6danERot7gjOqb', name: 'fldGto31lmx5KwyNr', email: 'fldePJtCCYwLsmNjp', status: 'fldEhm06lLDvEeF6q', origin: 'fldzOXQwAKsJFvjx4', previous: 'fld7KtQmkOlnXUgCJ' };
const R = { token: 'flduL4PmBEfH9rLpz', version: 'fldHJ4KNzMbpzdob6', completedAt: 'fld8sYjswX21vvVXz', consentEmails: 'flduWhkQo6u5O3nIp', origin: 'fld7t6e21yjvQmTTh', pairs: 'fldvxb2mrIYVKLGVM', floor: 'fldc1EMbDAHAO99Av' };
const res = () => ({ _status: 200, status(s) { this._status = s; return this; }, setHeader() {}, json(b) { this.body = b; return this; } });

// One synthetic base: an earlier V3 completer (PREVIOUS) and, once minted, their retake row (RETAKE).
let identity = { [PREVIOUS]: { id: 'recIdPrev', fields: { [F.token]: PREVIOUS, [F.name]: 'Synthetic Person', [F.email]: 'synthetic@example.com', [F.status]: 'Completed' } } };
let responses = { [PREVIOUS]: { id: 'recRespPrev', fields: { [R.token]: PREVIOUS, [R.version]: v3, [R.completedAt]: '2026-09-10T00:00:00Z', [R.consentEmails]: true, [R.pairs]: '{}' } } };
const writes = [];
global.fetch = async (url, options = {}) => {
  const u = String(url); const method = options.method || 'GET';
  const table = u.includes('tblwpricYYzx4rmiR') ? identity : u.includes('tblL9mf8VfAmbhuG7') ? responses : null;
  const tokenOf = (m) => m && decodeURIComponent(m[1]);
  if (method === 'GET') {
    const m = u.match(/filterByFormula=([^&]+)/); const tok = tokenOf(m) && tokenOf(m).match(/="([^"]+)"/)?.[1];
    const row = table && tok ? table[tok] : null;
    return { ok: true, json: async () => ({ records: row ? [row] : [] }), text: async () => '' };
  }
  const body = JSON.parse(options.body); writes.push({ u, method, body });
  if (method === 'POST' && table === identity) { const f = body.records[0].fields; identity[f[F.token]] = { id: 'recIdRetake', fields: f }; return { ok: true, json: async () => ({ records: [{ id: 'recIdRetake' }] }), text: async () => '' }; }
  if (method === 'POST' && table === responses) { const f = (body.records || [body])[0].fields; responses[f[R.token]] = { id: 'recRespRetake', fields: f }; return { ok: true, json: async () => ({ records: [{ id: 'recRespRetake', fields: f }] }), text: async () => '' }; }
  if (method === 'PATCH') { const id = u.split('/').pop(); const row = Object.values(table).find(r => r.id === id); if (row) Object.assign(row.fields, body.fields); return { ok: true, json: async () => ({ id, fields: row ? row.fields : {} }), text: async () => '' }; }
  throw new Error('unexpected ' + method + ' ' + u);
};

try {
  const auth = { authorization: 'Bearer test-admin-key' };
  // 13c: minting needs the admin key, an existing completed participant with study-email consent and an address.
  let r = res(); await invite({ method: 'POST', headers: {}, body: { action: 'retake-invite', previousToken: PREVIOUS } }, r); assert.equal(r._status, 401);
  r = res(); await invite({ method: 'POST', headers: auth, body: { action: 'retake-invite', previousToken: 'synthetic-unknown' } }, r); assert.equal(r._status, 404);
  responses[PREVIOUS].fields[R.consentEmails] = false;
  r = res(); await invite({ method: 'POST', headers: auth, body: { action: 'retake-invite', previousToken: PREVIOUS } }, r); assert.equal(r._status, 409);
  responses[PREVIOUS].fields[R.consentEmails] = true; assert.equal(writes.length, 0);
  r = res(); await invite({ method: 'POST', headers: auth, body: { action: 'retake-invite', previousToken: PREVIOUS } }, r);
  assert.equal(r._status, 201); assert.equal(r.body.retake, true);
  const minted = writes[0].body.records[0].fields; const newToken = minted[F.token];
  assert(newToken && newToken !== PREVIOUS); assert(r.body.inviteUrl.endsWith('/take-part?t=' + newToken));
  assert.equal(minted[F.origin], 'retake'); assert.equal(minted[F.previous], PREVIOUS); assert.equal(minted[F.status], 'Not sent');
  assert.equal(minted[F.name], 'Synthetic Person'); assert.equal(minted[F.email], 'synthetic@example.com');
  assert.equal(identity[PREVIOUS].fields[F.token], PREVIOUS, 'the earlier row keeps its token');
  assert.equal(identity[PREVIOUS].fields[F.status], 'Completed');
  r = res(); await invite({ method: 'POST', headers: auth, body: { action: 'retake-invite', previousToken: newToken } }, r); assert.equal(r._status, 409, 'a retake token cannot seed another retake');
  // Rename the minted row's token to a stable synthetic value for the rest of the journey.
  identity[RETAKE] = identity[newToken]; delete identity[newToken]; identity[RETAKE].fields[F.token] = RETAKE;

  // 13d: lookup treats the retake like an owner invite (no expiry rules) and labels its route; the earlier token still resolves to its completion.
  r = res(); await lookup({ method: 'GET', query: { t: RETAKE } }, r); assert.equal(r._status, 200); assert.equal(r.body.valid, true); assert.equal(r.body.completed, false); assert.equal(r.body.origin, 'retake'); assert.equal(r.body.savedState, null);
  r = res(); await lookup({ method: 'GET', query: { t: PREVIOUS } }, r); assert.equal(r.body.valid, true); assert.equal(r.body.completed, true); assert.equal(r.body.origin, 'owner_invite');
  assert(!JSON.stringify(r.body).includes(PREVIOUS)); assert(!JSON.stringify(r.body).includes('synthetic@example.com'));

  // Scale answers are never pre-filled: a fresh retake starts with nothing saved (13f).
  const pairResponses = Object.fromEntries(Array.from({ length: 12 }, (_, i) => ['d' + (i + 1), { contribution: 4, conditions: 2 }]));
  r = res(); await save({ method: 'POST', body: { token: RETAKE, consent: { takingPart: true }, pairResponses: { d1: { contribution: 3 } }, instrumentVersion: v5 } }, r); assert.equal(r._status, 200);
  assert.equal(responses[RETAKE].fields[R.origin], 'retake'); assert.equal(responses[RETAKE].fields[R.version], v5);
  r = res(); await submit({ method: 'POST', body: { token: RETAKE, consent: { takingPart: true }, pairResponses, instrumentVersion: v5 } }, r); assert.equal(r._status, 200, JSON.stringify(r.body));
  assert.equal(responses[RETAKE].fields[R.origin], 'retake'); assert.equal(identity[RETAKE].fields[F.status], 'Completed');
  assert.equal(responses[PREVIOUS].fields[R.version], v3, 'the earlier response is untouched'); assert.equal(identity[PREVIOUS].fields[F.status], 'Completed');
  r = res(); await submit({ method: 'POST', body: { token: RETAKE, consent: { takingPart: true }, pairResponses, instrumentVersion: v5 } }, r); assert.equal(r._status, 409, 'a retake completes once');

  // 13e: the benchmark counts the retake once in the pooled cohort and reports it for disclosure; the V3 original is not pooled.
  const rows = [responses[PREVIOUS], { id: 'recRespRetake', fields: { ...responses[RETAKE].fields, [R.completedAt]: '2026-10-28T00:00:00Z', [R.floor]: true, [R.pairs]: JSON.stringify(pairResponses) } }];
  const b = computeStatementBenchmark(rows, v5, { allowedTokens: new Set([PREVIOUS, RETAKE]), retakeTokens: new Set([RETAKE]) });
  assert.equal(b.cohortSize, 1); assert.equal(b.retakeCount, 1); assert.deepEqual(b.versionsPresent, [v5]);
  console.log('PASS: retake invite minted without touching the earlier row; retake journey runs as an owner invite and stamps submissionOrigin retake; earlier token still resolves; benchmark counts the retake once and discloses it');
} finally { global.fetch = oldFetch; for (const k of Object.keys(process.env)) if (!(k in oldEnv)) delete process.env[k]; Object.assign(process.env, oldEnv); }
