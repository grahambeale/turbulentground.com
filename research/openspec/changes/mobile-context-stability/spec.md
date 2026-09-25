# Mobile context stability

**Feedback:** FB-20260924-VN72QC
**Scope:** preview implementation only

## Problem

Selecting an answer currently reveals and focuses its optional textarea. On a
mobile browser, that can open the software keyboard and change the viewport even
when the participant did not intend to add context.

## Approved interaction

1. **Add context to your answer (optional)** is persistently visible before and
   after answer selection, so selecting a score introduces no vertical change.
2. The textarea remains collapsed and receives no focus.
3. Activating that persistent control opens the textarea and moves focus into it.
4. Existing context is preserved across Back and Continue.
5. Context remains optional and Continue depends only on both statements having
   an answer.

## Constraints

- Do not change question wording, scores, stored context keys or consent.
- Preserve reduced-motion, keyboard and screen-reader behaviour.
- Do not release without separate production approval.

## Acceptance criteria

- Answer selection does not add, remove or focus a control, move the page, or
  open the mobile keyboard.
- The field opens only after explicit activation.
- Existing context survives navigation and save-and-return.
- The paired journey remains usable at 320 CSS pixels without horizontal
  overflow or a score-triggered scroll jump.
