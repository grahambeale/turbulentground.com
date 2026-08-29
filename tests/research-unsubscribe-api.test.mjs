import handler from "../api/research-unsubscribe.js";

function check(label, condition, detail = "") {
  if (!condition) throw new Error(`FAIL  ${label}${detail ? `: ${detail}` : ""}`);
  console.log(`  PASS  ${label}`);
}

function mockRes() {
  return {
    _status: 200, _body: null, _headers: {},
    status(code) { this._status = code; return this; },
    setHeader(name, value) { this._headers[name] = value; return this; },
    json(body) { this._body = body; return this; },
    send(body) { this._body = body; return this; },
  };
}

const oldFetch = global.fetch;
const oldToken = process.env.AIRTABLE_RESEARCH_TOKEN;
process.env.AIRTABLE_RESEARCH_TOKEN = "test-airtable";

try {
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("tblL9mf8VfAmbhuG7?") && (!options.method || options.method === "GET")) {
      return { ok: true, json: async () => ({ records: [{ id: "recResponse", fields: {} }] }) };
    }
    if (String(url).includes("tblL9mf8VfAmbhuG7/recResponse") && options.method === "PATCH") {
      return { ok: true, json: async () => ({}) };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  console.log("research-unsubscribe-api.test.mjs");

  const pageRes = mockRes();
  await handler({ method: "GET", query: { t: "valid-token" } }, pageRes);
  check("serves a deliberate unsubscribe confirmation page", pageRes._status === 200 && /Unsubscribe from study emails\?/.test(pageRes._body));
  check("does not mutate consent during the GET", calls.length === 0);
  check("prevents the page being cached", pageRes._headers["Cache-Control"] === "no-store");
  check("asks for optional feedback", /Would you like to tell me why\?/.test(pageRes._body));
  check("requires the confirmation form before POST", /form\.addEventListener\('submit'/.test(pageRes._body) && !/unsubscribe\(\);/.test(pageRes._body));
  check("keeps the participant subscribed without leaving the page", /You’re still subscribed\./.test(pageRes._body) && /getElementById\('keep'\)\.addEventListener/.test(pageRes._body));
  check("does not send the participant to the token-protected survey", !/href="\/research\//.test(pageRes._body));

  const postRes = mockRes();
  await handler({ method: "POST", body: { token: "valid-token", feedback: "Too many emails for me." } }, postRes);
  check("returns success after opting out", postRes._status === 200 && postRes._body?.success === true);
  const patch = calls.find(call => call.url.includes("tblL9mf8VfAmbhuG7/recResponse"));
  const patchBody = JSON.parse(patch.options.body);
  check("sets study-email consent to false", patchBody.fields.flduWhkQo6u5O3nIp === false);
  check("stores optional feedback separately", patchBody.fields.fldRWiyUJF7rMf3Zk === "Too many emails for me.");
  check("records when the participant unsubscribed", !Number.isNaN(Date.parse(patchBody.fields.fldMhpdR9iQHKiGou)));

  const tooLongRes = mockRes();
  await handler({ method: "POST", body: { token: "valid-token", feedback: "x".repeat(1001) } }, tooLongRes);
  check("rejects feedback beyond the stated limit", tooLongRes._status === 400);

  const invalidRes = mockRes();
  await handler({ method: "POST", body: { token: "" } }, invalidRes);
  check("rejects an invalid unsubscribe token", invalidRes._status === 400);

  console.log("\nALL CHECKS PASSED");
} finally {
  global.fetch = oldFetch;
  if (oldToken === undefined) delete process.env.AIRTABLE_RESEARCH_TOKEN;
  else process.env.AIRTABLE_RESEARCH_TOKEN = oldToken;
}
