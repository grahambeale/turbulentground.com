// POST /api/research-submit
//
// Server-side write for the Phase 3 research instrument (/research). This
// file is intentionally standalone: it shares no code, imports, or helpers
// with api/submit.js or api/verify.js (Phase 2's diagnostic API routes),
// even where that means duplicating a small amount of logic. See the
// commit message and decision-log.md for why this file exists outside
// /research/ at all — a documented, deliberate exception to the Phase 3
// path boundary, required by Vercel's serverless-function routing
// convention (functions must live under top-level /api/), not scope creep.
// Also standalone from api/research-lookup.js and
// api/research-capture-email.js — the Identity lookup below is
// deliberately duplicated rather than shared, same reasoning.
//
// Env var required: AIRTABLE_RESEARCH_TOKEN — a personal access token with
// data.records:write scoped to base app7dKDinTjxczEfD. Deliberately
// separate from the existing AIRTABLE_TOKEN used by Phase 2, so a scope
// mistake on one token can't silently touch the other base.
//
// Token validation: the submitted token is now checked against the
// Identity table before anything is written to Responses (previously a
// known, flagged gap — any string was accepted). Unknown token -> 403,
// no write. Already-completed token -> 409, no write, no duplicate
// Responses record. Valid + not yet completed -> writes Responses as
// before, then marks the Identity record's Invite Status as completed,
// which is what makes the token genuinely single-use.
//
// This route never writes an email address anywhere, under any
// circumstance — that is the sole responsibility of
// api/research-capture-email.js, writing to Identity only.

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";

const FIELD = {
  token: "flduL4PmBEfH9rLpz",
  consentTakingPart: "fldMx0Ta5VNoKJJyU",
  consent30Day: "flduWhkQo6u5O3nIp",
  consentQuoteAnon: "fldrkZLOa0Z58uxEs",
  consentQuoteName: "fldDMxw9XFHCUItsx",
  startedAt: "fldsN6iDwlfMkxamH",
  completedAt: "fld8sYjswX21vvVXz",
  pairResponsesJson: "fldvxb2mrIYVKLGVM",
  openComment: "fldnLAxDsWQFrusiD",
  role: "fldLpRW2iICNOHKc9",
  teamResponsibility: "fldP3feAS0fMX9w5N",
  orgSize: "fldNrxY2Jm8OOcBFm",
  pairsAnswered: "fldybjxPuIHJ7wx6k",
  meetsCompletionFloor: "fldc1EMbDAHAO99Av",
};

const IDENTITY_FIELD = {
  token: "fld6danERot7gjOqb",
  inviteStatus: "fldEhm06lLDvEeF6q",
};

// Paired with scripts/generate-invite.mjs's INVITE_STATUS_SENT = "Sent".
// Same caveat: the field's existing choices couldn't be inspected (see
// generate-invite.mjs comment), so this uses typecast to create the
// option if it doesn't already exist.
const INVITE_STATUS_COMPLETED = "Completed";

const DOMAIN_KEYS = ["d1","d2","d3","d4","d5","d6","d7","d8","d9","d10","d11","d12"];
const VALID_VALUES = new Set([1, 2, 3, 4, 5, "skip", "not_applicable"]);

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Re-derives pairsAnswered / meetsCompletionFloor server-side rather than
// trusting the client-computed values, since the client is untrusted input.
function computeCompletion(pairResponses) {
  let pairsAnswered = 0;
  for (const key of DOMAIN_KEYS) {
    const pair = pairResponses[key];
    if (!pair) continue;
    const hasRealContribution = typeof pair.contribution === "number";
    const hasRealConditions = typeof pair.conditions === "number";
    if (hasRealContribution || hasRealConditions) pairsAnswered++;
  }
  return { pairsAnswered, meetsCompletionFloor: pairsAnswered >= 10 };
}

function validatePairResponses(pairResponses) {
  if (!isPlainObject(pairResponses)) return "pairResponses must be an object";
  for (const [key, pair] of Object.entries(pairResponses)) {
    if (!DOMAIN_KEYS.includes(key)) return `unknown domain key: ${key}`;
    if (!isPlainObject(pair)) return `domain ${key} must be an object`;
    for (const stmt of ["contribution", "conditions"]) {
      if (!(stmt in pair)) continue; // a statement key may be omitted, not every domain need have both
      if (!VALID_VALUES.has(pair[stmt])) {
        return `domain ${key}.${stmt} must be 1-5, "skip", or "not_applicable", got ${JSON.stringify(pair[stmt])}`;
      }
    }
  }
  return null;
}

