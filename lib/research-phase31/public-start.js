// POST /api/research-public-start
// Disabled-by-default Phase 3.1 public identity creation.
// No production route is usable unless RESEARCH_PUBLIC_ENTRY_ENABLED=true.

import { randomBytes, randomUUID, createHash, createHmac } from "node:crypto";

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";
const REFERRALS_TABLE_ID = "tblXBzl8mQal543xw";
const ACQUISITIONS_TABLE_ID = "tblhjBvklwWNNx8Rg";
const RETURN_DAYS = 14;
const PRIVACY_VERSION = "phase-3-1-privacy-v1";
const CONSENT_VERSION = "phase-3-1-consent-v1";

// Abuse controls (D10). Two independent checks, both server-authoritative:
//  - Rate limit: at most RATE_LIMIT_MAX requests per hashed client IP per
//    RATE_LIMIT_WINDOW_MS, counted from the Acquisitions records that IP has
//    actually created. This is a real Vercel Firewall/WAF rule; the project's
//    plan does not currently expose that feature (confirmed: both reading and
//    writing a firewall config for this project return 404 "Seawall Config
//    not found" from the Vercel API), so this is an application-level
//    equivalent instead, enforced here rather than at the edge.
//  - Idempotency: a retry or accidental double-submit with the same email
//    within IDEMPOTENCY_WINDOW_MS must not create a second Identity record.
//    This deliberately does NOT return the existing record's private token —
//    every other resume path in this codebase (see api/research-lookup.js)
//    is gated by token, never by email, specifically so an email address
//    alone can never be used to reach someone else's saved answers. A genuine
//    duplicate request sends the return link only to the stored inbox.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

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
const REFERRAL_FIELD = {
  referralId: "fldhsVcyzGsgcIZXU", referrer: "fldgZjeCrX8WJDfSJ", status: "fld8XFaGgrsGKkABg"
};
const ACQUISITION_FIELD = {
  id: "fldqnGM9SWMpPcZtK", participant: "fldqU9bCJH5V4m4Lx", referrer: "fldWurPEyDv2OhIXp",
  channel: "fldagXCapTLv19hLF", status: "fldD7AXUyBI6heSeI", landingAt: "fldxDn7WjkfJONBQb",
  lockedAt: "fldkh3datrGFaXNlT", generation: "fldao8tphfNYi86lC", conflictCount: "fldwGlpOjfvSvhXpq",
  clientIpHash: "fldvtRXWe3D2YqFHG"
};
const CHANNELS = new Set(["direct", "organic", "email", "linkedin", "x", "facebook", "whatsapp", "other", "unknown"]);
const MAX_REFERRAL_GENERATION = 5;

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

function clientIp(req) {
  // Vercel sets x-forwarded-for to "client, proxy1, proxy2, ..."; the first
  // entry is the original client. Fall back to the raw socket address for
  // local/dev requests, where no proxy header is present.
  const forwarded = typeof req.headers?.["x-forwarded-for"] === "string" ? req.headers["x-forwarded-for"] : "";
  const first = forwarded.split(",")[0]?.trim();
  return first || req.socket?.remoteAddress || "unknown";
}

function hashIp(ip, secret) {
  return createHmac("sha256", secret).update(ip).digest("base64url");
}

