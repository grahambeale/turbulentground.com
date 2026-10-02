# Design foundations: tasks, verification and enforcement

Each step needs the workflow gates in `operations/workflow.md`: lease,
Airtable record, exact approval, then preview approval and release approval
as separate decisions.

## Step 1: tokens file and learnings template (template plus 10 articles)

`step1-article-template.patch` is rebased onto `main` at `ed4b349` and is
deliberately **not applied** on the proposal branch. Apply it only when this
step is approved. See "Step 1 patch" in `proposal.md` for the checks already
run on it.

- [x] Add `styles/tokens.css` (draft in this branch, revision 2: both themes).
- [x] Add `scripts/audit/check-contrast.mjs` to `npm run build` (fails on a
      missing light value or a contrast failure in either theme).
- [x] `learnings/_article-template.html`: link `/styles/tokens.css` before
      the inline `<style>`; delete the inline `:root`; set
      `html { font-size: 100% }`; map text to roles:
      `article p` → body, `.cold-open` and `.cta-hook-a` → small,
      `.byline-*` and `.disclosure-note` → meta.
- [x] `npm run build`; confirm the template and all 10 articles regenerate.
- [x] Verify computed styles: `article p` 17px / 1.7 / 400 at 1440px and
      about 16px at 390px; no undefined custom properties.
      Prototype result (local, not deployed): 17px / 1.70 / 400 at 1440,
      16.2px / 1.70 / 400 at 390. Before: 16px / 1.80 / 400.
- [x] axe and visual check at 320, 390 and 1440px; no horizontal overflow.

  Verified 2 October 2026 on the branch preview (real browser, commit `7c6fbdd`):

  | Check | Before (production) | After (preview) |
  |---|---|---|
  | Root font size | 15px | 16px |
  | `article p` at 1440px | 16px / 1.8 / 400 | 17px / 1.7 / 400 |
  | `article p` at 390px | not measured | 16.175px / 1.7 / 400 |
  | `article p` at 320px | 16px / 1.8 / 400 | 16px / 1.7 / 400 |
  | Page background | `#131110` | `#0b0907` (homepage palette) |
  | `tokens.css` linked | no | yes, served as 200 `text/css` |
  | Inline `:root` in the page | yes | none |
  | Horizontal overflow at 320, 390, 1440px | none | none |

  axe-core 4.10.0 (WCAG 2.0, 2.1 and 2.2, levels A and AA) at 320px: 0
  violations, 21 rules passed, 2 items left for manual review (the nav
  wordmark and strapline, where the background is a hero image and axe cannot
  compute it). The nav wordmark running past the viewport at 320px is
  pre-existing and identical on production. `npm test` 21 of 21; the audit
  passes 44 of 44; the audit now runs inside `npm run build`, which Vercel runs
  on every deploy, and was checked to exit 1 for both a failing pair and a
  missing light value.

  Not changed by step 1 and worth a decision later: the article `h1` is still
  weight 300 (the 1 October decision covers body weight only).

## Step 1b: homepage headings and the feedback dialog title (approved 2 October 2026)

Own branch `design-foundations-homepage-headings`, built on step 1, with its own
preview and its own release decision.

- [ ] Homepage `h1, h2` from DM Serif Display to Cormorant Garamond. Test
      weights 500 and 600 for legibility over the canvas in every scene, on
      desktop and mobile, and pick one on that evidence.
- [ ] Check the hero heading's `.line` wrappers (`overflow: hidden`) do not clip
      Cormorant Garamond's longer descenders.
- [ ] Replace the homepage Google Fonts request for DM Serif Display with the
      Cormorant Garamond weights and italics actually used.
- [ ] Remove DM Serif Display from `.tg-dialog__title` in
      `partials/feedback.css` and `research/feedback-widget.css`; rebuild so the
      injected copies on every page update.
- [ ] No other homepage change; compare screenshots before and after in every
      scene.

## Step 2: contrast fixes (separate item: `FB-20261002-CONTRAST-ORANGE-BTN`)

Tracked and released on its own branch, independent of this packet.

