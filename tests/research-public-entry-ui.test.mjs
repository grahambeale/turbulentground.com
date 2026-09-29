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
check('id="public-start-study-emails"', "public entry keeps study emails as a separate optional choice");
check('id="public-start-video-link"', "public entry keeps a simple way to reopen the welcome video");
check('.video-modal-panel video', "welcome video uses the shared popup");
check('aspect-ratio: 9 / 16', "video popup uses the source portrait ratio rather than a forced widescreen frame");
check("fetch('/api/research-public-start'", "public entry checks and calls the protected start service");
check("window.location.replace(result.data.resumePath)", "successful public start continues with the private return token");
check("result.data.status === 'return_link_sent'", "an existing unfinished response becomes a secure emailed return-link recovery");
check("You’ve already started. I’ve emailed your secure return link.", "duplicate starts receive a clear confirmation rather than a generic failure");
check("params.get('preview') === 'public-start'", "protected visual preview is available without creating participant data");
check("isPublicStartReviewPreview()", "the protected preview gate is re-evaluated when the form is submitted");
check("previewState === 'existing-participant'", "the preview can safely demonstrate the existing-participant recovery outcome");
check("you have 14 days to complete the survey", "entry screen leads with the benefit of a flexible completion window");
check("delete your answers and personal details to protect your privacy", "entry screen explains deletion as a privacy safeguard");
check('data-open-privacy', "entry screen opens the privacy notice without leaving the survey");
check('id="privacy-modal"', "privacy notice has a large in-page modal");
check("fetch('/research/privacy.html')", "privacy modal loads the maintained privacy notice");
check("sessionStorage.setItem('tg-public-start-consent'", "public entry carries its recorded consent through the private redirect without showing a duplicate consent step");
if (html.includes('<p class="eyebrow">Your experience of the AI shift</p>')) throw new Error('entry screen should not repeat the research eyebrow');
if (html.includes('<h1>Before you start</h1>')) throw new Error('consent screen should not show the redundant before-you-start heading');
if (!html.includes('id="intro-video-link"') || !html.includes('A quick message from Graham')) throw new Error('consent screen should retain a click-to-play welcome-video thumbnail');
if (html.includes('window.startIntroVideo') || html.includes('window.startOutroVideo')) throw new Error('video should be click-to-play only, not opened automatically when a screen shows');
if (!html.includes('id="video-modal-skip"')) throw new Error('video popup should offer a prominent way to skip it');
if ((html.match(/href="\/research\/privacy"/g) || []).length > 1) throw new Error('privacy notice should not be repeated on the consent screen');
check('.choice-grid { display: grid; grid-template-columns: 1fr; gap: 12px;', "profile choices are presented as a comfortably spaced vertical list");

for (const [name, text] of [["privacy HTML", privacyHtml], ["privacy Markdown", privacyMd]]) {
  if (!text.includes("public study page")) throw new Error(`${name} must describe public participation`);
  if (!text.includes("after 14 days")) throw new Error(`${name} must state incomplete-response deletion timing`);
}

console.log("Research public-entry UI checks passed.");

function check(fragment, message) {
  if (!html.includes(fragment)) throw new Error(message);
}
