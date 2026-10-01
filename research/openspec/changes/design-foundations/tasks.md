# Design foundations: tasks, verification and enforcement

Each step needs the workflow gates in `operations/workflow.md`: lease,
Airtable record, exact approval, then preview approval and release approval
as separate decisions.

## Step 1: tokens file and learnings template (11 articles)

- [ ] Add `styles/tokens.css` (draft in this branch).
- [ ] `learnings/_article-template.html`: link `/styles/tokens.css` before
      the inline `<style>`; delete the inline `:root`; set
      `html { font-size: 100% }`; map text to roles:
      `article p` → body, `.cold-open` and `.cta-hook-a` → small,
      `.byline-*` and `.disclosure-note` → meta.
- [ ] `npm run build`; confirm all 11 articles regenerate.
- [ ] Verify computed styles: `article p` 17px / 1.7 / 400 at 1440px and
      about 16px at 390px; no undefined custom properties.
      Prototype result (local, not deployed): 17px / 1.70 / 400 at 1440,
      16.2px / 1.70 / 400 at 390. Before: 16px / 1.80 / 400.
- [ ] axe and visual check at 320, 390 and 1440px; no horizontal overflow.

## Step 2: contrast fixes (small, can ride with or after Release 2)

- [ ] `.scale-btn[aria-pressed="true"]`: background `--orange-btn`.
- [ ] `.skip-link`: background `--orange-btn`.
- [ ] Verify 4.5:1 or better on both.

## Step 3: remaining page families (one commit each)

Order: learnings index, about, privacy and research privacy (light theme),
home, participation runtime (after Release 2 ships), Care Capital and
diagnostic (pending the Outfit decision).

For each: link tokens, remove local `:root` and px root size, map text to
the four roles, replace heading font with `--font-display`, re-run the audit.

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
      - no `:root` blocks outside `styles/tokens.css`.
- [ ] Add a Playwright check that fails if any public page sets a px
      root font size or computes body text outside the four roles.

## Done when

- Every public page links `tokens.css` and has no local `:root`.
- The audit reports 4 body styles, 1 body typeface, 1 display typeface.
- The build fails on a new raw colour, font or size value.
