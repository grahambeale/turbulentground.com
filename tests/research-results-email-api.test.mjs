import handler, { buildEmailHtml } from "../api/research-results-email.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

const oldFetch = global.fetch;
const oldEnv = { ...process.env };
process.env.AIRTABLE_RESEARCH_TOKEN = "test-airtable";
process.env.RESEND_API_KEY = "test-resend";
process.env.RESEND_FROM = "Turbulent Ground <results@example.com>";

try {
  const calls = [];
  let cohortSize = 30;
  const cohortNumbers = () => Array.from({ length: cohortSize }, (_, index) => index + 1);
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    // The orphan guard's token listing: every synthetic cohort token has an Identity row except "orphan".
    if (String(url).includes("tblwpricYYzx4rmiR?") && !String(url).includes("filterByFormula")) {
      return { ok: true, json: async () => ({ records: cohortNumbers().map((value) => ({ id: `recIdentity${value}`, fields: {
        fld6danERot7gjOqb: `synthetic-cohort-${value}`,
      } })) }) };
    }
    if (String(url).includes("tblwpricYYzx4rmiR?") && (!options.method || options.method === "GET")) {
      return { ok: true, json: async () => ({ records: [{ id: "recIdentity", fields: {
        fldGto31lmx5KwyNr: "Alex Morgan",
        fldePJtCCYwLsmNjp: "alex@example.com",
        fldEhm06lLDvEeF6q: "Completed",
      } }] }) };
    }
    if (String(url).includes("tblL9mf8VfAmbhuG7?") && String(url).includes("filterByFormula")) {
      return { ok: true, json: async () => ({ records: [{ id: "recResponse", fields: {
        fldHJ4KNzMbpzdob6: "phase3-v3-2026-09-08",
        fldvxb2mrIYVKLGVM: JSON.stringify({
          d1: { contribution: 4, conditions: 2 },
          d2: { contribution: 2, conditions: 5 },
          d3: { contribution: 5, conditions: 2 },
          d4: { contribution: 5, conditions: 3 },
          d5: { contribution: 4, conditions: 3 },
          d6: { contribution: 4, conditions: 3 },
          d7: { contribution: 4, conditions: 3 },
          d8: { contribution: 4, conditions: 3 },
          d9: { contribution: 4, conditions: 3 },
          d10: { contribution: 4, conditions: 3 },
          d11: { contribution: 4, conditions: 3 },
          d12: { contribution: 4, conditions: 3 },
        }),
      } }] }) };
    }
    if (String(url).includes("tblL9mf8VfAmbhuG7?")) {
      // Two extra low-scoring completions that must never reach the benchmark: one whose record id is on
      // research/excluded-responses.json, and one whose token has no Identity row.
      const skipped = [["recJ9ffZOxOK2j3IP", "synthetic-cohort-1-excluded"], ["recOrphan", "orphan"]];
      return { ok: true, json: async () => ({ records: cohortNumbers().map((value) => [`recCohort${value}`, `synthetic-cohort-${value}`, 3])
        .concat(skipped.map(([id, token]) => [id, token, 1])).map(([id, token, score]) => ({
        id,
        fields: {
          flduL4PmBEfH9rLpz: token,
          fldvxb2mrIYVKLGVM: JSON.stringify({
            d1: { contribution: score, conditions: score },
            d2: { contribution: score, conditions: score },
            d3: { contribution: score, conditions: score },
            d4: { contribution: score, conditions: score },
          }),
          fldc1EMbDAHAO99Av: true,
          fldHJ4KNzMbpzdob6: "phase3-v3-2026-09-08",
          fld8sYjswX21vvVXz: "2026-09-08T00:00:00Z",
        },
      })) }) };
    }
    if (String(url).includes("api.resend.com/emails")) {
      return { ok: true, json: async () => ({ id: "email_123" }) };
    }
    if (String(url).includes("tblwpricYYzx4rmiR/recIdentity")) {
      return { ok: true, json: async () => ({}) };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  console.log("research-results-email-api.test.mjs");
  const res = mockRes();
  await handler({ method: "POST", body: { token: "valid-token" } }, res);
  check("returns success", res._status === 200 && res._body?.success === true, JSON.stringify(res._body));

  const send = calls.find(call => call.url.includes("api.resend.com/emails"));
  const sendBody = JSON.parse(send.options.body);
  check("sends to the stored email", sendBody.to[0] === "alex@example.com");
  check("uses an idempotency key", send.options.headers["Idempotency-Key"] === "research-results-valid-token");
  check("leads with the participant benefit", /how your experience compares with other people[\s\S]*where your answers stand out[\s\S]*where they are similar/i.test(sendBody.html));
  check("keeps contribution and conditions separate", /Your contribution[\s\S]*Conditions around you/i.test(sendBody.html));
  check("shows the largest benchmark differences", /Where you differ most[\s\S]*Skill and craft[\s\S]*2\.0 higher than the current benchmark/.test(sendBody.html));
  check("shows where answers are broadly similar", /Where you are broadly similar/.test(sendBody.html));
  check("provides tailored reflection questions", /Questions to consider[\s\S]*Where does the time needed to check AI-assisted work/.test(sendBody.html));
  check("does not present the comparison as a score or judgement", /point of comparison, not a score or judgement/i.test(sendBody.html));
  check("does not claim to explain a difference", /do not explain why the difference exists/i.test(sendBody.html));
  check("includes the saved response", /4 \/ 5/.test(sendBody.html));
  check("includes the current study benchmark, unaffected by the excluded and orphan records", /Current study benchmark 3\.0 \/ 5/.test(sendBody.html));
  check("does not reveal the response count", !/eligible completed responses|\(n=\d+\)/i.test(sendBody.html));
  check("includes accessible comparison bars", /aria-label="Your response 4 out of 5; current benchmark 3\.0 out of 5"/.test(sendBody.html));
  check("keeps the requested comparison separate from study emails", /requested comparison is separate from optional study emails/i.test(sendBody.html));
  check("includes a one-click study-email unsubscribe route", /https:\/\/www\.turbulentground\.com\/api\/research-unsubscribe\?t=valid-token/.test(sendBody.html));

  const audit = calls.find(call => call.url.includes("tblwpricYYzx4rmiR/recIdentity"));
  const auditBody = JSON.parse(audit.options.body);
  check("records results-email consent", auditBody.fields.fldDQkh2LSSVjacTx === true);
  check("records a sent timestamp", typeof auditBody.fields.fldcGbn19ft4z1OPe === "string");

  const provenance = JSON.parse(auditBody.fields.fldmEbpMqwAWUWv7l);
  check("records the v2 benchmark policy and the cohort size", provenance.policyId === "statement-benchmark-v2-2026-10-27" && provenance.cohortSize === 30 && provenance.announceGate === 30);

  cohortSize = 29;
  const secondRes = mockRes();
  await handler({ method: "POST", body: { token: "second-valid-token" } }, secondRes);
  const sends = calls.filter(call => call.url.includes("api.resend.com/emails"));
  const secondSendBody = JSON.parse(sends.at(-1).options.body);
  check("withholds the benchmark below the 30-completion participant gate, although every statement clears 15", !/Current study benchmark 3\.0 \/ 5/.test(secondSendBody.html));
  check("explains that the comparison is still building without revealing the count", /Your comparison is still building/i.test(secondSendBody.html) && !/Only 29|29 eligible/i.test(secondSendBody.html));
  check("withholds comparisons when the benchmark is unavailable", !/Where you differ most|Where you are broadly similar/.test(secondSendBody.html));
  check("still shows the participant's answers before a benchmark exists", /Your answers, theme by theme/.test(secondSendBody.html));

  // An unreadable exclusion list stops the email rather than risk counting test records.
  const sendsBefore = calls.filter(call => call.url.includes("api.resend.com/emails")).length;
  const cwd = process.cwd();
  const listRes = mockRes();
  process.chdir(mkdtempSync(join(tmpdir(), "no-exclusion-list-")));
  try { await handler({ method: "POST", body: { token: "third-valid-token" } }, listRes); }
  finally { process.chdir(cwd); }
  check("returns 502 when the exclusion list cannot be read", listRes._status === 502);
  check("sends nothing when the exclusion list cannot be read", calls.filter(call => call.url.includes("api.resend.com/emails")).length === sendsBefore);

  const sparseHtml = buildEmailHtml("", {
    d1: { contribution: 5, conditions: 3 },
    d2: { contribution: "not_applicable", conditions: 3 },
  }, { domains: null }, "sparse-token");
  check("does not invent analysis for sparse answers", /Your comparison is still building/.test(sparseHtml));

  const midpointPairs = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [
    `d${index + 1}`,
    { contribution: 3, conditions: 3 },
  ]));
  const midpointHtml = buildEmailHtml("", midpointPairs, { domains: null }, "midpoint-token");
  check("keeps midpoint answers visible without a benchmark", /Your answers, theme by theme/.test(midpointHtml));
  check("does not turn Not applicable into a score", !/Your answers suggest that not applicable/.test(sparseHtml));
  console.log("\nALL CHECKS PASSED");
} finally {
  global.fetch = oldFetch;
  process.env = oldEnv;
}
