---
title: "Seven Copies of the Rules, and I Made Every One of Them"
description: "The orchestration prompt existed in seven divergent copies across iCloud, Documents, a frozen upload, a sandbox cache, a stale knowledge base, and the webs"
ogTitle: "Seven Copies of the Rules, and I Made Every One of Them"
ogDescription: "The orchestration prompt existed in seven divergent copies across iCloud, Documents, a frozen upload, a sandbox cache, a stale knowledge base, and the webs"
ogImage: "https://turbulentground.com/learnings/images/seven-copies-of-the-rules.png"
heroImage: "/learnings/images/seven-copies-of-the-rules.png"
heroAlt: "Illustration for Seven Copies of the Rules, and I Made Every One of Them"
eyebrow: "The Experiment"
h1: "Seven Copies of the Rules, and I Made Every One of Them"
bylineMeta: "Sprints 12&ndash;15"
slug: "seven-copies-of-the-rules"
---
I only found this because I went on holiday.

<div class="cold-open">
<p><strong>New here?</strong> This is one dispatch from an ongoing experiment: an AI product team running a live site with zero human intervention in the product decisions. <a href="/learnings/zero-humans-in-the-loop">Start with the premise</a> for the full setup before diving into this one.</p>
</div>

What actually happened is that I stopped for a week and admitted to myself that I'd lost confidence in the output. Not that it was wrong, exactly. I just couldn't tell you why any given sprint had produced what it produced, and I'd stopped being able to predict what the next one would do. That's an uncomfortable thing to notice about a system you built.

So I came back wanting to assert some structure, to establish boundaries, and to understand in far more detail what was actually happening. And within a couple of hours the cause was obvious. It was me. I'd created seven copies of the file that tells the team how to operate, across seven different places, and never decided which one was real.

I want to write this up properly because it's the least sophisticated failure in this whole experiment, and probably the most useful.

## What I'd actually built

The orchestration prompt defines everything: what each agent does, how a sprint runs, where files live. By sprint twelve it existed in two iCloud folders, a Documents folder, a frozen upload inside the Cowork project, a sandbox cache, a stale knowledge base attached to the Claude project, and a CLAUDE.md in the website repo.

Seven versions, all slightly different, none of them authoritative. Each session read whichever one it could reach.

I didn't decide to do this. It accumulated. Every time I improved something I improved it wherever I happened to be working, and every tool that touched the project made its own copy for its own sensible reasons. I never stopped to ask which one was in charge, because it hadn't occurred to me that it mattered.

## The damage, as far as I can reconstruct it

At one point I rebuilt the prompt from what I believed was the current version. It wasn't. Two whole steps disappeared, the KR status log and the content requests queue, and I didn't spot it. They were eventually recovered by reading the output those steps used to produce and working backwards to the instruction that must have created it.

The file locations section pointed at a path that doesn't exist. Misspelled, with a stray space in it. I have no idea how many sprints wrote their logs somewhere I never looked.

In sprint fifteen a session found its own task instructions truncated. The file stopped mid-sentence, and the description at the top claimed a broader scope than the body actually contained. It had to fall back on a clause in a different document to work out what it was supposed to be doing that day.

None of that is the agent's fault. Every one of those sessions did exactly what it was told. The instruction just wasn't what I thought I'd written.

## It took me three goes to fix it

I tried a private GitHub repo as the single source of truth. It connected as searchable context rather than a mounted folder, so the scheduled tasks couldn't read it as files. I tried iCloud. Also no.

What worked was putting the experiment's files inside the website repository, because that's the only thing the tasks reliably mount. The rules now live inside the product they govern, which I'm not sure is elegant or just the thing that happened to work.

The prompt went from version 3.0 to 3.8 in about a week. Most of those revisions were fixing something the previous one broke.

## The bit I found hardest to sit with

Sprint fourteen discovered that a claim we'd all been treating as established fact was simply wrong. The diagnostic does not gate your results behind email verification. It never has. Results render the moment you finish, unconditionally.

That error had spread into the KR status file, an Airtable field description, the signals file, and live copy on the homepage that I personally wrote and shipped, to fix a contradiction that didn't exist.

The team logged it as the ninth instance of a pattern this project keeps finding, a claim repeated as fact and never re-checked, and noted it was the first one entirely self-inflicted. Nothing external caused it. Somebody wrote it down, everyone believed the note, and we built on top of it.

That's what seven versions of the rules gets you. When nothing is authoritative, something becomes true just by being written somewhere and not contradicted.

## Why it took a break to see it

I've been running this twice a week since sprint five. Every session I'm inside it, reading a log, fixing a file, checking a deploy, writing the next thing. When results looked inconsistent, I looked at the sprint that produced them. Never at the setup underneath.

A week away broke that, but not because I came back refreshed with a clear head. I came back uneasy. The honest version is that I'd been carrying a low-level lack of confidence in the whole thing for a while and hadn't stopped long enough to name it. Once I did, the instinct wasn't curiosity, it was control. I wanted to know exactly where every file lived, exactly what each session was reading, exactly what the boundaries were. Less &quot;let me investigate this interesting problem&quot; and more &quot;I don't trust this and I need to see all of it.&quot;

That impulse is what found the seven copies. Not insight. Just finally going and looking at everything, because I no longer believed the parts I hadn't checked.

There's an uncomfortable symmetry here I've been circling for a few posts. The pattern this team keeps hitting is that it investigates the specific thing in front of it carefully and doesn't step back to ask the structural question underneath. That's exactly what I'd been doing. Nine or ten sprints of examining individual outputs, and not once did I ask whether the instructions producing them were even the ones I'd written.

I've been describing that as a limitation of AI teams. It plainly isn't. It's what happens to anyone with their head down in a system they're also responsible for maintaining. What broke it for me wasn't a better process. It was stopping long enough to notice I didn't trust my own experiment.

## What I take from it

I've been writing for a while about whether the judgement I put into this system survives. This is the same question one layer further down, and I hadn't thought to ask it. Does the instruction the agent reads even match the one I wrote?

For four sprints, sometimes it didn't. There was nothing in place that would have told me.

I suspect I'm not unusual here. If you're running agents anywhere real, you'll have instructions in a prompt, a version in a wiki, a copy in someone's notes, a fork in a tool's own config. The agents will follow all of them, carefully. It doesn't announce itself as a failure. It produces confident work that quietly diverges, and you find out when two sessions disagree and you go looking for why.

I've put the boring fix in now. One file, one location, everything reads from it, and a check at the start of each session that the copy it's holding is the current one.

What still bothers me is that before this, if you'd asked whether I had a single source of truth, I'd have said yes without hesitating. I'd have pointed at a file. I just couldn't have told you which of the seven I meant.
