// POST /api/research-public-start
// Disabled-by-default Phase 3.1 public identity creation.
// No production route is usable unless RESEARCH_PUBLIC_ENTRY_ENABLED=true.

import { randomBytes, randomUUID } from "node:crypto";

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";
const REFERRALS_TABLE_ID = "tblXBzl8mQal543xw";
const ACQUISITIONS_TABLE_ID = "tblhjBvklwWNNx8Rg";
const RETURN_DAYS = 14;
const PRIVACY_VERSION = "phase-3-1-privacy-v1";
const CONSENT_VERSION = "phase-3-1-consent-v1";

const FIELD = {
  token: "fld6danERot7gjOqb",
  name: "fldGto31lmx5KwyNr",
  email: "fldePJtCCYwLsmNjp",
  inviteStatus: "fldEhm06lLDvEeF6q",
  identityOrigin: "fldzOXQwAKsJFvjx4",
  privacyVersion: "fldtIJ2lu6mz1FXiQ",
  consentVersion: "fld1nIQE9VBeiTTu2",
  participationConsentAt: "fldBUlgc1HW9JKJqo",
  incompleteExpiresAt: "fldj4eidGJYUhVeUQ",
  lifecycleState: "fldAU2mJzl7jwcCWz",
  publicParticipantId: "fld1Eki2yPUVPS72T",
};
const REFERRAL_FIELD = { referralId: "fldhsVcyzGsgcIZXU", status: "fld8XFaGgrsGKkABg" };
const ACQUISITION_FIELD = {
  id: "fldqnGM9SWMpPcZtK", participant: "fldqU9bCJH5V4m4Lx", referrer: "fldWurPEyDv2OhIXp",
  channel: "fldagXCapTLv19hLF", status: "fldD7AXUyBI6heSeI", landingAt: "fldxDn7WjkfJONBQb",
  lockedAt: "fldkh3datrGFaXNlT", generation: "fldao8tphfNYi86lC", conflictCount: "fldwGlpOjfvSvhXpq"
};
const CHANNELS = new Set(["direct", "organic", "email", "linkedin", "x", "facebook", "whatsapp", "other", "unknown"]);

function parseBody(body) {
  if (typeof body === "string") {
    if (body.length > 4096) throw new Error("too_large");
    return JSON.parse(body);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid");
  if (JSON.stringify(body).length > 4096) throw new Error("too_large");
  return body;
}

function validEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function resolveReferral(referralId, token) {
  if (process.env.RESEARCH_REFERRAL_RESOLVE_ENABLED !== "true") return null;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(referralId)) return null;
  const formula = `{${REFERRAL_FIELD.referralId}}="${referralId.replace(/"/g, '\\"')}"`;
  const params = new URLSearchParams({ filterByFormula: formula, maxRecords: "1", returnFieldsByFieldId: "true" });
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${REFERRALS_TABLE_ID}?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Airtable referral lookup failed: ${response.status}`);
  const record = (await response.json()).records?.[0];
  return record && record.fields[REFERRAL_FIELD.status] === "active" ? record : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (process.env.RESEARCH_PUBLIC_ENTRY_ENABLED !== "true") {
    return res.status(404).json({ error: "Not found" });
  }

  let data;
  try { data = parseBody(req.body); }
  catch { return res.status(400).json({ error: "Invalid request" }); }

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!name || name.length > 120 || !validEmail(email)) {
    return res.status(400).json({ error: "Enter a valid name and email address." });
  }
  if (data.adultConfirmed !== true || data.participationConsent !== true) {
    return res.status(400).json({ error: "Adult confirmation and participation consent are required." });
  }

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!airtableToken) return res.status(500).json({ error: "Server configuration error" });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + RETURN_DAYS * 24 * 60 * 60 * 1000);
  const privateToken = randomBytes(32).toString("base64url");
  const participantId = randomUUID();
  const suppliedReferral = typeof data.referralId === "string" ? data.referralId.trim() : "";
  const channel = CHANNELS.has(data.channel) ? data.channel : (suppliedReferral ? "unknown" : "direct");
  let referral = null;
  try { referral = suppliedReferral ? await resolveReferral(suppliedReferral, airtableToken) : null; }
  catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Could not start the survey. Please try again." });
  }
  const fields = {
    [FIELD.token]: privateToken,
    [FIELD.name]: name,
    [FIELD.email]: email,
    [FIELD.inviteStatus]: "In Progress",
    [FIELD.identityOrigin]: "public_self_service",
    [FIELD.privacyVersion]: PRIVACY_VERSION,
    [FIELD.consentVersion]: CONSENT_VERSION,
    [FIELD.participationConsentAt]: now.toISOString(),
    [FIELD.incompleteExpiresAt]: expiresAt.toISOString(),
    [FIELD.lifecycleState]: "started",
    [FIELD.publicParticipantId]: participantId,
  };

  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${airtableToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });
    if (!response.ok) throw new Error(`Airtable identity creation failed: ${response.status}`);
    const identity = (await response.json()).records?.[0];
    if (!identity?.id) throw new Error("Airtable identity creation returned no record");

    const acquisitionFields = {
      [ACQUISITION_FIELD.id]: randomUUID(),
      [ACQUISITION_FIELD.participant]: [identity.id],
      [ACQUISITION_FIELD.channel]: channel,
      [ACQUISITION_FIELD.status]: referral ? "attributed" : (suppliedReferral ? "invalid_referral" : "direct"),
      [ACQUISITION_FIELD.landingAt]: now.toISOString(),
      [ACQUISITION_FIELD.lockedAt]: now.toISOString(),
      [ACQUISITION_FIELD.generation]: referral ? 1 : 0,
      [ACQUISITION_FIELD.conflictCount]: 0,
    };
    if (referral) acquisitionFields[ACQUISITION_FIELD.referrer] = [referral.id];
    const acquisition = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ACQUISITIONS_TABLE_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${airtableToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields: acquisitionFields }], typecast: true }),
    });
    if (!acquisition.ok) {
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}/${identity.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${airtableToken}` }
      });
      throw new Error(`Airtable acquisition creation failed: ${acquisition.status}`);
    }
  } catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Could not start the survey. Please try again." });
  }

  return res.status(201).json({
    status: "started",
    resumePath: `/research?t=${encodeURIComponent(privateToken)}`,
    expiresAt: expiresAt.toISOString(),
  });
}

export { CONSENT_VERSION, PRIVACY_VERSION, RETURN_DAYS };
