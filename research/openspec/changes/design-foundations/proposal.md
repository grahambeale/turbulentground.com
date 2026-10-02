# Design foundations: shared tokens and body type scale

**Revision:** 2
**Prepared:** 1 October 2026 (revision 2 adds theme-ready requirements, same day)
**Amended:** 2 October 2026, by Claude taking over from Codex. Three changes
only, none touching the requirements: the Airtable link below, the open
conflict about DM Serif Display, and the step 1 patch rebased onto current
`main`. Graham approves the packet as it stands on this branch.
**Airtable:** `FB-20261002-DESIGN-FOUNDATIONS` (intake created 2 October 2026,
Graham's decision: Pending)
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
| Light mode | Build the token system theme-ready now; do not ship a light mode. Can be dropped later. |

Not yet decided: whether Care Capital and the diagnostic move from Outfit to
DM Sans now or are left until their evidence-led retirement (Phase 4 says
"unpromoted before any evidence-led retirement").

## Open conflict: the homepage uses DM Serif Display

Added 2 October 2026. Graham's decision is "Cormorant Garamond sitewide" as the
only display typeface. The homepage does not currently follow it, and the
packet cannot be approved as consistent until this is settled.

Evidence, from `main` at `ed4b349`:

- `index.html` line 167 sets every `h1` and `h2` on the homepage in DM Serif
  Display (`h1, h2 { font-family:'DM Serif Display',serif; ... }`), and the
  homepage requests that font from Google Fonts. It is the only page whose
  page headings use it.
- A search of every HTML page, stylesheet and partial on `main` finds DM Serif
  Display nowhere else as a page-heading font. On every other page it appears
  only inside the shared feedback dialog (`.tg-dialog__title`, from
  `partials/feedback.css` and `research/feedback-widget.css`), where
  Cormorant Garamond is already listed as the fallback. The learnings
  template sets its headings in Cormorant Garamond. Other pages' headings
  were not otherwise audited for this note.
- `styles/tokens.css` sets `--font-display` to Cormorant Garamond, so
  migrating the homepage as written would change its headings.
- The homepage is also the source of the palette Graham chose to adopt
  sitewide, so its typography is part of the look he was reacting to.

Options for Graham (no recommendation is made on taste; each needs its own
decision):

1. **Follow the decision.** Move the homepage headings and the feedback dialog
   title to Cormorant Garamond when the homepage is migrated. This visibly
   changes the flagship page, so it needs its own preview and approval.
2. **Record a deliberate exception.** Keep DM Serif Display for homepage
   headings only, add it to the token file as a second display token, and
   amend the decision to "Cormorant Garamond everywhere except the homepage".
   This weakens the "one display typeface" target (1 display typeface in
   `tasks.md`, "Done when").
3. **Revisit the decision.** Choose DM Serif Display as the single display
   typeface instead. This changes every article and page heading.

Until Graham chooses, nothing in this packet changes the homepage.

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

## Theme-ready requirements (revision 2)

The site stays dark by default. These requirements keep a future light mode
to a second set of token values rather than a second migration.

1. **Semantic names.** Tokens describe a job (`--on-accent`, `--accent-glow`,
   `--bg-translucent`, `--scrim`), not a colour.
2. **No raw colour in page CSS**, including translucent `rgba()` variants of
   cream, orange and black. These map to `--overlay-1/2`, `--accent-tint`,
   `--accent-glow`, `--accent-shadow`, `--scrim` and `--border-emphasis`.
   Layered and gradient backgrounds are covered by this rule.
3. **Every colour token has a light value** in `[data-theme="light"]`.
4. **Automated check for both themes:** `scripts/audit/check-contrast.mjs`
   fails the build if a colour token lacks a light value or any required
   text, button, focus or accent pair falls below WCAG 2.2 AA in either
   theme. Current result: 44 of 44 checks pass, 23 colour tokens.
5. **`color-scheme`** is declared per theme so form controls and scrollbars
   follow it.

Exceptions allowed in page CSS: SVG fills inside the logo, and pure
black/white alpha values used only in `mask-image` gradients.

## Affected people

All site visitors; participants in the survey runtime (type changes only,
no wording, scoring or flow change); the agent team, who will be constrained
to tokens.

## Explicitly out of scope

- copy, questionnaire wording, scoring, consent and privacy policy text;
- layout and composition changes beyond type and colour values;
- the Writing page (being retired under Phase 4);
- routes, APIs and the Release 2 shell;
- a build-system migration (Eleventy or similar); a separate proposal;
- shipping a light mode: no toggle, no `prefers-color-scheme` switching, no
  light variants of the logo or hero imagery. `data-theme="light"` stays
  limited to the privacy notices. Shipping it needs its own proposal and
  evidence of demand (strongest candidates: the survey on mobile, and long
  articles).

## Sequencing

Release 2 (route and shell cutover) is approved and touches
`research/index.html` and the participation shell. To avoid conflicting
edits, this change:

1. ships the token file and the learnings template first (no Release 2
   overlap);
2. fixes the two contrast failures as a small separate item,
   `FB-20261002-CONTRAST-ORANGE-BTN`, on its own branch and preview (Graham
   asked for this split on 2 October 2026, so it does not wait for this
   packet);
3. migrates the participation runtime only after Release 2 is released.

## Cost of revision 2

Roughly 10 to 15% more work per page migration, mostly mapping glow, border
and overlay values to tokens. Dropping the requirement later means deleting
the light block and the theme-ready check; nothing else depends on it.

## Step 1 patch: kept unapplied, rebased onto current `main`

`step1-article-template.patch` in this folder migrates
`learnings/_article-template.html` to the tokens. It is **not applied** on this
branch. Approving this packet does not apply it; step 1 still needs the
workflow gates in `tasks.md`.

Rebased 2 October 2026 onto `main` at `ed4b349`. The original was written
against `ab7156b`, before the shared footer partial, the nav and feedback
injection, and the other changes that landed since. It is **not** based on the
uncommitted article edits that were sitting in the shared checkout: those were
an earlier legacy-sprint typography pass (Sprint 22, commit `ebd45ed`, never
reached `main`), they are not part of this proposal, and they have been
archived outside the repository.

Checks run on the rebased patch, in a scratch copy that was then reverted:

- `git apply --check` passes on a clean `main`.
- `npm run build` regenerates the template plus all 10 articles with no other
  file changing. The unpatched build also changes nothing, so the build is
  repeatable.
- No custom property is used without a fallback and left undefined in any of
  the 10 built articles. `--border-dk` and `--cream` are undefined but appear
  only as fallback arguments in the shared footer CSS, so they are harmless.
- Computed `article p` in a real browser: 17px / line-height 1.7 / weight 400
  at 1440px, and 16.175px / 1.7 / 400 at 390px, with no horizontal overflow.
  Before: 16px / 1.8 / 400.
- `node scripts/audit/check-contrast.mjs` passes 44 of 44 checks.

To apply it later: `git apply
research/openspec/changes/design-foundations/step1-article-template.patch`,
then `npm run build`.

## Rollback

Each page family migrates in its own commit. Reverting the commit restores
that page's inline `:root` and sizes. `tokens.css` is inert for any page that
does not link it.