async function findIdentityRecord(token, airtableToken) {
  const formula = `{${IDENTITY_FIELD.token}}="${token.replace(/"/g, '\\"')}"`;
  const url =
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&returnFieldsByFieldId=true`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${airtableToken}` } });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Identity lookup failed: ${err}`);
  }
  const data = await res.json();
  return data.records && data.records[0];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let data;
  try {
    data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const token = typeof data.token === "string" ? data.token.trim() : "";
  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  const consent = isPlainObject(data.consent) ? data.consent : {};
  if (consent.takingPart !== true) {
    return res.status(400).json({ error: "Taking-part consent is required" });
  }

  const pairResponses = data.pairResponses;
  const pairError = validatePairResponses(pairResponses);
  if (pairError) {
    return res.status(400).json({ error: pairError });
  }

  const { pairsAnswered, meetsCompletionFloor } = computeCompletion(pairResponses);

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!airtableToken) {
    console.error("Missing AIRTABLE_RESEARCH_TOKEN");
    return res.status(500).json({ error: "Server configuration error" });
  }

  let identityRecord;
  try {
    identityRecord = await findIdentityRecord(token, airtableToken);
  } catch (err) {
    console.error(err.message);
    return res.status(502).json({ error: "Could not validate your invite. Please try again." });
  }

  if (!identityRecord) {
    return res.status(403).json({ error: "This invite link isn't recognised." });
  }

  const currentStatus = identityRecord.fields[IDENTITY_FIELD.inviteStatus];
  if (currentStatus === INVITE_STATUS_COMPLETED) {
    return res.status(409).json({ error: "This invite has already been used." });
  }

  const fields = {
    [FIELD.token]: token,
    [FIELD.consentTakingPart]: consent.takingPart === true,
    [FIELD.consent30Day]: consent.contact30Day === true,
    [FIELD.consentQuoteAnon]: consent.quoteAnonymously === true,
    [FIELD.consentQuoteName]: consent.quoteByName === true,
    [FIELD.pairResponsesJson]: JSON.stringify(pairResponses),
    [FIELD.pairsAnswered]: pairsAnswered,
    [FIELD.meetsCompletionFloor]: meetsCompletionFloor,
  };

  if (typeof data.startedAt === "string" && data.startedAt) {
    fields[FIELD.startedAt] = data.startedAt;
  }
  // Completed At is only ever set here, on the final submit action. This
  // route has no partial-save/resume path — see research/index.html: the
  // instrument is not saved until the respondent reaches final submit.
  fields[FIELD.completedAt] = new Date().toISOString();

  if (typeof data.openComment === "string" && data.openComment.trim()) {
    fields[FIELD.openComment] = data.openComment.trim().slice(0, 5000);
  }
  if (typeof data.role === "string" && data.role) fields[FIELD.role] = data.role;
  if (typeof data.teamResponsibility === "string" && data.teamResponsibility) {
    fields[FIELD.teamResponsibility] = data.teamResponsibility;
  }
  if (typeof data.orgSize === "string" && data.orgSize) fields[FIELD.orgSize] = data.orgSize;

  // Reserve the invite before writing the response. If the response write
  // fails, restore the previous status so the participant can retry.
  try {
    const patchRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}/${identityRecord.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: { [IDENTITY_FIELD.inviteStatus]: INVITE_STATUS_COMPLETED },
          typecast: true,
        }),
      }
    );
    if (!patchRes.ok) {
      const err = await patchRes.text();
      console.error("Identity status update failed:", err);
      return res.status(502).json({ error: "Could not save your response. Please try again." });
    }
  } catch (err) {
    console.error("Identity status update fetch error:", err);
    return res.status(502).json({ error: "Could not save your response. Please try again." });
  }

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RESPONSES_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields }] }),
      }
    );

    if (!airtableRes.ok) {
      const err = await airtableRes.text();
      throw new Error(`Airtable write failed: ${err}`);
    }
  } catch (err) {
    console.error("Airtable response write error:", err.message);
    try {
      const rollbackRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}/${identityRecord.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${airtableToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: { [IDENTITY_FIELD.inviteStatus]: currentStatus || "Sent" },
            typecast: true,
          }),
        }
      );
      if (!rollbackRes.ok) {
        console.error("Identity status rollback failed:", await rollbackRes.text());
      }
    } catch (rollbackErr) {
      console.error("Identity status rollback fetch error:", rollbackErr);
    }
    return res.status(502).json({ error: "Could not save your response. Please try again." });
  }

  return res.status(200).json({ status: "submitted", pairsAnswered, meetsCompletionFloor });
}
