// GET /api/research-lookup?t=TOKEN
//
// Documented exception to the Phase 3 path boundary, same as
// api/research-submit.js: this file lives outside /research/ because
// Vercel only recognises serverless functions under top-level /api/.
// Standalone — shares no code with api/submit.js or api/verify.js
// (Phase 2's diagnostic routes), api/research-submit.js, or
// api/research-save-progress.js.
//
// Exposes the absolute minimum needed for the consent-screen greeting and
// resume: whether a token is real, a first name, whether an email is
// already on file, whether Identity already marks this token Completed,
// and — if a Responses record already exists for this token — that
// record's own saved consent/context/pairResponses, so the survey can
// resume where the respondent left off. Never returns the email address
// itself, the raw Invite Status string, or any other Identity field —
// `completed` is a derived boolean, not a passthrough of the field.
//
// savedState is safe to return here: it's a person's own prior progress,
// gated by the same token that already controls everything else in this
// build. It never exposes another participant's data.
//
// savedState is intentionally omitted (returned as null) once the found
// Responses record's own "Completed At" is set — i.e. once the survey
// has actually been finished. Resuming must never reopen a completed
// response; the hard block against re-submitting lives in
// api/research-submit.js and api/research-save-progress.js (via
// Identity's Invite Status), but there's no reason for this endpoint to
// even offer a completed response back to the client for a fake "resume"
// that could never actually save again.
//
// `completed` is the fix for a gap found in testing: without it, a
// completed token's savedState is null (correct — nothing to resume),
// but the client had no way to distinguish "never started" from "already
// finished," so it silently offered a blank survey and only rejected at
// the final Submit click. research/index.html now checks this flag
// before rendering the consent screen and stops immediately if it's
// true. Checked directly against Identity's Invite Status (the actual
// source of truth used to block resubmission everywhere else), not
// inferred from the Responses record, so it's correct even for a
// completed token that somehow has no Responses record at all.
//
// Env var: AIRTABLE_RESEARCH_TOKEN (same as the other research/* routes).

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";

const IDENTITY_FIELD = {
  token: "fld6danERot7gjOqb",
  name: "fldGto31lmx5KwyNr",
  email: "fldePJtCCYwLsmNjp",
  inviteStatus: "fldEhm06lLDvEeF6q",
};

// Same field/value pairing api/research-submit.js and
// api/research-save-progress.js already use to block resubmission.
const INVITE_STATUS_COMPLETED = "Completed";

const RESPONSE_FIELD = {
  token: "flduL4PmBEfH9rLpz",
  consentTakingPart: "fldMx0Ta5VNoKJJyU",
  consentStudyEmails: "flduWhkQo6u5O3nIp",
  consentQuoteAnon: "fldrkZLOa0Z58uxEs",
  consentQuoteName: "fldDMxw9XFHCUItsx",
  completedAt: "fld8sYjswX21vvVXz",
  pairResponsesJson: "fldvxb2mrIYVKLGVM",
  role: "fldLpRW2iICNOHKc9",
  discipline: "fldAHP8vHMM5R3od0",
  teamResponsibility: "fldP3feAS0fMX9w5N",
  orgSize: "fldNrxY2Jm8OOcBFm",
};

function firstNameOf(fullName) {
  if (!fullName || typeof fullName !== "string") return "";
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/);
  return parts.length > 1 ? parts[0] : trimmed;
}

async function findResponseRecord(token, airtableToken) {
  const formula = `{${RESPONSE_FIELD.token}}="${token.replace(/"/g, '\\"')}"`;
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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = typeof req.query.t === "string" ? req.query.t.trim() : "";
  if (!token) {
    return res.status(200).json({ valid: false });
  }

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!airtableToken) {
    console.error("Missing AIRTABLE_RESEARCH_TOKEN");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const formula = `{${IDENTITY_FIELD.token}}="${token.replace(/"/g, '\\"')}"`;
  const url =
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&returnFieldsByFieldId=true`;

  let record;
  try {
    const airtableRes = await fetch(url, {
      headers: { Authorization: `Bearer ${airtableToken}` },
    });
    if (!airtableRes.ok) {
      const err = await airtableRes.text();
      console.error("Airtable lookup failed:", err);
      return res.status(502).json({ error: "Lookup failed" });
    }
    const data = await airtableRes.json();
    record = data.records && data.records[0];
  } catch (err) {
    console.error("Airtable fetch error:", err);
    return res.status(502).json({ error: "Lookup failed" });
  }

  if (!record) {
    return res.status(200).json({ valid: false });
  }

  const name = firstNameOf(record.fields[IDENTITY_FIELD.name]);
  const hasEmail = typeof record.fields[IDENTITY_FIELD.email] === "string" && record.fields[IDENTITY_FIELD.email].trim() !== "";
  const completed = record.fields[IDENTITY_FIELD.inviteStatus] === INVITE_STATUS_COMPLETED;

  let savedState = null;
  try {
    const responseRecord = await findResponseRecord(token, airtableToken);
    if (responseRecord && !responseRecord.fields[RESPONSE_FIELD.completedAt]) {
      const f = responseRecord.fields;
      let pairResponses = {};
      try { pairResponses = JSON.parse(f[RESPONSE_FIELD.pairResponsesJson] || "{}"); } catch { /* corrupt/missing, treat as empty */ }
      savedState = {
        consent: {
          takingPart: f[RESPONSE_FIELD.consentTakingPart] === true,
          contactStudyEmails: f[RESPONSE_FIELD.consentStudyEmails] === true,
          quoteAnonymously: f[RESPONSE_FIELD.consentQuoteAnon] === true,
          quoteByName: f[RESPONSE_FIELD.consentQuoteName] === true,
        },
        context: {
          role: f[RESPONSE_FIELD.role] || "",
          discipline: f[RESPONSE_FIELD.discipline] || "",
          teamResponsibility: f[RESPONSE_FIELD.teamResponsibility] || "",
          orgSize: f[RESPONSE_FIELD.orgSize] || "",
        },
        pairResponses: pairResponses,
      };
    }
  } catch (err) {
    // A failed resume-state lookup should not break the whole page load —
    // worst case, the respondent starts from the beginning again.
    console.error("Responses lookup for resume failed (non-fatal):", err.message);
  }

  return res.status(200).json({ valid: true, name, hasEmail, completed, savedState });
}
