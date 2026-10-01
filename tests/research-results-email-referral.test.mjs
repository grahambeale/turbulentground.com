// Confirms the results email offers the same referral-sharing link as the
// web thank-you screen: reuses the actual issue-or-retrieve logic (not a
// second parallel mechanism), places it after the participant's own
// results and before the unsubscribe/legal footer, and never lets a
// referral failure block the results email itself from sending.

import handler, { buildEmailHtml } from "../api/research-results-email.js";
import { PAIRED_VERSION } from "../api/_research-instruments.js";

function check(label, condition, detail = "") {
  if (!condition) throw new Error(`FAIL  ${label}${detail ? `: ${detail}` : ""}`);
  console.log(`  PASS  ${label}`);
}

function mockRes() {
  return {
    _status: 200, _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
  };
}

console.log("research-results-email-referral.test.mjs");

// --- buildEmailHtml directly: placement and privacy copy ---------------

const SAMPLE_PAIRS = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [`d${i + 1}`, { contribution: 4, conditions: 3 }])
);
const SAMPLE_BENCHMARK = { domains: null, cohortSize: 0 };
const SHARE_URL = "https://www.turbulentground.com/take-part?r=K7M4PX";

const withShare = buildEmailHtml("Alex", SAMPLE_PAIRS, SAMPLE_BENCHMARK, "tok", PAIRED_VERSION, SHARE_URL);
check("includes the exact referral heading", withShare.includes("Help me hear more perspectives on AI at work"));
check("includes the real working link, not a placeholder", withShare.includes(`href="${SHARE_URL}"`) && withShare.includes(SHARE_URL));
check("reuses the exact web privacy wording", withShare.includes("The link does not reveal anything about you.") &&
  withShare.includes("It contains a random referral code, not your name, email, answers or results."));
check("explains what happens when the link is shared, not just a bare link", withShare.includes("anyone who opens it can add their own experience to the study"));

const resultsIndex = withShare.indexOf("As you read, look for answers");
const referralIndex = withShare.indexOf("Help me hear more perspectives");
const explainerIndex = withShare.indexOf("anyone who opens it can add their own experience");
const linkIndex = withShare.indexOf(SHARE_URL);
const footerIndex = withShare.indexOf("You received this because you requested your summary");
check("referral section comes after the participant's own results", resultsIndex < referralIndex);
check("explainer sentence sits between the heading and the link", referralIndex < explainerIndex && explainerIndex < linkIndex);
check("referral section comes before the unsubscribe/legal footer", referralIndex < footerIndex);

const withoutShare = buildEmailHtml("Alex", SAMPLE_PAIRS, SAMPLE_BENCHMARK, "tok", PAIRED_VERSION, "");
check("omits the section entirely when no share link was resolved", !withoutShare.includes("Help me hear more perspectives"));

// --- handler: real end-to-end resolution through the shared logic ------

const oldFetch = global.fetch;
const oldEnv = { ...process.env };
process.env.AIRTABLE_RESEARCH_TOKEN = "test-airtable";
process.env.RESEND_API_KEY = "test-resend";
process.env.RESEND_FROM = "Turbulent Ground <results@example.com>";
process.env.RESEARCH_SHARING_UI_ENABLED = "true";
process.env.RESEARCH_REFERRAL_ISSUE_ENABLED = "true";
process.env.RESEARCH_REFERRAL_SECRET = "synthetic-referral-secret-that-is-long-enough";

function identityRecord() {
  return { records: [{ id: "recIdentity", fields: {
    fldGto31lmx5KwyNr: "Alex Morgan",
    fldePJtCCYwLsmNjp: "alex@example.com",
    fldEhm06lLDvEeF6q: "Completed",
  } }] };
}
function responseRecord() {
  return { records: [{ id: "recResponse", fields: {
    fldHJ4KNzMbpzdob6: "phase3-v3-2026-09-08",
    fld8sYjswX21vvVXz: "2026-09-08T00:00:00Z",
    fldc1EMbDAHAO99Av: true,
    fldvxb2mrIYVKLGVM: JSON.stringify(SAMPLE_PAIRS),
  } }] };
}

