// POST /api/research-invite
// body: { name, email? }
// Authorization: Bearer <RESEARCH_ADMIN_KEY>
//
// Owner-only invite generation for the Phase 3 research study. This is the
// browser equivalent of scripts/generate-invite.mjs: it creates an Identity
// record and returns the unique participant link. It never returns existing
// Identity data.
//
// body: { action: "retake-invite", previousToken }
// Mints a retake invite for someone who completed an earlier instrument
// version (decision log 2026-10-27, benchmark compatibility revision 2, D4):
// a new Identity row with a fresh token, origin "retake", Previous Token set,
// name and email copied, invite status "Not sent". The existing row and its
// token are never modified, so the earlier Responses row stays reachable. The
// Responses table is read only to confirm the earlier completion consented to
// study emails. Minting is not sending: the email goes through Graham's own
// review sequence.

import { randomUUID, timingSafeEqual } from "node:crypto";
import saveResearchFeedback from "../lib/research-feedback.js";
import saveFeedbackSubmission from "../lib/research-feedback-submission.js";
import saveSiteFeedbackSubmission from "../lib/site-feedback-submission.js";
import publicStart from "../lib/research-phase31/public-start.js";
import incompleteMaintenance from "../lib/research-phase31/incomplete-maintenance.js";
import incompleteCron from "../lib/research-phase31/incomplete-cron.js";
import referralAttribution from "../lib/research-phase31/referral-attribution.js";
import referralDisable from "../lib/research-phase31/referral-disable.js";
import referralIssue from "../lib/research-phase31/referral-issue.js";
import referralResolve from "../lib/research-phase31/referral-resolve.js";
import participationCount from "../lib/research-phase31/participation-count.js";

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";
const RESEARCH_BASE_URL = "https://www.turbulentground.com";

const FIELD = {
  token: "fld6danERot7gjOqb",
  name: "fldGto31lmx5KwyNr",
  email: "fldePJtCCYwLsmNjp",
  inviteSentDate: "flda1wM53yby5Un6F",
  inviteStatus: "fldEhm06lLDvEeF6q",
  notes: "fldX9muawo9iSMYpT",
  identityOrigin: "fldzOXQwAKsJFvjx4",
  previousToken: "fld7KtQmkOlnXUgCJ",
};
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";
const RESPONSE_FIELD = { token: "flduL4PmBEfH9rLpz", completedAt: "fld8sYjswX21vvVXz", consentStudyEmails: "flduWhkQo6u5O3nIp" };
const INVITE_STATUS_NOT_SENT = "Not sent";

function authorised(req, expectedKey) {
  if (!expectedKey) return false;
  const header = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const suppliedKey = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!suppliedKey) return false;

  const supplied = Buffer.from(suppliedKey);
  const expected = Buffer.from(expectedKey);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function findByToken(tableId, tokenFieldId, token, airtableToken) {
  const formula = `{${tokenFieldId}}="${token.replace(/"/g, '\\"')}"`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&returnFieldsByFieldId=true`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${airtableToken}` } });
  if (!r.ok) throw new Error(`Airtable lookup failed: ${r.status}`);
  const data = await r.json();
  return data.records && data.records[0];
}

async function retakeInvite(res, data, airtableToken) {
  const previousToken = typeof data?.previousToken === "string" ? data.previousToken.trim() : "";
  if (!previousToken || previousToken.length > 200) return res.status(400).json({ error: "Enter the participant's earlier invite token" });

  let identity, response;
  try {
    [identity, response] = await Promise.all([
      findByToken(IDENTITY_TABLE_ID, FIELD.token, previousToken, airtableToken),
      findByToken(RESPONSES_TABLE_ID, RESPONSE_FIELD.token, previousToken, airtableToken),
    ]);
  } catch (err) {
    console.error("Retake invite lookup failed:", err.message);
    return res.status(502).json({ error: "Could not check the earlier token. Please try again." });
  }
  if (!identity) return res.status(404).json({ error: "No participant has that token" });
  if (identity.fields[FIELD.identityOrigin] === "retake") return res.status(409).json({ error: "That token is already a retake invite" });
  if (!response || !response.fields[RESPONSE_FIELD.completedAt]) return res.status(409).json({ error: "That participant has not completed the questionnaire" });
  if (response.fields[RESPONSE_FIELD.consentStudyEmails] !== true) return res.status(409).json({ error: "That participant did not agree to study emails" });
  const email = typeof identity.fields[FIELD.email] === "string" ? identity.fields[FIELD.email].trim() : "";
  if (!email) return res.status(409).json({ error: "That participant has no email on file" });

  const token = randomUUID();
  const fields = {
    [FIELD.token]: token,
    [FIELD.name]: identity.fields[FIELD.name] || "",
    [FIELD.email]: email,
    [FIELD.inviteStatus]: INVITE_STATUS_NOT_SENT,
    [FIELD.identityOrigin]: "retake",
    [FIELD.previousToken]: previousToken,
  };
  try {
    const airtableRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${airtableToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });
    if (!airtableRes.ok) {
      console.error("Airtable retake invite write failed:", await airtableRes.text());
      return res.status(502).json({ error: "Could not create the retake invite. Please try again." });
    }
  } catch (err) {
    console.error("Airtable retake invite fetch error:", err);
    return res.status(502).json({ error: "Could not create the retake invite. Please try again." });
  }
  return res.status(201).json({ inviteUrl: `${RESEARCH_BASE_URL}/take-part?t=${token}`, hasEmail: true, retake: true });
}

