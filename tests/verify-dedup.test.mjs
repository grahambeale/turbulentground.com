#!/usr/bin/env node
/**
 * Regression test for api/verify.js's attempt_id lookup-and-retry logic
 * (Sprint 8).
 *
 * Background: Sprint 4 added a "find the pending record by attempt_id and
 * PATCH it in place" step specifically so one diagnostic attempt produces
 * one Airtable row, not two. Real usage on 2026-07-19 (the same day Sprint
 * 7's submit-button fix went live) produced exactly the duplicate row this
 * was meant to prevent: two records sharing one attempt_id, one
 * verified:false, one verified:true — meaning the find-by-attempt_id
 * lookup returned nothing even though the pending record existed. Root
 * cause wasn't confirmed (no access to Airtable/Vercel internals from this
 * sandbox); Sprint 8 added one short retry before falling back to create,
 * on the theory that a brief consistency/propagation lag is the most
 * likely explanation and a retry mitigates it regardless of which of the
 * two candidate causes (Airtable read-after-write lag, Vercel regional
 * deploy propagation) is the real one.
 *
 * Verifies:
 *  1. If the pending record is found on the first lookup, it's PATCHed
 *     (updated in place) — no new record is created, no retry delay paid.
 *  2. If the first lookup finds nothing but the retry finds the record,
 *     it's still PATCHed, not duplicated — this is the specific scenario
 *     that produced Sprint 8's real-world duplicate row.
 *  3. If both lookups find nothing (pending write genuinely never
 *     happened, or an older token predates attempt_id), it still falls
 *     back to creating a fresh record — verification must never fail
 *     outright because of this mechanism.
 *
 * Run: node tests/verify-dedup.test.mjs
 * (.mjs extension: api/verify.js is an ES module; this keeps the test
 * runnable without needing "type":"module" in package.json.)
 */

import { createHmac } from "crypto";

process.env.VERIFICATION_SECRET = "test-secret-not-real";
process.env.RESEND_API_KEY = "placeholder"; // deliberately skips real send
process.env.RESEND_FROM = "test@turbulentground.com";
process.env.AIRTABLE_TOKEN = "test-airtable-token";
process.env.AIRTABLE_BASE_ID = "appTest";
process.env.AIRTABLE_TABLE = "Diagnostic Submissions";

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

function signToken(payload, secret) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

function makeToken(attemptId, email) {
  const payload = {
    exp: Date.now() + 60_000,
    data: {
      email,
      attempt_id: attemptId,
      score_overall: 60,
      raw_answers: {},
    },
  };
  return signToken(payload, process.env.VERIFICATION_SECRET);
}

