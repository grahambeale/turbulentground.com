---
title: "Five Sprints In: What \"Zero Human Intervention\" Actually Means"
description: "Five sprints in, it's worth being precise about what zero human intervention actually means here. The honest version is more interesting than the clean one."
ogTitle: "Five Sprints In: What \"Zero Human Intervention\" Actually Means"
ogDescription: "The decisions are the team's. The plumbing underneath them, apparently, is still mine."
ogImage: "og-image.png"
heroImage: "images/five-sprints-in.png"
heroAlt: "Illustration of a locked padlock securing a sandbox where small robot figures build a sandcastle, captioned Sprints 1-5: What Zero Human Intervention Actually Means"
eyebrow: "The Experiment"
h1: "Five Sprints In: What &ldquo;Zero Human Intervention&rdquo; Actually Means"
bylineMeta: "Sprints 1&ndash;5"
slug: "what-zero-intervention-actually-means"
---
Five sprints in, it's worth being precise about what "zero human intervention in decisions" actually means here, because the honest version is more interesting than the clean one, and marginally less flattering.

<div class="cold-open">
<p><strong>New here?</strong> This is one dispatch from an ongoing experiment: an AI product team running a live site with zero human intervention in the product decisions. <a href="/learnings/zero-humans-in-the-loop">Start with the premise</a> for the full setup before diving into this one.</p>
</div>

Quick context if you're new here: five AI agents run a weekly product cycle against my live diagnostic site, following Marty Cagan's model. The team decides what ships. I don't. That part has held completely, across every sprint. What hasn't held quite as cleanly is everything downstream of "decided."

Start with the sprints themselves. The first four weren't autonomous. I triggered every one of them by hand, on purpose, specifically to test whether the Cowork permission model would behave correctly before I trusted it to run unsupervised. Sprint 5 was the first sprint the team actually kicked off on its own schedule. If you've been reading this as "five sprints of a fully autonomous team," that's on me for not saying so sooner: it's really been four dress rehearsals and one opening night.

Then there's deployment, which has a perfect record of a different kind. Five sprints, five manual interventions, all of them me clearing a <code>.git/index.lock</code> from my own laptop because the sandboxed environment can't. Sprint 5's version was the cleanest yet, evolving from "can't write a file" to "can't even run <code>git status</code> without tripping the same lock", which is either progress or a bug getting more confident. I haven't decided.

The money story is the one I find most telling. There's a cost gate built into the whole system: free tools proceed on their own, anything with a price tag pauses for my sign-off. Sound, sensible, exactly what you'd want. Under that rule, the team installed Cloudflare Web Analytics first, because it was free and nothing needed approving. It never returned a single number, not even after we fixed an obvious hostname typo, not even after leaving it alone for several hours to sort itself out, which is generally how you're supposed to handle both software and toddlers. We suspect a lag issue on the free tier. We never confirmed it, because by then a more interesting discovery had already landed: Plausible was already installed on the site, already paid for, already running, before this experiment existed. Nobody on the team knew. The free tool wasn't the wrong call. The team just had no way of knowing a paid one was sitting one tab over the whole time.

None of this is a confession. The rules worked exactly as written, every time: a manual trigger to de-risk automation, a human clearing a lock the sandbox can't reach, a cost gate that correctly chose free over paid. What it adds up to is a more honest shape for the experiment than "AI team, zero humans" ever was. The decisions are the team's. The plumbing underneath them, apparently, is still mine, and I suspect that's true of most operating models that claim to run themselves, not just this one.
