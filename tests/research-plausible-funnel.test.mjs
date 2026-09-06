import fs from "node:fs";

const html = fs.readFileSync(new URL("../research/index.html", import.meta.url), "utf8");

function check(label, condition) {
  if (!condition) throw new Error(`FAIL  ${label}`);
  console.log(`  PASS  ${label}`);
}

console.log("research-plausible-funnel.test.mjs");

const expectedEvents = [
  "Research: Invite Validated",
  "Research: Resumed",
  "Research: Consent Completed",
  "Research: Profile Completed",
  "Research: 25% Complete",
  "Research: 50% Complete",
  "Research: 75% Complete",
  "Research: Questions Completed",
  "Research: Submitted",
  "Research: Comparison Requested",
  "Research: Submission Failed",
  "Research: Comparison Failed",
  "Research: Explanation Opened",
  "Research: Intro Video Played",
  "Research: Intro Video Completed",
  "Research: Outro Video Played",
  "Research: Outro Video Completed",
];

check("loads Plausible on the research page",
  /data-domain="turbulentground\.com" src="https:\/\/plausible\.io\/js\/script\.js"/.test(html));

for (const eventName of expectedEvents) {
  check(`fires ${eventName}`,
    html.includes(`trackResearchEvent('${eventName}')`));
}

check("fires resumed only after restored participation consent is confirmed",
  /function resumeFromSavedState\(saved\) \{[\s\S]*if \(!consent\.takingPart\) \{[\s\S]*return;[\s\S]*trackResearchEvent\('Research: Resumed'\);[\s\S]*showScreen\('screen-pairs'\)/.test(html));

check("fires explanation opened only when an explanation is being revealed",
  /var opening = help\.hidden;[\s\S]*if \(opening\) trackResearchEvent\('Research: Explanation Opened'\);[\s\S]*help\.hidden = !opening;/.test(html));

check("tracks quarter milestones from actual newly answered statements",
  /if \(!wasAnswered\) \{[\s\S]*statementsAnswered\+\+[\s\S]*statementsAnswered === 6[\s\S]*statementsAnswered === 12[\s\S]*statementsAnswered === 18[\s\S]*statementsAnswered === TOTAL_STATEMENTS/.test(html));
const submitFetch = html.indexOf("fetch('/api/research-submit'");
const submitSuccess = html.indexOf("trackResearchEvent('Research: Submitted')", submitFetch);
const submitFailure = html.indexOf(".catch(function", submitFetch);
check("fires submission only after the submission request succeeds",
  submitFetch !== -1 && submitSuccess > submitFetch && submitSuccess < submitFailure);
const submissionFailure = html.indexOf("trackResearchEvent('Research: Submission Failed')", submitFailure);
check("fires submission failed only from the failure path",
  submissionFailure > submitFailure);
check("does not classify invalid or already-used invites as service failures",
  /res\.status === 409[\s\S]*trackSubmissionFailure = false;[\s\S]*res\.status === 403[\s\S]*trackSubmissionFailure = false;/.test(html));

const comparisonFetch = html.indexOf("fetch('/api/research-results-email'");
const comparisonSuccess = html.indexOf("trackResearchEvent('Research: Comparison Requested')", comparisonFetch);
const comparisonFailure = html.indexOf(".catch(function", comparisonFetch);
check("fires comparison requested only after the email request succeeds",
  comparisonFetch !== -1 && comparisonSuccess > comparisonFetch && comparisonSuccess < comparisonFailure);
const comparisonFailed = html.indexOf("trackResearchEvent('Research: Comparison Failed')", comparisonFailure);
check("fires comparison failed only from the failure path",
  comparisonFailed > comparisonFailure);
check("does not track local research previews",
  /if \(localJourneyPreview \|\| localTransitionPreview \|\| localRestrainedPreview \|\| researchEventsSent\[name\]\) return;/.test(html));
check("sends only a fixed event name with no custom properties",
  /window\.plausible\(name\);/.test(html) && !/window\.plausible\(name,/.test(html));
check("tracks video plays from the media player's real play event",
  /player\.addEventListener\('play',[\s\S]*Research: Intro Video Played[\s\S]*Research: Outro Video Played/.test(html));
check("tracks video completions only from the media player's ended event",
  /player\.addEventListener\('ended',[\s\S]*Research: Intro Video Completed[\s\S]*Research: Outro Video Completed/.test(html));

console.log("\nALL CHECKS PASSED");
