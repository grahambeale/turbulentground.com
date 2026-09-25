# Implementation review — contextual question examples

## Implemented

- All 24 optional paraphrases are replaced by the approved concrete examples.
- The disclosure label is **See an example** / **Hide example**.
- New responses use instrument V5; earlier instrument definitions remain
  frozen.
- Unfinished V4 journeys restore their original explanations and version.
- Submission, save/return, results rendering and benchmark selection recognise
  V5 while keeping versions separate.
- The rationale records the context amendment and its release boundary.

## Verification

- All research API and unit tests use synthetic data and pass.
- Full 24-statement desktop journey passes without browser errors.
- Mobile layout, progress animation, backward navigation and reduced motion
  pass browser verification.
- No participant data or email was used.

## Gate

Review the branch preview. Production requires Graham to approve the exact
commit separately.
