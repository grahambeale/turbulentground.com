// GET /api/research-participation
// Public, read-only participation progress for the homepage.
// Returns counts only: no tokens, answers, disciplines or timestamps of
// individual responses ever leave this function.
//
// "Completed" = a Responses record with Completed At set and Meets Completion
// Floor ticked, counted once per token (duplicate completions count once).
// Test or pilot records are counted until they are removed or unticked in
// Airtable; this function does not guess which records are tests.

import { PAIRED_VERSION } from "../../api/_research-instruments.js";
import { BENCHMARK_MIN_COHORT } from "../../api/_research-benchmarks.js";

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";
const F = { token: "flduL4PmBEfH9rLpz", completedAt: "fld8sYjswX21vvVXz", floor: "fldc1EMbDAHAO99Av", version: "fldHJ4KNzMbpzdob6" };
// Pre-registered overall threshold for the first analysis (see project
// overview: "30 overall completions"). Change here if the decision changes.
export const FIRST_FINDINGS_MILESTONE = 30;

export function summariseParticipation(records, now = new Date()) {
  const tokens = new Set(), currentTokens = new Set();
  for (const r of records) {
    const f = r.fields || {};
    if (!f[F.completedAt] || f[F.floor] !== true) continue;
    const token = typeof f[F.token] === "string" ? f[F.token].trim() : "";
    if (!token) continue;
    tokens.add(token);
    if (f[F.version] === PAIRED_VERSION) currentTokens.add(token);
  }
  const completed = tokens.size;
  return {
    completed,
    milestone: FIRST_FINDINGS_MILESTONE,
    remaining: Math.max(0, FIRST_FINDINGS_MILESTONE - completed),
    currentVersion: PAIRED_VERSION,
    currentVersionCompleted: currentTokens.size,
    benchmarkMin: BENCHMARK_MIN_COHORT,
    updatedAt: now.toISOString(),
  };
}

export default async function participationCount(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ error: "Method not allowed" }); }
  const token = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!token) { res.setHeader("Cache-Control", "no-store"); return res.status(503).json({ error: "Participation count unavailable" }); }
  const records = [];
  let offset = "", pages = 0;
  try {
    do {
      const q = new URLSearchParams({ filterByFormula: "AND({Meets Completion Floor}, {Completed At})", returnFieldsByFieldId: "true", pageSize: "100" });
      Object.values(F).forEach((id) => q.append("fields[]", id));
      if (offset) q.set("offset", offset);
      const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RESPONSES_TABLE_ID}?${q}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`Airtable ${r.status}`);
      const page = await r.json();
      records.push(...(page.records || []));
      offset = page.offset || "";
      if (++pages > 50) throw new Error("Too many pages");
    } while (offset);
  } catch (e) {
    console.error("research-participation-failed", String(e && e.message || e));
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Participation count unavailable" });
  }
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).json(summariseParticipation(records));
}