async function run() {
  console.log("verify-dedup.test.mjs — testing api/verify.js's attempt_id find-then-patch retry\n");

  const { default: handler } = await import("../api/verify.js");

  console.log("Scenario: pending record found on first lookup — PATCH, not POST");
  {
    let findCalls = 0, patchCalls = 0, postCalls = 0;
    global.fetch = async (url, opts) => {
      const u = String(url);
      const method = (opts && opts.method) || "GET";
      // Distinguish the attempt_id lookup from getCompanyScores' separate
      // GET queries (email_domain/verified-based) — both hit airtable.com.
      if (u.includes("airtable.com") && method === "GET" && u.includes("attempt_id")) {
        findCalls++;
        return { ok: true, json: async () => ({ records: [{ id: "recEXISTING" }] }) };
      }
      if (u.includes("airtable.com") && method === "GET") {
        // getCompanyScores — return no records, not what this test covers.
        return { ok: true, json: async () => ({ records: [] }) };
      }
      if (u.includes("airtable.com") && method === "PATCH") {
        patchCalls++;
        return { ok: true, json: async () => ({}) };
      }
      if (u.includes("airtable.com") && method === "POST") {
        postCalls++;
        return { ok: true, json: async () => ({}) };
      }
      return { ok: true, json: async () => ({}), text: async () => "" };
    };

    const token = makeToken("attempt-found-immediately", "someone@example.com");
    const req = { method: "GET", query: { token } };
    const res = mockRes();
    const start = Date.now();
    await handler(req, res);
    const elapsed = Date.now() - start;

    check("responds 200", res._status === 200, `got ${res._status}, body=${JSON.stringify(res._body)}`);
    check("find lookup called exactly once (no retry needed)", findCalls === 1, `findCalls=${findCalls}`);
    check("PATCH called (record updated in place)", patchCalls === 1, `patchCalls=${patchCalls}`);
    check("POST not called (no duplicate created)", postCalls === 0, `postCalls=${postCalls}`);
    check("no retry delay paid when found immediately", elapsed < 400, `elapsed=${elapsed}ms`);
  }

  console.log("\nScenario: first lookup empty, retry finds it — PATCH, not duplicated (Sprint 8's real-world case)");
  {
    let findCalls = 0, patchCalls = 0, postCalls = 0;
    global.fetch = async (url, opts) => {
      const u = String(url);
      const method = (opts && opts.method) || "GET";
      if (u.includes("airtable.com") && method === "GET" && u.includes("attempt_id")) {
        findCalls++;
        if (findCalls === 1) return { ok: true, json: async () => ({ records: [] }) };
        return { ok: true, json: async () => ({ records: [{ id: "recFOUND-ON-RETRY" }] }) };
      }
      if (u.includes("airtable.com") && method === "GET") {
        return { ok: true, json: async () => ({ records: [] }) };
      }
      if (u.includes("airtable.com") && method === "PATCH") {
        patchCalls++;
        return { ok: true, json: async () => ({}) };
      }
      if (u.includes("airtable.com") && method === "POST") {
        postCalls++;
        return { ok: true, json: async () => ({}) };
      }
      return { ok: true, json: async () => ({}), text: async () => "" };
    };

    const token = makeToken("attempt-found-on-retry", "someone-else@example.com");
    const req = { method: "GET", query: { token } };
    const res = mockRes();
    await handler(req, res);

    check("responds 200", res._status === 200, `got ${res._status}, body=${JSON.stringify(res._body)}`);
    check("find lookup retried exactly once (2 calls total)", findCalls === 2, `findCalls=${findCalls}`);
    check("PATCH called once the retry found it", patchCalls === 1, `patchCalls=${patchCalls}`);
    check("POST never called — this is the exact bug this test guards against", postCalls === 0, `postCalls=${postCalls}`);
  }

  console.log("\nScenario: no pending record found after retry — falls back to create, verification still succeeds");
  {
    let findCalls = 0, patchCalls = 0, postCalls = 0;
    global.fetch = async (url, opts) => {
      const u = String(url);
      const method = (opts && opts.method) || "GET";
      if (u.includes("airtable.com") && method === "GET" && u.includes("attempt_id")) {
        findCalls++;
        return { ok: true, json: async () => ({ records: [] }) };
      }
      if (u.includes("airtable.com") && method === "GET") {
        return { ok: true, json: async () => ({ records: [] }) };
      }
      if (u.includes("airtable.com") && method === "PATCH") {
        patchCalls++;
        return { ok: true, json: async () => ({}) };
      }
      if (u.includes("airtable.com") && method === "POST") {
        postCalls++;
        return { ok: true, json: async () => ({}) };
      }
      return { ok: true, json: async () => ({}), text: async () => "" };
    };

    const token = makeToken("attempt-never-found", "third-person@example.com");
    const req = { method: "GET", query: { token } };
    const res = mockRes();
    await handler(req, res);

    check("responds 200 — verification never fails because of this fallback", res._status === 200, `got ${res._status}, body=${JSON.stringify(res._body)}`);
    check("find lookup attempted twice before giving up", findCalls === 2, `findCalls=${findCalls}`);
    check("falls back to POST (create) exactly once", postCalls === 1, `postCalls=${postCalls}`);
    check("PATCH never called", patchCalls === 0, `patchCalls=${patchCalls}`);
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
