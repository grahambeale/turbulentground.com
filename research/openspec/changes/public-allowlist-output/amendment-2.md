# Amendment 2 — what implementation found (for Graham's attention)

Written 3 Oct 2026 during implementation of the approved packet. Items 1 and 3 deviate from, or add to, the approved text.

1. **`research/legacy-v3.html` stays public (deviates from D1).** The proposal listed it among the 13 research
   review pages. It is not one: `research/index.html` redirects any participant whose saved progress is on the v3
   instrument to it (`window.location.replace('/research/legacy-v3.html?t=…')`), and tests assert that route. Making
   it preview-only would send those participants to a 404 on production. It is in the `public` group (already
   `noindex`). The preview-only group is therefore 12 pages, not 13. Please confirm.
2. **`research/ux-review-assets/*.png` are preview-only.** `research/ux-review.html` builds its image URLs in
   JavaScript (`'/research/ux-review-assets/' + id + '.png'`). My interim `.vercelignore` release of 2 Oct hid that
   folder, so the page's seven screenshots have returned 404 on production since then (Airtable
   `FB-20261003-UX-REVIEW-IMAGES`). They join the preview-only group, with the page. The first checker did not see
   built paths; it now does (string concatenation and template literals), so this class of miss fails the build.
3. **One `.vercelignore` line is removed (the only exception to D3).** Vercel deletes ignored files before the build,
   so an allowlisted file that `.vercelignore` hides makes the allowlist match nothing and the deploy fail. The
   first preview of this branch failed exactly that way on `/research/ux-review-assets/`. The line is removed with a
   comment, and `check-public` now fails locally (in the hook) if `.vercelignore` hides any allowlisted file. Every
   other interim entry is kept.
4. **A pre-existing bug was found, not changed:** six learnings articles set `og:image` to the relative path
   `og-image.png`, which 404s at `/learnings/og-image.png` (Airtable `FB-20261003-OG-IMAGE-RELATIVE`). Public
   pages must stay byte-identical, so `public-allowlist.json` lists it as a known ignored reference.
5. **Safety choice:** preview-only pages are included only when `VERCEL_ENV` is exactly `preview`. Unset means
   production-like, so a missing variable can never leak them. The preview build proved `VERCEL_ENV` is set there.
