// POST /api/research-save-progress
// body: { token, consent, context, pairResponses, sectionReached }
//
// Documented exception to the Phase 3 path boundary, same as
// api/research-submit.js, api/research-lookup.js, and
// api/research-capture-email.js: this file lives outside /research/
// because Vercel only recognises serverless functions under top-level
// /api/. Standalone — shares no code with api/submit.js or api/verify.js
// (Phase 2's diagnostic routes), or with the other research/* routes,
// except validatePairResponses(), factored into api/_research-lib.mjs
// specifically because it was called out to be shared rather than
// duplicated a third time (see api/research-submit.js's header comment).
//
// This endpoint is called often (on page hide/unload via
// navigator.sendBeacon, and as a periodic safety-net save while someone
// is mid-survey), so it's kept deliberately cheap: it persists exactly
// what it's given and nothing more. It does NOT compute pairsAnswered or
// meetsCompletionFloor — those are only meaningful at final submission
// (api/research-submit.js) and computing them here would be extra work
// this route doesn't need to do.
//
// sectionReached is accepted in the request body (per spec) but not
// persisted anywhere: the live Responses table has no field for it
// (checked directly against real records before building this — the
// only place that field name ever existed was in old, already-deleted
// manually-seeded test rows, not the current schema), and the resume
// logic itself doesn't need it either — research/index.html resumes by
// scanning pairResponses for the first genuinely unanswered statement,
// not by trusting a stored position pointer. Flagged rather than
// silently inventing a new Airtable field without being asked to.
//
// This route never writes an email address anywhere, under any
// circumstance — that is the sole responsibility of
// api/research-capture-email.js, writing to Identity only.
//
// Env var: AIRTABLE_RESEARCH_TOKEN (same as the other research/* routes).

import { isPlainObject, validatePairResponses } from "./_research-lib.mjs";

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";

const FIELD = {
  token: "flduL4PmBEfH9rLpz",
  consentTakingPart: "fldMx0Ta5VNoKJJyU",
  consentStudyEmails: "flduWhkQo6u5O3nIp",
  consentQuoteAnon: "fldrkZLOa0Z58uxEs",
  consentQuoteName: "fldDMxw9XFHCUItsx",
  startedAt: "fldsN6iDwlfMkxamH",
  pairResponsesJson: "fldvxb2mrIYVKLGVM",
  role: "fldLpRW2iICNOHKc9",
  discipline: "fldAHP8vHMM5R3od0",
  teamResponsibility: "fldP3feAS0fMX9w5N",
  orgSize: "fldNrxY2Jm8OOcBFm",
};

const IDENTITY_FIELD = {
  token: "fld6danERot7gjOqb",
  inviteStatus: "fldEhm06lLDvEeF6q",
};

const INVITE_STATUS_COMPLETED = "Completed";
// New option on the existing Invite Status field, same pattern as "Sent"
// (scripts/generate-invite.mjs) and "Completed" (api/research-submit.js):
// its existing choices couldn't be inspected (Airtable metadata API
// rejects this token — no schema.bases:read scope — and no existing
// record had this field populated to infer a convention from), so this
// is written with typecast, which creates the option if it doesn't
// already exist.
const INVITE_STATUS_IN_PROGRESS = "In Progress";

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

async function findResponseRecord(token, airtableToken) {
  const formula = `{${FIELD.token}}="${token.replace(/"/g, '\\"')}"`;
  const url =
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RESPONSES_TABLE_ID}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&returnFieldsByFieldId=true`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${airtableToken}` } });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Responses lookup failed: ${err}`);
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
    // sendBeacon's Blob body arrives with the same Content-Type header a
    // normal fetch POST would carry, so this parses identically either way.
    data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const token = typeof data.token === "string" ? data.token.trim() : "";
  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  const consent = isPlainObject(data.consent) ? data.consent : {};
  const context = isPlainObject(data.context) ? data.context : {};
  const pairResponses = isPlainObject(data.pairResponses) ? data.pairResponses : {};

  const pairError = validatePairResponses(pairResponses);
  if (pairError) {
    return res.status(400).json({ error: pairError });
  }

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
    [FIELD.consentStudyEmails]: consent.contactStudyEmails === true,
    [FIELD.consentQuoteAnon]: consent.quoteAnonymously === true,
    [FIELD.consentQuoteName]: consent.quoteByName === true,
    [FIELD.pairResponsesJson]: JSON.stringify(pairResponses),
  };
  if (typeof context.role === "string" && context.role) fields[FIELD.role] = context.role;
  if (typeof context.discipline === "string" && context.discipline) fields[FIELD.discipline] = context.discipline;
  if (typeof context.teamResponsibility === "string" && context.teamResponsibility) {
    fields[FIELD.teamResponsibility] = context.teamResponsibility;
  }
  if (typeof context.orgSize === "string" && context.orgSize) fields[FIELD.orgSize] = context.orgSize;

  try {
    const existingResponse = await findResponseRecord(token, airtableToken);

    if (existingResponse) {
      // Update in place. Started At is deliberately NOT included here — it
      // was already set on creation and must not be overwritten by every
      // subsequent checkpoint save.
      const patchRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RESPONSES_TABLE_ID}/${existingResponse.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${airtableToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields }),
        }
      );
      if (!patchRes.ok) {
        const err = await patchRes.text();
        throw new Error(`Airtable update failed: ${err}`);
      }
    } else {
      // First save for this token: set Started At now.
      fields[FIELD.startedAt] = new Date().toISOString();
      const postRes = await fetch(
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
      if (!postRes.ok) {
        const err = await postRes.text();
        throw new Error(`Airtable write failed: ${err}`);
      }
    }
  } catch (err) {
    console.error("Airtable response save error:", err.message);
    return res.status(502).json({ error: "Could not save progress." });
  }

  // Never downgrade an already-Completed status — checked above, this
  // only runs when currentStatus is something else (e.g. "Sent" or
  // already "In Progress").
  try {
    const statusRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}/${identityRecord.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: { [IDENTITY_FIELD.inviteStatus]: INVITE_STATUS_IN_PROGRESS },
          typecast: true,
        }),
      }
    );
    if (!statusRes.ok) {
      console.error("Identity status update failed (non-fatal):", await statusRes.text());
    }
  } catch (err) {
    console.error("Identity status update fetch error (non-fatal):", err);
  }

  return res.status(200).json({ success: true });
}
