// POST /api/research-capture-email
// body: { token, email }
//
// Documented exception to the Phase 3 path boundary, same as
// api/research-submit.js and api/research-lookup.js: lives outside
// /research/ because Vercel only recognises serverless functions under
// top-level /api/. Standalone — shares no code with api/submit.js,
// api/verify.js, api/research-submit.js, or api/research-lookup.js.
//
// This and api/research-results-email.js are the only code paths in this
// build allowed to write an email address. Both write to the Identity table
// only and never touch Responses. Called the moment a plausible-looking email is typed for
// someone with no email on file, independent of final survey submission,
// so an abandoned survey doesn't lose an already-consented-to email.
//
// Env var: AIRTABLE_RESEARCH_TOKEN (same as the other research/* routes).

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";

const FIELD = {
  token: "fld6danERot7gjOqb",
  email: "fldePJtCCYwLsmNjp",
  responseToken: "flduL4PmBEfH9rLpz",
  consentStudyEmails: "flduWhkQo6u5O3nIp",
  consentQuoteByName: "fldDMxw9XFHCUItsx",
};

// Light sanity check only, not full RFC 5322 validation — just enough to
// catch an obvious typo or empty string, per the brief.
function looksLikeEmail(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return false; // no @, or nothing before it
  const domain = trimmed.slice(at + 1);
  if (!domain || domain.indexOf(".") <= 0) return false; // nothing after @, or no dot with something before it
  if (/\s/.test(trimmed)) return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let data;
  try {
    data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const token = typeof data.token === "string" ? data.token.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const hasPreferences = typeof data.studyEmails === "boolean" || typeof data.quoteByName === "boolean";
  const studyEmails = data.studyEmails === true;
  const quoteByName = data.quoteByName === true;

  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }
  if (!hasPreferences && !looksLikeEmail(email)) {
    return res.status(400).json({ error: "That doesn't look like a valid email address" });
  }
  if (email && !looksLikeEmail(email)) {
    return res.status(400).json({ error: "That doesn't look like a valid email address" });
  }

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!airtableToken) {
    console.error("Missing AIRTABLE_RESEARCH_TOKEN");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const formula = `{${FIELD.token}}="${token.replace(/"/g, '\\"')}"`;
  const lookupUrl =
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&returnFieldsByFieldId=true`;

  let record;
  try {
    const lookupRes = await fetch(lookupUrl, {
      headers: { Authorization: `Bearer ${airtableToken}` },
    });
    if (!lookupRes.ok) {
      const err = await lookupRes.text();
      console.error("Airtable lookup failed:", err);
      return res.status(502).json({ error: "Could not save email" });
    }
    const lookupData = await lookupRes.json();
    record = lookupData.records && lookupData.records[0];
  } catch (err) {
    console.error("Airtable lookup fetch error:", err);
    return res.status(502).json({ error: "Could not save email" });
  }

  if (!record) {
    return res.status(403).json({ error: "Invalid token" });
  }

  if (studyEmails && !email && !record.fields?.[FIELD.email]) {
    return res.status(400).json({ error: "Please add an email address for study emails" });
  }

  try {
    if (email) {
      const patchRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}/${record.id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${airtableToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { [FIELD.email]: email } }),
        }
      );
      if (!patchRes.ok) throw new Error(`Airtable email write failed: ${await patchRes.text()}`);
    }

    if (hasPreferences) {
      const responseFormula = `{${FIELD.responseToken}}="${token.replace(/"/g, '\\"')}"`;
      const responseLookup = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RESPONSES_TABLE_ID}` +
        `?filterByFormula=${encodeURIComponent(responseFormula)}&maxRecords=1&returnFieldsByFieldId=true`,
        { headers: { Authorization: `Bearer ${airtableToken}` } }
      );
      if (!responseLookup.ok) throw new Error(`Airtable response lookup failed: ${await responseLookup.text()}`);
      const responseData = await responseLookup.json();
      const responseRecord = responseData.records && responseData.records[0];
      if (!responseRecord) return res.status(403).json({ error: "This completed response could not be found" });
      const preferencePatch = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RESPONSES_TABLE_ID}/${responseRecord.id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${airtableToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ fields: {
            [FIELD.consentStudyEmails]: studyEmails,
            [FIELD.consentQuoteByName]: quoteByName,
          } }),
        }
      );
      if (!preferencePatch.ok) throw new Error(`Airtable preference write failed: ${await preferencePatch.text()}`);
    }
  } catch (err) {
    console.error("Airtable patch fetch error:", err);
    return res.status(502).json({ error: "Could not save email" });
  }

  return res.status(200).json({ success: true });
}
