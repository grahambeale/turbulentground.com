// POST /api/research-results-preview
// body: { email }
// Authorization: Bearer <RESEARCH_ADMIN_KEY>
//
// Sends the current results template with fictional data. It does not read or
// write either research table, so previewing cannot create participant data or
// alter a real participant's email preferences.

import { timingSafeEqual } from "node:crypto";
import { buildEmailHtml } from "./research-results-email.js";

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
  return typeof value === "string" && value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const SAMPLE_PAIRS = {
  d1: { contribution: 5, conditions: 4 },
  d2: { contribution: 2, conditions: 5 },
  d3: { contribution: 5, conditions: 2 },
  d4: { contribution: 5, conditions: 2 },
  d5: { contribution: 4, conditions: 3 },
  d6: { contribution: 4, conditions: 2 },
  d7: { contribution: 5, conditions: 4 },
  d8: { contribution: 5, conditions: 2 },
  d9: { contribution: 4, conditions: 3 },
  d10: { contribution: 4, conditions: 2 },
  d11: { contribution: 2, conditions: 4 },
  d12: { contribution: 4, conditions: 2 },
};

const SAMPLE_BENCHMARK = {
  cohortSize: 5,
  domains: Object.fromEntries(Object.keys(SAMPLE_PAIRS).map(key => [key, {
    contribution: { mean: 3, n: 5 },
    conditions: { mean: 3, n: 5 },
  }])),
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const adminKey = process.env.RESEARCH_ADMIN_KEY;
  if (!adminKey) return res.status(500).json({ error: "Server configuration error" });
  if (!authorised(req, adminKey)) return res.status(401).json({ error: "Incorrect access key" });

  let data;
  try { data = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: "Invalid JSON" }); }
  const email = typeof data?.email === "string" ? data.email.trim() : "";
  if (!looksLikeEmail(email)) return res.status(400).json({ error: "Enter a valid email address" });

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
  if (!resendKey || !resendFrom) return res.status(500).json({ error: "Email is not configured" });

  const previewNote = `<p style="padding:10px 12px;background:#3a241a;color:#ef7b45;font-family:Arial,sans-serif;font-size:13px;font-weight:700;">Test preview using fictional responses. No participant record was created or changed.</p>`;
  const html = buildEmailHtml("Graham", SAMPLE_PAIRS, SAMPLE_BENCHMARK, "preview-only")
    .replace("Your AI shift response summary</h1>", `Your AI shift response summary</h1>${previewNote}`)
    .replace(/<p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#9e8e7c;">This requested comparison[\s\S]*?<\/p>/, "");

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `research-results-preview-${Date.now()}`,
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [email],
      subject: "TEST: Your AI shift response summary",
      html,
    }),
  });
  if (!emailResponse.ok) {
    console.error("Resend preview email failed:", await emailResponse.text());
    return res.status(502).json({ error: "Could not send the preview email" });
  }
  return res.status(200).json({ success: true });
}
