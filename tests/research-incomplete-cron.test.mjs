#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";

process.env.CRON_SECRET = "synthetic-cron-secret";
process.env.RESEARCH_MAINTENANCE_KEY = "synthetic-maintenance-key";
const { createCronHandler } = await import("../lib/research-phase31/incomplete-cron.js");

function response() {
  const res = { code: 0, body: null, headers: {} };
  res.setHeader = (name, value) => { res.headers[name] = value; };
  res.status = code => { res.code = code; return res; };
  res.json = body => { res.body = body; return res; };
  return res;
}
const request = (authorization = "Bearer synthetic-cron-secret") => ({ method: "GET", headers: { authorization } });

test("cron rejects requests without Vercel's secret", async () => {
  const res = response();
  await createCronHandler()(request(""), res);
  assert.equal(res.code, 401);
});

test("cron is a successful no-op while lifecycle execution is disabled", async () => {
  delete process.env.RESEARCH_INCOMPLETE_REMINDER_ENABLED;
  let called = false;
  const res = response();
  await createCronHandler(async () => { called = true; })(request(), res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { status: "disabled" });
  assert.equal(called, false);
});

test("enabled cron delegates only the protected execute request", async () => {
  process.env.RESEARCH_INCOMPLETE_REMINDER_ENABLED = "true";
  let delegated;
  const res = response();
  await createCronHandler(async req => { delegated = req; return res.status(200).json({ status: "executed" }); })(request(), res);
  assert.equal(res.code, 200);
  assert.equal(delegated.method, "POST");
  assert.equal(delegated.body.mode, "execute");
  assert.equal(delegated.headers.authorization, "Bearer synthetic-maintenance-key");
});
