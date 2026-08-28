#!/usr/bin/env node

process.env.RESEARCH_ADMIN_KEY = "test-admin-key";
process.env.AIRTABLE_RESEARCH_TOKEN = "test-airtable-token";

let failures = 0;
function check(label, condition, detail) {
  if (condition) console.log(`  PASS  ${label}`);
  else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function mockRes() {
  const res = { _status: null, _body: null, _headers: {} };
  res.setHeader = (name, value) => { res._headers[name] = value; };
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

const airtableCalls = [];
global.fetch = async (url, options) => {
  airtableCalls.push({ url: String(url), options });
  return {
    ok: true,
    json: async () => ({ records: [{ id: "recTest" }] }),
    text: async () => "",
  };
};

const { default: handler } = await import("../api/research-invite.js");

console.log("research-invite-api.test.mjs — testing owner-only invite generation\n");

{
  const req = { method: "POST", headers: {}, body: { name: "Sam Taylor" } };
  const res = mockRes();
  await handler(req, res);
  check("rejects a missing access key", res._status === 401, JSON.stringify(res._body));
  check("does not call Airtable when unauthorised", airtableCalls.length === 0);
}

{
  const req = {
    method: "POST",
    headers: { authorization: "Bearer wrong-key" },
    body: { name: "Sam Taylor" },
  };
  const res = mockRes();
  await handler(req, res);
  check("rejects an incorrect access key", res._status === 401, JSON.stringify(res._body));
  check("still does not call Airtable", airtableCalls.length === 0);
}

{
  const req = {
    method: "POST",
    headers: { authorization: "Bearer test-admin-key" },
    body: { name: "Sam Taylor", email: "sam@example.com" },
  };
  const res = mockRes();
  await handler(req, res);
  check("creates an invite with the correct key", res._status === 201, JSON.stringify(res._body));
  check("returns a production research URL", /^https:\/\/www\.turbulentground\.com\/research\?t=[0-9a-f-]+$/.test(res._body?.inviteUrl || ""), res._body?.inviteUrl);
  check("reports that an email was saved", res._body?.hasEmail === true);
  check("writes exactly once to the Identity table", airtableCalls.length === 1);
  const payload = JSON.parse(airtableCalls[0].options.body);
  check("writes the supplied name", payload.records[0].fields.fldGto31lmx5KwyNr === "Sam Taylor");
  check("writes the supplied email", payload.records[0].fields.fldePJtCCYwLsmNjp === "sam@example.com");
  check("marks the invite Sent", payload.records[0].fields.fldEhm06lLDvEeF6q === "Sent");
}

{
  const before = airtableCalls.length;
  const req = {
    method: "POST",
    headers: { authorization: "Bearer test-admin-key" },
    body: { name: "Sam Taylor", email: "not-an-email" },
  };
  const res = mockRes();
  await handler(req, res);
  check("rejects a malformed email", res._status === 400, JSON.stringify(res._body));
  check("does not write malformed input", airtableCalls.length === before);
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
