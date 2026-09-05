import fs from "node:fs";

const html = fs.readFileSync(new URL("../research/index.html", import.meta.url), "utf8");

function check(label, condition) {
  if (!condition) throw new Error(`FAIL  ${label}`);
  console.log(`  PASS  ${label}`);
}

console.log("research-likert-transition.test.mjs");

check("enables the approved transition in the participant experience",
  /document\.documentElement\.classList\.add\('likert-transitions'\)/.test(html) &&
  /if \(!window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\)/.test(html));
check("retains a local transition preview without analytics",
  /localTransitionPreview[\s\S]*?previewMode === 'transition'/.test(html) &&
  /localJourneyPreview \|\| localTransitionPreview \|\| researchEventsSent/.test(html));
check("gives the selected control a short press state",
  /response-control-pressed/.test(html) && /scale\(0\.92\)/.test(html));
check("moves the old question left and the new question in from the right",
  /likert-question-out/.test(html) && /translateX\(calc\(-100vw - 100%\)\)/.test(html) &&
  /likert-question-in/.test(html) && /translateX\(calc\(100vw \+ 100%\)\)/.test(html));
check("mirrors the motion when navigating back",
  /likert-question-out-back/.test(html) && /likert-question-in-back/.test(html) &&
  /runLikertTransition\(previousStatementIndex, null, 'back'\)/.test(html));
check("moves the journey map with the question transition",
  /journey-route-forward/.test(html) && /journey-route-back/.test(html) &&
  /animateJourneyRoute\(direction\)/.test(html));
check("starts the forward node burst with the slide",
  /if \(direction === 'forward'\) animateStationDeparture\(\);[\s\S]*animateJourneyRoute\(direction\)/.test(html));
check("preserves vertical position between questions",
  /function showStatement\(index, preserveScrollPosition\)/.test(html) &&
  /window\.scrollTo\(0, preserveScrollPosition \? scrollYBeforeUpdate : 0\)/.test(html) &&
  /showStatement\(nextStatementIndex, true\)/.test(html) &&
  /showStatement\(previousStatementIndex, true\)/.test(html));
check("prevents browser scroll anchoring during the handoff",
  /#pairs-list\.is-transitioning[\s\S]*?overflow-anchor: none/.test(html));
check("does not clip motion at the survey column",
  /#pairs-list\.is-transitioning[\s\S]*?overflow: visible/.test(html));
check("runs the slide after the press settles",
  /runLikertTransition\(nextStatementIndex, selectedControlEl, 'forward'\)/.test(html) &&
  /settleDelay = selectedControlEl \? 160 : 0/.test(html));
check("prevents repeat answers during the transition", /isLikertTransitioning/.test(html));
check("provides a reduced-motion path", /prefers-reduced-motion: reduce/.test(html));

console.log("\nALL CHECKS PASSED");
