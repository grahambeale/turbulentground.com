# Survey journey — design comparison

## Gate evidence
Revision 2 approved in Airtable; exact published packet verified through the
authenticated connector on 12 September 2026 at 23:02:58 UTC. Local approval
record checks pass. Graham authorised this connector verification directly.
This is a design proposal, not a prototype or release approval.

## Baseline
The current journey removes completed route stations and returns the route
viewport to its start. A correct questions-left count is present, but the route
can appear to restart. Evidence is one feedback record, not a measured effect.

## Option A — clearer copy, current question presentation
Keep one statement per screen. Add a persistent whole-survey text cue above the
answer area, such as “Statement 7 of 24”, with “17 statements after this one”.
The footer route is secondary. The whole-survey cue remains present across pair
boundaries, Back and resume. Do not call the current statement completed until
it is answered. On the optional comment screen, show “Statements complete —
optional comment”. This isolates whether explicit continuity language helps.

## Option B — pairs together, stable overall progress
Show the two existing statements for a domain together, with separate answer
controls and their original wording/order. Use a stable whole-survey bar and
text such as “Pair 4 of 12 · statements 7–8 of 24”. Label remaining statements
from actual answer state, rather than infer them from screen count. Continue
requires both answers. Back returns to the previous pair with answers retained;
resume restores a partially answered pair. Mobile stacks the two statements.
Do not show both as answered merely because the participant visited the pair.
This tests Graham's hypothesis that pairing makes their distinction clearer.
The visual metaphor may change; a stable bar is proposed, not selected.

## Requirements and tradeoffs
Both options address whole-journey orientation, accessible count agreement,
Back/resume and a clear ending. A is smaller and preserves the current answering
rhythm. B exposes the pairs but adds mobile height and more complex navigation.
Neither changes statement wording, answer options, scoring or stored responses.
A pair-level screen-reader cue must distinguish screen position from individual
statement completion. Maintain focus order and an understandable error if one
answer is missing; never erase a saved answer during pair navigation.

## Evaluation with Graham
Compare the baseline, A and B at the start, across a pair boundary and near the
end. Ask: Where are you? How much remains? Did anything appear to restart? For
B, also ask whether putting the pair together clarifies the difference, and
whether answering feels crowded or tiring. Record observations and uncertainty.
Later technical checks cover mobile, zoom, reduced motion, accessible text,
partial-pair resume, Back and final optional comments.

## Next decision
Graham approved comparing both approaches. Spec approval authorises design and
comparison prototypes without another approach approval. Graham now reviews the
resulting prototypes to choose an implementation direction or redirect the work.
Keep the approved spec intact; material departures return to specification
review. No questionnaire code, prototype, implementation tasks or deployment
was produced in the original design step.

## Prototype handoff

### 13 September approved question amendment
The exact approved questions in rationale v1.1 supersede the copy-review draft.
The paired prototype is now `outputs/approved-paired-survey.html`, with updated
draft explanations and paired layout selected by default. Statement wording is
approved; explanations are proposed for review. The original comparison and
revision-2 packet are retained as history. See `approved-question-amendment.md`
for the actual approval source and `version-safe-implementation-proposal.md` for
additional decisions not covered by question approval. Browser checks include
exact approved wording and a complete 12-pair journey as well as navigation,
partial resume, counts and reflow. Production and release remain unchanged.

Both interactive options are delivered in the task's `outputs/survey-comparison.html`.
The prototype copies all 24 current statement wordings and individual answer
fields; it has no study submission, analytics, network dependency or scoring.
Demo answers and saved positions stay in browser-tab memory.

Code inspection identified a limitation in revision 2: the live survey deliberately
interleaves first statements across 12 domains, then second statements. B changes
that presentation order; preserving stored answer identities is not the same as
preserving presentation order. B is exploratory. Before implementing it, revise
the instrument/order constraint with Graham and assess the methodological effect.
A preserves the existing two-pass order. Neither prototype changes the live survey.

Browser checks passed for answer guards, A forward/Back, B partial-pair save/resume,
answered counts, optional-comment ending and 320px reflow; no browser errors.
This is not evidence that participant comprehension has improved. Graham's
comparison remains the next step, followed by separate implementation/release gates.
