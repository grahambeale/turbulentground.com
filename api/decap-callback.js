// GET /api/decap-callback?code=...
//
// Second half of the GitHub OAuth handshake — see api/decap-auth.js for
// the full picture. GitHub redirects here with a one-time code after
// Graham approves the OAuth App; this exchanges it server-side for an
// access token (the exchange needs the Client Secret, which must never
// reach the browser), then hands that token back to the admin/index.html
// popup via the exact postMessage protocol Decap CMS's GitHub backend
// expects — this isn't a bespoke handshake, it's the documented Decap/
// Netlify CMS one, so admin/config.yml's `backend: name: github` works
// against it without any special-casing on the CMS side.
//
// Requires DECAP_GITHUB_CLIENT_ID and DECAP_GITHUB_CLIENT_SECRET set as
// Vercel env vars (see api/decap-auth.js for the OAuth App setup this
// pairs with).

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!code) {
    return res.status(400).send("Missing OAuth code from GitHub.");
  }

  const clientId = process.env.DECAP_GITHUB_CLIENT_ID;
  const clientSecret = process.env.DECAP_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("Missing DECAP_GITHUB_CLIENT_ID or DECAP_GITHUB_CLIENT_SECRET");
    return res.status(500).send("Server configuration error: Decap GitHub OAuth env vars are not set.");
  }

  let tokenData;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    tokenData = await tokenRes.json();
  } catch (err) {
    console.error("GitHub token exchange failed:", err);
    return res.status(502).send("Could not reach GitHub to complete sign-in. Please try again.");
  }

  if (tokenData.error || !tokenData.access_token) {
    console.error("GitHub token exchange error:", tokenData);
    return res.status(400).send(`GitHub sign-in failed: ${tokenData.error_description || tokenData.error || "no access token returned"}`);
  }

  const token = tokenData.access_token;
  const payload = JSON.stringify({ token, provider: "github" });

  // The exact two-step postMessage handshake Decap's GitHub backend
  // listens for: the popup announces itself, waits for the opener to
  // reply (so it knows the opener's real origin instead of guessing),
  // then sends the token back to that origin specifically — never "*".
  const html = `<!doctype html>
<html><body>
<script>
(function () {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:${payload.replace(/</g, "\\u003c")}',
      e.origin
    );
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body></html>`;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}
