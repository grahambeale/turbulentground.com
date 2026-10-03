# Serve only an allowlisted public/ directory — proposal

Status: **PROPOSAL ONLY. NOT APPROVED. NO IMPLEMENTATION.**
Airtable: `FB-20261002-SERVED-FILES` (`recb5cq3Kxa7Sqt43`), Graham's decision of 2 Oct 2026: option (b) is the target.
Author: Claude. Written 3 Oct 2026, after headings, nav-about, design-foundations and type-scale-batch-2 shipped.
Packet: this file, `design.md`, `tasks.md`, `evidence-snapshot.md`. There is no `approval.json`; it is
written only from an explicit decision by Graham on this exact packet (operations/workflow.md section 3).

## Problem

The repository root is the site root (`vercel.json` has `"outputDirectory": "."`), so every committed
file is downloadable unless `.vercelignore` hides it. That default fails open: a new file is public until
someone remembers to list it. An investigation on 2 Oct found 130 non-public files being served, including
build scripts, API library source, tests, operations notes and agent configuration. A secret scan found no
tokens, but Airtable record IDs appeared in 26 served files and email addresses in 21. The repository is
also public on GitHub, so the content itself is not secret; what the served copies add is easy
discoverability and the fact that anything added later is exposed automatically.

An interim `.vercelignore` extension (released 2 Oct, `FB-20261002-VERCELIGNORE-INTERIM`) hid 91 of them.
It cannot hide anything the build or the API functions need, because Vercel removes ignored files from
the checkout before building. On current `main`, 128 files are still served: 14 are API functions, 53 are
public pages and assets, and **61 are not public** (listed in `evidence-snapshot.md`): `scripts/` (14),
`lib/` (11), `content/` (10), `partials/` (8), 13 internal research pages, `learnings/_article-template.html`,
`vercel.json`, and the package files and `.env.example` that Vercel itself withholds.

## Affected users

- Visitors and search engines: should see exactly today's public site, byte for byte.
- Participants in the research study: the survey, results, invitation and email flows must be unaffected.
- Graham and agents: previews, the pre-push hook and local serving change how they run the site.
- Nobody sees a visual or copy change.

## Proposed change

Build into a dedicated `public/` directory that contains only an explicit allowlist, and deploy that
directory. A new file is private until someone adds it to the list.

1. A build step copies the allowlisted files into `public/` (gitignored), preserving the directory layout
   so `vercel.json` rewrites, redirects, `cleanUrls` and headers keep working unchanged.
2. `vercel.json` sets `"outputDirectory": "public"`. `api/` and the crons are unaffected: functions are
   built from the project root, not the output directory.
3. Build-time checks fail the build when the output is not exactly the allowlist, when a forbidden path
   appears, or when anything the public pages reference is missing from `public/`.
4. A crawl-and-hash parity check proves, once and again before release, that production and the new
   preview return identical status, length and hash for every public route.
5. The pre-push hook and any local server serve `public/` after building, so tests see what production serves.

## Requirements

R1. `public/` contains exactly the allowlist: 53 files today (53 = 5 root pages + 3 hero images + favicon,
    og-image, social preview, sitemap.xml, BingSiteAuth.xml, 2 stylesheets, the diagnostic page, the 4 admin
    files, the learnings index, 10 articles and 10 images, and the 12 research files incl. 4 media files).
R2. Everything served today that is public stays served at the same URL with the same bytes.
R3. Every file not in the allowlist returns 404 on production, including all 61 listed in the evidence.
R4. Every local asset a public page references, in HTML, CSS or JavaScript, exists in `public/`; the build
    fails otherwise. This explicitly covers JavaScript-only references (section "JS-only assets" in `design.md`).
R5. The 17 internal HTML pages are not served from production (decision D1 below).
R6. API routes, rewrites, redirects, cron paths and response headers behave as before.
R7. The pre-push hook builds, then serves `public/`, and fails on any check above.
R8. Rollback is one setting plus a redeploy, rehearsed before release.

## Exclusions

- No change to page content, copy, styling, the survey instrument or any participant flow.
- No change to `api/` or `lib/` behaviour; they stay in the repo and deploy as functions.
- No framework migration, bundler or hosting change.
- Not in scope: robots.txt/noindex strategy for public pages, the deployment-retention question
  (`FB-20261002-PREVIEW-RETENTION`), and the `/writing` redirect.

## Privacy, accessibility and research implications

- Privacy: removes the public copies of files that contain Airtable base/table/record IDs and contact
  addresses (counts as of the 2 Oct investigation, not recomputed here). No participant data is in any
  of these files. Data minimisation improves; nothing new is collected.
- Accessibility: no UI or markup change; WCAG 2.2 AA status is unchanged. The parity check proves it.
- Research validity: no instrument, order, copy or scoring change. The frozen survey screens
  (`tests/smoke/survey-frozen.spec.js`) and the existing journey tests keep running against `public/`.
  The one participant-facing risk is a missing asset (for example the intro video), which the asset
  check and parity crawl exist to prevent.

## Decisions needed from Graham

D1. The 17 internal HTML pages: (a) not served at all (recommended for the 5 build inputs: `partials/feedback`,
    `partials/footer`, `partials/nav`, `learnings/_article-template` are not pages anyone should visit;
    these 4 plus the 13 research preview pages make 17); for the 13 research preview/review pages
    choose between (a1) removed from every deployment, or (a2) included only on preview deployments
    (`VERCEL_ENV` is not `production`), with `noindex`, so you can still review them. Recommendation: a2.
D2. `writing.html`: unreachable on production (`/writing` redirects to LinkedIn) but tests load the file.
    Recommendation: keep it in the allowlist.
D3. After this ships, keep or delete the interim `.vercelignore` entries. Recommendation: keep only
    `research/openspec/` as a second guard and drop the rest, so there is one source of truth.
D4. Approve the throttled crawl rule for the parity check (4 at a time, about 1 s apart, per
    operations/workflow.md) and that previews are checked from the authenticated browser or Vercel connector.

## Acceptance criteria

A1. Parity: every URL in the baseline manifest has the same status, content type, length and sha256 on the
    preview as on production, except the listed expected differences (the preview toolbar tag Vercel
    appends to HTML on previews, and the intended 404s). Both videos are compared explicitly.
A2. All 61 non-public files, and any path outside the allowlist, return 404 on the preview.
A3. API parity: the same status and body shape for the safe, read-only calls used in the 2 Oct check;
    cron paths exist; no function logs an import error.
A4. Build checks pass, and each one is shown to fail on a deliberate fault (missing asset, extra file,
    forbidden path, stale dynamic-asset entry).
A5. The pre-push hook passes serving `public/`; the smoke suite passes unchanged.
A6. Production smoke run (`SMOKE_TEST_BASE_URL=https://www.turbulentground.com`) passes after release.
A7. Rollback rehearsed on a preview and the steps recorded.

## Test plan and rollback

See `design.md`. Rollback: set `outputDirectory` back to `.` and redeploy, or promote the previous
production deployment (Vercel instant rollback). Keep the interim `.vercelignore` entries until the
release has been live and clean for one full day.

## Release gates

Proposal approval, implementation approval and production-release approval are separate. Approving
this proposal approves nothing else. Implementation happens on its own branch, previews first, and a
release needs Graham's exact approval of the previewed head, as for every other change.
