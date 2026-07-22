// POST /api/submit
// Validates email, checks MX record, generates signed verification token,
// sends verification email. Also writes a *pending* (verified=false) record
// to Airtable immediately, tagged with a unique attempt_id, so the team can
// see diagnostic attempts that never get verified — not just completions.
// This pending write is best-effort: if it fails, the core submit/verify
// flow still works exactly as before (see Sprint 4 decision log).
//
// Env vars required:
//   RESEND_API_KEY        — Resend API key
//   RESEND_FROM           — verified sender e.g. results@turbulentground.com
//   VERIFICATION_SECRET   — random hex string used to sign tokens
//   AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE — same as /api/verify,
//     used here only for the best-effort pending-record write (Sprint 4)

import { createHmac, randomUUID } from "crypto";
import { promises as dns } from "dns";

// Reserved address for the automated Playwright smoke test (Sprint 7, see
// .github/workflows/diagnostic-smoke-test.yml and decision-log.md row 15).
// Exercises the full client -> server round trip on the LIVE site without
// sending a real verification email or writing a real Airtable row each
// time the schedule fires — both of which would otherwise pollute exactly
// the "real submissions" data the team has struggled to interpret since
// Sprint 4. Everything else (format check, consumer-domain check, token
// signing, response shape) still runs for real, so a break in any of that
// still fails the smoke test.
const SMOKE_TEST_EMAIL = "playwright-smoke-test@turbulentground.com";

const CONSUMER_DOMAINS = new Set([
  "gmail.com","googlemail.com","outlook.com","hotmail.com","hotmail.co.uk",
  "hotmail.fr","live.com","live.co.uk","msn.com","yahoo.com","yahoo.co.uk",
  "yahoo.fr","icloud.com","me.com","mac.com","aol.com","aol.co.uk",
  "proton.me","protonmail.com","protonmail.ch","gmx.com","gmx.de","gmx.net",
  "yandex.com","yandex.ru","zoho.com","qq.com","163.com","126.com",
  "mail.com","inbox.com","fastmail.com","fastmail.fm","hey.com",
]);

function signToken(payload, secret) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig  = createHmac("sha256", secret).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

async function checkMx(domain) {
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

async function writePendingRecord(data) {
  const airtableToken = process.env.AIRTABLE_TOKEN;
  const airtableBase  = process.env.AIRTABLE_BASE_ID;
  const airtableTable = process.env.AIRTABLE_TABLE;

  if (!airtableToken || !airtableBase || !airtableTable) {
    console.error("Pending record skipped: Airtable env vars not configured");
    return;
  }

  const domain = (data.email.split("@")[1] || "").toLowerCase();
  const is_consumer_domain = CONSUMER_DOMAINS.has(domain);

  const record = {
    fields: {
      attempt_id:          data.attempt_id,
      timestamp:           data.timestamp ?? new Date().toISOString(),
      email:               data.email,
      email_domain:        domain,
      is_consumer_domain,
      verified:            false,
      team_name:           data.team_name        ?? "",
      respondent_name:     data.respondent_name  ?? "",
      score_safety:        data.score_safety      ?? 0,
      score_trust:         data.score_trust       ?? 0,
      score_incentives:    data.score_incentives  ?? 0,
      score_curiosity:     data.score_curiosity   ?? 0,
      score_collective:    data.score_collective  ?? 0,
      score_overall:       data.score_overall     ?? 0,
      raw_answers:         JSON.stringify(data.raw_answers ?? {}),
      role:                data.role              ?? "",
      org_size_band:       data.org_size_band     ?? "",
      sector:              data.sector            ?? "",
      country:             data.country           ?? "",
      consent_results:     data.consent_results   ?? false,
      consent_findings:    data.consent_findings  ?? false,
      consent_contribute:  data.consent_contribute ?? false,
      source:              data.source            ?? "",
      utm:                 JSON.stringify(data.utm ?? {}),
    },
  };

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${airtableBase}/${encodeURIComponent(airtableTable)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [record] }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("Pending record write failed (non-fatal):", err);
    }
  } catch (err) {
    console.error("Pending record fetch error (non-fatal):", err);
  }
}

