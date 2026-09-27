// Daily Vercel Cron entry point for incomplete public research responses.
// While RESEARCH_INCOMPLETE_REMINDER_ENABLED is false it reports disabled and
// performs no Airtable read, write, deletion or email delivery.
import { timingSafeEqual } from "node:crypto";
import maintenance from "../lib/research-phase31/incomplete-maintenance.js";

function authorised(req) {
  const expected = process.env.CRON_SECRET || "";
  const header = typeof req.headers?.authorization === "string" ? req.headers.authorization : "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createCronHandler(maintenanceHandler = maintenance) {
  return async function handler(req, res) {
    res.setHeader?.("Cache-Control", "no-store");
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    if (!authorised(req)) return res.status(401).json({ error: "Unauthorised" });
    if (process.env.RESEARCH_INCOMPLETE_REMINDER_ENABLED !== "true") {
      return res.status(200).json({ status: "disabled" });
    }
    const maintenanceKey = process.env.RESEARCH_MAINTENANCE_KEY;
    if (!maintenanceKey) return res.status(500).json({ error: "Server configuration error" });
    return maintenanceHandler({ method: "POST", headers: { authorization: `Bearer ${maintenanceKey}` }, body: { mode: "execute" } }, res);
  };
}

export default createCronHandler();
