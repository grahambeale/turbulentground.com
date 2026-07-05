// GET /api/verify?token=xxx
// Called by the diagnostic page when it detects ?token= in the URL.
// Validates the signed token, writes the Airtable record, sends the
// results email, and returns the submission data + company scores.
//
// Env vars required:
//   VERIFICATION_SECRET
//   AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE
//   RESEND_API_KEY, RESEND_FROM

import { createHmac } from "crypto";

const CONSUMER_DOMAINS = new Set([
  "gmail.com","googlemail.com","outlook.com","hotmail.com","hotmail.co.uk",
  "hotmail.fr","live.com","live.co.uk","msn.com","yahoo.com","yahoo.co.uk",
  "yahoo.fr","icloud.com","me.com","mac.com","aol.com","aol.co.uk",
  "proton.me","protonmail.com","protonmail.ch","gmx.com","gmx.de","gmx.net",
  "yandex.com","yandex.ru","zoho.com","qq.com","163.com","126.com",
  "mail.com","inbox.com","fastmail.com","fastmail.fm","hey.com",
]);

function verifyToken(token, secret) {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  const expected = createHmac("sha256", secret).update(b64).digest("hex");
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function scoreLabel(score) {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Developing";
  if (score >= 25) return "At risk";
  return "Critical";
}

function buildResultsEmailHtml(data) {
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
            You received this because you completed the Care Capital diagnostic and verified your email.
            To request data deletion, email <a href="mailto:privacy@turbulentground.com" style="color:#9e8e7c;">privacy@turbulentground.com</a>.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

async function getCompanyScores(domain, airtableToken, airtableBase, airtableTable) {
  // Query all verified submissions for this domain
  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const formula = encodeURIComponent(
    `AND({email_domain}="${domain}", {verified}=1, IS_AFTER({timestamp}, "${twelveMonthsAgo}"))`
  );

  const fields = ["score_safety","score_trust","score_incentives","score_curiosity","score_collective","score_overall","timestamp"]
    .map(f => `fields[]=${encodeURIComponent(f)}`).join("&");

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${airtableBase}/${encodeURIComponent(airtableTable)}?filterByFormula=${formula}&${fields}`,
      { headers: { Authorization: `Bearer ${airtableToken}` } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const records = (json.records || []).map(r => r.fields);

    const allTime = records; // already in last 12 months
    const isStale = allTime.length < 3;

    // If under 3 in last 12 months, fall back to all time
    let useRecords = records;
    if (isStale) {
      // Fetch all-time records for this domain
      const allFormula = encodeURIComponent(`AND({email_domain}="${domain}", {verified}=1)`);
      const allRes = await fetch(
        `https://api.airtable.com/v0/${airtableBase}/${encodeURIComponent(airtableTable)}?filterByFormula=${allFormula}&${fields}`,
        { headers: { Authorization: `Bearer ${airtableToken}` } }
      );
      if (allRes.ok) {
        const allJson = await allRes.json();
        useRecords = (allJson.records || []).map(r => r.fields);
      }
    }

    if (useRecords.length < 3) return null; // minimum group size not met

    const dims = ["score_safety","score_trust","score_incentives","score_curiosity","score_collective","score_overall"];
    const stats = {};
    dims.forEach(dim => {
      const vals = useRecords.map(r => Number(r[dim] || 0)).filter(v => !isNaN(v));
      stats[dim] = {
        min: Math.round(Math.min(...vals)),
        max: Math.round(Math.max(...vals)),
        mean: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      };
    });

    // Oldest and newest submission dates
    const timestamps = useRecords.map(r => r.timestamp).filter(Boolean).sort();

    return {
      count: useRecords.length,
      stats,
      isStale,
      freshCount: records.length,
      oldestDate: timestamps[0] || null,
      newestDate: timestamps[timestamps.length - 1] || null,
    };
  } catch (err) {
    console.error("Airtable company query error:", err);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  const secret = process.env.VERIFICATION_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Verify signature
  const payload = verifyToken(token, secret);
  if (!payload) {
    return res.status(400).json({ error: "Invalid or tampered verification link." });
  }

  // Check expiry
  if (Date.now() > payload.exp) {
    return res.status(400).json({ error: "This verification link has expired. Please retake the diagnostic and submit again." });
  }

  const data = payload.data;
  const email = data.email;
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const is_consumer_domain = CONSUMER_DOMAINS.has(domain);

  // Write to Airtable
  const airtableToken = process.env.AIRTABLE_TOKEN;
  const airtableBase  = process.env.AIRTABLE_BASE_ID;
  const airtableTable = process.env.AIRTABLE_TABLE;

  if (!airtableToken || !airtableBase || !airtableTable) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const fields = {
    timestamp:           data.timestamp ?? new Date().toISOString(),
    email,
    email_domain:        domain,
    is_consumer_domain,
    verified:            true,
    attempt_id:          data.attempt_id ?? "",
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
  };

  try {
    // Sprint 4: /api/submit now writes a pending (verified=false) record
    // tagged with attempt_id. Look for it and update it in place, so a
    // single diagnostic attempt produces one row, not two. If no pending
    // record is found (pending write failed, or an older token issued
    // before this change), fall back to the original create-on-verify
    // behaviour so verification never fails because of this.
    let updated = false;

    if (data.attempt_id) {
      const findFormula = encodeURIComponent(`{attempt_id}="${data.attempt_id}"`);
      const findRes = await fetch(
        `https://api.airtable.com/v0/${airtableBase}/${encodeURIComponent(airtableTable)}?filterByFormula=${findFormula}&maxRecords=1`,
        { headers: { Authorization: `Bearer ${airtableToken}` } }
      );
      if (findRes.ok) {
        const findJson = await findRes.json();
        const existing = (findJson.records || [])[0];
        if (existing) {
          const patchRes = await fetch(
            `https://api.airtable.com/v0/${airtableBase}/${encodeURIComponent(airtableTable)}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${airtableToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ records: [{ id: existing.id, fields }] }),
            }
          );
          if (patchRes.ok) {
            updated = true;
          } else {
            const err = await patchRes.text();
            console.error("Airtable patch failed, will fall back to create:", err);
          }
        }
      } else {
        const err = await findRes.text();
        console.error("Airtable lookup by attempt_id failed, will fall back to create:", err);
      }
    }

    if (!updated) {
      const atRes = await fetch(
        `https://api.airtable.com/v0/${airtableBase}/${encodeURIComponent(airtableTable)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${airtableToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ records: [{ fields }] }),
        }
      );
      if (!atRes.ok) {
        const err = await atRes.text();
        console.error("Airtable error:", err);
        return res.status(502).json({ error: "Failed to save submission" });
      }
    }
  } catch (err) {
    console.error("Airtable fetch error:", err);
    return res.status(502).json({ error: "Failed to save submission" });
  }

  // Send results email if consented
  if (data.consent_results) {
    const resendKey  = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM;
    if (resendKey && resendFrom && resendKey !== "placeholder") {
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
            subject: "Your Care Capital results",
            html: buildResultsEmailHtml(data),
          }),
        });
        if (!emailRes.ok) {
          const err = await emailRes.text();
          console.error("Resend error (non-fatal):", err);
        }
      } catch (err) {
        console.error("Resend fetch error (non-fatal):", err);
      }
    }
  }

  // Fetch company scores (only for work domains)
  let company = null;
  if (!is_consumer_domain) {
    company = await getCompanyScores(domain, airtableToken, airtableBase, airtableTable);
  }

  return res.status(200).json({
    ok: true,
    submission: data,
    company,
  });
}
