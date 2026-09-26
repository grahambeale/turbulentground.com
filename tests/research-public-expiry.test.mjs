#!/usr/bin/env node

process.env.AIRTABLE_RESEARCH_TOKEN = "synthetic-airtable-token";

const { default: lookup } = await import("../api/research-lookup.js");
const { default: save } = await import("../api/research-save-progress.js");
const { default: submit } = await import("../api/research-submit.js");

function response() {
  const res = { code: 0, body: null };
  res.status = (code) => { res.code = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

const expiredIdentity = {
  id: "recExpiredSynthetic",
  fields: {
    fld6danERot7gjOqb: "synthetic-private-token",
    fldzOXQwAKsJFvjx4: "public_self_service",
    fldj4eidGJYUhVeUQ: new Date(Date.now() - 60000).toISOString(),
    fldAU2mJzl7jwcCWz: "started",
  },
};

let calls = [];
global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  return { ok: true, json: async () => ({ records: [expiredIdentity] }), text: async () => "" };
};

let res = response();
await lookup({ method: "GET", query: { t: "synthetic-private-token" } }, res);
assert(res.code === 200 && res.body.valid === false && res.body.expired === true,
  "expired public lookup should return only the generic expired state");
assert(calls.length === 1 && !calls[0].options.method, "expired lookup should not write or load saved answers");

calls = [];
res = response();
await save({ method: "POST", body: {
  token: "synthetic-private-token",
  instrumentVersion: "phase3-v5-2026-09-25-examples",
  rationaleVersion: "phase3-rationale-v1.0-2026-08-28",
  consent: { takingPart: true }, pairResponses: {}
} }, res);
assert(res.code === 410, "expired public response should not save");
assert(calls.length === 1 && !calls[0].options.method, "expired save should stop before any write");

calls = [];
res = response();
await submit({ method: "POST", body: {
  token: "synthetic-private-token",
  instrumentVersion: "phase3-v5-2026-09-25-examples",
  rationaleVersion: "phase3-rationale-v1.0-2026-08-28",
  consent: { takingPart: true }, pairResponses: {}
} }, res);
assert(res.code === 410, "expired public response should not submit");
assert(calls.length === 1 && !calls[0].options.method, "expired submit should stop before any write");

let lookupCount = 0;
global.fetch = async () => {
  lookupCount++;
  if (lookupCount === 1) {
    return { ok: true, json: async () => ({ records: [{ id: "recInvite", fields: {
      fld6danERot7gjOqb: "owner-invite-token", fldGto31lmx5KwyNr: "Invited Person"
    } }] }), text: async () => "" };
  }
  return { ok: true, json: async () => ({ records: [] }), text: async () => "" };
};
res = response();
await lookup({ method: "GET", query: { t: "owner-invite-token" } }, res);
assert(res.code === 200 && res.body.valid === true && res.body.expired !== true,
  "existing owner invites must remain valid without public lifecycle fields");

const activePublicIdentity = {
  id: "recActiveSynthetic",
  fields: {
    fld6danERot7gjOqb: "active-public-token",
    fldzOXQwAKsJFvjx4: "public_self_service",
    fldj4eidGJYUhVeUQ: new Date(Date.now() + 86400000).toISOString(),
    fldAU2mJzl7jwcCWz: "started",
    fldEhm06lLDvEeF6q: "In Progress",
  },
};
calls = [];
let sequence = 0;
global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  sequence++;
  if (sequence === 1) return { ok: true, json: async () => ({ records: [activePublicIdentity] }), text: async () => "" };
  if (sequence === 2) return { ok: true, json: async () => ({ records: [] }), text: async () => "" };
  return { ok: true, json: async () => ({ records: [{ id: "recSynthetic" }] }), text: async () => "" };
};
res = response();
await submit({ method: "POST", body: {
  token: "active-public-token",
  instrumentVersion: "phase3-v5-2026-09-25-examples",
  rationaleVersion: "phase3-rationale-v1.0-2026-08-28",
  consent: { takingPart: true }, pairResponses: {}
} }, res);
assert(res.code === 200, "active public response should complete through the existing submit path");
const identityPatch = JSON.parse(calls[2].options.body).fields;
assert(identityPatch.fldAU2mJzl7jwcCWz === "completed", "public completion must close the lifecycle");
const responseWrite = JSON.parse(calls[3].options.body).records[0].fields;
assert(responseWrite.fld7t6e21yjvQmTTh === "public_self_service", "public response must retain its origin");

console.log("Phase 3.1 public expiry boundary checks passed.");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
