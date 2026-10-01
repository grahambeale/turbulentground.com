# Phase 4 Release 3 — privacy content tabs amendment

**Revision:** 2  
**Prepared:** 1 October 2026  
**Airtable:** `FB-20261001-PHASE4-REL3-PRIVACY`  
**Authority:** Graham's direct preview correction on 1 October 2026

## Decision

The Release 3 privacy page's top-level contents control must be a genuine
in-place tab interface, not a set of links that requires readers to scroll
through the whole notice. Selecting a tab shows that major privacy section in
the same reading area and hides the other major sections.

## Requirements

- Use the existing referral-tab visual language.
- Keep one major privacy panel visible at a time.
- Support Left/Right, Home and End keyboard navigation with visible focus.
- Preserve stable URL fragments such as `#participation`; loading a fragment
  must activate the corresponding panel without scrolling through the page.
- Keep all panels available when JavaScript is unavailable and when printing.
- Do not change privacy wording, processing promises, consent, lawful bases,
  retention or routes.
- Avoid horizontal page overflow at 320 CSS pixels; the tab strip itself may
  scroll horizontally.

## Verification

- Assert correct tab, tablist and tabpanel relationships.
- Assert only the active panel is visible after enhancement.
- Verify direct loading of `/privacy#participation` and another section.
- Verify keyboard switching and focus.
- Verify print and no-JavaScript fallbacks retain the complete notice.
- Run the full repository test suite and publish a new preview only.

Production release remains a separate decision.