function looksLikeEmail(value) {
  if (!value) return true;
  if (typeof value !== "string" || value.length > 320 || /\s/.test(value)) return false;
  const at = value.indexOf("@");
  return at > 0 && value.slice(at + 1).includes(".");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const phase31Handlers = {
    "public-start": publicStart,
    "incomplete-maintenance": incompleteMaintenance,
    "incomplete-cron": incompleteCron,
    "referral-attribution": referralAttribution,
    "referral-disable": referralDisable,
    "referral-issue": referralIssue,
    "referral-resolve": referralResolve,
    "participation-count": participationCount,
  };
  const phase31Action = typeof req.query?.phase31 === "string" ? req.query.phase31 : "";
  if (phase31Handlers[phase31Action]) return phase31Handlers[phase31Action](req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let data;
  try {
    data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (data?.action === "feedback-submission") {
    return saveFeedbackSubmission(req, res, data);
  }

  // Main-site feedback widget (not research). Routed through this function
  // because the project is at the Vercel function limit.
  if (data?.action === "site-feedback-submission") {
    return saveSiteFeedbackSubmission(req, res, data);
  }

  if (data?.action === "feedback") {
    return saveResearchFeedback(req, res, data);
  }

  const adminKey = process.env.RESEARCH_ADMIN_KEY;
  if (!adminKey) {
    console.error("Missing RESEARCH_ADMIN_KEY");
    return res.status(500).json({ error: "Server configuration error" });
  }
  if (!authorised(req, adminKey)) {
    return res.status(401).json({ error: "Incorrect access key" });
  }

  if (data?.action === "retake-invite") {
    const retakeAirtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
    if (!retakeAirtableToken) {
      console.error("Missing AIRTABLE_RESEARCH_TOKEN");
      return res.status(500).json({ error: "Server configuration error" });
    }
    return retakeInvite(res, data, retakeAirtableToken);
  }

  const name = typeof data?.name === "string" ? data.name.trim() : "";
  const email = typeof data?.email === "string" ? data.email.trim() : "";
  if (!name || name.length > 200) {
    return res.status(400).json({ error: "Enter a name of 200 characters or fewer" });
  }
  if (!looksLikeEmail(email)) {
    return res.status(400).json({ error: "Check the email address, or leave it blank" });
  }

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!airtableToken) {
    console.error("Missing AIRTABLE_RESEARCH_TOKEN");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const token = randomUUID();
  const fields = {
    [FIELD.token]: token,
    [FIELD.name]: name,
    [FIELD.inviteSentDate]: new Date().toISOString().slice(0, 10),
    [FIELD.inviteStatus]: "Sent",
  };
  if (email) {
    fields[FIELD.email] = email;
  } else {
    fields[FIELD.notes] =
      "No email on file. Invited via LinkedIn or similar, so study emails cannot be automated for this person";
  }

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );
    if (!airtableRes.ok) {
      console.error("Airtable invite write failed:", await airtableRes.text());
      return res.status(502).json({ error: "Could not create the invite. Please try again." });
    }
  } catch (err) {
    console.error("Airtable invite fetch error:", err);
    return res.status(502).json({ error: "Could not create the invite. Please try again." });
  }

  return res.status(201).json({
    inviteUrl: `${RESEARCH_BASE_URL}/take-part?t=${token}`,
    hasEmail: Boolean(email),
  });
}
