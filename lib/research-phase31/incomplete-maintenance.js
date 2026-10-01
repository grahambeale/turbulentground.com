// Authorised lifecycle maintenance for incomplete public research responses.
// Count-only is always safe; execution also requires its disabled-by-default flag.
import { createHash, timingSafeEqual } from "node:crypto";

const BASE = "app7dKDinTjxczEfD";
const TABLE = { identity: "tblwpricYYzx4rmiR", responses: "tblL9mf8VfAmbhuG7", acquisitions: "tblhjBvklwWNNx8Rg", referrals: "tblXBzl8mQal543xw", events: "tbldf3XOuTy3DYth9" };
const F = { token: "fld6danERot7gjOqb", name: "fldGto31lmx5KwyNr", email: "fldePJtCCYwLsmNjp", origin: "fldzOXQwAKsJFvjx4", consentAt: "fldBUlgc1HW9JKJqo", expiresAt: "fldj4eidGJYUhVeUQ", remindedAt: "fldjYkXmaCiSCd7mh", state: "fldAU2mJzl7jwcCWz" };
const LINK = { responses: "flduL4PmBEfH9rLpz", acquisitions: "fldqU9bCJH5V4m4Lx", referrals: "fldgZjeCrX8WJDfSJ", events: "fldSxQvjcbKAxJfgs" };
const DAY = 86400000;

function authorised(req) {
  const expected = process.env.RESEARCH_MAINTENANCE_KEY || "";
  const header = typeof req.headers?.authorization === "string" ? req.headers.authorization : "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
const headers = token => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
const escapeFormula = value => String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

async function list(table, formula, token) {
  const records = [];
  let offset = "";
  do {
    const params = new URLSearchParams({ filterByFormula: formula, returnFieldsByFieldId: "true", pageSize: "100" });
    if (offset) params.set("offset", offset);
    const response = await fetch(`https://api.airtable.com/v0/${BASE}/${table}?${params}`, { headers: headers(token) });
    if (!response.ok) throw new Error(`Airtable maintenance lookup failed: ${response.status}`);
    const body = await response.json();
    records.push(...(body.records || []));
    offset = body.offset || "";
  } while (offset);
  return records;
}

function classify(record, now) {
  const fields = record.fields || {};
  const started = Date.parse(fields[F.consentAt] || "");
  const expires = Date.parse(fields[F.expiresAt] || "");
  if (!Number.isFinite(started) || !Number.isFinite(expires)) return "invalidDeadline";
  if (now >= expires) return "expired";
  if (now >= started + 7 * DAY && !fields[F.remindedAt]) return "reminderEligible";
  return "active";
}

async function patchIdentity(id, fields, token) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE.identity}/${id}`, { method: "PATCH", headers: headers(token), body: JSON.stringify({ fields, typecast: true }) });
  if (!response.ok) throw new Error(`Airtable maintenance update failed: ${response.status}`);
}
async function remove(table, id, token) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE}/${table}/${id}`, { method: "DELETE", headers: headers(token) });
  if (!response.ok && response.status !== 404) throw new Error(`Airtable maintenance deletion failed: ${response.status}`);
}
async function deleteParticipantData(identity, token) {
  const privateToken = identity.fields?.[F.token] || "";
  if (!privateToken) throw new Error("Expired identity is missing its private token");
  const related = [
    [TABLE.responses, `{${LINK.responses}}="${escapeFormula(privateToken)}"`],
    [TABLE.events, `FIND("${escapeFormula(identity.id)}",ARRAYJOIN({${LINK.events}}))`],
    [TABLE.acquisitions, `FIND("${escapeFormula(identity.id)}",ARRAYJOIN({${LINK.acquisitions}}))`],
    [TABLE.referrals, `FIND("${escapeFormula(identity.id)}",ARRAYJOIN({${LINK.referrals}}))`],
  ];
  for (const [table, formula] of related) for (const record of await list(table, formula, token)) await remove(table, record.id, token);
  await remove(TABLE.identity, identity.id, token);
}

