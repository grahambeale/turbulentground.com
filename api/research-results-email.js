// POST /api/research-results-email
// body: { token, email? }
//
// Sends a completed participant a factual summary of their own paired
// responses. Once five completed responses exist, it also shows the current
// invited-cohort mean for each statement, labelled as an early benchmark with
// its cohort size. It never calculates an overall score or percentile.

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";

const IDENTITY_FIELD = {
  token: "fld6danERot7gjOqb",
  name: "fldGto31lmx5KwyNr",
  email: "fldePJtCCYwLsmNjp",
  inviteStatus: "fldEhm06lLDvEeF6q",
  consentResults: "fldDQkh2LSSVjacTx",
  resultsSentAt: "fldcGbn19ft4z1OPe",
};

const RESPONSE_FIELD = {
  token: "flduL4PmBEfH9rLpz",
  pairResponsesJson: "fldvxb2mrIYVKLGVM",
  meetsCompletionFloor: "fldc1EMbDAHAO99Av",
};

const DOMAINS = [
  ["d1", "Judgement"], ["d2", "Time and workload"],
  ["d3", "Working relationships"], ["d4", "Skill and craft"],
  ["d5", "Autonomy"], ["d6", "Learning"], ["d7", "Trust"],
  ["d8", "Being seen"], ["d9", "Meaning"], ["d10", "Pace"],
  ["d11", "AI in team decisions"], ["d12", "Job security"],
];

function looksLikeEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayValue(value) {
  if (typeof value === "number" && value >= 1 && value <= 5) return `${value} / 5`;
  if (value === "not_applicable") return "Not applicable";
  if (value === "skip") return "Prefer not to say";
  return "Not answered";
}

async function findRecord(tableId, token, tokenFieldId, airtableToken) {
  const formula = `{${tokenFieldId}}="${token.replace(/"/g, '\\"')}"`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&returnFieldsByFieldId=true`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${airtableToken}` } });
  if (!response.ok) throw new Error(`Airtable lookup failed: ${await response.text()}`);
  const data = await response.json();
  return data.records && data.records[0];
}

