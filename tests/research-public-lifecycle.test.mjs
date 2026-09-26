#!/usr/bin/env node

process.env.AIRTABLE_RESEARCH_TOKEN = "synthetic-airtable-token";
process.env.RESEARCH_MAINTENANCE_KEY = "synthetic-maintenance-key";

const { default: start } = await import("../api/research-public-start.js");
const { default: maintain } = await import("../api/research-incomplete-maintenance.js");

function response() {
  const res = { code: 0, body: null };
  res.status = (code) => { res.code = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

const writes = [];
global.fetch = async (url, options = {}) => {
  if (options.method === "POST") {
    writes.push(JSON.parse(options.body));
    return { ok: true, status: 201, json: async () => ({ records: [{ id: "recSynthetic" }] }) };
  }
  const now = Date.now();
  return {
    ok: true,
    status: 200,
    json: async () => ({ records: [
      { id: "recActive", fields: { fldBUlgc1HW9JKJqo: new Date(now - 2 * 86400000).toISOString(), fldj4eidGJYUhVeUQ: new Date(now + 12 * 86400000).toISOString() } },
      { id: "recReminder", fields: { fldBUlgc1HW9JKJqo: new Date(now - 8 * 86400000).toISOString(), fldj4eidGJYUhVeUQ: new Date(now + 6 * 86400000).toISOString() } },
      { id: "recExpired", fields: { fldBUlgc1HW9JKJqo: new Date(now - 15 * 86400000).toISOString(), fldj4eidGJYUhVeUQ: new Date(now - 86400000).toISOString() } },
    ] })
  };
};

delete process.env.RESEARCH_PUBLIC_ENTRY_ENABLED;
let res = response();
await start({ method: "POST", body: {} }, res);
assert(res.code === 404, "public start must be unavailable while its flag is off");
assert(writes.length === 0, "disabled public start must not write");

process.env.RESEARCH_PUBLIC_ENTRY_ENABLED = "true";
res = response();
await start({ method: "POST", body: { name: "Synthetic Person", email: "synthetic@example.test" } }, res);
assert(res.code === 400, "public start must require adult and participation confirmation");
assert(writes.length === 0, "invalid consent must not write");

const before = Date.now();
res = response();
await start({ method: "POST", body: {
  name: "Synthetic Person", email: "synthetic@example.test",
  adultConfirmed: true, participationConsent: true
} }, res);
assert(res.code === 201, "valid synthetic public start should be created");
assert(writes.length === 1, "valid start should make one Airtable write");
const fields = writes[0].records[0].fields;
assert(fields.fldzOXQwAKsJFvjx4 === "public_self_service", "origin must be public_self_service");
assert(fields.fldAU2mJzl7jwcCWz === "started", "lifecycle must start as started");
const duration = Date.parse(fields.fldj4eidGJYUhVeUQ) - Date.parse(fields.fldBUlgc1HW9JKJqo);
assert(duration === 14 * 86400000, "expiry must be fixed at exactly 14 days");
assert(Date.parse(fields.fldBUlgc1HW9JKJqo) >= before, "consent timestamp must be server generated");
assert(/^\/research\?t=/.test(res.body.resumePath), "response should contain a private return path");

res = response();
await maintain({ method: "POST", headers: {}, body: { mode: "count-only" } }, res);
assert(res.code === 401, "maintenance must require its private key");

res = response();
await maintain({
  method: "POST",
  headers: { authorization: "Bearer synthetic-maintenance-key" },
  body: { mode: "count-only" }
}, res);
assert(res.code === 200, "authorised count-only maintenance should run");
assert(res.body.counts.active === 1, "dry run should count active records");
assert(res.body.counts.reminderEligible === 1, "dry run should count reminder-eligible records");
assert(res.body.counts.expired === 1, "dry run should count expired records");
assert(writes.length === 1, "maintenance dry run must not write");

console.log("Phase 3.1 disabled public lifecycle checks passed.");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
