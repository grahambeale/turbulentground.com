# Clarify the survey journey — proposal revision 2

Status: **READY FOR GRAHAM'S SPECIFICATION REVIEW — DESIGN BLOCKED**

## Why

A participant could see the journey indicator's changing local window as a
short sequence that restarts, despite an accurate questions-left count. The
current implementation removes completed stations and resets the remaining
route to the start of its viewport, so the interpretation is plausible.

## Evidence

See `evidence-snapshot.md`. The evidence is one Airtable feedback record plus
direct implementation inspection. It identifies a comprehension risk, not a
measured completion or trust effect.

## Interpretation

The experience communicates exact question count but may not communicate its
larger structure or continuous position through the study. The likely gap is
orientation: “Where am I in the whole journey?” The solution could be copy,
structure, visual treatment or a combination. The existing suggestion “Theme 2
of 6” is not carried forward as a fact: the instrument has 12 paired domains,
and choosing a higher-level grouping would itself be a design/content decision.

## Desired outcome

Before starting and while crossing a domain boundary, a participant can form a
reasonably accurate expectation of how much of the questionnaire remains and
understands that the route is continuing rather than restarting. This should
work visually, with reduced motion and through the accessible progress name.

## What changes

Graham's Airtable review permits other progress metaphors and requests a comparison
of a minimal copy option with a structural option. The structural option may show
the two statements of each pair on one screen to make their distinction clearer.
This expands presentation scope, not question content or scoring.

After G1, explore the smallest coherent clarification to the existing journey
indicator. Preserve the questions-left count and research instrument. Capture
the current baseline before choosing a design. Do not prototype within this
specification stage.

## Capabilities

- New capability: `survey-journey-orientation`
- Modified capabilities: none; no prior OpenSpec capability inventory exists.

## Impact

Potential later surfaces are the journey markup, styles and progress update
logic in `research/index.html`, plus focused journey tests. Question wording,
answer data, scoring, saved progress, consent and emails are outside scope.

## Review gate

Graham reviews `review.md` and the specification. Approval of revision 2 is a
distinct decision after this packet exists. No design, prototype,
implementation, preview or release is authorised by this proposal.
