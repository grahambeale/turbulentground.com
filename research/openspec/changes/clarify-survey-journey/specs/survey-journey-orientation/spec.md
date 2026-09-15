# Survey journey orientation — specification revision 2

Status: Draft for Graham. Requirements are proposed acceptance terms, not
claims about achieved behaviour.

## Purpose

Help participants understand their position and remaining journey throughout
the questionnaire, especially when the visible route crosses between paired
domains, without altering the research instrument.

## Users and context

Invited research participants completing 24 statements on mobile or desktop,
including people using zoom, reduced motion or assistive technology. The risk is
most visible after several questions, when completed stations have disappeared
and the remaining route occupies the start of the viewport again.

## Evidence

One Airtable feedback record reports a perceived restart. Current code explains
how that perception can arise. The numeric questions-left count is already
present and accurate. See `evidence-snapshot.md` for provenance and limits.

## Interpretation

Exact remaining-question count and whole-journey orientation are different
messages. The current indicator provides the first but may not provide the
second. A continuous cue might help, but no particular grouping, label, map,
bar, animation or percentage is yet approved.

## Desired outcome

A participant can tell that the questionnaire is one continuing journey, can
estimate its remaining extent well enough to avoid a false “nearly finished”
expectation, and receives consistent progress meaning across visual and
accessible representations.

## Requirements

1. The experience must communicate both exact questions remaining and position
   within the complete questionnaire.
2. Crossing from one paired domain to another must read as continued progress,
   not a reset to the beginning.
3. Forward and Back navigation must preserve a coherent overall-position cue.
4. Progress meaning must not rely on animation, colour, spatial position or
   hidden off-screen content alone.
5. The accessible progressbar's current value, maximum and human-readable text
   must remain accurate and agree with the visible cue.
6. The clarification must work at mobile and desktop widths, 200% text zoom,
   320 CSS-pixel reflow and reduced-motion preference without obscuring the
   question or answer controls.
7. The final statement must have a clear ending; the final optional comment
   screen must not imply that scored questions remain.
8. The approach must be reusable across all 12 paired domains and must derive
   progress from the existing ordered-statement data rather than duplicate the
   questionnaire structure manually.

## Constraints

- Preserve all 24 statement wordings, order, pair structure, answer options,
  scoring and completion floor.
- The structural design option may present both statements of a pair together.
  Preserve their stored order and individual answers. Distinguish 24 statements
  from 12 pair screens if this option is chosen; never label screens as questions.
- Preserve save/resume and Back behaviour. A resumed participant must see the
  same correct overall position.
- Do not expose response counts, participant data or cohort progress.
- Do not add a paid service, external dependency or participant-data field.
- Maintain the existing research privacy commitments and WCAG 2.2 AA floor.
- Keep the intervention within the participant questionnaire journey. Invitation,
  consent, context, results and email surfaces are outside scope.
- Do not release from this pilot without the separate implementation and release
  approvals required by `research/agent-workflow.md`.

## Assumptions

- A1: The perceived restart comes primarily from the route window rebuilding,
  rather than from the question transition or page layout.
- A2: Whole-journey orientation can improve without making the footer visually
  dominant or increasing perceived burden.
- A3: Participants understand “questions left”; the missing information is
  continuity and larger structure.
- A4: A small number of representative comprehension checks can select a design
  for this pilot, while remaining insufficient to claim a population effect.

## Graham's direction and remaining unknowns

Graham selected “Approved with changes” in Airtable. He permits other progress
metaphors, requests a minimal-copy versus structural comparison, suggests putting
each pair together on one screen, and accepts his own comprehension review for
this pilot. These directions inform revision 2; no design has begun.

- U1: Does a clearer cue resolve the perceived restart? Check the baseline and
  later options with Graham rather than assume an improvement.
- U2: Does presenting pairs together clarify their difference without crowding
  mobile screens or confusing saved progress? Evaluate in the structural option.
- U3: Which progress metaphor works best? No particular replacement is selected.
- U4: Graham found some acceptance wording unclear. The plain-language criteria
  below and the paired-screen scope require his confirmation at G1.

## Non-goals

Reducing the number of questions; changing similar question wording; changing
the transition animation for delight; redesigning answer controls; altering
scoring or results; conversion optimisation; solving every survey-length concern;
  automatically approving or releasing a solution. Presenting pairs together is
  an option to evaluate, not a commitment to replace the current presentation.

## Acceptance criteria

In plain language: Graham approves this revision first, then compares the current
journey with clearer copy and a structural option. He should be able to tell where
he is and how much remains, including across pair boundaries. Counts must agree
for sighted and screen-reader users, after Back and resume. Phones, enlarged text
and reduced motion must remain usable. All 24 statements, individual answers and
scoring stay the same. Later technical checks establish those details; Graham
records whether specifying first helped. The criteria below give those checks.

- AC1: Before any design artifact or prototype exists, Graham explicitly approves
  this exact packet or supplies revisions; the decision and packet digest are
  recorded and pass `check-gate.py`.
- AC2: In a baseline-versus-prototype review at the first statement, immediately
  before a domain boundary and immediately after it, reviewers can state that
  more of the same questionnaire remains and give an estimate consistent with
  the visible overall cue. Answers and uncertainty are recorded rather than
  converted into a fabricated success percentage.
- AC3: The visible cue and accessible progress text agree at statement indices
  0, 1, a domain boundary, 23 and 24, after forward navigation, Back navigation
  and restored saved progress.
- AC4: At mobile and desktop widths, 200% text zoom and 320 CSS-pixel reflow,
  progress remains readable without covering or crowding the active question or
  answer controls. Reduced-motion mode retains the same meaning.
- AC5: Existing research journey tests continue to pass or are changed only
  where the approved specification intentionally changes behaviour. Targeted
  checks cover whole-journey orientation, boundary continuity, Back, resume,
  final statement and final free-text state.
- AC6: No question, answer, score, completion-floor, consent, save/resume payload,
  participant data or analytics meaning changes.
- AC7: The pilot retains this original specification, Graham's revisions, the
  approved version, design deviations, rework and the later verdict: Held, Did
  not hold, Inconclusive or Superseded. Graham records whether specifying first
  improved the work and why.

## ADDED Requirements

### Requirement: Whole-journey orientation
The questionnaire SHALL communicate the participant's position within the
complete question journey alongside the exact questions-remaining count.

#### Scenario: Participant crosses a paired-domain boundary
- **WHEN** a participant answers the final statement in one paired domain and
  advances to the next
- **THEN** the visible and accessible progress cues continue forward and do not
  present the new domain as a return to the start.

### Requirement: Navigation-consistent progress
The questionnaire SHALL derive its whole-journey position from the existing
ordered statement state during forward, Back and restored-session flows.

#### Scenario: Participant returns to an earlier statement
- **WHEN** a participant uses Back after advancing across a domain boundary
- **THEN** the overall-position cue reverses to the matching earlier state while
  the questions-left count and accessible values remain consistent.

### Requirement: Modality-independent meaning
The questionnaire SHALL convey journey continuity without depending on motion,
colour or spatial position alone.

#### Scenario: Participant prefers reduced motion
- **WHEN** reduced motion is active and route animations are removed
- **THEN** the participant receives the same whole-journey position and remaining
  question meaning as someone using the animated presentation.
