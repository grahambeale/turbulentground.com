# Evidence snapshot

Computed 3 Oct 2026 from `origin/main` (commit `f27bdc9`), not from memory.

## Method

1. List the tracked files at `origin/main`: 420.
2. Apply `.vercelignore` to them in an isolated empty repository (the project's own `.gitignore` is not
   applied, because it lists `package.json` and would inflate the matches): `git check-ignore --no-index`.
   292 are ignored; **128 are served**.
3. Classify the 128: 14 are API functions (`api/`), 53 are public pages and assets (the allowlist),
   61 are not public.

No participant data, record contents or free text are reproduced here.
Provenance: Airtable `FB-20261002-SERVED-FILES` (`recb5cq3Kxa7Sqt43`) holds the 2 Oct investigation
(374 files probed on production: 158 raw 200, 40 308-redirect pages, 176 404; 130 non-public files served;
Airtable IDs in 26 files and emails in 21, no tokens or keys). The interim release is
`FB-20261002-VERCELIGNORE-INTERIM` (`recTNJsbVhUzIyPqJ`).

## Counts of the 61 not-public files

| Group | Files |
|---|---|
| `scripts/` | 14 |
| `lib/` | 11 |
| `content/` | 10 |
| `partials/` | 8 |
| research review and preview pages | 13 |
| `learnings/_article-template.html` | 1 |
| `vercel.json` | 1 |
| `package.json`, `package-lock.json`, `.env.example` (Vercel already returns 404 for these) | 3 |

The 17 internal HTML pages: 17 files = 4 build inputs (3 partials plus the article template) and 13 research pages.

## The 61 not-public files (expected 404 after the change)

```
.env.example
content/learnings/analytics-data-mean-what-you-think.md
content/learnings/chatgpt-starts-this-week.md
content/learnings/eleven-sprints-in.md
content/learnings/how-does-an-ai-team-miss-a-failure-this-big.md
content/learnings/make-my-ai-team-take-risks.md
content/learnings/seven-copies-of-the-rules.md
content/learnings/signals-added-to-the-pile.md
content/learnings/the-silent-veto.md
content/learnings/what-zero-intervention-actually-means.md
content/learnings/zero-humans-in-the-loop.md
learnings/_article-template.html
lib/research-feedback-submission.js
lib/research-feedback.js
lib/research-phase31/incomplete-cron.js
lib/research-phase31/incomplete-maintenance.js
lib/research-phase31/participation-count.js
lib/research-phase31/public-start.js
lib/research-phase31/referral-attribution.js
lib/research-phase31/referral-disable.js
lib/research-phase31/referral-issue.js
lib/research-phase31/referral-resolve.js
lib/site-feedback-submission.js
package-lock.json
package.json
partials/feedback.css
partials/feedback.html
partials/feedback.js
partials/footer.css
partials/footer.html
partials/nav.css
partials/nav.html
partials/nav.js
research/benchmark-preview.html
research/benchmark-preview/available.html
research/benchmark-preview/building.html
research/benchmark-preview/partial.html
research/legacy-v3.html
research/lifecycle-email-preview.html
research/purpose-preview.html
research/referral-sharing-preview.html
research/results-preview-v3.html
research/results-preview-v4-own.html
research/results-preview-v4.html
research/return-link-email-preview.html
research/ux-review.html
scripts/audit/check-contrast.mjs
scripts/audit/check-rail.mjs
scripts/build-feedback.mjs
scripts/build-footer.mjs
scripts/build-learnings.mjs
scripts/build-nav.mjs
scripts/build-research-benchmark-preview.mjs
scripts/build-research-results-preview.mjs
scripts/build-research-return-link-preview.mjs
scripts/generate-invite.mjs
scripts/hooks/install.sh
scripts/hooks/pre-push
scripts/hooks/serve.py
scripts/research-phase31-schema.mjs
vercel.json
```

## The 53 allowlisted public files

```
BingSiteAuth.xml
about.html
admin/admin-nav.css
admin/config.yml
admin/index.html
admin/invitations/index.html
care-capital.html
diagnostic/index.html
favicon.png
hero-terrain-mobile.webp
hero-terrain.png
hero-terrain.webp
index.html
learnings/analytics-data-mean-what-you-think.html
learnings/chatgpt-starts-this-week.html
learnings/eleven-sprints-in.html
learnings/how-does-an-ai-team-miss-a-failure-this-big.html
learnings/images/analytics-data-mean.png
learnings/images/chatgpt-starts-this-week.png
learnings/images/eleven-sprints-in.png
learnings/images/five-sprints-in.png
learnings/images/how-does-an-ai-team-miss-a-failure-this-big.png
learnings/images/make-my-ai-team-take-risks.png
learnings/images/seven-copies-of-the-rules.png
learnings/images/signals-added-to-the-pile.png
learnings/images/the-silent-veto.png
learnings/images/zero-humans-in-the-loop.png
learnings/index.html
learnings/make-my-ai-team-take-risks.html
learnings/seven-copies-of-the-rules.html
learnings/signals-added-to-the-pile.html
learnings/the-silent-veto.html
learnings/what-zero-intervention-actually-means.html
learnings/zero-humans-in-the-loop.html
og-image.png
privacy.html
research-social-preview-2026.png
research/admin-tools.html
research/admin.html
research/feedback-widget.css
research/feedback-widget.js
research/index.html
research/media/intro-poster.jpg
research/media/outro-poster.jpg
research/media/research-intro.mp4
research/media/research-outro.mp4
research/privacy.html
research/referral-sharing.css
research/referral-sharing.js
sitemap.xml
styles/reading.css
styles/tokens.css
writing.html
```

## API functions (unchanged, built from the project root)

```
api/_research-benchmarks.js
api/_research-instruments.js
api/decap-auth.js
api/decap-callback.js
api/research-capture-email.js
api/research-invite.js
api/research-lookup.js
api/research-results-email.js
api/research-results-preview.js
api/research-save-progress.js
api/research-submit.js
api/research-unsubscribe.js
api/submit.js
api/verify.js
```

## JavaScript-only references found (grep of the public pages)

- `research/index.html`: `/research/media/research-intro.mp4`, `/research/media/research-outro.mp4`,
  `/research/media/intro-poster.jpg`, `/research/media/outro-poster.jpg` in a script block.
- `research/index.html`: `fetch('/privacy.html')`.
- `admin/index.html`: relative `config.yml` read by Decap CMS (the page works around the missing trailing
  slash; see its inline comment). The CMS script loads from unpkg (external).
- `fetch('/api/...')` in the home, research, admin, diagnostic and admin-tools pages.
- Stylesheets `/styles/tokens.css` and `/styles/reading.css` are linked, not dynamic, but are new since
  the last crawl baseline and must be in the allowlist.

## Facts established on 2 Oct and 3 Oct that this design relies on

- Vercel removes `.vercelignore`d files before the build; a build input can never be ignored.
- The build (`npm run build`) rewrites pages in place at the repo root; the committed copies equal the build output.
- Preview deployments append a toolbar `<script>` to HTML; with it removed the homepage was byte-identical.
- A crawl that is too fast trips Vercel's Security Checkpoint (403, `x-vercel-mitigated: challenge`).
- The pre-push hook builds the pushed commit in a throwaway worktree and serves it with `scripts/hooks/serve.py`.

## Not established (to be confirmed during implementation, if approved)

- That no spec outside the allowlist is requested over HTTP by the smoke suite.
- That `api/` and `lib/` still have no runtime reads of repository files.
- Exact Vercel behaviour for `outputDirectory: public` with `cleanUrls` and `api/` together: verify on a preview.
