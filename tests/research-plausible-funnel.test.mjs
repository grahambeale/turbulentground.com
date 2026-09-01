import fs from "node:fs";

const html = fs.readFileSync(new URL("../research/index.html", import.meta.url), "utf8");

function check(label, condition) {
  if (!condition) throw new Error(`FAIL  ${label}`);
  console.log(`  PASS  ${label}`);
}

console.log("research-plausible-funnel.test.mjs");

const expectedEvents = [
  "Research: Invite Validated",
  "Research: Consent Completed",
  "Research: Profile Completed",
  "Research: 25% Complete",
  "Research: 50% Complete",
  "Research: 75% Complete",
  "Research: Questions Completed",
  "Research: Submitted",
  "Research: Comparison Requested",
];

check("loads Plausible on the research page",
  /data-domain="turbulentground\.com" src="https:\/\/plausible\.io\/js\/script\.js"/.test(html));

for (const eventName of expectedEvents) {
  check(`fires ${eventName}`,
    html.includes(`trackResearchEvent('${eventName}')`));
}

check("tracks quarter milestones from actual newly answered statements",
  /if \(!wasAnswered\) \{[\s\S]*statementsAnswered\+\+[\s\S]*statementsAnswered === 6[\s\S]*statementsAnswered === 12[\s\S]*statementsAnswered === 18[\s\S]*statementsAnswered === TOTAL_STATEMENTS/.test(html));
const submitFetch = html.indexOf("fetch('/api/research-submit'");
const submitSuccess = html.indexOf("trackResearchEvent('Research: Submitted')", submitFetch);
const submitFailure = html.indexOf(".catch(function", submitFetch);
check("fires submission only after the submission request succeeds",
  submitFetch !== -1 && submitSuccess > submitFetch && submitSuccess < submitFailure);

const comparisonFetch = html.indexOf("fetch('/api/research-results-email'");
const comparisonSuccess = html.indexOf("trackResearchEvent('Research: Comparison Requested')", comparisonFetch);
const comparisonFailure = html.indexOf(".catch(function", comparisonFetch);
check("fires comparison requested only after the email request succeeds",
  comparisonFetch !== -1 && comparisonSuccess > comparisonFetch && comparisonSuccess < comparisonFailure);
check("does not track local journey previews",
  /if \(localJourneyPreview \|\| researchEventsSent\[name\]\) return;/.test(html));
check("sends only a fixed event name with no custom properties",
  /window\.plausible\(name\);/.test(html) && !/window\.plausible\(name,/.test(html));

console.log("\nALL CHECKS PASSED");
