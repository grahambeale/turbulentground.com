// POST /api/research-public-start
// Disabled-by-default Phase 3.1 public identity creation.
// No production route is usable unless RESEARCH_PUBLIC_ENTRY_ENABLED=true.

import { randomBytes, randomUUID } from "node:crypto";

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";
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
