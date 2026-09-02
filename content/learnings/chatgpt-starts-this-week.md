---
title: "Team Claude Is Getting Reinforcements. ChatGPT Starts This Week."
description: "Three sprints shipped nothing after the seven-copies fix, so cadence goes daily."
ogTitle: "Team Claude Is Getting Reinforcements. ChatGPT Starts This Week."
ogDescription: "Three sprints shipped nothing after the seven-copies fix, so cadence goes daily."
ogImage: "https://turbulentground.com/learnings/images/chatgpt-starts-this-week.png"
heroImage: "/learnings/images/chatgpt-starts-this-week.png"
heroAlt: "Illustration for Team Claude Is Getting Reinforcements. ChatGPT Starts This Week."
eyebrow: "The Experiment"
h1: "Team Claude Is Getting Reinforcements. ChatGPT Starts This Week."
bylineMeta: "Sprints 15&ndash;17"
slug: "chatgpt-starts-this-week"
---
A few weeks ago I found the thing I thought was breaking this experiment. The file that tells my AI team how to operate existed in seven different places at once, all slightly different, none of them authoritative. I deleted almost all of them. One local repo, one GitHub copy, everything reading from the same source.

<div class="cold-open">
<p><strong>New here?</strong> This is one dispatch from an ongoing experiment: an AI product team running a live site with zero human intervention in the product decisions. <a href="/learnings/zero-humans-in-the-loop">Start with the premise</a> for the full setup before diving into this one.</p>
</div>

Then three sprints ran and shipped nothing.

Not &quot;shipped something small&quot;. Nothing material reached production. Sprint fifteen was discovery only. Sprint fourteen had technically shipped, but I'd committed it myself, out of band, so no session ever completed its own close. The pattern since has held.

That's worse than where I started. For eleven sprints this thing was at least a ticket factory. Small, correct, inconsequential fixes, twice a week, reliably. Now the factory has stopped and I've removed the excuse I'd been using for why.

So the problem was never the files. Fixing them was necessary. It just wasn't sufficient, and I'd quietly hoped it would be.

## Going daily

The first change is cadence. Twice a week becomes every day.

The reasoning is simple. Four months in, I've learned a great deal about how these systems fail and almost nothing about whether they can work. At two sprints a week I'm three months from a conclusion. At daily, three weeks. Given the answer might well be no, I'd rather find out sooner.

## Which means a second team

The immediate constraint on daily is tokens. I've already lost whole sprints to a scheduled run hitting a usage limit and simply stopping. At seven runs a week that goes from an occasional annoyance to the thing that defines the cadence.

So Claude is being joined by ChatGPT.

Not as a replacement, and not as a second opinion. As a second runner on the same team. Same project folder, same protocol, same sprint state. When Claude can't run, ChatGPT picks up from the recorded checkpoint rather than starting again. One canonical set of rules, two thin entry points into it. Claude reads one bootstrap file, Codex reads another, and neither of those files contains any actual rules. They both just point at the same protocol and the same state.

Making that work was more interesting than I expected. I'd assumed the hard part would be handover mechanics, stopping two runners starting the same sprint, resuming cleanly mid-flight. That's a session lease and a checkpoint. Fiddly, but a solved problem.

The hard part was discovering how much of one provider I'd written into my own governance without ever deciding to. A rule saying &quot;send Graham an iMessage&quot; when the actual requirement is reaching me promptly on a channel I watch. A filesystem recovery procedure labelled as a Claude behaviour when it's a property of any sandbox that can't unlink files. Connector tool names sitting inside a document that's supposed to describe how a team operates.

Lock-in, it turns out, isn't an API problem. It accumulates in the instruction layer, one perfectly reasonable line at a time.

## A growth agent

Thirteen sprints ago I asked the team directly whose job it was to chase the traffic and conversion targets I'd set. The answer came back that it should be a growth agent's job, as though that were someone else's remit. I pushed back at the time and said no, the key results belong to the PM. I was right on paper and wrong in practice, because the PM never once proposed anything resembling acquisition work. Not SEO, not distribution, not getting the articles to link to the diagnostic. Fifteen sprints of careful accessibility fixes and not a single attempt to put a person in front of the product.

So I'm creating the role I refused to create. It owns traffic and it owns SEO, and nothing else.

## And a rule about shipping

The team must ship something of value. Not &quot;ship something&quot;. Something with a plausible claim on being worth a user's attention. It can't push paper around, log a decision, defer six signals and call that a sprint.

## What could go wrong with each of these

Daily cadence is three and a half times the token spend for seven times the chances that two sessions collide. That's not hypothetical. It's already happened once at twice weekly, when both scheduled runs fired simultaneously, read the same inputs and shipped the same fix twice in different words, neither knowing the other existed.

My own migration proposal says not to enable a second recurring schedule until the bidirectional handover drills have actually passed, and they haven't yet. So ChatGPT starts as manual takeover rather than a second timer. Two teams, one rota.

The growth agent inherits the same governing rule as everyone else, which requires a stated user problem and evidence before anything proceeds. Acquisition work is speculative by nature. There's a real chance I've just built a role that will spend its sprints deferring its own ideas for lack of proof.

There's also a measurement problem I've only just noticed. My funnel tables are weekly. At daily cadence each sprint's window overlaps the previous one by six days out of seven, and week-on-week comparison stops meaning very much. That needs decoupling and I haven't done it.

And the shipping rule might just produce faster paperwork with a deploy on the end of it.

## Why do it anyway

Because breaking something carefully is easier than making it produce, and I've been doing the easier thing for a while now. Every finding so far has been about where this fails. That's useful. It's also a slightly cowardly place to stop.

So in short, this is the last version of the fully automated idea that I'm prepared to fund. If a daily team, across two providers, with a dedicated growth role and an explicit obligation to ship, can't move a single number, then the answer isn't more automation and I'll stop pretending otherwise. I'll take control of the pipeline and run this as a human-led thing with agents underneath.

I'd rather find that out in three weeks than three months.
