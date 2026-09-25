# Replace question paraphrases with concrete examples — Revision 2

## Outcome

Replace the optional explanatory copy beneath all 24 research statements with
the exact examples Graham approved. Label the disclosure **See an example**.

## Invariants

- Do not change statement wording, order, response scale or storage mappings.
- Record new responses as `phase3-v5-2026-09-25-examples` because explanatory
  context can affect interpretation.
- Keep V5 benchmarks separate from earlier versions.
- Resume unfinished V4 responses with the original V4 explanations and V4
  version stamp.
- Render emailed results using the wording and version the participant
  completed.
- Preserve optional answer context, accessibility and reduced-motion behaviour.

## Acceptance criteria

- Every statement has one approved concrete example.
- The disclosure reads **See an example** / **Hide example** for V5.
- V4 and V5 submissions are both accepted but cannot be mixed within one saved
  response.
- V4 and V5 results and benchmark cohorts remain version-specific.
- Synthetic API and browser tests cover full completion, save/resume, results,
  desktop, mobile and reduced motion.
- A reviewable preview is supplied before any production release.

## Non-goals

Changing questions, scores, response options, benchmark thresholds, consent,
participant recruitment or production without a separate release approval.
