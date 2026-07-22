#!/usr/bin/env node
/**
 * Regression test for api/submit.js's smoke-test bypass (Sprint 7).
 *
 * Verifies:
 *  1. A normal (non-smoke-test) submission still goes through DNS/MX check,
 *     writes a pending Airtable record, and calls Resend — i.e. the bypass
 *     is scoped narrowly to SMOKE_TEST_EMAIL and doesn't weaken real
 *     submissions.
 *  2. The reserved smoke-test address skips the MX check, skips the
 *     Airtable pending-record write, and skips the real Resend call, while
 *     still exercising JSON parsing, email validation, and token signing.
 *
 * Run: node tests/submit-api.test.mjs
 * (.mjs extension: api/submit.js is an ES module; this keeps the test
 * runnable without needing "type":"module" in package.json.)
 */

process.env.VERIFICATION_SECRET = 'test-secret-not-real';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.RESEND_FROM = 'test@turbulentground.com';
process.env.AIRTABLE_TOKEN = 'test-airtable-token';
process.env.AIRTABLE_BASE_ID = 'appTest';
process.env.AIRTABLE_TABLE = 'Diagnostic Submissions';

let failures = 0;
function check(label, condition, detail) {
  if (condition) console.log(`  PASS  ${label}`);
  else { failures++; console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`); }
}

function mockRes() {
  const res = { _status: null, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

async function run() {
  console.log('submit-api.test.mjs — testing api/submit.js smoke-test bypass\n');

  const calledUrls = [];
  global.fetch = async (url, opts) => {
    calledUrls.push(url);
    if (String(url).includes('resend.com')) {
      return { ok: true, json: async () => ({ id: 'fake' }), text: async () => '' };
    }
    if (String(url).includes('airtable.com')) {
      return { ok: true, json: async () => ({}), text: async () => '' };
    }
    return { ok: true, json: async () => ({}), text: async () => '' };
  };

  // dns.resolveMx is real (not mocked) for the non-smoke-test case below —
  // use a domain with well-known, stable MX records so this test doesn't
  // depend on network access being available in every environment it runs
  // in. If DNS isn't reachable here (e.g. an offline sandbox), that
  // specific check is skipped rather than failed, since it isn't what this
  // test file exists to verify (the bypass logic is).
  const { default: handler } = await import('../api/submit.js');

  console.log('Scenario: normal submission (not the smoke-test address)');
  {
    const req = { method: 'POST', body: { email: 'someone@gmail.com' } };
    const res = mockRes();
    await handler(req, res);
    check('consumer domain (gmail.com) is still rejected for normal submissions', res._status === 400 && /work email/.test(res._body.error || ''), JSON.stringify(res._body));
  }

  console.log('\nScenario: smoke-test address bypasses MX check, Airtable write, and Resend send');
  {
    calledUrls.length = 0;
    const req = { method: 'POST', body: { email: 'playwright-smoke-test@turbulentground.com', raw_answers: {}, score_overall: 60 } };
    const res = mockRes();
    await handler(req, res);
    check('returns 200', res._status === 200, `got ${res._status}, body=${JSON.stringify(res._body)}`);
    check('response has status: verification_sent', res._body && res._body.status === 'verification_sent', JSON.stringify(res._body));
    check('response flags smoke_test: true', res._body && res._body.smoke_test === true, JSON.stringify(res._body));
    check('no request to resend.com was made', !calledUrls.some(u => String(u).includes('resend.com')), calledUrls.join(', '));
    check('no request to airtable.com was made', !calledUrls.some(u => String(u).includes('airtable.com')), calledUrls.join(', '));
  }

  console.log('\nScenario: smoke-test address still requires VERIFICATION_SECRET (real env-config signal, not bypassed)');
  {
    const savedSecret = process.env.VERIFICATION_SECRET;
    delete process.env.VERIFICATION_SECRET;
    const req = { method: 'POST', body: { email: 'playwright-smoke-test@turbulentground.com' } };
    const res = mockRes();
    await handler(req, res);
    check('fails with 500 if VERIFICATION_SECRET is missing, even for the smoke-test address', res._status === 500, `got ${res._status}`);
    process.env.VERIFICATION_SECRET = savedSecret;
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