async function countRecentAcquisitionsByIpHash(ipHash, sinceIso, token, maxRecords) {
  const formula = `AND({${ACQUISITION_FIELD.clientIpHash}}="${ipHash.replace(/"/g, '\\"')}", IS_AFTER({${ACQUISITION_FIELD.landingAt}}, DATETIME_PARSE("${sinceIso}")))`;
  const params = new URLSearchParams({ filterByFormula: formula, maxRecords: String(maxRecords), returnFieldsByFieldId: "true" });
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ACQUISITIONS_TABLE_ID}?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Airtable rate-limit lookup failed: ${response.status}`);
  return (await response.json()).records?.length || 0;
}

async function findRecentIdentityByEmail(email, sinceIso, token) {
  const formula = `AND(LOWER({${FIELD.email}})="${email.replace(/"/g, '\\"')}", {${FIELD.identityOrigin}}="public_self_service", {${FIELD.lifecycleState}}="started", IS_AFTER({${FIELD.participationConsentAt}}, DATETIME_PARSE("${sinceIso}")))`;
  const params = new URLSearchParams({ filterByFormula: formula, maxRecords: "1", returnFieldsByFieldId: "true" });
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Airtable idempotency lookup failed: ${response.status}`);
  return (await response.json()).records?.[0] || null;
}

const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const firstName = value => String(value || "").trim().split(/\s+/)[0] || "there";

async function sendReturnLink(identity) {
  const fields = identity.fields || {};
  const email = String(fields[FIELD.email] || "").trim();
  const token = String(fields[FIELD.token] || "").trim();
  if (!email || !token || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    throw new Error("Public resume email is not configured");
  }
  const url = `https://www.turbulentground.com/research?t=${encodeURIComponent(token)}`;
  const deadline = new Date(fields[FIELD.incompleteExpiresAt]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
  const html = `<p>Hi ${escapeHtml(firstName(fields[FIELD.name]))},</p><p>You’ve already started the Turbulent Ground research survey. Your progress is saved.</p><p><a href="${url}">Return to my survey</a></p><p>Please complete it by ${escapeHtml(deadline)}. After that date, your incomplete answers and personal details will be deleted automatically.</p><p>If you didn’t request this email, you can ignore it.</p>`;
  const day = new Date().toISOString().slice(0, 10);
  const idempotencyKey = `research-public-return-${createHash("sha256").update(`${identity.id}:${day}`).digest("hex").slice(0, 32)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ from: process.env.RESEND_FROM, to: [email], subject: "Your secure survey return link", html })
  });
  if (!response.ok) throw new Error(`Public resume email failed: ${response.status}`);
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

async function getRecord(table, recordId, token) {
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}/${recordId}?returnFieldsByFieldId=true`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Airtable record lookup failed: ${response.status}`);
  return response.json();
}

async function findReferrerAcquisition(identityId, token) {
  const formula = `FIND("${identityId.replace(/"/g, '\\"')}",ARRAYJOIN({${ACQUISITION_FIELD.participant}}))`;
  const params = new URLSearchParams({ filterByFormula: formula, maxRecords: "1", returnFieldsByFieldId: "true" });
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ACQUISITIONS_TABLE_ID}?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Airtable acquisition lookup failed: ${response.status}`);
  return (await response.json()).records?.[0] || null;
}

async function assessReferral(referral, participantEmail, token) {
  if (!referral) return { status: null, generation: 0, credit: false };
  const referrerIdentityId = referral.fields[REFERRAL_FIELD.referrer]?.[0];
  if (!referrerIdentityId) return { status: "invalid_referral", generation: 0, credit: false };

  const referrerIdentity = await getRecord(IDENTITY_TABLE_ID, referrerIdentityId, token);
  const referrerEmail = String(referrerIdentity.fields?.[FIELD.email] || "").trim().toLowerCase();
  if (referrerEmail && referrerEmail === participantEmail) {
    return { status: "self_referral", generation: 0, credit: false };
  }

  const parentAcquisition = await findReferrerAcquisition(referrerIdentityId, token);
  const parentGeneration = Number(parentAcquisition?.fields?.[ACQUISITION_FIELD.generation] || 0);
  const generation = parentGeneration + 1;
  if (!Number.isSafeInteger(generation) || generation > MAX_REFERRAL_GENERATION) {
    return { status: "invalid_referral", generation, credit: false };
  }
  return { status: "attributed", generation, credit: true };
}

export default async function handler(req, res) {
  res.setHeader?.("Cache-Control", "no-store");
  if (req.method === "GET") {
    return res.status(200).json({ enabled: process.env.RESEARCH_PUBLIC_ENTRY_ENABLED === "true" });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (process.env.RESEARCH_PUBLIC_ENTRY_ENABLED !== "true") {
    return res.status(404).json({ error: "Not found" });
  }
  const contentType = typeof req.headers?.["content-type"] === "string" ? req.headers["content-type"] : "";
  if (contentType && !contentType.toLowerCase().startsWith("application/json")) {
    return res.status(415).json({ error: "Invalid request" });
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
  const abuseSecret = process.env.RESEARCH_ABUSE_SECRET;
  if (!airtableToken || !abuseSecret) return res.status(500).json({ error: "Server configuration error" });

  const now = new Date();
  const ipHash = hashIp(clientIp(req), abuseSecret);

  try {
    const rateWindowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS).toISOString();
    const recentFromIp = await countRecentAcquisitionsByIpHash(ipHash, rateWindowStart, airtableToken, RATE_LIMIT_MAX);
    if (recentFromIp >= RATE_LIMIT_MAX) {
      res.setHeader("Retry-After", String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)));
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Could not start the survey. Please try again." });
  }

  try {
    const idempotencyWindowStart = new Date(now.getTime() - IDEMPOTENCY_WINDOW_MS).toISOString();
    const existing = await findRecentIdentityByEmail(email, idempotencyWindowStart, airtableToken);
    if (existing) {
      // Never expose an existing private token merely because the browser
      // supplied the matching address. Send it only to that inbox.
      await sendReturnLink(existing);
      return res.status(200).json({ status: "return_link_sent" });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Could not start the survey. Please try again." });
  }

  const expiresAt = new Date(now.getTime() + RETURN_DAYS * 24 * 60 * 60 * 1000);
  const privateToken = randomBytes(32).toString("base64url");
  const participantId = randomUUID();
  const suppliedReferral = typeof data.referralId === "string" ? data.referralId.trim() : "";
  const channel = CHANNELS.has(data.channel) ? data.channel : (suppliedReferral ? "unknown" : "direct");
  let referral = null;
  let referralAssessment = { status: null, generation: 0, credit: false };
  try {
    referral = suppliedReferral ? await resolveReferral(suppliedReferral, airtableToken) : null;
    referralAssessment = await assessReferral(referral, email, airtableToken);
  }
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
      [ACQUISITION_FIELD.status]: referralAssessment.status || (suppliedReferral ? "invalid_referral" : "direct"),
      [ACQUISITION_FIELD.landingAt]: now.toISOString(),
      [ACQUISITION_FIELD.lockedAt]: now.toISOString(),
      [ACQUISITION_FIELD.generation]: referralAssessment.generation,
      [ACQUISITION_FIELD.conflictCount]: 0,
      [ACQUISITION_FIELD.clientIpHash]: ipHash,
    };
    if (referralAssessment.credit) acquisitionFields[ACQUISITION_FIELD.referrer] = [referral.id];
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
