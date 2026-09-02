---
title: "How Does an AI Team Miss a Failure This Big?"
description: "The diagnostic's submit button was silently, completely broken since Sprint 5. Four separate QA reviews of that exact page never caught it, because none of them actually tried to use the form as a real visitor would."
ogTitle: "How Does an AI Team Miss a Failure This Big?"
ogDescription: "For three sprints running, this AI product team reported a 100% bounce rate. The real story was worse: the submit button had been dead the whole time, and nobody had clicked it."
ogImage: "og-image.png"
heroImage: "images/how-does-an-ai-team-miss-a-failure-this-big.png"
heroAlt: "Illustration for Sprints 5-7: How Does an AI Team Miss a Failure This Big?"
eyebrow: "The Experiment"
h1: "How Does an AI Team Miss a Failure This Big?"
bylineMeta: "Sprints 5&ndash;7"
slug: "how-does-an-ai-team-miss-a-failure-this-big"
---
For three sprints running, this AI product team reported the same number: a 100% bounce rate on the diagnostic tool. Every single visitor, apparently, left without engaging. Bad, but at least it was consistent.

<div class="cold-open">
<p><strong>New here?</strong> This is one dispatch from an ongoing experiment: an AI product team running a live site with zero human intervention in the product decisions. <a href="/learnings/zero-humans-in-the-loop">Start with the premise</a> for the full setup before diving into this one.</p>
</div>

Then we found out why it was so consistent. The diagnostic is a single-page app &mdash; every click just swaps content on the same page, no new page ever loads. Which means the tracking tool could only ever report one thing: a single pageview, every time, for every visitor. It didn't matter if someone bounced in two seconds or sat there and completed all 25 questions. Both looked identical to the data. The 100% figure wasn't measuring behaviour. It was the only number that page's tracking was ever capable of producing.

Once I understood that, a much less comfortable question followed it. If the number can't tell us whether people are engaging, how would we know if the survey was engaging at all? How would we know if it was actually working?

So I did the obvious thing nobody, including me, had thought to do for weeks. I opened the diagnostic myself and ran it.

I clicked &ldquo;Send my results.&rdquo; Nothing happened.

The submit button had been completely broken since sprint 5. Not slow, not flaky &mdash; dead. Every real click threw a silent error before it even reached the server. No message. No submission. Nothing a visitor would ever see or report, because there was nothing to see. It just quietly failed, every time, for weeks.

The team had reviewed that exact page three separate times since the bug was introduced &mdash; sprint 5, sprint 6, sprint 7 &mdash; on top of whatever review happened when the change first shipped. Four passes. None of them caught it, because none of them actually tried to submit the form as a real visitor would. They reviewed the code. I clicked the button.

Once I reported it, the team traced the fault to a single leftover reference from an old feature removed in sprint 5, fixed it, and while they were in there, found three more pieces of the same dead code causing the same silent-failure pattern &mdash; one of which would have crashed the entire page for anyone arriving via an old invite link.

Then I asked the question that actually mattered more than the fix: how do we make sure this doesn't just happen again, because you can't rely on me, and it does cause reputational damage.

That's the real story here. The team's answer wasn't &ldquo;we'll be more careful.&rdquo; It built three actual layers. A permanent regression test that loads the real page script into a mocked browser and drives it through the whole flow &mdash; proven to fail on the old broken code and pass on the fix, so it's not just decoration. Error telemetry across every page, so a silent JavaScript crash now shows up as a real, visible data point in the next sprint review instead of quietly looking like &ldquo;nobody tried.&rdquo; And an automated browser test that runs twice a day against the live site, actually clicking through the survey the way a real visitor would, the same test I'd just done by hand, except it doesn't need me to remember to do it.

There's one honest gap worth keeping, because this series has been good about not smoothing these over. The third layer &mdash; the one that actually proves the whole flow works &mdash; could not be verified inside the sandbox at all. No permission to install what a real browser needs to run. It's built on the reasonable assumption that GitHub's own infrastructure can run it, but as of writing, it hadn't actually succeeded anywhere yet. The fix for &ldquo;don't rely on a human to catch this&rdquo; is itself, for now, running on faith that it'll work once given the chance.

I don't think the lesson here is that AI QA is careless. Three sprints of genuine, well-evidenced review happened on that page and still missed it, because reviewing code for correctness and actually using the thing turned out to be two different exercises. What's more interesting is what happened after: the team didn't just fix the one bug. It built the thing that should have caught it in the first place, then was honest that the strongest part of that fix hasn't proven itself yet either.

If the point of this whole project is to find out where AI teams fail silently, this is exactly the kind of failure worth surfacing rather than quietly patching and moving on.
