import fs from "node:fs";

const page = fs.readFileSync(new URL("../research/index.html", import.meta.url), "utf8");
const privacyHtml = fs.readFileSync(new URL("../research/privacy.html", import.meta.url), "utf8");
const privacyMd = fs.readFileSync(new URL("../research/privacy.md", import.meta.url), "utf8");

function check(label, condition) {
  if (!condition) throw new Error(`FAIL  ${label}`);
  console.log(`  PASS  ${label}`);
}

console.log("research-upfront-email-consent.test.mjs");

const consentForm = page.match(/<form id="consent-form">([\s\S]*?)<\/form>/)?.[1] || "";
const resultsForm = page.match(/<form class="results-email" id="results-email-form">([\s\S]*?)<\/form>/)?.[1] || "";
const endForm = page.match(/<form class="results-email stay-involved" id="stay-involved-form">([\s\S]*?)<\/form>/)?.[1] || "";

check("keeps participation and study-email consent as separate checkboxes",
  /id="consent-taking-part" required/.test(consentForm) &&
  /id="consent-study-emails"/.test(consentForm) &&
  !/id="consent-study-emails"[^>]*required/.test(consentForm));
check("places the conditional email field on the opening consent screen",
  /id="email-capture"/.test(consentForm) && /id="email-capture-input"/.test(consentForm));
check("removes the study-email opt-in from the end screen",
  !/id="consent-study-emails"/.test(endForm) && /id="consent-quote-name"/.test(endForm));
check("offers a separate second study-email choice with the comparison request",
  /id="results-study-emails"/.test(resultsForm) &&
  !/id="results-study-emails"[^>]*required/.test(resultsForm));
check("restores the existing study-email preference in the comparison module",
  /resultsStudyEmails\.checked = consent\.contactStudyEmails/.test(page));
check("sends the comparison and study-email choices separately",
  /\/api\/research-capture-email[\s\S]*?studyEmails: resultsStudyEmails\.checked[\s\S]*?\/api\/research-results-email/.test(page));
check("requires an address when an email opt-in has no address on file",
  /wantsEmails && !hasEmailOnFile && !emailCaptured && !looksLikeEmailClientSide\(email\)/.test(page));
check("persists the email and consent before opening the context questions",
  /emailSave\.then\([\s\S]*?\/api\/research-save-progress[\s\S]*?Research: Consent Completed[\s\S]*?showScreen\('screen-context'\)/.test(page));
check("privacy notice describes the upfront choice as separate and optional",
  /separate, optional checkbox on the same screen/.test(privacyHtml) &&
  /separate, optional checkbox on the same screen/.test(privacyMd));
check("privacy notice explains the second opportunity to review the preference",
  /a second optional checkbox lets you review or change that email preference/.test(privacyHtml) &&
  /a second optional checkbox lets you review or change that email preference/.test(privacyMd));

console.log("\nALL CHECKS PASSED");
