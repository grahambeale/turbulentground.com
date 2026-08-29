# Survey journey visual QA

## Reference and implementation

- Selected reference: `/Users/graham/.codex/generated_images/01a0458e-3900-7642-90ab-76448e63906d/exec-06f83da2-9202-4767-8e11-dc7646730a44.png`
- Reference dimensions: 1487 × 1058, normalised to 1440 × 1024 for comparison
- Implementation capture: `/private/tmp/tg-journey-desktop.png`
- Implementation viewport: 1440 × 1024 CSS pixels at 1× pixel density
- Tested state: first survey question, 24 questions left
- Full-page comparison: `/private/tmp/tg-journey-comparison.png`
- Focused footer comparison: `/private/tmp/tg-journey-footer-comparison.png`

## Visual comparison

The implementation retains the selected reference's quiet Underground-map character: a cream route line, small outlined stations, editorial theme labels, one orange current station, a questions-left count, and a low-impact footer position. The existing Turbulent Ground typography, question layout, answer controls, and colour tokens remain unchanged.

Two intentional differences improve accuracy:

- The reference concept showed 12 stations while also saying 23 questions remained. The implementation represents all 24 questions so every answer removes one real station.
- The implementation keeps the production survey's existing main content proportions rather than adopting the concept image's enlarged question area.

No visible P0, P1, or P2 issues remain. Theme labels and stations are legible at desktop and mobile widths, the footer remains inside the viewport, and the page does not introduce horizontal body overflow.

## Interaction QA

- Initial state: 24 stations and “24 questions left”.
- Answering a question immediately changes the count to 23, triggers the departing-station state, then removes the completed node.
- After the transition, the next theme becomes current and 23 stations remain.
- Back restores the previous question, its node, and the count of 24.
- The completion animation uses 12 icon-library fragments plus an expanding station ring.
- Reduced-motion users receive a short, non-animated transition.
- The progress component exposes `progressbar`, numeric progress, and a questions-left text alternative.
- Desktop verification: 1440 × 1024.
- Mobile verification: 390 × 844, with no horizontal body overflow and the footer fully visible.
- Browser console errors: none.

## Comparison history

The first implementation updated the remaining count only after the transition and used a subtler burst. It was revised so the count changes as soon as an answer is chosen and the station departure now has a clearer 12-fragment explosion. The final desktop and footer comparison captures reflect the revised version.

### Route endpoint and final input refinement

- User source captures:
  - `/var/folders/nf/k_4g44qx6pn4k86dzz0s9ldw0000gp/T/codex-clipboard-100f25a2-d126-449a-a9b6-bab54d7a2ec7.png`
  - `/var/folders/nf/k_4g44qx6pn4k86dzz0s9ldw0000gp/T/codex-clipboard-7869f37e-e0f5-472e-aaa6-d1516fb311c8.png`
- Revised implementation captures:
  - `/private/tmp/tg-journey-one-left.png`, 1265 × 712 at a 1265 × 712 CSS viewport and 1× density
  - `/private/tmp/tg-journey-final-input.png`, 1265 × 712 at a 1265 × 712 CSS viewport and 1× density
- Focused comparison: `/private/tmp/tg-journey-line-end-comparison.png`
- Final-screen comparison: `/private/tmp/tg-journey-final-screen-comparison.png`

The earlier route retained a full-width line after its final visible station, which weakened the proximity-to-completion signal. The route now sizes to its remaining stations and terminates at the final node. Verified states include six stations remaining and one station remaining. On the final free-text screen, the route and count are hidden completely, while Back and Submit remain visible at opposite edges of the footer.

Fonts and typography, spacing and layout rhythm, colour tokens, icon quality, and copy remain consistent with the selected visual direction and the existing survey. No new image assets were required. No P0, P1, or P2 findings remain. Browser console errors: none.

Final result: passed.
