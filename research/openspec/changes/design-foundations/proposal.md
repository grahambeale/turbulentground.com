# Design foundations: shared tokens and body type scale

**Revision:** 1
**Prepared:** 1 October 2026
**Airtable:** not yet created (intake required before implementation)
**Status:** Proposed. Awaiting Graham's approval of this exact packet.
**Evidence:** `design-system/2026-10-01-token-audit.md` (claude.ai project), audit of `main` at `ab7156b`

## Problem (observed)

- Running text on the public site uses 36 distinct size, weight and
  line-height combinations: 10 sizes (11 to 23px), 3 weights, 7 line-heights.
- The same role renders at different sizes on different pages. Card
  descriptions are 14px (about, learnings), 15px (writing) and 16px (home).
- The root font size is set in px and differs by page: 15px (learnings),
  16px (browser default on home, about, writing), 17px (both privacy notices),
  18px (participation runtime). Every rem value therefore means something
  different per page, and a px root ignores the visitor's browser text-size
  setting.
- Each page carries its own `:root`. The homepage has forked the palette
  (`--bg #0b0907`, `--ink #efe5d3`, `--muted #a8977f`) from the rest
  (`#131110`, `#e8dcc8`, `#9e8e7c`). Partials already code around the drift
  with fallback chains such as `var(--ink, var(--cream, #efe5d3))`.
- Two body typefaces (DM Sans, Outfit) and two heading typefaces (Cormorant
  Garamond, DM Serif Display) are in use.
- 982 raw colour literals sit outside token definitions.

## Accessibility findings raised by the audit

These are accountability issues, not taste, and should not wait for the full
migration.

1. **Selected answer on mobile:** `.scale-btn[aria-pressed="true"]` in the
   participation runtime is white on `--orange` (3.94:1) at 1.2rem / 500 on
   the mobile breakpoint. That is normal-size text under WCAG, so it needs
   4.5:1. `--orange-btn` (`#b84215`) gives 5.49:1.
2. **Skip link:** `.skip-link` on the homepage is white on `--orange`
   (3.94:1) at body size. Same fix.
3. **Body weight 300 on dark backgrounds** at 13 to 16px on marketing pages.
   Ratios pass, but thin strokes reduce legibility in practice.
4. **px root font size** on five page families overrides user text-size
   preferences.

## Decisions stated by Graham (Claude session, 1 October 2026)

Recorded as inputs to this packet. They are not an approval of the packet.

| Question | Decision |
|---|---|
| Body text weight | 400 everywhere |
| Body text size | 17px |
| Display typeface | Cormorant Garamond sitewide |
| Homepage palette fork | Adopt sitewide |

Not yet decided: whether Care Capital and the diagnostic move from Outfit to
DM Sans now or are left until their evidence-led retirement (Phase 4 says
"unpromoted before any evidence-led retirement").

## Proposed solution

One shared stylesheet, `styles/tokens.css`, linked before each page's inline
styles, holding colour (dark default plus a `[data-theme="light"]` set for the
privacy notices), typography roles, spacing and radius. Pages stop defining
their own `:root` and stop setting a px root font size. Migration runs page
family by page family, starting with the learnings article template.

Body roles replacing the 36 current combinations:

| Role | Size | Line-height | Weight |
|---|---|---|---|
| Lead | 18 to 20px fluid | 1.55 | 400 |
| Body | 16 to 17px fluid | 1.7 | 400 |
| Small | 15px | 1.6 | 400 |
| Meta | 13px | 1.5 | 400 |

## Affected people

All site visitors; participants in the survey runtime (type changes only,
no wording, scoring or flow change); the agent team, who will be constrained
to tokens.

## Explicitly out of scope

- copy, questionnaire wording, scoring, consent and privacy policy text;
- layout and composition changes beyond type and colour values;
- the Writing page (being retired under Phase 4);
- routes, APIs and the Release 2 shell;
- a build-system migration (Eleventy or similar); a separate proposal.

## Sequencing

Release 2 (route and shell cutover) is approved and touches
`research/index.html` and the participation shell. To avoid conflicting
edits, this change:

1. ships the token file and the learnings template first (no Release 2
   overlap);
2. fixes the two contrast failures as a small separate item, which can go
   inside or after Release 2 by agreement;
3. migrates the participation runtime only after Release 2 is released.

## Rollback

Each page family migrates in its own commit. Reverting the commit restores
that page's inline `:root` and sizes. `tokens.css` is inert for any page that
does not link it.
