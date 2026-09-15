# Survey journey evidence snapshot — revision 1

Captured 12 September 2026. Airtable and repository state were read before this
specification was drafted. No participant identity, token, response score or
verbatim feedback is copied into this repository artifact.

## Activation

Graham selected Airtable feedback `FB-20260911-TEVOGK` as the first Phase 3
OpenSpec pilot in the current Codex task. This authorises specification work
only. The Airtable record's existing `Graham's decision` remains `Pending`.

## Source record

- Base: `TurbulentGround Research` (`app7dKDinTjxczEfD`)
- Table: `Research Project Feedback` (`tbltQDAUZ8FF0ZDvA`)
- Record: `FB-20260911-TEVOGK` (`recXsGlAyZTEvogkV`)
- Received: 11 September 2026
- Source: retained in Airtable; the source field is blank
- Status at snapshot: `Awaiting approval`
- Graham's decision: `Pending`
- Release decision: `Pending`

The original comment reports that the bottom timeline appeared to contain only
a few questions and then seemed to restart. It also acknowledges that the
numeric questions-left count is present and describes the concern as minor.
That paraphrase is for planning; Airtable remains the verbatim source.

## Existing Airtable interpretation and proposal

The existing assessment identifies a comprehension risk: only a local group of
theme-labelled stations is visible, and the route is rebuilt as the respondent
moves, so a new group can look like a restart. It does not claim a submission
failure. The existing proposed solution suggests preserving the compact journey
metaphor while adding an overall-position cue and testing a small typographic cue
before changing animation. This specification tests and narrows that proposal;
it does not treat it as approved design.

## Current implementation evidence

Repository HEAD at inspection: `4b2244f3891acb8413fde767c1d02131d78d24c0`.

- `research/index.html` exposes a `progressbar` with `aria-valuemin="0"`,
  `aria-valuemax="24"`, numeric `aria-valuenow` and an `aria-valuetext` such as
  “24 questions left”. A visible questions-left count is updated on each answer.
- `updateProgress()` clears the journey route and renders
  `orderedStatements.slice(n)`. Completed stations disappear; remaining
  stations shift back to the start of the viewport. This directly supports the
  reported restart interpretation.
- Each remaining question is a station labelled with its domain/theme name.
  There are 24 statements arranged as 12 paired domains. Repeated adjacent
  theme labels may look like a small local sequence rather than twelve domains.
- Forward/back animations move the route by one station. A restrained mode and
  reduced-motion path remove or soften animation, so continuity cannot depend
  on motion alone.
- The journey is hidden on the final free-text screen. Existing tests require
  question-remaining language, removal of completed stations, theme-labelled
  stations, back navigation, reduced motion and no conventional progress bar.

## Related and contrary evidence

This is one feedback record. The visible numeric questions-left count is
contrary evidence against the strongest reading that total length is wholly
hidden. Existing automated checks show intended implementation structure, not
whether people correctly predict remaining sections. No duplicate feedback
record naming this exact restart behaviour was found in the 14-item queue.

Other feedback about questionnaire length and similar questions may increase
the cost of late surprise, but those records raise separate problems and are
not merged into this pilot. They remain independently reviewable in Airtable.

## Evidence limits and freshness

No moderated comprehension test, screen recording or aggregate abandonment
pattern was inspected. Do not claim that the indicator causes abandonment or
that the problem is widespread. Before any later design work, recheck the source
record, repository HEAD and related feedback. A material change requires a new
packet revision and renewed Graham review.
