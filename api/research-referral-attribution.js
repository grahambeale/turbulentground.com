// POST /api/research-referral-attribution
// Records a later referral claim without replacing immutable first-touch attribution.

import { createHmac } from "node:crypto";

const BASE = "app7dKDinTjxczEfD";
const IDENTITY = "tblwpricYYzx4rmiR";
const REFERRALS = "tblXBzl8mQal543xw";
const ACQUISITIONS = "tblhjBvklwWNNx8Rg";
const EVENTS = "tbldf3XOuTy3DYth9";

const IF = { token: "fld6danERot7gjOqb" };
const FF = { referralId: "fldhsVcyzGsgcIZXU", status: "fld8XFaGgrsGKkABg" };
const AF = {
  participant: "fldqU9bCJH5V4m4Lx", referrer: "fldWurPEyDv2OhIXp",
  status: "fldD7AXUyBI6heSeI", conflictCount: "fldwGlpOjfvSvhXpq"
};
const EF = {
  id: "fldJG2VrwhlQah3kx", name: "fldERYINEax5o7062", occurredAt: "fldvncP0ZFavSkUis",
  receivedAt: "fldv4ED2rAefaMQPd", participant: "fldSxQvjcbKAxJfgs", acquisition: "fldzdtlF9YfQYgdgb",
  authority: "fldJHfnVkKAJJWICL", validity: "fldyXCb8LlLlrMkPH", schemaVersion: "fld9stbQokNRNIKnk"
};

function escaped(value) { return String(value).replace(/"/g, '\\"'); }

async function find(table, formula, token, maxRecords = 1) {
  const params = new URLSearchParams({ filterByFormula: formula, maxRecords: String(maxRecords), returnFieldsByFieldId: "true" });
  const response = await fetch(`https://api.airtable.com/v0/${BASE}/${table}?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Airtable lookup failed: ${response.status}`);
  return (await response.json()).records || [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (process.env.RESEARCH_REFERRAL_RESOLVE_ENABLED !== "true") return res.status(404).json({ error: "Not found" });

  const privateToken = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  const referralId = typeof req.body?.referralId === "string" ? req.body.referralId.trim() : "";
  if (!privateToken || privateToken.length > 256 || !/^[A-Za-z0-9_-]{20,64}$/.test(referralId)) {
    return res.status(400).json({ error: "Invalid request" });
  }
  const token = process.env.AIRTABLE_RESEARCH_TOKEN;
  const secret = process.env.RESEARCH_REFERRAL_SECRET;
  if (!token || !secret || secret.length < 32) return res.status(500).json({ error: "Server configuration error" });

  try {
    const identity = (await find(IDENTITY, `{${IF.token}}="${escaped(privateToken)}"`, token))[0];
    if (!identity) return res.status(404).json({ error: "Not found" });
    const acquisition = (await find(ACQUISITIONS, `FIND("${identity.id}",ARRAYJOIN({${AF.participant}}))`, token))[0];
    const referral = (await find(REFERRALS, `{${FF.referralId}}="${escaped(referralId)}"`, token))[0];
    if (!acquisition || !referral || referral.fields[FF.status] !== "active") {
      return res.status(200).json({ status: "ignored" });
    }

    const originalReferral = acquisition.fields[AF.referrer]?.[0] || null;
    if (originalReferral === referral.id) return res.status(200).json({ status: "attributed" });

    const eventId = createHmac("sha256", secret)
      .update(`attribution-conflict:${identity.id}:${referral.id}`)
      .digest("base64url").slice(0, 32);
    const now = new Date().toISOString();
    const eventFields = {
      [EF.id]: eventId,
      [EF.name]: "attribution_conflict",
      [EF.occurredAt]: now,
      [EF.receivedAt]: now,
      [EF.participant]: [identity.id],
      [EF.acquisition]: [acquisition.id],
      [EF.authority]: "server",
      [EF.validity]: "excluded",
      [EF.schemaVersion]: 1,
    };
    const eventResponse = await fetch(`https://api.airtable.com/v0/${BASE}/${EVENTS}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn: [EF.id] }, records: [{ fields: eventFields }], typecast: true
      }),
    });
    if (!eventResponse.ok) throw new Error(`Airtable event upsert failed: ${eventResponse.status}`);

    const conflictFormula = `AND({${EF.name}}="attribution_conflict",FIND("${acquisition.id}",ARRAYJOIN({${EF.acquisition}})))`;
    const conflicts = await find(EVENTS, conflictFormula, token, 100);
    const update = await fetch(`https://api.airtable.com/v0/${BASE}/${ACQUISITIONS}/${acquisition.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: {
        [AF.status]: "conflicting_referral",
        [AF.conflictCount]: conflicts.length,
      }, typecast: true }),
    });
    if (!update.ok) throw new Error(`Airtable acquisition update failed: ${update.status}`);
    return res.status(200).json({ status: "conflict_recorded" });
  } catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Could not record referral attribution." });
  }
}
