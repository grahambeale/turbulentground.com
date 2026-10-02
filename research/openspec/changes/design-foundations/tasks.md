# Design foundations: tasks, verification and enforcement

Each step needs the workflow gates in `operations/workflow.md`: lease,
Airtable record, exact approval, then preview approval and release approval
as separate decisions.

## Step 1: tokens file and learnings template (template plus 10 articles)

`step1-article-template.patch` is rebased onto `main` at `ed4b349` and is
deliberately **not applied** on the proposal branch. Apply it only when this
step is approved. See "Step 1 patch" in `proposal.md` for the checks already
run on it.

- [ ] Add `styles/tokens.css` (draft in this branch, revision 2: both themes).
- [ ] Add `scripts/audit/check-contrast.mjs` to `npm run build` (fails on a
      missing light value or a contrast failure in either theme).
- [ ] `learnings/_article-template.html`: link `/styles/tokens.css` before
      the inline `<style>`; delete the inline `:root`; set
      `html { font-size: 100% }`; map text to roles:
      `article p` → body, `.cold-open` and `.cta-hook-a` → small,
      `.byline-*` and `.disclosure-note` → meta.
- [ ] `npm run build`; confirm the template and all 10 articles regenerate.
- [ ] Verify computed styles: `article p` 17px / 1.7 / 400 at 1440px and
      about 16px at 390px; no undefined custom properties.
      Prototype result (local, not deployed): 17px / 1.70 / 400 at 1440,
      16.2px / 1.70 / 400 at 390. Before: 16px / 1.80 / 400.
- [ ] axe and visual check at 320, 390 and 1440px; no horizontal overflow.

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

## Done when

- Every public page links `tokens.css` and has no local `:root`.
- The audit reports 4 body styles, 1 body typeface, 1 display typeface.
- Every migrated page renders without raw colour values and passes a
  light-theme sanity check.
- The build fails on a new raw colour, font or size value.
