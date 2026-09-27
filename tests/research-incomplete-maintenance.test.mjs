#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";

process.env.AIRTABLE_RESEARCH_TOKEN = "synthetic-airtable-token";
process.env.RESEARCH_MAINTENANCE_KEY = "synthetic-maintenance-key";
process.env.RESEND_API_KEY = "synthetic-resend-key";
process.env.RESEND_FROM = "research@example.test";

const { default: maintain } = await import("../lib/research-phase31/incomplete-maintenance.js");
const DAY = 86400000;

function response() {
  const res = { code: 0, body: null, headers: {} };
  res.setHeader = (name, value) => { res.headers[name] = value; };
  res.status = code => { res.code = code; return res; };
  res.json = body => { res.body = body; return res; };
  return res;
}
const request = mode => ({ method: "POST", headers: { authorization: "Bearer synthetic-maintenance-key" }, body: { mode } });

test("execute stays unavailable while its feature flag is disabled", async () => {
  delete process.env.RESEARCH_INCOMPLETE_REMINDER_ENABLED;
  let called = false;
  global.fetch = async () => { called = true; throw new Error("should not fetch"); };
  const res = response();
  await maintain(request("execute"), res);
  assert.equal(res.code, 404);
  assert.equal(called, false);
});

test("execute sends one reminder and deletes expired participant data without returning PII", async () => {
  process.env.RESEARCH_INCOMPLETE_REMINDER_ENABLED = "true";
  const now = Date.now();
  const reminder = { id: "recReminder", fields: {
    fld6danERot7gjOqb: "private-reminder-token", fldGto31lmx5KwyNr: "Reminder Person", fldePJtCCYwLsmNjp: "reminder@example.test",
    fldBUlgc1HW9JKJqo: new Date(now - 8 * DAY).toISOString(), fldj4eidGJYUhVeUQ: new Date(now + 6 * DAY).toISOString(),
  } };
  const expired = { id: "recExpired", fields: {
    fld6danERot7gjOqb: "private-expired-token", fldGto31lmx5KwyNr: "Expired Person", fldePJtCCYwLsmNjp: "expired@example.test",
    fldBUlgc1HW9JKJqo: new Date(now - 15 * DAY).toISOString(), fldj4eidGJYUhVeUQ: new Date(now - DAY).toISOString(),
  } };
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("api.resend.com")) return { ok: true, status: 200, json: async () => ({ id: "email" }) };
    if (options.method === "PATCH" || options.method === "DELETE") return { ok: true, status: 200, json: async () => ({}) };
    if (String(url).includes("tblwpricYYzx4rmiR")) return { ok: true, status: 200, json: async () => ({ records: [reminder, expired] }) };
    if (String(url).includes("tblL9mf8VfAmbhuG7")) return { ok: true, status: 200, json: async () => ({ records: [{ id: "recResponse" }] }) };
    return { ok: true, status: 200, json: async () => ({ records: [] }) };
  };

  const res = response();
  await maintain(request("execute"), res);
  assert.equal(res.code, 200);
  assert.equal(res.body.actions.remindersSent, 1);
  assert.equal(res.body.actions.deletionsCompleted, 1);
  assert.equal(res.body.actions.deletionConfirmationsAttempted, 1);
  assert.equal(calls.filter(call => call.url.includes("api.resend.com")).length, 2);
  assert.ok(calls.some(call => call.options.method === "PATCH" && call.url.includes("recReminder")), "reminder attempt must be claimed first");
  assert.ok(calls.some(call => call.options.method === "DELETE" && call.url.includes("recResponse")), "linked response must be deleted");
  assert.ok(calls.some(call => call.options.method === "DELETE" && call.url.includes("recExpired")), "identity must be deleted");
  const publicResult = JSON.stringify(res.body);
  assert.doesNotMatch(publicResult, /example\.test|private-.*-token|Reminder Person|Expired Person/);
});
