// GET /api/research-lookup?t=TOKEN
//
// Documented exception to the Phase 3 path boundary, same as
// api/research-submit.js: this file lives outside /research/ because
// Vercel only recognises serverless functions under top-level /api/.
// Standalone — shares no code with api/submit.js or api/verify.js
// (Phase 2's diagnostic routes), or with api/research-submit.js.
//
// Exposes the absolute minimum needed for the consent-screen greeting:
// whether a token is real, a first name, and whether an email is already
// on file. Never returns the email address itself, Invite Status, or any
// other Identity field.
//
// Env var: AIRTABLE_RESEARCH_TOKEN (same as the other research/* routes).

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";

const FIELD = {
  token: "fld6danERot7gjOqb",
  name: "fldGto31lmx5KwyNr",
  email: "fldePJtCCYwLsmNjp",
};

function firstNameOf(fullName) {
  if (!fullName || typeof fullName !== "string") return "";
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/);
  return parts.length > 1 ? parts[0] : trimmed;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = typeof req.query.t === "string" ? req.query.t.trim() : "";
  if (!token) {
    return res.status(200).json({ valid: false });
  }

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!airtableToken) {
    console.error("Missing AIRTABLE_RESEARCH_TOKEN");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const formula = `{${FIELD.token}}="${token.replace(/"/g, '\\"')}"`;
  const url =
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&returnFieldsByFieldId=true`;

  let record;
  try {
    const airtableRes = await fetch(url, {
      headers: { Authorization: `Bearer ${airtableToken}` },
    });
    if (!airtableRes.ok) {
      const err = await airtableRes.text();
      console.error("Airtable lookup failed:", err);
      return res.status(502).json({ error: "Lookup failed" });
    }
    const data = await airtableRes.json();
    record = data.records && data.records[0];
  } catch (err) {
    console.error("Airtable fetch error:", err);
    return res.status(502).json({ error: "Lookup failed" });
  }

  if (!record) {
    return res.status(200).json({ valid: false });
  }

  const name = firstNameOf(record.fields[FIELD.name]);
  const hasEmail = typeof record.fields[FIELD.email] === "string" && record.fields[FIELD.email].trim() !== "";

  return res.status(200).json({ valid: true, name, hasEmail });
}