- [ ] `.scale-btn[aria-pressed="true"]`: background `--orange-btn`.
- [ ] `.skip-link`: background `--orange-btn`.
- [ ] Verify 4.5:1 or better on both.

## Step 3: remaining page families (one commit each)

Order: learnings index, about, privacy and research privacy (light theme),
home, participation runtime (after Release 2 ships), Care Capital and
diagnostic (pending the Outfit decision).

For each: link tokens, remove local `:root` and px root size, map text to
the four roles, replace heading font with `--font-display`, replace every
raw colour and `rgba()` value with a semantic token, re-run the audit.
Check the migrated page renders correctly with `data-theme="light"` set
(visual sanity check only; light is not shipped on that page).

**Risk:** the participation runtime is built on an 18px root. Moving it to
100% shrinks every rem value by about 11% unless the values are re-based.
Re-base explicitly, then compare screenshots of every survey state.

## Step 4: enforcement (fail loudly)

- [ ] Commit the audit scripts to `scripts/audit/` and record the number of
      distinct body styles per release. Target: 36 → 4.
- [ ] Add Stylelint to `npm run build`, warn first, then error once
      migration is complete:
      - no colour literals outside `styles/tokens.css` (allowlist SVG fills);
      - no `font-family` other than token variables;
      - no `font-size` in px outside tokens;
      - no `:root` blocks outside `styles/tokens.css`;
      - colour tokens without a light value (already enforced by
        `check-contrast.mjs`).
- [ ] Add a Playwright check that fails if any public page sets a px
      root font size or computes body text outside the four roles.

## Step 1c: phone article layout (2 Oct 2026, Graham's review)

Below 640px only, in `learnings/_article-template.html`:

- Article body text is 18px (was 16.2px at 390px). From 641px up it is
  unchanged (16 to 17px by the token). This is a phone-specific exception
  to the 1 Oct "17px" decision, requested by Graham on 2 Oct.
- Hero-to-title gap roughly halved at 390px: 113px to 55px (page-wrap top
  padding 80px to 28px, eyebrow margin 16px to 10px). H1 bottom margin
  20px to 14px, byline row margin and padding 48/32px to 28/20px,
  disclosure note 40px to 32px, h2 margins 48/20px to 36/16px.
- Measured production vs step-1 preview at 390px: the spacing (80px top
  padding, 16/20/48/32px margins) and the nav problem are identical on
  production, so they are PRE-EXISTING, not step-1 regressions. Step 1's
  only phone differences are body text 16px/1.8 (production) to
  16.2px/1.7, root size 15px to 16px and the darker background.
- The round button beside the byline on previews is Vercel's own preview
  toolbar (`vercel-live-feedback`), not site code; it does not appear on
  production. The site's own feedback tab (fixed, bottom-left, 48px wide)
  is the same on production and overlaps the left edge of body text when
  it scrolls underneath. Not changed here: needs a design decision.
- Screenshots at 390px in `evidence/`: production, step-1 preview before
  this change, and after.

## Step 1d: mobile reading (2 Oct 2026, Graham's phone review)

Supersedes the phone values in Step 1c. Single change, below 640px unless noted;
641px and up is unchanged (verified 16.8px/1.7 on articles, privacy 18.4px/1.75).

- Shared tokens in `styles/tokens.css`: `--read-size` 18px, `--read-leading` 1.6,
  `--read-para` 1em, `--read-h2-top` 1.75em, `--read-h2-bottom` 0.5em,
  `--read-page-top` 28px, applied through `class="reading-copy"`. Pages that did not
  yet link `tokens.css` (privacy, about, learnings index, take-part) now link it;
  their own `:root` colours still win, nothing else in it affects them.
  Sizes are px, not rem, because pages set different root sizes (15, 17, 18px).
- Applied to the article template, /privacy, /learnings (intro and card
  summaries), /about (narrative) and the /take-part intro. Page-top padding is
  28px (header 73px + 28px on pages with a fixed header over plain content);
  hero-to-eyebrow gap is 28px on articles.