function buildVerifyEmailHtml(verifyUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#131110;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#131110;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#1c1915;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:32px 40px 24px;background:#0e0b08;">
          <p style="margin:0 0 8px;font-family:sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9e8e7c;">Turbulent Ground</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#e8dcc8;line-height:1.25;">Confirm your email to see your results</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px;">
          <p style="margin:0 0 28px;font-family:sans-serif;font-size:15px;color:#c8b89a;line-height:1.6;">
            Click the button below to verify your work email and unlock your Care Capital scores. This link expires in 24 hours.
          </p>
          <a href="${verifyUrl}" style="display:inline-block;background:#b84215;color:#fff;font-family:sans-serif;font-size:14px;font-weight:500;text-decoration:none;padding:14px 28px;border-radius:40px;">
            View my results
          </a>
          <p style="margin:24px 0 0;font-family:sans-serif;font-size:12px;color:#9e8e7c;line-height:1.6;">
            Or copy this link into your browser:<br>
            <span style="color:#c8b89a;word-break:break-all;">${verifyUrl}</span>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px;background:#0e0b08;border-top:1px solid #26211c;">
          <p style="margin:0;font-family:sans-serif;font-size:12px;color:#9e8e7c;">
            If you didn't take the Care Capital diagnostic, ignore this email — nothing has been saved.
            Questions? <a href="mailto:privacy@turbulentground.com" style="color:#9e8e7c;">privacy@turbulentground.com</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let data;
  try {
    data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const email = (data.email || "").trim().toLowerCase();

  // Basic format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const domain = email.split("@")[1];
  const isSmokeTest = email === SMOKE_TEST_EMAIL;

  // Consumer domain check
  if (CONSUMER_DOMAINS.has(domain)) {
    return res.status(400).json({
      error: "Please use a work email address. Personal email addresses (Gmail, Outlook, etc.) are not accepted."
    });
  }

  // MX record check — domain must have mail configured. Bypassed only for
  // the reserved smoke-test address, so the automated check doesn't depend
  // on turbulentground.com's own DNS/MX setup (unrelated to what it's
  // actually testing) and can't be flaky because of it.
  const hasMx = isSmokeTest ? true : await checkMx(domain);
  if (!hasMx) {
    return res.status(400).json({
      error: "We couldn't verify that email domain. Please check your address and try again."
    });
  }

  // Build token payload — includes all submission data so /api/verify
  // can write to Airtable without a separate store
  const secret = process.env.VERIFICATION_SECRET;
  if (!secret) {
    console.error("Missing VERIFICATION_SECRET");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const attemptId = randomUUID();

  const payload = {
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24h expiry
    data: { ...data, email, attempt_id: attemptId },
  };

  const token = signToken(payload, secret);
  const verifyUrl = `https://turbulentground.com/diagnostic?token=${token}`;

  // Best-effort pending record — funnel visibility (Sprint 4). Never blocks
  // or fails the submission if Airtable is unreachable or misconfigured.
  // Skipped for the smoke test specifically so scheduled runs don't create
  // real Airtable rows (see SMOKE_TEST_EMAIL comment above).
  if (!isSmokeTest) {
    await writePendingRecord({ ...data, email, attempt_id: attemptId });
  }

  // Send verification email
  const resendKey  = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;

  if (!resendKey || !resendFrom || resendKey === "placeholder") {
    console.error("Missing Resend env vars");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // The smoke test stops here, deliberately: everything above it (JSON
  // parsing, email/domain validation, VERIFICATION_SECRET presence, token
  // signing) has now run for real using the actual deployed code and env
  // config, which is exactly what a smoke test should prove works. Sending
  // a real email through Resend on every scheduled run is the one part
  // worth skipping — it has no bearing on whether the *submission* flow
  // works, and would otherwise deliver a real inbox message a few times a
  // day to an address nobody reads.
  if (isSmokeTest) {
    return res.status(200).json({ status: "verification_sent", smoke_test: true });
  }

  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject: "Confirm your email to see your Care Capital results",
        html: buildVerifyEmailHtml(verifyUrl),
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error("Resend error:", err);
      return res.status(502).json({ error: "Could not send verification email. Please try again." });
    }
  } catch (err) {
    console.error("Resend fetch error:", err);
    return res.status(502).json({ error: "Could not send verification email. Please try again." });
  }

  return res.status(200).json({ status: "verification_sent" });
}
