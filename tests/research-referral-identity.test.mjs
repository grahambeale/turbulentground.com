#!/usr/bin/env node

process.env.AIRTABLE_RESEARCH_TOKEN = "synthetic-airtable-token";
process.env.RESEARCH_REFERRAL_SECRET = "synthetic-referral-secret-that-is-long-enough";

const { default: issue } = await import("../api/research-referral-issue.js");
const { default: resolve } = await import("../api/research-referral-resolve.js");
const { default: disable } = await import("../api/research-referral-disable.js");

function response() {
  const res = { code: 0, body: null };
  res.status = (code) => { res.code = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}
function assert(condition, message) { if (!condition) throw new Error(message); }

let calls = [];
global.fetch = async (...args) => { calls.push(args); throw new Error("disabled route fetched"); };
delete process.env.RESEARCH_REFERRAL_ISSUE_ENABLED;
let res = response();
await issue({ method: "POST", body: { token: "private-token" } }, res);
assert(res.code === 404 && calls.length === 0, "referral issue must fail closed while disabled");

process.env.RESEARCH_REFERRAL_ISSUE_ENABLED = "true";
let sequence = 0;
calls = [];
global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  sequence++;
  if (sequence === 1) return ok({ records: [{ id: "recIdentity", fields: {} }] });
  if (sequence === 2) return ok({ records: [{ id: "recResponse", fields: {
    fld8sYjswX21vvVXz: "2026-09-26T12:00:00.000Z", fldc1EMbDAHAO99Av: true,
    fldHJ4KNzMbpzdob6: "phase3-v5-2026-09-25-examples"
  } }] });
  if (sequence === 3) return ok({ records: [] });
  return ok({ records: [{ id: "recReferral" }] });
};
res = response();
await issue({ method: "POST", body: { token: "private-token" } }, res);
assert(res.code === 201, "eligible completed participant should receive a referral ID");
assert(/^\/research\?r=[A-Za-z0-9_-]{20,64}$/.test(res.body.sharePath), "share URL should contain only a public referral ID");
assert(!res.body.sharePath.includes("private-token"), "share URL must never expose the private token");
const createBody = JSON.parse(calls[3].options.body);
assert(createBody.records[0].fields.fldgZjeCrX8WJDfSJ[0] === "recIdentity", "referral should link privately to its owner");
assert(calls[3].options.method === "PATCH" && createBody.performUpsert.fieldsToMergeOn[0] === "fldhsVcyzGsgcIZXU",
  "referral creation must atomically upsert its stable ID");

sequence = 0;
global.fetch = async () => {
  sequence++;
  if (sequence === 1) return ok({ records: [{ id: "recIdentity", fields: {} }] });
  if (sequence === 2) return ok({ records: [{ id: "recResponse", fields: {
    fld8sYjswX21vvVXz: "2026-09-26T12:00:00.000Z", fldc1EMbDAHAO99Av: true
  } }] });
  return ok({ records: [{ id: "recReferral", fields: { fld8XFaGgrsGKkABg: "active", fldhsVcyzGsgcIZXU: "stablePublicReferral99" } }] });
};
res = response();
await issue({ method: "POST", body: { token: "private-token" } }, res);
assert(res.code === 200 && res.body.sharePath === "/research?r=stablePublicReferral99", "repeat issue should retrieve the stable ID");

process.env.RESEARCH_REFERRAL_RESOLVE_ENABLED = "true";
global.fetch = async () => ok({ records: [{ id: "recReferral", fields: { fld8XFaGgrsGKkABg: "active" } }] });
res = response();
await resolve({ method: "GET", query: { r: "stablePublicReferral99" } }, res);
assert(res.code === 200 && JSON.stringify(res.body) === '{"available":true}', "public resolution should reveal only availability");

sequence = 0;
calls = [];
global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  sequence++;
  if (sequence === 1) return ok({ records: [{ id: "recIdentity", fields: {} }] });
  if (sequence === 2) return ok({ records: [{ id: "recReferral", fields: {} }] });
  return ok({ records: [{ id: "recReferral" }] });
};
res = response();
await disable({ method: "POST", body: { token: "private-token" } }, res);
assert(res.code === 200 && res.body.status === "withdrawn", "participant should be able to disable their own referral");
const disabledFields = JSON.parse(calls[2].options.body).fields;
assert(disabledFields.fld8XFaGgrsGKkABg === "withdrawn" && disabledFields.fld6FqGWIEes5Tn7L === "withdrawal",
  "disable should store only the coarse withdrawal state");

console.log("Phase 3.1 referral identity safety checks passed.");

function ok(body) {
  return { ok: true, status: 200, json: async () => body, text: async () => "" };
}
