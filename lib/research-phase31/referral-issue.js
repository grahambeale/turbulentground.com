// POST /api/research-referral-issue
// Issues or retrieves one stable public referral ID for an eligible completion.

import { createHmac } from "node:crypto";

const BASE = "app7dKDinTjxczEfD";
const IDENTITY = "tblwpricYYzx4rmiR";
const RESPONSES = "tblL9mf8VfAmbhuG7";
const REFERRALS = "tblXBzl8mQal543xw";

const IF = { token: "fld6danERot7gjOqb" };
const RF = { token: "flduL4PmBEfH9rLpz", completedAt: "fld8sYjswX21vvVXz", eligible: "fldc1EMbDAHAO99Av", instrument: "fldHJ4KNzMbpzdob6" };
const FF = {
  referralId: "fldhsVcyzGsgcIZXU", referrer: "fldgZjeCrX8WJDfSJ", status: "fld8XFaGgrsGKkABg",
  issuedAt: "fld8sCGvIxsuIRlRZ", instrument: "fld2WYZPaepqkXFM4", privacy: "fld8bUJmR4GrQbftZ",
  consent: "fldk0GgOjqAf7dhMJ"
};

async function find(table, formula, token) {
  const params = new URLSearchParams({ filterByFormula: formula, maxRecords: "1", returnFieldsByFieldId: "true" });
  const response = await fetch(`https://api.airtable.com/v0/${BASE}/${table}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Airtable lookup failed: ${response.status}`);
  return (await response.json()).records?.[0] || null;
}

// Core issue-or-retrieve logic, shared by this endpoint and any other
// server-side caller (e.g. the results email) that already has the
// participant's identity/response records and just needs their public
// referral link — same eligibility check, same stable HMAC-derived ID,
// same "never expose the private token" guarantee, in one place rather
// than reimplemented a second time.
export async function resolveReferralShareForParticipant({ identity, response, airtableToken, referralSecret }) {
  if (!identity || !response || !response.fields[RF.completedAt] || response.fields[RF.eligible] !== true) {
    return null;
  }

  const existing = await find(REFERRALS, `FIND("${identity.id}",ARRAYJOIN({${FF.referrer}}))`, airtableToken);
  if (existing) {
    if (existing.fields[FF.status] !== "active") return null;
    return { created: false, sharePath: `/take-part?r=${encodeURIComponent(existing.fields[FF.referralId])}` };
  }

  const referralId = createHmac("sha256", referralSecret).update(identity.id).digest("base64url").slice(0, 22);
  const fields = {
    [FF.referralId]: referralId,
    [FF.referrer]: [identity.id],
    [FF.status]: "active",
    [FF.issuedAt]: new Date().toISOString(),
    [FF.instrument]: response.fields[RF.instrument] || "unknown",
    [FF.privacy]: "phase-3-1-privacy-v1",
    [FF.consent]: "phase-3-1-consent-v1",
  };
  const created = await fetch(`https://api.airtable.com/v0/${BASE}/${REFERRALS}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${airtableToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      performUpsert: { fieldsToMergeOn: [FF.referralId] },
      records: [{ fields }],
      typecast: true,
    }),
  });
  if (!created.ok) throw new Error(`Airtable referral creation failed: ${created.status}`);
  return { created: true, sharePath: `/take-part?r=${encodeURIComponent(referralId)}` };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ enabled: process.env.RESEARCH_SHARING_UI_ENABLED === "true" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (process.env.RESEARCH_REFERRAL_ISSUE_ENABLED !== "true") return res.status(404).json({ error: "Not found" });
  const privateToken = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  if (!privateToken) return res.status(400).json({ error: "Invalid request" });
  const token = process.env.AIRTABLE_RESEARCH_TOKEN;
  const referralSecret = process.env.RESEARCH_REFERRAL_SECRET;
  if (!token || !referralSecret || referralSecret.length < 32) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const escaped = privateToken.replace(/"/g, '\\"');
    const [identity, response] = await Promise.all([
      find(IDENTITY, `{${IF.token}}="${escaped}"`, token),
      find(RESPONSES, `{${RF.token}}="${escaped}"`, token),
    ]);
    const result = await resolveReferralShareForParticipant({ identity, response, airtableToken: token, referralSecret });
    if (!result) return res.status(403).json({ error: "Referral sharing is unavailable." });
    return res.status(result.created ? 201 : 200).json({ status: "active", sharePath: result.sharePath });
  } catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Referral sharing is temporarily unavailable." });
  }
}
