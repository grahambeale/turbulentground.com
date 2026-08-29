// GET /api/research-unsubscribe?t=TOKEN
//   Returns a confirmation page that immediately sends the POST from a real
//   browser. Keeping the mutation out of GET prevents email link scanners
//   from unsubscribing participants merely by inspecting a message.
// POST /api/research-unsubscribe
// body: { token }
//   Sets study-email consent to false on the participant's response.

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";

const FIELD = {
  token: "flduL4PmBEfH9rLpz",
  consentStudyEmails: "flduWhkQo6u5O3nIp",
};

function tokenFrom(req) {
  if (req.method === "GET") {
    return typeof req.query?.t === "string" ? req.query.t.trim() : "";
  }
  let data;
  try { data = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return ""; }
  return typeof data?.token === "string" ? data.token.trim() : "";
}

function page(token) {
  const safeToken = JSON.stringify(token).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Study email preferences | Turbulent Ground</title>
  <style>
    :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#131110;color:#e8dcc8;font-family:Arial,sans-serif;display:grid;place-items:center;padding:24px}.card{width:min(620px,100%);padding:42px;background:#1c1916;border:1px solid #3a332d}h1{margin:0 0 18px;font:400 clamp(2rem,6vw,3.5rem)/1.05 Georgia,serif}p{color:#d0bea2;font-size:1.05rem;line-height:1.65}.brand{margin-bottom:46px;color:#d0bea2;font-size:.8rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase}.status{color:#ef7b45;font-weight:700}.button{display:none;margin-top:22px;border:0;border-radius:999px;background:#c9470e;color:#fff;padding:14px 24px;font:700 1rem Arial,sans-serif;cursor:pointer}
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">Turbulent Ground</div>
    <h1 id="title">Updating your preferences</h1>
    <p class="status" id="status" role="status" aria-live="polite">Unsubscribing you from study emails…</p>
    <p id="detail">Your research response will remain part of the study.</p>
    <button class="button" id="retry" type="button">Try again</button>
  </main>
  <script>
    (function () {
      var token = ${safeToken};
      var title = document.getElementById('title');
      var status = document.getElementById('status');
      var detail = document.getElementById('detail');
      var retry = document.getElementById('retry');
      function unsubscribe() {
        retry.style.display = 'none';
        status.textContent = 'Unsubscribing you from study emails…';
        fetch('/api/research-unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token })
        }).then(function (response) {
          if (!response.ok) throw new Error('request failed');
          title.textContent = 'You’re unsubscribed.';
          status.textContent = 'You will not receive further study community emails.';
          detail.textContent = 'Your existing research response remains part of the study. You do not need to do anything else.';
        }).catch(function () {
          title.textContent = 'That didn’t work.';
          status.textContent = 'I couldn’t update your preference just now.';
          detail.textContent = 'Please try again, or email privacy@turbulentground.com.';
          retry.style.display = 'inline-block';
        });
      }
      retry.addEventListener('click', unsubscribe);
      unsubscribe();
    }());
  </script>
</body>
</html>`;
}

async function findResponse(token, airtableToken) {
  const formula = `{${FIELD.token}}="${token.replace(/"/g, '\\"')}"`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RESPONSES_TABLE_ID}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&returnFieldsByFieldId=true`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${airtableToken}` } });
  if (!response.ok) throw new Error(`Airtable lookup failed: ${await response.text()}`);
  const data = await response.json();
  return data.records && data.records[0];
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const token = tokenFrom(req);

  if (req.method === "GET") {
    if (!token) return res.status(400).send("Invalid unsubscribe link");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(page(token));
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!token) return res.status(400).json({ error: "Invalid unsubscribe link" });

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  if (!airtableToken) {
    console.error("Missing AIRTABLE_RESEARCH_TOKEN");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const responseRecord = await findResponse(token, airtableToken);
    if (responseRecord) {
      const patch = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RESPONSES_TABLE_ID}/${responseRecord.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${airtableToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields: { [FIELD.consentStudyEmails]: false } }),
        }
      );
      if (!patch.ok) throw new Error(`Airtable update failed: ${await patch.text()}`);
    }
    // Return the same success response when no record exists. This avoids
    // exposing whether a token belongs to a participant and is idempotent.
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Could not update email preferences" });
  }
}
