---
title: "The Rule That Could Make or Break This Experiment — So Far, Silent"
description: "This experiment has a circuit breaker built into it. Five sprints in, it has never once fired, and that turns out to be a more interesting finding than if it had."
ogTitle: "The Rule That Could Make or Break This Experiment — So Far, Silent"
ogDescription: "A governance mechanism that never fires isn't necessarily decorative. Or it hasn't been tested yet. I don't know which."
ogImage: "og-image.png"
heroImage: "images/the-silent-veto.png"
heroAlt: "Illustration of a break-glass emergency lever sitting untouched in a desert, a small robot walking past in the distance, captioned Sprints 2-5: The Rule That Could Make or Break This Experiment, So Far Silent"
eyebrow: "The Experiment"
h1: "The Rule That Could Make or Break This Experiment &mdash; So Far, Silent"
bylineMeta: "Sprints 2&ndash;5"
slug: "the-silent-veto"
---
This experiment has a circuit breaker designed into it. Five sprints in, it has never once fired, and that turns out to be a more interesting finding than if it had.

<div class="cold-open">
<p><strong>New here?</strong> This is one dispatch from an ongoing experiment: an AI product team running a live site with zero human intervention in the product decisions. <a href="/learnings/zero-humans-in-the-loop">Start with the premise</a> for the full setup before diving into this one.</p>
</div>

Quick context if you're new here: five AI agents run a weekly product cycle against my live diagnostic site, following Marty Cagan's model. I set the objective for the quarter.

After that, I don't get a vote, except in one specific, deliberate way: if three of the four non-PM agents object to the PM's sprint objective, they can force a revision. Object twice, and the sprint defaults to the safest, most defensible item on the backlog. I wrote that mechanism assuming it would matter. So far, it's mostly sat there, armed and slightly bored.

What has fired, twice now, in sprint 5 alone, is something smaller and in some ways more useful: ordinary disagreement that never got close to the threshold.

QA wanted a full six-page colour-contrast audit; the team computed real WCAG 2.1 contrast ratios for two live issues (one interactive element measuring 3.94:1 against the 4.5:1 threshold, one piece of dead code left over from a removed feature) and logged the rest as deliberately incomplete rather than quietly calling it done.

Design wanted to shorten the 25-question diagnostic survey, a genuinely credible idea; the team parked it for a sprint, on the grounds that the very data needed to test the idea responsibly was what that sprint's own work was about to start producing.

Neither disagreement escalated. Neither got smoothed over either. Both got logged, argued, and settled without anyone needing to invoke the nuclear option.

That's the part worth sitting with. A governance mechanism that never fires isn't necessarily decorative. It can also mean the smaller checks are doing their job well enough that the big one never needs to. I don't know yet which of those two this is.

Five sprints and one real disagreement in sprint 2 that got escalated to me rather than resolved internally is not much of a sample size to draw a conclusion from.

There's one honest gap worth naming too. QA's contrast-audit objection got logged in full, and nothing structurally guarantees it gets picked up rather than quietly ageing the way it already did once before. The AI team can voice an objection, but it has no mechanism to force a future sprint to actually act on it. A backlog item and a broken promise currently look identical from the outside, and the only thing telling them apart is whether anyone remembers the dialogue.

So the veto exists, technically. It has real teeth, on paper. And it has spent five sprints doing absolutely nothing. Which might be exactly what a well-designed safety mechanism is supposed to do, or might just mean it hasn't been tested yet.

If you've designed governance mechanisms like this professionally, I'd be genuinely interested in your experiences of putting them into practice.
