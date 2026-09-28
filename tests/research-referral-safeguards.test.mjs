#!/usr/bin/env node

process.env.AIRTABLE_RESEARCH_TOKEN = "synthetic-airtable-token";
process.env.RESEARCH_REFERRAL_SECRET = "synthetic-referral-secret-that-is-long-enough";
process.env.RESEARCH_ABUSE_SECRET = "synthetic-abuse-secret-that-is-long-enough";
process.env.RESEARCH_PUBLIC_ENTRY_ENABLED = "true";
process.env.RESEARCH_REFERRAL_RESOLVE_ENABLED = "true";

const { default: start } = await import("../lib/research-phase31/public-start.js");
const { default: attribution } = await import("../lib/research-phase31/referral-attribution.js");

function response() {
  const res = { code: 0, body: null };
  res.status = (code) => { res.code = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}
function ok(body) { return { ok: true, status: 200, json: async () => body, text: async () => "" }; }
function assert(condition, message) { if (!condition) throw new Error(message); }
const validStart = {
  method: "POST",
  body: {
    name: "Synthetic Person", email: "same@example.test", adultConfirmed: true,
    participationConsent: true, referralId: "stablePublicReferral99", channel: "linkedin"
  }
};

let calls = [];
let sequence = 0;
global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  sequence++;
  // sequence 1: D10 rate-limit lookup (by IP hash); sequence 2: D10
  // idempotency lookup (by email) — both empty, so the request proceeds.
  if (sequence === 1 || sequence === 2) return ok({ records: [] });
  if (sequence === 3) return ok({ records: [{ id: "recReferral", fields: {
    fld8XFaGgrsGKkABg: "active", fldgZjeCrX8WJDfSJ: ["recReferrer"]
  } }] });
  if (sequence === 4) return ok({ id: "recReferrer", fields: { fldePJtCCYwLsmNjp: "SAME@example.test" } });
  if (sequence === 5) return ok({ records: [{ id: "recParticipant" }] });
  return ok({ records: [{ id: "recAcquisition" }] });
};
let res = response();
await start(validStart, res);
assert(res.code === 201, "self-referral should not block participation");
const selfAcquisition = JSON.parse(calls[5].options.body).records[0].fields;
assert(selfAcquisition.fldD7AXUyBI6heSeI === "self_referral", "same normalized email must be marked self_referral");
assert(!selfAcquisition.fldWurPEyDv2OhIXp, "self-referral must not credit or link the supplied referrer");

calls = [];
sequence = 0;
global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  sequence++;
  if (sequence === 1 || sequence === 2) return ok({ records: [] });
  if (sequence === 3) return ok({ records: [{ id: "recReferral", fields: {
    fld8XFaGgrsGKkABg: "active", fldgZjeCrX8WJDfSJ: ["recReferrer"]
  } }] });
  if (sequence === 4) return ok({ id: "recReferrer", fields: { fldePJtCCYwLsmNjp: "different@example.test" } });
  if (sequence === 5) return ok({ records: [{ id: "recParentAcquisition", fields: { fldao8tphfNYi86lC: 5 } }] });
  if (sequence === 6) return ok({ records: [{ id: "recParticipant" }] });
  return ok({ records: [{ id: "recAcquisition" }] });
};
res = response();
await start(validStart, res);
assert(res.code === 201, "excess-depth referral should not block participation");
const depthAcquisition = JSON.parse(calls[6].options.body).records[0].fields;
assert(depthAcquisition.fldD7AXUyBI6heSeI === "invalid_referral", "generation six must be excluded");
assert(depthAcquisition.fldao8tphfNYi86lC === 6, "excluded depth should remain auditable");
assert(!depthAcquisition.fldWurPEyDv2OhIXp, "excess-depth referral must not receive credit");

delete process.env.RESEARCH_REFERRAL_RESOLVE_ENABLED;
calls = [];
global.fetch = async (...args) => { calls.push(args); throw new Error("disabled route fetched"); };
res = response();
await attribution({ method: "POST", body: { token: "private", referralId: "stablePublicReferral99" } }, res);
assert(res.code === 404 && calls.length === 0, "attribution endpoint must fail closed while disabled");

process.env.RESEARCH_REFERRAL_RESOLVE_ENABLED = "true";
calls = [];
sequence = 0;
global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  sequence++;
  if (sequence === 1) return ok({ records: [{ id: "recParticipant", fields: {} }] });
  if (sequence === 2) return ok({ records: [{ id: "recAcquisition", fields: {
    fldWurPEyDv2OhIXp: ["recOriginalReferral"], fldwGlpOjfvSvhXpq: 0
  } }] });
  if (sequence === 3) return ok({ records: [{ id: "recLaterReferral", fields: { fld8XFaGgrsGKkABg: "active" } }] });
  if (sequence === 4) return ok({ records: [{ id: "recConflictEvent" }] });
  if (sequence === 5) return ok({ records: [{ id: "recConflictEvent", fields: {} }] });
  return ok({ id: "recAcquisition", fields: {} });
};
res = response();
await attribution({ method: "POST", body: { token: "synthetic-private-token", referralId: "stablePublicReferral99" } }, res);
assert(res.code === 200 && res.body.status === "conflict_recorded", "later referral should be recorded as a conflict");
const eventWrite = JSON.parse(calls[3].options.body);
assert(eventWrite.performUpsert.fieldsToMergeOn[0] === "fldJG2VrwhlQah3kx", "conflict event must be idempotently upserted");
assert(!JSON.stringify(eventWrite).includes("synthetic-private-token") && !JSON.stringify(eventWrite).includes("stablePublicReferral99"),
  "conflict event must not store private tokens or public referral IDs");
const acquisitionUpdate = JSON.parse(calls[5].options.body).fields;
assert(acquisitionUpdate.fldD7AXUyBI6heSeI === "conflicting_referral" && acquisitionUpdate.fldwGlpOjfvSvhXpq === 1,
  "conflict should be counted and labelled");
assert(!Object.hasOwn(acquisitionUpdate, "fldWurPEyDv2OhIXp"), "conflict must never replace the first-touch referrer");

calls = [];
sequence = 0;
global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  sequence++;
  if (sequence === 1) return ok({ records: [{ id: "recParticipant", fields: {} }] });
  if (sequence === 2) return ok({ records: [{ id: "recAcquisition", fields: {
    fldWurPEyDv2OhIXp: ["recOriginalReferral"], fldwGlpOjfvSvhXpq: 1
  } }] });
  if (sequence === 3) return ok({ records: [{ id: "recLaterReferral", fields: { fld8XFaGgrsGKkABg: "active" } }] });
  if (sequence === 4) return ok({ records: [{ id: "recConflictEvent" }] });
  if (sequence === 5) return ok({ records: [{ id: "recConflictEvent", fields: {} }] });
  return ok({ id: "recAcquisition", fields: {} });
};
res = response();
await attribution({ method: "POST", body: { token: "synthetic-private-token", referralId: "stablePublicReferral99" } }, res);
const retryUpdate = JSON.parse(calls[5].options.body).fields;
assert(retryUpdate.fldwGlpOjfvSvhXpq === 1, "retrying the same conflict must not double count it");

console.log("Phase 3.1 referral safeguard checks passed.");
