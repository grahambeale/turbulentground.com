// POST /api/research-participation-preferences
// Saves optional, post-submission contact and attribution choices.

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";

const FIELD = {
  identityToken: "fld6danERot7gjOqb",
  identityEmail: "fldePJtCCYwLsmNjp",
  responseToken: "flduL4PmBEfH9rLpz",
  studyEmails: "flduWhkQo6u5O3nIp",
  quoteByName: "fldDMxw9XFHCUItsx",
};

function looksLikeEmail(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  const at = trimmed.indexOf("@");
  return at > 0 && trimmed.slice(at + 1).includes(".") && !/\s/.test(trimmed);
}

async function findRecord(tableId, fieldId, token, airtableToken) {
  const formula = `{${fieldId}}="${token.replace(/"/g, '\\"')}"`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&returnFieldsByFieldId=true`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${airtableToken}` } });
  if (!response.ok) throw new Error(`Airtable lookup failed: ${await response.text()}`);
  const data = await response.json();
  return data.records && data.records[0];
}

async function patchRecord(tableId, recordId, fields, airtableToken) {
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}/${recordId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${airtableToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`Airtable update failed: ${await response.text()}`);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  let data;
  try { data = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: "Invalid JSON" }); }

  const token = typeof data?.token === "string" ? data.token.trim() : "";
  const studyEmails = data?.studyEmails === true;
  const quoteByName = data?.quoteByName === true;
  const email = typeof data?.email === "string" ? data.email.trim() : "";
  if (!token) return res.status(400).json({ error: "Missing token" });
  if (studyEmails && email && !looksLikeEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!airtableToken) return res.status(500).json({ error: "Server configuration error" });

  try {
    const [identity, response] = await Promise.all([
      findRecord(IDENTITY_TABLE_ID, FIELD.identityToken, token, airtableToken),
      findRecord(RESPONSES_TABLE_ID, FIELD.responseToken, token, airtableToken),
    ]);
    if (!identity || !response) return res.status(403).json({ error: "This completed response could not be found" });
    if (studyEmails && !email && !identity.fields?.[FIELD.identityEmail]) {
      return res.status(400).json({ error: "Please add an email address for study emails" });
    }
    await Promise.all([
      patchRecord(RESPONSES_TABLE_ID, response.id, {
        [FIELD.studyEmails]: studyEmails,
        [FIELD.quoteByName]: quoteByName,
      }, airtableToken),
      email ? patchRecord(IDENTITY_TABLE_ID, identity.id, { [FIELD.identityEmail]: email }, airtableToken) : Promise.resolve(),
    ]);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Could not save your choices" });
  }
}
