import handler from "../api/research-results-preview.js";

function check(label, condition) {
  if (!condition) throw new Error(`FAIL  ${label}`);
  console.log(`  PASS  ${label}`);
}

function mockRes() {
  return {
    _status: 200, _body: null, _headers: {},
    status(code) { this._status = code; return this; },
    setHeader(name, value) { this._headers[name] = value; return this; },
    json(body) { this._body = body; return this; },
  };
}

const oldFetch = global.fetch;
const oldEnv = { ...process.env };
process.env.RESEARCH_ADMIN_KEY = "correct-key";
process.env.RESEND_API_KEY = "test-resend";
process.env.RESEND_FROM = "Turbulent Ground <results@example.com>";

try {
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return { ok: true, json: async () => ({ id: "email_preview" }) };
  };

  console.log("research-results-preview-api.test.mjs");
  const unauthorised = mockRes();
  await handler({ method: "POST", headers: { authorization: "Bearer wrong-key" }, body: { email: "graham@beale.co.uk" } }, unauthorised);
  check("rejects an incorrect admin key", unauthorised._status === 401);
  check("does not send when unauthorised", calls.length === 0);

  const res = mockRes();
  await handler({ method: "POST", headers: { authorization: "Bearer correct-key" }, body: { email: "graham@beale.co.uk" } }, res);
  check("sends an authorised preview", res._status === 200 && res._body?.success === true);
  const send = calls.find(call => call.url.includes("api.resend.com/emails"));
  const body = JSON.parse(send.options.body);
  check("labels the subject as a test", body.subject === "TEST: Your AI shift response summary");
  check("labels the fictional preview in the email", /fictional responses/i.test(body.html));
  check("contains the personalised summary", /Your response at a glance/.test(body.html));
  check("contains the benchmark comparison", /Your emerging benchmark comparison/.test(body.html));
  check("does not include a functional unsubscribe link", !/api\/research-unsubscribe/.test(body.html));

  console.log("\nALL CHECKS PASSED");
} finally {
  global.fetch = oldFetch;
  process.env = oldEnv;
}
