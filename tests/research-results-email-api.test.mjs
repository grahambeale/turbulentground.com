import handler from "../api/research-results-email.js";

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
  let cohortSize = 5;
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("tblwpricYYzx4rmiR?") && (!options.method || options.method === "GET")) {
      return { ok: true, json: async () => ({ records: [{ id: "recIdentity", fields: {
        fldGto31lmx5KwyNr: "Alex Morgan",
        fldePJtCCYwLsmNjp: "alex@example.com",
        fldEhm06lLDvEeF6q: "Completed",
      } }] }) };
    }
    if (String(url).includes("tblL9mf8VfAmbhuG7?") && String(url).includes("filterByFormula")) {
      return { ok: true, json: async () => ({ records: [{ id: "recResponse", fields: {
        fldvxb2mrIYVKLGVM: JSON.stringify({
          d1: { contribution: 4, conditions: 2 },
          d2: { contribution: 2, conditions: 5 },
          d3: { contribution: 5, conditions: 2 },
          d4: { contribution: 5, conditions: 3 },
        }),
      } }] }) };
    }
    if (String(url).includes("tblL9mf8VfAmbhuG7?")) {
      return { ok: true, json: async () => ({ records: [1, 2, 3, 4, 5].slice(0, cohortSize).map((value) => ({
        id: `recCohort${value}`,
        fields: {
          fldvxb2mrIYVKLGVM: JSON.stringify({
            d1: { contribution: 3, conditions: 3 },
            d2: { contribution: 3, conditions: 3 },
            d3: { contribution: 3, conditions: 3 },
            d4: { contribution: 3, conditions: 3 },
          }),
          fldc1EMbDAHAO99Av: true,
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
  check("keeps contribution and conditions separate", /difference between them matters/i.test(sendBody.html));
  check("includes the saved response", /4 \/ 5/.test(sendBody.html));
  check("includes the current study benchmark", /Current study benchmark 3\.0 \/ 5/.test(sendBody.html));
  check("warns that the early benchmark may fluctuate", /likely to fluctuate frequently during the early phase/i.test(sendBody.html));
  check("does not reveal the response count", !/eligible completed responses|\(n=\d+\)/i.test(sendBody.html));
  check("shows lens-level benchmark cards", /Your contribution/.test(sendBody.html) && /Conditions around you/.test(sendBody.html));
  check("shows a signed benchmark difference", /\+1\.0 above the benchmark/.test(sendBody.html));
  check("shows concise benchmark highlights", /Benchmark highlights/.test(sendBody.html));
  check("shows above and below contribution highlights", /Skill and craft[\s\S]*\+2\.0[\s\S]*Time and workload[\s\S]*-1\.0/.test(sendBody.html));
  check("shows above and below conditions highlights", /Conditions around you[\s\S]*Time and workload[\s\S]*\+2\.0[\s\S]*Judgement[\s\S]*-1\.0/.test(sendBody.html));
  check("qualifies the organisation comparison", /not an assessment of your whole organisation/i.test(sendBody.html));
  check("includes accessible comparison bars", /aria-label="Your response 4 out of 5; current benchmark 3\.0 out of 5"/.test(sendBody.html));
  check("includes a study-email unsubscribe route", /Unsubscribe%20from%20study%20emails/.test(sendBody.html));

  const audit = calls.find(call => call.url.includes("tblwpricYYzx4rmiR/recIdentity"));
  const auditBody = JSON.parse(audit.options.body);
  check("records results-email consent", auditBody.fields.fldDQkh2LSSVjacTx === true);
  check("records a sent timestamp", typeof auditBody.fields.fldcGbn19ft4z1OPe === "string");

  cohortSize = 4;
  const secondRes = mockRes();
  await handler({ method: "POST", body: { token: "second-valid-token" } }, secondRes);
  const sends = calls.filter(call => call.url.includes("api.resend.com/emails"));
  const secondSendBody = JSON.parse(sends.at(-1).options.body);
  check("withholds the benchmark below five eligible responses", !/Current study benchmark 3\.0 \/ 5/.test(secondSendBody.html));
  check("explains that the benchmark is unavailable without revealing the count", /A comparison benchmark is not available yet/i.test(secondSendBody.html) && !/Only 4|4 eligible/i.test(secondSendBody.html));
  check("withholds highlights when the benchmark is unavailable", !/Benchmark highlights/.test(secondSendBody.html));
  console.log("\nALL CHECKS PASSED");
} finally {
  global.fetch = oldFetch;
  process.env = oldEnv;
}
