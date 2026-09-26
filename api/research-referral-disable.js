// POST /api/research-referral-disable
// A completed participant can withdraw their own public referral ID.

const BASE = "app7dKDinTjxczEfD";
const IDENTITY = "tblwpricYYzx4rmiR";
const REFERRALS = "tblXBzl8mQal543xw";
const IF = { token: "fld6danERot7gjOqb" };
const FF = { referrer: "fldgZjeCrX8WJDfSJ", status: "fld8XFaGgrsGKkABg", disabledAt: "fldPsnNZV61DO1vih", reason: "fld6FqGWIEes5Tn7L" };

async function find(table, formula, token) {
  const params = new URLSearchParams({ filterByFormula: formula, maxRecords: "1", returnFieldsByFieldId: "true" });
  const response = await fetch(`https://api.airtable.com/v0/${BASE}/${table}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Airtable lookup failed: ${response.status}`);
  return (await response.json()).records?.[0] || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (process.env.RESEARCH_REFERRAL_ISSUE_ENABLED !== "true") return res.status(404).json({ error: "Not found" });
  const privateToken = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  if (!privateToken) return res.status(400).json({ error: "Invalid request" });
  const token = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!token) return res.status(500).json({ error: "Server configuration error" });
  try {
    const identity = await find(IDENTITY, `{${IF.token}}="${privateToken.replace(/"/g, '\\"')}"`, token);
    if (!identity) return res.status(200).json({ status: "unavailable" });
    const referral = await find(REFERRALS, `FIND("${identity.id}",ARRAYJOIN({${FF.referrer}}))`, token);
    if (!referral) return res.status(200).json({ status: "unavailable" });
    const response = await fetch(`https://api.airtable.com/v0/${BASE}/${REFERRALS}/${referral.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: {
        [FF.status]: "withdrawn", [FF.disabledAt]: new Date().toISOString(), [FF.reason]: "withdrawal"
      }, typecast: true }),
    });
    if (!response.ok) throw new Error(`Airtable referral disable failed: ${response.status}`);
    return res.status(200).json({ status: "withdrawn" });
  } catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Could not update referral sharing." });
  }
}