async function listResponsePairs(airtableToken) {
  const allPairs = [];
  let offset = "";
  do {
    const params = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
    params.append("fields[]", RESPONSE_FIELD.pairResponsesJson);
    params.append("fields[]", RESPONSE_FIELD.meetsCompletionFloor);
    if (offset) params.set("offset", offset);
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RESPONSES_TABLE_ID}?${params}`,
      { headers: { Authorization: `Bearer ${airtableToken}` } }
    );
    if (!response.ok) throw new Error(`Airtable cohort lookup failed: ${await response.text()}`);
    const data = await response.json();
    for (const record of data.records || []) {
      if (record.fields[RESPONSE_FIELD.meetsCompletionFloor] !== true) continue;
      try { allPairs.push(JSON.parse(record.fields[RESPONSE_FIELD.pairResponsesJson] || "{}")); }
      catch { /* Exclude unreadable records from the benchmark. */ }
    }
    offset = data.offset || "";
  } while (offset);
  return allPairs;
}

function computeBenchmark(allPairs) {
  if (allPairs.length < 5) return { cohortSize: allPairs.length, domains: null };
  const domains = {};
  for (const [key] of DOMAINS) {
    domains[key] = {};
    for (const field of ["contribution", "conditions"]) {
      const values = allPairs.map(pairs => pairs?.[key]?.[field]).filter(value => typeof value === "number");
      domains[key][field] = values.length
        ? { mean: values.reduce((sum, value) => sum + value, 0) / values.length, n: values.length }
        : null;
    }
  }
  return { cohortSize: allPairs.length, domains };
}

function benchmarkValue(entry) {
  return entry ? `Early study average ${entry.mean.toFixed(1)} / 5 (n=${entry.n})` : "No study average yet";
}

function buildEmailHtml(name, pairs, benchmark) {
  const rows = DOMAINS.map(([key, label]) => {
    const pair = pairs[key] || {};
    const domainBenchmark = benchmark.domains && benchmark.domains[key];
    const contributionBenchmark = domainBenchmark && benchmarkValue(domainBenchmark.contribution);
    const conditionsBenchmark = domainBenchmark && benchmarkValue(domainBenchmark.conditions);
    return `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #3a332d;color:#e8dcc8;font-family:Arial,sans-serif;font-size:14px;">${escapeHtml(label)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #3a332d;color:#d0bea2;font-family:Arial,sans-serif;font-size:14px;">${displayValue(pair.contribution)}${contributionBenchmark ? `<br><span style="font-size:12px;color:#9e8e7c;">${contributionBenchmark}</span>` : ""}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #3a332d;color:#d0bea2;font-family:Arial,sans-serif;font-size:14px;">${displayValue(pair.conditions)}${conditionsBenchmark ? `<br><span style="font-size:12px;color:#9e8e7c;">${conditionsBenchmark}</span>` : ""}</td>
    </tr>`;
  }).join("");

  const greeting = name ? `Hello ${escapeHtml(name)},` : "Hello,";
  const benchmarkNote = benchmark.domains
    ? `The early study averages below are based on ${benchmark.cohortSize} eligible completed responses from this invite-only cohort. They are provisional and may move substantially as more people take part.`
    : `Only ${benchmark.cohortSize} eligible completed ${benchmark.cohortSize === 1 ? "response is" : "responses are"} currently available, so a study comparison would not yet be meaningful. Your summary will show your own answers only.`;
  return `<!doctype html><html><body style="margin:0;background:#131110;color:#e8dcc8;">
    <div style="max-width:680px;margin:0 auto;padding:40px 24px;">
      <p style="font-family:Arial,sans-serif;font-size:15px;color:#d0bea2;">${greeting}</p>
      <h1 style="font-family:Georgia,serif;font-size:30px;font-weight:400;line-height:1.2;">Your AI shift response summary</h1>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#d0bea2;">This is a record of how you answered across the 12 themes. It is not an overall score.</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#9e8e7c;">${benchmarkNote}</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:24px;">
        <thead><tr>
          <th align="left" style="padding:10px 8px;border-bottom:2px solid #c9470e;color:#e8dcc8;font-family:Arial,sans-serif;font-size:13px;">Theme</th>
          <th align="left" style="padding:10px 8px;border-bottom:2px solid #c9470e;color:#e8dcc8;font-family:Arial,sans-serif;font-size:13px;">Your contribution</th>
          <th align="left" style="padding:10px 8px;border-bottom:2px solid #c9470e;color:#e8dcc8;font-family:Arial,sans-serif;font-size:13px;">Conditions around you</th>
        </tr></thead><tbody>${rows}</tbody>
      </table>
      <p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#9e8e7c;margin-top:24px;">The response scale runs from 1, strongly disagree, to 5, strongly agree. These results are descriptive and should not be treated as a psychological assessment.</p>
      <p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#9e8e7c;">You received this because you requested your summary after completing the invite-only Turbulent Ground research study.</p>
    </div></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let data;
  try { data = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: "Invalid JSON" }); }

  const token = typeof data?.token === "string" ? data.token.trim() : "";
  if (!token) return res.status(400).json({ error: "Missing token" });

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
  if (!airtableToken || !resendKey || !resendFrom) {
    console.error("Missing research results email configuration");
    return res.status(500).json({ error: "Results email is not configured" });
  }

  let identity;
  let responseRecord;
  let allPairs;
  try {
    [identity, responseRecord, allPairs] = await Promise.all([
      findRecord(IDENTITY_TABLE_ID, token, IDENTITY_FIELD.token, airtableToken),
      findRecord(RESPONSES_TABLE_ID, token, RESPONSE_FIELD.token, airtableToken),
      listResponsePairs(airtableToken),
    ]);
  } catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Could not prepare your results" });
  }

  if (!identity || !responseRecord || identity.fields[IDENTITY_FIELD.inviteStatus] !== "Completed") {
    return res.status(403).json({ error: "Results are only available after completing the study" });
  }
  if (identity.fields[IDENTITY_FIELD.resultsSentAt]) {
    return res.status(409).json({ error: "Your results have already been sent" });
  }

  const suppliedEmail = typeof data?.email === "string" ? data.email.trim() : "";
  const storedEmail = identity.fields[IDENTITY_FIELD.email];
  const email = suppliedEmail || storedEmail || "";
  if (!looksLikeEmail(email)) return res.status(400).json({ error: "Please enter a valid email address" });

  let pairs;
  try { pairs = JSON.parse(responseRecord.fields[RESPONSE_FIELD.pairResponsesJson] || "{}"); }
  catch { return res.status(502).json({ error: "Could not read your saved responses" }); }
  const benchmark = computeBenchmark(allPairs);

  const name = identity.fields[IDENTITY_FIELD.name] || "";
  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `research-results-${token}`,
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [email],
      subject: "Your AI shift response summary",
      html: buildEmailHtml(name, pairs, benchmark),
    }),
  });
  if (!emailResponse.ok) {
    console.error("Resend results email failed:", await emailResponse.text());
    return res.status(502).json({ error: "Could not send your results. Please try again" });
  }

  const patchFields = {
    [IDENTITY_FIELD.consentResults]: true,
    [IDENTITY_FIELD.resultsSentAt]: new Date().toISOString(),
  };
  if (suppliedEmail) patchFields[IDENTITY_FIELD.email] = suppliedEmail;

  const patchResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}/${identity.id}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${airtableToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: patchFields }),
    }
  );
  if (!patchResponse.ok) {
    console.error("Results email audit write failed:", await patchResponse.text());
    return res.status(502).json({ error: "Results were sent, but the confirmation could not be saved" });
  }

  return res.status(200).json({ success: true });
}
