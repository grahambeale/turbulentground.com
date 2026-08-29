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

Final result: passed.
