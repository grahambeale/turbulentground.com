// POST /api/research-invite
// body: { name, email? }
// Authorization: Bearer <RESEARCH_ADMIN_KEY>
//
// Owner-only invite generation for the Phase 3 research study. This is the
// browser equivalent of scripts/generate-invite.mjs: it creates an Identity
// record and returns the unique participant link. It never returns existing
// Identity data and never reads or writes the Responses table.

import { randomUUID, timingSafeEqual } from "node:crypto";

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
};

function authorised(req, expectedKey) {
  if (!expectedKey) return false;
  const header = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const suppliedKey = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!suppliedKey) return false;

  const supplied = Buffer.from(suppliedKey);
  const expected = Buffer.from(expectedKey);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function looksLikeEmail(value) {
  if (!value) return true;
  if (typeof value !== "string" || value.length > 320 || /\s/.test(value)) return false;
  const at = value.indexOf("@");
  return at > 0 && value.slice(at + 1).includes(".");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminKey = process.env.RESEARCH_ADMIN_KEY;
  if (!adminKey) {
    console.error("Missing RESEARCH_ADMIN_KEY");
    return res.status(500).json({ error: "Server configuration error" });
  }
  if (!authorised(req, adminKey)) {
    return res.status(401).json({ error: "Incorrect access key" });
  }

  let data;
  try {
    data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
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
    inviteUrl: `${RESEARCH_BASE_URL}/research?t=${token}`,
    hasEmail: Boolean(email),
  });
}