try {
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    const u = String(url);
    if (u.includes("tblwpricYYzx4rmiR?")) return { ok: true, json: async () => identityRecord() };
    if (u.includes("tblL9mf8VfAmbhuG7?") && u.includes("filterByFormula") && !u.includes("pageSize")) {
      return { ok: true, json: async () => responseRecord() };
    }
    if (u.includes("tblL9mf8VfAmbhuG7?")) return { ok: true, json: async () => ({ records: [] }) };
    if (u.includes("tblXBzl8mQal543xw") && (!options.method || options.method === "GET")) {
      return { ok: true, json: async () => ({ records: [] }) }; // no existing referral yet
    }
    if (u.includes("tblXBzl8mQal543xw")) {
      return { ok: true, json: async () => ({ records: [{ id: "recReferral" }] }) }; // upsert create
    }
    if (u.includes("api.resend.com/emails")) return { ok: true, json: async () => ({ id: "email_123" }) };
    if (u.includes("tblwpricYYzx4rmiR/recIdentity")) return { ok: true, json: async () => ({}) };
    throw new Error(`Unexpected fetch: ${url}`);
  };

  const res = mockRes();
  await handler({ method: "POST", body: { token: "valid-token" } }, res);
  check("results email still sends successfully", res._status === 200 && res._body?.success === true);

  const send = calls.find(call => call.url.includes("api.resend.com/emails"));
  const sendBody = JSON.parse(send.options.body);
  check("sent email contains a genuine referral link", /https:\/\/www\.turbulentground\.com\/take-part\?r=[A-Za-z0-9_-]{20,}/.test(sendBody.html));
  check("sent email does not leak the private token in the referral link", !sendBody.html.includes("/take-part?r=valid-token"));

  const referralCreate = calls.find(call => call.url.includes("tblXBzl8mQal543xw") && call.options.method === "PATCH");
  check("issues the referral through the same upsert used by the web flow", referralCreate?.options && JSON.parse(referralCreate.options.body).performUpsert.fieldsToMergeOn[0] === "fldhsVcyzGsgcIZXU");
} finally {
  global.fetch = oldFetch;
}

// --- handler: sharing disabled -> email still sends, no section --------

try {
  process.env.RESEARCH_SHARING_UI_ENABLED = "false";
  global.fetch = async (url, options = {}) => {
    const u = String(url);
    if (u.includes("tblwpricYYzx4rmiR?")) return { ok: true, json: async () => identityRecord() };
    if (u.includes("tblL9mf8VfAmbhuG7?") && u.includes("filterByFormula") && !u.includes("pageSize")) {
      return { ok: true, json: async () => responseRecord() };
    }
    if (u.includes("tblL9mf8VfAmbhuG7?")) return { ok: true, json: async () => ({ records: [] }) };
    if (u.includes("api.resend.com/emails")) return { ok: true, json: async () => ({ id: "email_456" }) };
    if (u.includes("tblwpricYYzx4rmiR/recIdentity")) return { ok: true, json: async () => ({}) };
    throw new Error(`Unexpected fetch while sharing disabled: ${url}`);
  };
  const res = mockRes();
  await handler({ method: "POST", body: { token: "disabled-sharing-token" } }, res);
  check("results email sends when sharing is disabled site-wide", res._status === 200 && res._body?.success === true);
} finally {
  global.fetch = oldFetch;
}

// --- handler: referral service fails -> email still sends, no section --

try {
  process.env.RESEARCH_SHARING_UI_ENABLED = "true";
  global.fetch = async (url, options = {}) => {
    const u = String(url);
    if (u.includes("tblwpricYYzx4rmiR?")) return { ok: true, json: async () => identityRecord() };
    if (u.includes("tblL9mf8VfAmbhuG7?") && u.includes("filterByFormula") && !u.includes("pageSize")) {
      return { ok: true, json: async () => responseRecord() };
    }
    if (u.includes("tblL9mf8VfAmbhuG7?")) return { ok: true, json: async () => ({ records: [] }) };
    if (u.includes("tblXBzl8mQal543xw")) throw new Error("Airtable is down");
    if (u.includes("api.resend.com/emails")) return { ok: true, json: async () => ({ id: "email_789" }) };
    if (u.includes("tblwpricYYzx4rmiR/recIdentity")) return { ok: true, json: async () => ({}) };
    throw new Error(`Unexpected fetch during referral failure: ${url}`);
  };
  const res = mockRes();
  await handler({ method: "POST", body: { token: "referral-failure-token" } }, res);
  check("results email still sends when referral resolution fails", res._status === 200 && res._body?.success === true);
} finally {
  global.fetch = oldFetch;
  process.env = oldEnv;
}

console.log("\nALL CHECKS PASSED");
