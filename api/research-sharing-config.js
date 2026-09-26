// GET /api/research-sharing-config
// Exposes only the disabled-by-default sharing UI capability.

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  return res.status(200).json({
    enabled: process.env.RESEARCH_SHARING_UI_ENABLED === "true",
  });
}
