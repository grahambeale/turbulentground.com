#!/usr/bin/env node
// Generates one Phase 3 research invite: a random token, a new Identity
// record in Airtable, and the invite URL to send manually.
//
//   node scripts/generate-invite.mjs "Sam Taylor" sam@example.com
//   node scripts/generate-invite.mjs "Sam Taylor"          (no email — e.g. LinkedIn invite)
//
// Local/manual use only. This script is never called from the browser and
// must never be exposed as a route — it's a CLI tool, run by hand, that
// talks to Airtable directly using AIRTABLE_RESEARCH_TOKEN from .env.local.
// It does not send email; the printed URL is pasted manually for now.

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  let text;
  try {
    text = readFileSync(envPath, "utf8");
  } catch {
    console.error(".env.local not found at repo root. Expected AIRTABLE_RESEARCH_TOKEN there.");
    process.exit(1);
  }
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";

const FIELD = {
  token: "fld6danERot7gjOqb",
  name: "fldGto31lmx5KwyNr",
  email: "fldePJtCCYwLsmNjp",
  inviteSentDate: "flda1wM53yby5Un6F",
  inviteStatus: "fldEhm06lLDvEeF6q",
  notes: "fldX9muawo9iSMYpT",
};

// Could not inspect the Invite Status field's existing single-select
// choices — the Airtable metadata API rejected the request (PAT lacks
// schema.bases:read), and no existing Identity record has this field
// populated to infer a convention from. "Sent" is used here for "invite
// generated, not yet completed" as a clear, conventional value; the write
// uses typecast so Airtable creates it as a real option if it doesn't
// already exist rather than erroring. Confirm this is the right label —
// rename here (and in api/research-submit.js's "Completed" counterpart)
// if an existing convention turns out to differ.
const INVITE_STATUS_SENT = "Sent";

const [, , name, email] = process.argv;

if (!name) {
  console.error('Usage: node scripts/generate-invite.mjs "Full Name" [email@example.com]');
  process.exit(1);
}

const env = loadEnvLocal();
const airtableToken = env.AIRTABLE_RESEARCH_TOKEN;
if (!airtableToken) {
  console.error("AIRTABLE_RESEARCH_TOKEN not set in .env.local");
  process.exit(1);
}

const token = randomUUID();

const fields = {
  [FIELD.token]: token,
  [FIELD.name]: name,
  [FIELD.inviteSentDate]: new Date().toISOString().slice(0, 10),
  [FIELD.inviteStatus]: INVITE_STATUS_SENT,
};

if (email) {
  fields[FIELD.email] = email;
} else {
  fields[FIELD.notes] =
    "No email on file — invited via LinkedIn or similar, 30-day follow-up cannot be automated for this person";
}

const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${airtableToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ records: [{ fields }], typecast: true }),
});

if (!res.ok) {
  const err = await res.text();
  console.error("Airtable write failed:", err);
  process.exit(1);
}

const data = await res.json();
const recordId = data.records[0].id;

const base = env.RESEARCH_BASE_URL || "https://turbulentground.com";
const url = `${base}/research?t=${token}`;

console.log(`Identity record created: ${recordId}`);
console.log(`Invite URL: ${url}`);

if (!email) {
  console.log(
    "No email on file — the 30-day follow-up cannot be sent to this person automatically."
  );
}
