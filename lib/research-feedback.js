// Shared handler for feedback about the invite-only research study and its
// participant experience. Public submissions are deliberately limited to
// participant-facing research sources. Private manual research entries require
// the same RESEARCH_ADMIN_KEY used by /research/admin.

import { randomBytes, timingSafeEqual } from "node:crypto";

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const FEEDBACK_TABLE_ID = "tbltQDAUZ8FF0ZDvA";

const FIELD = {
  feedbackId: "fldYrA4UUxXwXtcvG",
  originalFeedback: "fldlzHrCv4IYmMz76",
  source: "fldJO2SI6UznywFVp",
  sourceDetail: "fldrsU9RW2IJ9ghru",
  pageOrStage: "fldebFpmSzXb9codc",
  pageUrl: "fldPq40ghyZSbfu5j",
  contactEmail: "fldB0HRKppeoTYdGW",
  status: "fldHo0OtoX08jX4lr",
  type: "fld5dyykzXY5wm6lX",
  grahamDecision: "fldweW0Xu2zKmUkcF",
  receivedAt: "fldZpLZA27iXuud6C",
};

const PUBLIC_SOURCES = new Set(["Research study", "Results page"]);
const ALL_SOURCES = new Set([
  ...PUBLIC_SOURCES,
  "Unsubscribe", "Email", "LinkedIn", "iMessage or WhatsApp", "Conversation or interview",
  "Testing session", "Manual note", "Agent observation", "Analytics observation",
]);
const FEEDBACK_TYPES = new Set([
  "Bug", "Usability", "Copy", "Research method", "Privacy", "Accessibility",
  "Feature idea", "Positive feedback", "Other",
]);

function authorised(req, expectedKey) {
  if (!expectedKey) return false;
  const header = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const suppliedKey = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!suppliedKey) return false;
  const supplied = Buffer.from(suppliedKey);
  const expected = Buffer.from(expectedKey);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function cleanString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function looksLikeEmail(value) {
  if (!value) return true;
  if (value.length > 320 || /\s/.test(value)) return false;
  const at = value.indexOf("@");
  return at > 0 && value.slice(at + 1).includes(".");
}

function safePageUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString().slice(0, 2000);
  } catch {
    return "";
  }
}

function feedbackId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `FB-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export default async function handler(req, res, parsedData) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let data = parsedData;
  if (!data) {
    try {
      data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  // Quietly accept bot-filled submissions without storing them.
  if (cleanString(data?.company, 200)) return res.status(201).json({ saved: true });

  const feedback = cleanString(data?.feedback, 5000);
  const source = cleanString(data?.source, 80) || "Research study";
  const isAdmin = authorised(req, process.env.RESEARCH_ADMIN_KEY);
  if (!feedback) return res.status(400).json({ error: "Please enter your feedback" });
  if (!ALL_SOURCES.has(source)) return res.status(400).json({ error: "Unknown feedback source" });
  if (!PUBLIC_SOURCES.has(source) && !isAdmin) {
    return res.status(401).json({ error: "Incorrect access key" });
  }

  const email = cleanString(data?.email, 320);
  if (!looksLikeEmail(email)) {
    return res.status(400).json({ error: "Check the email address, or leave it blank" });
  }

  const requestedTypes = Array.isArray(data?.types) ? data.types : [];
  const types = requestedTypes.filter((value) => FEEDBACK_TYPES.has(value)).slice(0, 4);
  const id = feedbackId();
  const fields = {
    [FIELD.feedbackId]: id,
    [FIELD.originalFeedback]: feedback,
    [FIELD.source]: source,
    [FIELD.status]: "New",
    [FIELD.grahamDecision]: "Pending",
    [FIELD.receivedAt]: new Date().toISOString(),
  };

  const sourceDetail = cleanString(data?.sourceDetail, 300);
  const pageOrStage = cleanString(data?.pageOrStage, 200);
  const pageUrl = safePageUrl(cleanString(data?.pageUrl, 2000));
  if (sourceDetail) fields[FIELD.sourceDetail] = sourceDetail;
  if (pageOrStage) fields[FIELD.pageOrStage] = pageOrStage;
  if (pageUrl) fields[FIELD.pageUrl] = pageUrl;
  if (email) fields[FIELD.contactEmail] = email;
  if (types.length) fields[FIELD.type] = types;

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!airtableToken) {
    console.error("Missing AIRTABLE_RESEARCH_TOKEN");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${FEEDBACK_TABLE_ID}`,
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
      console.error("Airtable feedback write failed:", await airtableRes.text());
      return res.status(502).json({ error: "Could not save your feedback. Please try again." });
    }
  } catch (error) {
    console.error("Airtable feedback fetch error:", error);
    return res.status(502).json({ error: "Could not save your feedback. Please try again." });
  }

  return res.status(201).json({ saved: true, feedbackId: id });
}
