// GET /api/research-referral-resolve?r=PUBLIC_REFERRAL_ID
// Returns only coarse availability; never identity, graph or internal IDs.

const BASE = "app7dKDinTjxczEfD";
const REFERRALS = "tblXBzl8mQal543xw";
const FIELD = { referralId: "fldhsVcyzGsgcIZXU", status: "fld8XFaGgrsGKkABg" };

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (process.env.RESEARCH_REFERRAL_RESOLVE_ENABLED !== "true") return res.status(404).json({ error: "Not found" });
  const referralId = typeof req.query?.r === "string" ? req.query.r.trim() : "";
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(referralId)) return res.status(200).json({ available: false });
  const token = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!token) return res.status(500).json({ error: "Server configuration error" });
  try {
    const formula = `{${FIELD.referralId}}="${referralId.replace(/"/g, '\\"')}"`;
    const params = new URLSearchParams({ filterByFormula: formula, maxRecords: "1", returnFieldsByFieldId: "true" });
    const response = await fetch(`https://api.airtable.com/v0/${BASE}/${REFERRALS}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Airtable referral lookup failed: ${response.status}`);
    const record = (await response.json()).records?.[0];
    return res.status(200).json({ available: Boolean(record && record.fields[FIELD.status] === "active") });
  } catch (error) {
    console.error(error.message);
    return res.status(200).json({ available: false });
  }
}
