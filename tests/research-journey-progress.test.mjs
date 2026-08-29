import fs from "node:fs";

const html = fs.readFileSync(new URL("../research/index.html", import.meta.url), "utf8");

function check(label, condition) {
  if (!condition) throw new Error(`FAIL  ${label}`);
  console.log(`  PASS  ${label}`);
}

console.log("research-journey-progress.test.mjs");

check("uses a question-remaining journey instead of a conventional progress bar",
  /id="journey-route"/.test(html) && !/pair-progress-track/.test(html));
check("announces questions remaining accessibly", /aria-valuetext="24 questions left"/.test(html));
check("decrements the remaining count as soon as an answer is chosen", /updateRemainingCount\(nextStatementIndex\)/.test(html));
check("renders theme-labelled stations from the ordered questions", /item\.domain\.name/.test(html));
check("removes completed stations by rendering from the current index", /orderedStatements\.slice\(n\)/.test(html));
check("ends the route line at the final visible station",
  /\.journey-route \{[\s\S]*?width: max-content/.test(html) &&
  /right: calc\(24px \+ \(var\(--station-space\) \/ 2\)\)/.test(html));
check("removes the journey line from the final free-text screen",
  /getElementById\('journey-progress'\)\.hidden = atEnd/.test(html) &&
  /\.footer-bar\.final-step \{ justify-content: space-between; \}/.test(html));
check("animates the current station before moving forward", /animateStationDeparture\(\)/.test(html));
check("uses icon-library fragments for the burst", /material-symbols-outlined journey-fragment/.test(html));
check("respects reduced-motion preferences", /prefers-reduced-motion: reduce/.test(html));
check("does not use elapsed-count language", !/displayN \+ ' of '/.test(html));
check("keeps the visual preview local-only", /window\.location\.hostname === 'localhost'/.test(html) && /preview'\) === 'journey'/.test(html));

console.log("\nALL CHECKS PASSED");
