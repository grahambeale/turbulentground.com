---
title: "I Finally Started Telling the Team Things. It Added Them to the Pile."
description: "Ten signals logged, four accepted (all narrowed), six deferred (every acquisition-shaped one)."
ogTitle: "I Finally Started Telling the Team Things. It Added Them to the Pile."
ogDescription: "Ten signals logged, four accepted (all narrowed), six deferred (every acquisition-shaped one)."
ogImage: "https://turbulentground.com/learnings/images/signals-added-to-the-pile.png"
heroImage: "/learnings/images/signals-added-to-the-pile.png"
heroAlt: "Illustration for I Finally Started Telling the Team Things. It Added Them to the Pile."
eyebrow: "The Experiment"
h1: "I Finally Started Telling the Team Things. It Added Them to the Pile."
bylineMeta: "Sprints 12&ndash;13"
slug: "signals-added-to-the-pile"
---
For eleven sprints I said nothing. From sprint twelve I started logging observations, not instructions, just things I'd noticed, in a file the team reads before it does its own thinking. It can accept, reject or defer each one, and it has to say why.

<div class="cold-open">
<p><strong>New here?</strong> This is one dispatch from an ongoing experiment: an AI product team running a live site with zero human intervention in the product decisions. <a href="/learnings/zero-humans-in-the-loop">Start with the premise</a> for the full setup before diving into this one.</p>
</div>

Sprint thirteen was the first sprint where that actually got tested. Ten signals, logged in one batch. Four accepted, six deferred, none rejected.

That sounds like a reasonable hit rate until you look at which four.

Every accepted signal was narrowed before it was acted on. And all six deferrals were the acquisition-shaped ones: distribution, getting articles to link to the diagnostic, anything that would put a person in front of the thing. The team's own log is blunt about the risk. Deferring isn't the same as scheduling, and nothing in the model guarantees a deferred signal ever gets picked up.

So my judgement reached the filter. The filter held. Same filter that had been quietly selecting for safe, provable work for eleven sprints. It just had more to filter now.

## Then two of them ran at once

The scheduled tasks fire twice a week, Sunday and Wednesday. On sprint thirteen, both fired concurrently against the same repository. Both independently worked out they were &quot;sprint thirteen&quot; from the state of the folder. Both read the same ten signals. Neither had any idea the other existed.

They shipped substantively the same fix, in different words, on different pages. One rewrote the homepage hero. One rewrote the diagnostic intro. Both correct. Both careful. Both live.

I cleared the locks and shipped them both, which in hindsight is its own small data point about who's actually running this.

But the thing that stayed with me afterwards wasn't the duplicated work. It was a question I couldn't answer. Were those two sessions even reading the same instructions?

They'd each derived &quot;sprint thirteen&quot; independently, from the folder, rather than from any shared authoritative record. Which meant nothing was telling them what sprint it was. They were both inferring it. And if that was true of something as basic as the sprint number, I had no particular reason to assume it wasn't true of everything else. The agent definitions. The process steps. The rules about what they're allowed to propose in the first place.

I noted it, felt vaguely uneasy, and moved on to the next sprint. I want to be honest that I didn't chase it at the time. What I eventually found when I did is a separate piece, and not a flattering one.

## What they both did, and neither did

They added copy. Neither removed any.

The site now carries three different descriptions of the same anonymity promise, simultaneously. The diagnostic says results are anonymous. The capture step says responses are grouped by work-email domain. The new copy says aggregated, company-level patterns. All three are live. All three are trying to say the same thing.

The Design agent actually spotted two of the three contradicting each other mid-sprint. It logged the tension as a content request rather than resolving it, correctly identifying that reconciling them needed judgement it didn't have a mandate to exercise. Then the parallel session made it a three-way problem.

Thirteen sprints in, I can't find a single instance of this team removing anything. Not a page, not a paragraph, not a claim. It has only ever added. And that's structurally predictable for exactly the same reason the ambition gap was: deletion can't be evidenced. &quot;Remove this sentence&quot; has no user problem behind it that a metric will prove. Addition is always defensible. Subtraction almost never is.

## Meanwhile, the actual data

I finally completed the funnel this week. Filled in the four steps that had never been written, reconstructed from the sprint logs.

Across eleven weeks: 55 homepage landings, 13 clicks through to the diagnostic, 3 people who started the survey, 3 who finished it, and zero genuine submissions.

Three started. Three finished. Nobody abandoned it partway.

The survey isn't too long. That was a hypothesis the Design agent proposed seven sprints running and had declined seven times. Almost nobody reaches it. The drop-off was never where thirteen sprints of careful work has been aimed.

## One more thing that didn't stick

The instruction to write those funnel rows weekly was there all along, in the description field of the table itself. Sprint twelve read that table carefully enough to extract two missing event names from it and build a whole sprint objective around them, and still didn't write a single row. Nothing in its actual mandate said it should.

Sprint thirteen picked it up, but only because sprint twelve's log recorded the base existing. The instruction had to take a lap through the project's own documentation before it became real work.

So: is this enough?

Honestly, I don't think so. Not yet.

Signals changed what the team notices. They didn't change what it's structurally permitted to propose. I can point at the three contradictory sentences all day. Nothing in the current rules lets anyone say &quot;delete two of these&quot; without a metric to justify it.

So in short, the problem isn't the volume of my input. It's the level. Feeding better inputs into an unchanged filter gets you better-informed safe work. What this probably needs is a change to the mandate itself: explicit permission to remove things, without needing to prove it first.

That's a different kind of intervention, and a more uncomfortable one, because it means admitting the thing I set up eleven sprints ago has a rule in it that was quietly wrong the whole time.
