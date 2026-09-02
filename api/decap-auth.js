// GET /api/decap-auth
//
// First half of the GitHub OAuth handshake Decap CMS (admin/index.html,
// admin/config.yml) needs to let Graham sign in and commit straight to
// this repo. Netlify provides this endpoint for free via Netlify
// Identity; this site is on Vercel, so it needs its own small
// implementation — this file and api/decap-callback.js are that.
//
// Flow: the admin UI's "Login with GitHub" button opens this endpoint
// in a popup. It redirects straight to GitHub's own authorize screen.
// GitHub redirects the popup back to api/decap-callback.js with a
// one-time code, which that file exchanges for an access token.
//
// Requires a GitHub OAuth App (github.com/settings/developers → OAuth
// Apps → New OAuth App) with:
//   Homepage URL:             https://www.turbulentground.com
//   Authorization callback URL: https://www.turbulentground.com/api/decap-callback
// and its Client ID / Client Secret set as the Vercel env vars this file
// and decap-callback.js read below. The secret must never be exposed to
// the browser — only this server-side pair of routes ever sees it.

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientId = process.env.DECAP_GITHUB_CLIENT_ID;
  if (!clientId) {
    console.error("Missing DECAP_GITHUB_CLIENT_ID");
    return res.status(500).send("Server configuration error: DECAP_GITHUB_CLIENT_ID is not set.");
  }

  const redirectUri = "https://www.turbulentground.com/api/decap-callback";
  const scope = "repo,user";
  const authorizeUrl =
    `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

  res.writeHead(302, { Location: authorizeUrl });
  res.end();
}
