// Vercel serverless function — POST /api/submit
// Env vars required:
//   AIRTABLE_TOKEN   — Airtable personal access token (data.records:write)
//   AIRTABLE_BASE_ID — e.g. appXXXXXXXXXXXXXX
//   AIRTABLE_TABLE   — table name, e.g. "Diagnostic Submissions"
//   RESEND_API_KEY   — Resend API key
//   RESEND_FROM      — verified sender, e.g. "results@turbulentground.com"

const CONSUMER_DOMAINS = new Set([
  "gmail.com","googlemail.com","outlook.com","hotmail.com","hotmail.co.uk",
  "hotmail.fr","live.com","live.co.uk","msn.com","yahoo.com","yahoo.co.uk",
  "yahoo.fr","icloud.com","me.com","mac.com","aol.com","aol.co.uk",
  "proton.me","protonmail.com","protonmail.ch","gmx.com","gmx.de","gmx.net",
  "yandex.com","yandex.ru","zoho.com","qq.com","163.com","126.com",
  "mail.com","inbox.com","fastmail.com","fastmail.fm","hey.com",
]);

function deriveEmailMeta(email) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return {
    email_domain: domain,
    is_consumer_domain: CONSUMER_DOMAINS.has(domain),
  };
}

function scoreLabel(score) {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Developing";
  if (score >= 25) return "At risk";
  return "Critical";
}

function buildEmailHtml(data) {
  const dims = [
    { key: "score_safety",     label: "Psychological Safety" },
    { key: "score_trust",      label: "Trust & Transparency" },
    { key: "score_incentives", label: "Aligned Incentives" },
    { key: "score_curiosity",  label: "Curiosity & Learning" },
    { key: "score_collective", label: "Collective Orientation" },
  ];

  const rows = dims.map(({ key, label }) => {
    const score = data[key] ?? 0;
    return `
      <tr>
        <td style="padding:8px 12px;color:#c8b89a;font-family:sans-serif;font-size:14px;">${label}</td>
        <td style="padding:8px 12px;font-family:sans-serif;font-size:14px;font-weight:600;color:#e8dcc8;">${score}</td>
        <td style="padding:8px 12px;font-family:sans-serif;font-size:13px;color:#9e8e7c;">${scoreLabel(score)}</td>
      </tr>`;
  }).join("");

  const overall = data.score_overall ?? 0;
  const lowestDim = dims.reduce((a, b) => (data[a.key] ?? 0) < (data[b.key] ?? 0) ? a : b);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#131110;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#131110;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#1c1915;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:32px 40px 24px;background:#0e0b08;">
          <p style="margin:0 0 8px;font-family:sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9e8e7c;">Turbulent Ground</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#e8dcc8;line-height:1.25;">Your Care Capital results</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px 8px;">
          <p style="margin:0 0 24px;font-family:sans-serif;font-size:15px;color:#c8b89a;line-height:1.6;">
            Here are your five dimension scores${data.respondent_name ? `, ${data.respondent_name}` : ""}. Overall score: <strong style="color:#e8dcc8;">${overall}/100</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid #26211c;">
                <th style="padding:8px 12px;text-align:left;font-family:sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e8e7c;font-weight:500;">Dimension</th>
                <th style="padding:8px 12px;text-align:left;font-family:sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e8e7c;font-weight:500;">Score</th>
                <th style="padding:8px 12px;text-align:left;font-family:sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9e8e7c;font-weight:500;">Signal</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 40px 32px;">
          <p style="margin:0 0 12px;font-family:sans-serif;font-size:14px;color:#9e8e7c;line-height:1.6;">
            Your lowest dimension is <strong style="color:#e8dcc8;">${lowestDim.label}</strong> (${data[lowestDim.key] ?? 0}). That is often the first place to focus.
          </p>
          <p style="margin:0;font-family:sans-serif;font-size:14px;color:#9e8e7c;line-height:1.6;">
            Read the full framework at <a href="https://turbulentground.com/care-capital" style="color:#d9571c;text-decoration:none;">turbulentground.com/care-capital</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px;background:#0e0b08;border-top:1px solid #26211c;">
          <p style="margin:0;font-family:sans-serif;font-size:12px;color:#9e8e7c;">
            You received this because you completed the Care Capital diagnostic and opted in to receive your results.
            To unsubscribe or request data deletion, email <a href="mailto:privacy@turbulentground.com" style="color:#9e8e7c;">privacy@turbulentground.com</a>.
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

  if (!data.email) {
    return res.status(400).json({ error: "email is required" });
  }

  const { email_domain, is_consumer_domain } = deriveEmailMeta(data.email);

  // --- Airtable write ---
  const airtableToken = process.env.AIRTABLE_TOKEN;
  const airtableBase  = process.env.AIRTABLE_BASE_ID;
  const airtableTable = process.env.AIRTABLE_TABLE;

  if (!airtableToken || !airtableBase || !airtableTable) {
    console.error("Missing Airtable env vars");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const record = {
    fields: {
      timestamp:           data.timestamp ?? new Date().toISOString(),
      email:               data.email,
      email_domain,
      is_consumer_domain,
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
    const atRes = await fetch(
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
    if (!atRes.ok) {
      const err = await atRes.text();
      console.error("Airtable error:", err);
      return res.status(502).json({ error: "Failed to save submission" });
    }
  } catch (err) {
    console.error("Airtable fetch error:", err);
    return res.status(502).json({ error: "Failed to save submission" });
  }

  // --- Resend email (only when consent_results) ---
  if (data.consent_results) {
    const resendKey  = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM;

    if (!resendKey || !resendFrom) {
      console.error("Missing Resend env vars — skipping email");
    } else {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFrom,
            to:   [data.email],
            subject: "Your Care Capital results",
            html: buildEmailHtml(data),
          }),
        });
        if (!emailRes.ok) {
          const err = await emailRes.text();
          console.error("Resend error:", err);
          // Non-fatal: record is already saved; log and continue
        }
      } catch (err) {
        console.error("Resend fetch error:", err);
      }
    }
  }

  return res.status(200).json({ ok: true });
}
