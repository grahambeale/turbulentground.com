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

---

# Entry and consent simplification — design QA

- Entry: removed the repeated eyebrow while preserving the existing heading, explanatory copy and required fields.
- Privacy: the maintained privacy notice now opens in a large, scrollable modal without taking the participant away from the survey.
- Consent: removed the repeated privacy prompt, the “Before you start” heading and the explanatory paragraphs.
- Video: Graham's introduction is embedded at full content width and starts muted when the consent screen appears; controls and the complete transcript remain available.
- Profile: all radio choices now use a single vertical reading order, avoiding the previous left-to-right and top-to-bottom scan pattern.
- Visual check: entry hierarchy, modal legibility, consent spacing and the embedded player were inspected at a 1265 × 712 desktop viewport.
- Regression suite and whitespace checks: passed.

---

# Research journey review console — hosted-screen QA

## Finding and fix

- Finding: Vercel sends a frame-denial policy, so the live survey cannot render inside the review console's embedded frames. The console navigation and notes loaded, but the central screen area was blank.
- Fix: the walkthrough and gallery now use committed captures of all seven safe review states. Each stage also provides an **Open interactive screen** link, opening the real protected screen in a separate tab where Vercel permits it to run.

## Checks

- Every journey stage has a corresponding capture: passed.
- No iframe remains in the review console: passed.
- The safe interactive route remains available for every stage: passed.
- Review notes remain browser-local and are never submitted automatically: passed.

---

# Research journey UX review console — design QA

## Evidence

- Interactive walkthrough: `/private/tmp/tg-ux-review-package/ux-review-walkthrough.png`
- All-screens gallery: `/private/tmp/tg-ux-review-package/ux-review-gallery.png`
- Desktop browser viewport: 1265 × 712
- Visual source: the production research journey's existing typography, palette and screen components.

## Review coverage

The console exposes six distinct participant moments: combined welcome, identity and consent; research context; the question experience; the final question pair; the optional final comment and submission moment; and completion. Each preview uses the actual research page rather than a redrawn facsimile.

Walkthrough navigation, gallery-to-walkthrough navigation, safe synthetic stage loading, public/private completion controls and responsive layout were checked in the in-app browser. The complete automated test suite passed.

## Consolidated annotation pass — 28 September 2026

- Combined the public welcome, embedded introduction, identity fields, privacy access and consent choices into one opening step. The recorded consent is carried through the private-token redirect so public participants do not meet a duplicate consent screen.
- Matched the 720×1280 introduction video’s native 9:16 portrait ratio and rewrote the 14-day retention note to lead with flexibility and end with the privacy benefit.
- Kept the research-context choices in one vertical reading order.
- Increased the space between those choices from 8px to 12px so each option is easier to distinguish without materially lengthening the journey.
- Made the questionnaire progress indicator sticky below the navigation. Browser verification at the bottom of the question recorded `position: sticky` with its top edge held at 76px.
- Reduced completion to the single heading “Thank you”, a full embedded autoplay-muted video with transcript, and stacked actions.
- Matched the separate 720×1280 thank-you video to its native 9:16 portrait ratio as well.
- When an email is already held, the benchmark request panel is omitted and the comparison is requested automatically. When an address is missing, the participant sees one compact email field and “Send my comparison”; success replaces the panel with a confirmation.
- Kept the personal invitation link immediately visible, while moving public/private channel controls behind a “More ways to share” disclosure.

## Safety and annotation

Review mode suppresses analytics and prevents participant creation, checkpoint saves, page-hide saves, survey submission, result-email requests and preference writes. Notes are stored only in the reviewer's browser and can be downloaded as Markdown; they are not posted to Airtable or any API.

## Findings

The first review pass grouped the final pair and submission moment together. The browser comparison showed these are meaningfully different states, so the submission moment was added as a seventh stage. No actionable P0, P1 or P2 findings remain in the review console itself.

Final result: passed.

---

# Research completion screen — unified action canvas

## Reference and implementation

- Selected visual direction: `/Users/graham/.codex/generated_images/01a0458e-3900-7642-90ab-76448e63906d/exec-0d205bd5-94f6-4cb7-8dc7-7fd1999a6761.png`
- Initial browser implementation: `/private/tmp/tg-completion-redesign/completion-redesign-implementation.png`
- Revised browser implementation: `/private/tmp/tg-completion-redesign/completion-redesign-implementation-v2.png`
- Viewport: desktop in-app browser, 1265 × 712 capture
- State: synthetic completion preview with an email on file, a referral link available, and public sharing selected. No submission, analytics event, email or referral issuance occurs in this preview.

