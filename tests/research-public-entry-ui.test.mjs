#!/usr/bin/env node

import fs from "node:fs";

const html = fs.readFileSync(new URL("../research/index.html", import.meta.url), "utf8");
const privacyHtml = fs.readFileSync(new URL("../research/privacy.html", import.meta.url), "utf8");
const privacyMd = fs.readFileSync(new URL("../research/privacy.md", import.meta.url), "utf8");

check('id="screen-public-start"', "public entry screen is present");
check('id="public-start-name"', "public entry requires a name field");
check('id="public-start-email"', "public entry requires an email field");
check('id="public-start-adult"', "public entry requires adult confirmation");
check('id="public-start-consent"', "public entry requires participation consent");
check("fetch('/api/research-public-start'", "public entry checks and calls the protected start service");
check("window.location.replace(result.data.resumePath)", "successful public start continues with the private return token");
check("previewMode === 'public-start'", "protected visual preview is available without creating participant data");
check("automatically delete the incomplete answers and contact details after 14 days", "entry screen states the retention promise");

for (const [name, text] of [["privacy HTML", privacyHtml], ["privacy Markdown", privacyMd]]) {
  if (!text.includes("public study page")) throw new Error(`${name} must describe public participation`);
  if (!text.includes("after 14 days")) throw new Error(`${name} must state incomplete-response deletion timing`);
}

console.log("Research public-entry UI checks passed.");

function check(fragment, message) {
  if (!html.includes(fragment)) throw new Error(message);
}
