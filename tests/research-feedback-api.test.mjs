import assert from "node:assert/strict";
import handler from "../api/research-invite.js";

function response() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function run(body, headers = {}) {
  const res = response();
  await handler({ method: "POST", body: { action: "feedback", ...body }, headers }, res);
  return res;
}

const originalFetch = global.fetch;
const originalResearchToken = process.env.AIRTABLE_RESEARCH_TOKEN;
const originalAdminKey = process.env.RESEARCH_ADMIN_KEY;

try {
  process.env.AIRTABLE_RESEARCH_TOKEN = "test-token";
  process.env.RESEARCH_ADMIN_KEY = "test-admin-key";

  let stored;
  global.fetch = async (_url, options) => {
    stored = JSON.parse(options.body);
    return { ok: true, json: async () => ({ records: [{ id: "rec1" }] }), text: async () => "" };
  };

  const publicResult = await run({
    source: "Research study",
    feedback: "The progress indicator was hard to understand.",
    pageUrl: "https://www.turbulentground.com/research",
  });
  assert.equal(publicResult.statusCode, 201);
  assert.equal(publicResult.body.saved, true);
  assert.equal(stored.records[0].fields.fldHo0OtoX08jX4lr, "New");
  assert.equal(stored.records[0].fields.fldweW0Xu2zKmUkcF, "Pending");

  const unauthorisedManual = await run({ source: "LinkedIn", feedback: "Manual feedback" });
  assert.equal(unauthorisedManual.statusCode, 401);

  const authorisedManual = await run(
    { source: "LinkedIn", feedback: "Manual feedback", sourceDetail: "Close beta participant" },
    { authorization: "Bearer test-admin-key" }
  );
  assert.equal(authorisedManual.statusCode, 201);

  const authorisedMessage = await run(
    { source: "iMessage or WhatsApp", feedback: "Message feedback" },
    { authorization: "Bearer test-admin-key" }
  );
  assert.equal(authorisedMessage.statusCode, 201);

  const widerSiteFeedback = await run({
    source: "Website feedback tab",
    feedback: "Feedback about the wider site",
  });
  assert.equal(widerSiteFeedback.statusCode, 400);

  const blank = await run({ source: "Research study", feedback: "" });
  assert.equal(blank.statusCode, 400);

  console.log("research-feedback-api.test.mjs: all tests passed");
} finally {
  global.fetch = originalFetch;
  if (originalResearchToken === undefined) delete process.env.AIRTABLE_RESEARCH_TOKEN;
  else process.env.AIRTABLE_RESEARCH_TOKEN = originalResearchToken;
  if (originalAdminKey === undefined) delete process.env.RESEARCH_ADMIN_KEY;
  else process.env.RESEARCH_ADMIN_KEY = originalAdminKey;
}