## Visual comparison

The completion experience is now one coherent page rather than a sequence of narrow stacked cards. The thank-you, supporting message and Graham's video form a centred hero. The two immediate actions — receive the benchmark and invite another participant — sit side by side beneath one dividing rule, preserving the selected direction's primary/secondary hierarchy.

The benchmark caveat appears once. Existing brand typography, palette, buttons and real sharing controls are retained rather than replaced with decorative mock controls.

## Required fidelity surfaces

- Fonts and typography: existing Cormorant Garamond and DM Sans hierarchy retained.
- Spacing and layout rhythm: desktop content expands to a balanced two-column canvas; mobile returns to a single column.
- Colors and visual tokens: existing ink, muted, border and orange tokens reused.
- Image and icon fidelity: Graham's real video thumbnail and the existing referral icons are preserved.
- Copy and content: the repeated benchmark caveat was removed and the saved-email explanation was shortened.

## Interaction and runtime checks

- Public sharing state renders with the referral link and social-sharing controls: passed.
- Private invitation state renders with optional name/email, editable message and private channels: passed.
- Completion preview suppresses Plausible events and does not call the referral issuance API: passed.
- Full automated test suite: passed.
- Diff whitespace validation: passed.

## Comparison history

- Initial finding: the first implementation retained a left-aligned completion heading and success mark, which drifted toward a different visual direction.
- Fix: centred the completion hero, removed the redundant success mark on this screen and moved feedback to the unobtrusive lower-left position.
- Revised evidence: `completion-redesign-implementation-v2.png`.

## Findings

No actionable P0, P1 or P2 differences remain. The normal 1265 × 712 desktop viewport shows the full hero and both next actions; the detailed sharing controls continue below the fold by design.

Final result: passed.

---

# Referral sharing tabs — design QA

## Reference and implementation

- Source visual truth: `/var/folders/nf/k_4g44qx6pn4k86dzz0s9ldw0000gp/T/codex-clipboard-a3718b12-a2d7-4525-bc81-ca363bd53418.png`
- Browser-rendered implementation: `/private/tmp/tg-phase31-activation/referral-tabs-private-implementation.jpg`
- Viewport: desktop in-app browser, 1265 × 712 capture
- Source pixels: 2030 × 1116; implementation pixels: 1265 × 712
- Normalisation: compared the same private-selected sharing region at each capture's native density; the source is a tighter crop, so judgement used component proportions and state rather than pixel-for-pixel page coordinates.
- State: private invitation selected; public and private switching also tested in the browser.

## Visual comparison

The existing palette, typography and layout are preserved. The old large rounded option buttons are replaced by a connected tab rail. The selected tab visually joins the content area through its open lower edge and shared background.

## Focused-region comparison evidence

Public uses the Material Symbols globe to convey one-to-many sharing; private uses the complementary Material Symbols person to convey a one-to-one invitation. Both icons loaded successfully. Selected, unselected and focusable radio states retain native accessible labels. Switching either radio shows the matching panel and hides the other.

## Required fidelity surfaces

- Fonts and typography: existing DM Sans and Cormorant Garamond hierarchy retained.
- Spacing and layout rhythm: compact connected tabs reduce the oversized button treatment without disturbing the card rhythm.
- Colors and visual tokens: existing background, border, ink, muted and orange tokens reused.
- Image and icon fidelity: no raster imagery is involved; icons come from Material Symbols.
- Copy and content: `Share publicly` remains; the tab shortens the private label to `Invite privately`, while the panel retains the full heading.

## Findings

No actionable P0, P1 or P2 differences remain for the requested refinement.

## Interaction and runtime checks

- Public → private switch: passed.
- Private → public switch: passed.
- Correct panel visibility: passed.
- Material Symbols font loaded: passed.
- Page reached `complete` with no visible runtime failure: passed.
- Existing synthetic sharing and integration tests: passed.

## Comparison history

- Initial finding: the modes read as independent large buttons rather than navigation between related panels.
- Fix: shared bottom rule, open-bottom selected tab, active top accent and complementary one-to-many/one-to-one icons.
- Post-fix evidence: `referral-tabs-private-implementation.jpg`.

## Follow-up polish

- P3: confirm label wrapping on a physical 320px-wide device during release verification.

Final result: passed.