- Header over the hero (720px and below): the page now starts below the header
  (`--nav-h`, 73px). Chosen over a solid header because a solid bar would still
  cover the top ~70px of a 204px hero, a third of the picture, and that is where
  the baked-in masthead text sits; moving the hero down loses no picture. Cost:
  73px of vertical space above the fold on phones.
- Smoke tests (`tests/smoke/mobile-nav.spec.js`): body text >= 18px and
  line-height <= 1.65 on the five pages at 320/390/640px, and hero top >= header
  bottom on the article at 320/390/640/720px. 19 tests; all fail on production,
  all pass here (99/99 in the file).
- Evidence (390px, production before vs this branch after): `evidence/`.

## Step 1e: mobile type scale and take-part evidence (2 Oct 2026, Graham's review)

Graham's rule: below 640px no visible text is under 18px, on the article template,
/privacy, /learnings, /about and the /take-part intro. 641px and up unchanged
(0 differing elements at 641, 800 and 1280px against the previous head).

Shared tokens (`styles/tokens.css`, applied with `body.reading-page` and
`.reading-copy`): `--read-size` 20px (body text, card summaries) at
`--read-leading` 1.55; `--read-tap` 20px (links, buttons, tabs, consent
labels); `--read-support` 18px (dates, bylines, labels, eyebrows, notes);
`--read-heading-min` 24px (card titles stay above body).

Changed at 390px (before is the previous step 1d head; production was smaller
still), each `px / line-height`:
- Article: eyebrow 11 -> 18; byline name 14 -> 18; byline meta 13 -> 18;
  disclosure note 13 -> 18; body p 16/1.8 -> 20/1.55; links 16 -> 20; CTA hook
  question 20/1.8 -> 20/1.55, answer 15 -> 20.
- Privacy: summary 18.4 -> 20; p 17/1.75 -> 20/1.55; tab label 15 -> 18; the
  five tabs 15.3 -> 20; card titles (dt) 17 -> 24 at 1.25; card text (dd) 17 -> 20;
  "Lawful basis" lines 15.6 -> 18; updated line 15.3 -> 20.
- Learnings: eyebrow 11 -> 18; intro 16 -> 20; dates 12 -> 18; card titles
  22 -> 24 at 1.25; card summaries 14 -> 20.
- About: hero sub 17 -> 20; hero links 15 -> 20; narrative p 17/1.85 -> 20/1.55;
  section eyebrow 10 -> 18; lead 16 -> 20; card titles 19 -> 24; card text
  14 -> 20; card links 13 -> 20.
- Take-part start: video label 11.7 -> 20; transcript toggle 14.4 -> 20;
  transcript 16.2 -> 20; note 16.2 -> 20; inline link 16.2 -> 20; consent labels
  18 -> 20; "Required" 14 -> 18; start button 18 -> 20.
- Shared footer (reading pages): brand 16 -> 18; note 12 -> 20 (it holds links);
  links 13 -> 20. Nav: wordmark floor 18px at 380px and below (was 17); strapline
  hidden up to 640px on these pages (was 480px); mobile-menu button 16 -> 20.
- Characters per line at 390px: median 31-35 (range 28-36), at 320px 22-27.
  Short for 20px text in a 24px gutter; the trade-off of the 20px rule.
- Smoke tests: body >= 20px and line-height <= 1.65; no visible text under
  18px at 320/390/480/640px on the five pages (every privacy tab, the open
  transcript, the open mobile menu) and on all ten articles; 124 pass here, the
  36 new type tests fail on production.
- Take-part start screen at 390px, rendered from this branch with the entry check
  mocked in the browser only (nothing enabled on any deployment): `evidence/1e-*`.
- Active privacy tab: no bottom stroke (pixel test added; see the Airtable note).

## Done when

- Every public page links `tokens.css` and has no local `:root`.
- The audit reports 4 body styles, 1 body typeface, 1 display typeface.
- Every migrated page renders without raw colour values and passes a
  light-theme sanity check.
- The build fails on a new raw colour, font or size value.