const firstName = value => String(value || "").trim().split(/\s+/)[0].replace(/[<>&"']/g, "") || "there";
const emailKey = (prefix, identity) => `${prefix}-${createHash("sha256").update(identity.id).digest("hex").slice(0, 32)}`;
async function sendEmail({ to, subject, html, key }) {
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify({ from: process.env.RESEND_FROM, to: [to], subject, html }) });
  if (!response.ok) throw new Error(`Research lifecycle email failed: ${response.status}`);
}
function reminderHtml(identity) {
  const fields = identity.fields || {};
  const deadline = new Date(fields[F.expiresAt]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });
  const url = `https://www.turbulentground.com/take-part?t=${encodeURIComponent(fields[F.token] || "")}`;
  return `<p>Hi ${firstName(fields[F.name])},</p><p>You started the Turbulent Ground research study, and your progress is saved. You can continue from where you left off.</p><p><a href="${url}">Resume my survey</a></p><p>Please complete your response by ${deadline}. After that date, your incomplete answers and contact details will be deleted automatically.</p><p>If you no longer want to take part, you don’t need to do anything. I delete incomplete responses so that I only retain research data from people who choose to complete the study.</p>`;
}
function deletionHtml(name) {
  return `<p>Hi ${firstName(name)},</p><p>As promised, your incomplete Turbulent Ground research response and the contact details connected to it have now been deleted.</p><p>I no longer retain the answers, name or email address associated with that incomplete response.</p><p>If you decide you would still like to take part, you can start again with a new response.</p><p><a href="https://www.turbulentground.com/take-part">Start the survey again</a></p>`;
}

export default async function handler(req, res) {
  res.setHeader?.("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!authorised(req)) return res.status(401).json({ error: "Unauthorised" });
  const mode = req.body?.mode;
  if (!new Set(["count-only", "execute"]).has(mode)) return res.status(400).json({ error: "Invalid maintenance mode" });
  if (mode === "execute" && (process.env.RESEARCH_INCOMPLETE_REMINDER_ENABLED !== "true" || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM)) return res.status(404).json({ error: "Not found" });
  const token = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!token) return res.status(500).json({ error: "Server configuration error" });

  let records;
  try { records = await list(TABLE.identity, `AND({${F.origin}}="public_self_service",{${F.state}}="started")`, token); }
  catch (error) { console.error(error.message); return res.status(502).json({ error: "Maintenance check failed" }); }
  const now = Date.now();
  const counts = { active: 0, reminderEligible: 0, expired: 0, invalidDeadline: 0 };
  for (const record of records) counts[classify(record, now)]++;
  if (mode === "count-only") return res.status(200).json({ mode, total: records.length, counts });

  const actions = { remindersAttempted: 0, remindersSent: 0, deletionsCompleted: 0, deletionConfirmationsAttempted: 0, failures: 0 };
  for (const identity of records) {
    const category = classify(identity, now), fields = identity.fields || {}, email = String(fields[F.email] || "").trim();
    try {
      if (category === "reminderEligible" && email) {
        actions.remindersAttempted++;
        // Claim the single permitted attempt before sending, preventing retry duplicates.
        await patchIdentity(identity.id, { [F.remindedAt]: new Date(now).toISOString() }, token);
        await sendEmail({ to: email, subject: "Your research response is saved", html: reminderHtml(identity), key: emailKey("research-incomplete-reminder", identity) });
        actions.remindersSent++;
      } else if (category === "expired") {
        const name = fields[F.name];
        await deleteParticipantData(identity, token);
        actions.deletionsCompleted++;
        if (email) {
          actions.deletionConfirmationsAttempted++;
          try { await sendEmail({ to: email, subject: "Your incomplete research response has been deleted", html: deletionHtml(name), key: emailKey("research-incomplete-deleted", identity) }); }
          catch { actions.failures++; }
        }
      }
    } catch { actions.failures++; console.error(`Research incomplete maintenance action failed (${category})`); }
  }
  return res.status(200).json({ mode, total: records.length, counts, actions });
}

export { classify };
