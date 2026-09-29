#!/usr/bin/env node

process.env.AIRTABLE_RESEARCH_TOKEN = "synthetic-airtable-token";
process.env.RESEARCH_ABUSE_SECRET = "synthetic-abuse-secret-that-is-long-enough";
process.env.RESEARCH_PUBLIC_ENTRY_ENABLED = "true";
process.env.RESEND_API_KEY = "synthetic-resend-key";
process.env.RESEND_FROM = "Turbulent Ground <research@example.test>";

const { default: start } = await import("../lib/research-phase31/public-start.js");

const privateToken = "synthetic-private-return-token";
const emailCalls = [];
global.fetch = async (url, options = {}) => {
  const target = String(url);
  if (target.includes("api.airtable.com") && target.includes("fldvtRXWe3D2YqFHG")) {
    return { ok: true, status: 200, json: async () => ({ records: [] }) };
  }
  if (target.includes("api.airtable.com") && target.includes("LOWER")) {
    return { ok: true, status: 200, json: async () => ({ records: [{
      id: "recExistingSynthetic",
      fields: {
        fld6danERot7gjOqb: privateToken,
        fldGto31lmx5KwyNr: "Synthetic Person",
        fldePJtCCYwLsmNjp: "synthetic@example.test",
        fldj4eidGJYUhVeUQ: "2026-10-12T12:00:00.000Z"
      }
    }] }) };
  }
  if (target.includes("api.resend.com/emails")) {
    emailCalls.push({ headers: options.headers, body: JSON.parse(options.body) });
    return { ok: true, status: 200, json: async () => ({ id: "emailSynthetic" }) };
  }
  throw new Error(`Unexpected request: ${target}`);
};

const res = response();
await start({
  method: "POST",
  headers: { "content-type": "application/json", "x-forwarded-for": "192.0.2.10" },
  body: {
    name: "Synthetic Person",
    email: "synthetic@example.test",
    adultConfirmed: true,
    participationConsent: true
  }
}, res);

assert(res.code === 200, "a duplicate start should become a successful recovery request");
assert(res.body.status === "return_link_sent", "the browser should receive a clear recovery status");
assert(!JSON.stringify(res.body).includes(privateToken), "the private token must never be returned to the browser");
assert(emailCalls.length === 1, "one secure return-link email should be requested");
assert(emailCalls[0].body.to[0] === "synthetic@example.test", "the return link must go only to the stored address");
assert(emailCalls[0].body.html.includes(encodeURIComponent(privateToken)), "the email should contain the private return link");
assert(emailCalls[0].body.subject === "Continue your Turbulent Ground survey", "the subject should make the next action clear");
assert(emailCalls[0].body.html.includes("Pick up where you left off"), "the email should lead with a personal, useful message");
assert(emailCalls[0].body.html.includes("Continue my survey"), "the secure return link should be presented as a clear button");
assert(emailCalls[0].body.html.includes("background:#131110"), "the return email should use the Turbulent Ground visual style");
assert(emailCalls[0].headers["Idempotency-Key"], "the recovery email must be idempotent");

console.log("Research public resume recovery checks passed.");

function response() {
  const res = { code: 0, body: null };
  res.status = code => { res.code = code; return res; };
  res.json = body => { res.body = body; return res; };
  return res;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
