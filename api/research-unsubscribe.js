// GET /api/research-unsubscribe?t=TOKEN
//   Returns a confirmation page. Opening the link never changes consent.
// POST /api/research-unsubscribe
// body: { token, feedback? }
//   Sets study-email consent to false and stores optional feedback.

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";

const FIELD = {
  token: "flduL4PmBEfH9rLpz",
  consentStudyEmails: "flduWhkQo6u5O3nIp",
  unsubscribeFeedback: "fldRWiyUJF7rMf3Zk",
  unsubscribedAt: "fldMhpdR9iQHKiGou",
};

const MAX_FEEDBACK_LENGTH = 1000;

function tokenFrom(req) {
  if (req.method === "GET") {
    return typeof req.query?.t === "string" ? req.query.t.trim() : "";
  }
  let data;
  try { data = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return ""; }
  return typeof data?.token === "string" ? data.token.trim() : "";
}

function feedbackFrom(req) {
  let data;
  try { data = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return ""; }
  return typeof data?.feedback === "string" ? data.feedback.trim() : "";
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
    :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#131110;color:#e8dcc8;font-family:Arial,sans-serif;display:grid;place-items:center;padding:24px}.card{width:min(650px,100%);padding:clamp(28px,6vw,48px);background:#1c1916;border:1px solid #3a332d}h1{margin:0 0 18px;font:400 clamp(2rem,6vw,3.5rem)/1.05 Georgia,serif}p{color:#d0bea2;font-size:1.05rem;line-height:1.65}.brand{margin-bottom:42px;color:#d0bea2;font-size:.8rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase}.field{margin-top:30px}label{display:block;margin-bottom:10px;color:#e8dcc8;font-weight:700;font-size:1.05rem}textarea{display:block;width:100%;min-height:130px;resize:vertical;border:1px solid #62574c;border-radius:8px;background:#131110;color:#fff;padding:15px;font:1rem/1.5 Arial,sans-serif}textarea:focus{outline:3px solid #ef7b45;outline-offset:2px}.hint{margin:8px 0 0;color:#a99780;font-size:.9rem}.actions{display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-top:28px}.button{border:0;border-radius:999px;background:#c9470e;color:#fff;padding:15px 25px;font:700 1rem Arial,sans-serif;cursor:pointer}.button:focus-visible,.keep:focus-visible{outline:3px solid #efaa78;outline-offset:4px}.button:disabled{cursor:wait;opacity:.65}.keep{border:0;background:transparent;color:#cbbba3;padding:10px 0;font:1rem Arial,sans-serif;text-decoration:underline;text-underline-offset:4px;cursor:pointer}.status{color:#ef7b45;font-weight:700}.error{margin-top:18px;color:#ff9d70;font-weight:700}.hidden{display:none}
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">Turbulent Ground</div>
    <section id="choice">
      <h1>Unsubscribe from study emails?</h1>
      <p>You will stop receiving findings, follow-up questions and opportunities to contribute to the research community.</p>
      <p>Your existing research response will remain part of the study.</p>
      <form id="unsubscribe-form">
        <div class="field">
          <label for="feedback">Would you like to tell me why? <span class="hint">(optional)</span></label>
          <textarea id="feedback" name="feedback" maxlength="1000" placeholder="Your feedback will help me improve the study emails."></textarea>
          <p class="hint">Please do not include sensitive information or name anyone else.</p>
        </div>
        <div class="actions">
          <button class="button" id="confirm" type="submit">Confirm unsubscribe</button>
          <button class="keep" id="keep" type="button">Keep receiving study emails</button>
        </div>
        <p class="error hidden" id="error" role="alert">I could not update your preference just now. Please try again, or email privacy@turbulentground.com.</p>
      </form>
    </section>
    <section class="hidden" id="success" aria-live="polite">
      <h1 tabindex="-1">You’re unsubscribed.</h1>
      <p class="status">You will not receive further study emails.</p>
      <p>Your existing research response remains part of the study. You do not need to do anything else.</p>
    </section>
    <section class="hidden" id="kept" aria-live="polite">
      <h1 tabindex="-1">You’re still subscribed.</h1>
      <p class="status">Your email preference has not changed.</p>
      <p>You can close this page. You will continue to receive study emails no more than once every 30 days.</p>
    </section>
  </main>
  <script>
    (function () {
      var token = ${safeToken};
      var form = document.getElementById('unsubscribe-form');
      var choice = document.getElementById('choice');
      var success = document.getElementById('success');
      var kept = document.getElementById('kept');
      var feedback = document.getElementById('feedback');
      var confirm = document.getElementById('confirm');
      var error = document.getElementById('error');
      document.getElementById('keep').addEventListener('click', function () {
        choice.classList.add('hidden');
        kept.classList.remove('hidden');
        kept.querySelector('h1').focus();
      });
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        confirm.disabled = true;
        confirm.textContent = 'Updating preference…';
        error.classList.add('hidden');
        fetch('/api/research-unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token, feedback: feedback.value })
        }).then(function (response) {
          if (!response.ok) throw new Error('request failed');
          choice.classList.add('hidden');
          success.classList.remove('hidden');
          success.querySelector('h1').focus();
        }).catch(function () {
          confirm.disabled = false;
          confirm.textContent = 'Confirm unsubscribe';
          error.classList.remove('hidden');
        });
      });
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
  const feedback = feedbackFrom(req);
  if (feedback.length > MAX_FEEDBACK_LENGTH) {
    return res.status(400).json({ error: "Feedback is too long" });
  }

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
          body: JSON.stringify({
            fields: {
              [FIELD.consentStudyEmails]: false,
              [FIELD.unsubscribedAt]: new Date().toISOString(),
              ...(feedback ? { [FIELD.unsubscribeFeedback]: feedback } : {}),
            },
          }),
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
