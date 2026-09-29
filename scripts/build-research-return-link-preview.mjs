import fs from "node:fs";
import { buildReturnLinkEmailHtml } from "../lib/research-phase31/public-start.js";

const note = '<aside style="padding:16px 20px;background:#3a241a;color:#e8dcc8;font:14px/1.6 Arial,sans-serif;">Review preview: fictional details only. No email is sent and no participant record is accessed.</aside>';
const html = buildReturnLinkEmailHtml(
  "Alex Morgan",
  "https://www.turbulentground.com/research?t=fictional-preview-only",
  "12 October 2026",
).replace(/<body([^>]*)>/, `<body$1>${note}`);

fs.writeFileSync(new URL("../research/return-link-email-preview.html", import.meta.url), html);
