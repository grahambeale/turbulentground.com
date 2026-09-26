// POST /api/research-incomplete-maintenance
// Stage 2 is count-only. It cannot send reminders or delete records.

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";
const DAY_MS = 24 * 60 * 60 * 1000;

const FIELD = {
  identityOrigin: "fldzOXQwAKsJFvjx4",
  participationConsentAt: "fldBUlgc1HW9JKJqo",
  incompleteExpiresAt: "fldj4eidGJYUhVeUQ",
  reminderSentAt: "fldjYkXmaCiSCd7mh",
  lifecycleState: "fldAU2mJzl7jwcCWz",
};

function authorised(req) {
  const expected = process.env.RESEARCH_MAINTENANCE_KEY;
  return Boolean(expected) && req.headers?.authorization === `Bearer ${expected}`;
}

async function loadCandidates(token) {
  const records = [];
  let offset = "";
  do {
    const formula = `AND({${FIELD.identityOrigin}}="public_self_service",{${FIELD.lifecycleState}}="started")`;
    const params = new URLSearchParams({ filterByFormula: formula, returnFieldsByFieldId: "true", pageSize: "100" });
    if (offset) params.set("offset", offset);
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error(`Airtable maintenance lookup failed: ${response.status}`);
    const body = await response.json();
    records.push(...(body.records || []));
    offset = body.offset || "";
  } while (offset);
  return records;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!authorised(req)) return res.status(401).json({ error: "Unauthorised" });
  if (req.body?.mode !== "count-only") return res.status(400).json({ error: "Stage 2 permits count-only dry runs." });

  const token = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!token) return res.status(500).json({ error: "Server configuration error" });

  let records;
  try { records = await loadCandidates(token); }
  catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Maintenance check failed" });
  }

  const now = Date.now();
  const counts = { active: 0, reminderEligible: 0, expired: 0, invalidDeadline: 0 };
  for (const record of records) {
    const fields = record.fields || {};
    const consentAt = Date.parse(fields[FIELD.participationConsentAt] || "");
    const expiresAt = Date.parse(fields[FIELD.incompleteExpiresAt] || "");
    if (!Number.isFinite(consentAt) || !Number.isFinite(expiresAt)) {
      counts.invalidDeadline++;
    } else if (now >= expiresAt) {
      counts.expired++;
    } else if (now >= consentAt + 7 * DAY_MS && !fields[FIELD.reminderSentAt]) {
      counts.reminderEligible++;
    } else {
      counts.active++;
    }
  }

  return res.status(200).json({ mode: "count-only", total: records.length, counts });
}
