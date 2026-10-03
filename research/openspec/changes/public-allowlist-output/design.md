# Design — public/ allowlist output

Status: **PROPOSAL ONLY (historical: approved 3 Oct 2026, see approval.json and amendments).** Nothing here is built.

## Mechanism

- `public-allowlist.json` at the repo root (not served): the list of files and globs that make up the
  public site. Each entry carries a one-line reason. Entries for assets that are only referenced from
  JavaScript carry `"dynamic": true` and `"referencedFrom"`.
- `scripts/build-public.mjs`: after the existing build steps, empties `public/` and copies each
  allowlisted file, preserving relative paths. Fails if an allowlisted path does not exist.
- `scripts/audit/check-public.mjs`: runs after the copy. Fails the build on any of the checks below.
- `package.json` `build` becomes the current chain, then `build-public`, then `check-public`.
  `.gitignore` adds `public/`. The hook's "build must leave tracked files unchanged" test still holds.
- `vercel.json`: `"outputDirectory": "public"`. Rewrites, redirects, `cleanUrls`, headers, `crons`
  and `buildCommand` are unchanged. `api/` is compiled from the project root, so it is untouched.
- `.vercelignore`: still applied before the build, so it must never list a build input
  (`scripts/`, `partials/`, `lib/`, `content/`, the template, `vercel.json`, pages).

The existing build scripts rewrite pages in place at the repo root; `build-public` runs last, so the
output is always the freshly built pages.

## Build checks (`check-public.mjs`)

1. **Exactness.** The set of files in `public/` equals the expanded allowlist: nothing extra, nothing missing.
2. **Forbidden paths.** No path under `tests/`, `scripts/`, `lib/`, `content/`, `partials/`, `operations/`,
   `_experiment/`, `.claude/`, `.github/`, `node_modules/`, `research/openspec/`; no `*.md`, `*.mjs`, `*.cjs`,
   `*.py`, `*.sh`, `*.patch`, `package*.json`, `vercel.json`, `.env*`.
3. **Referenced-asset check.** Parse every HTML file in `public/` (`src`, `href`, `poster`, `srcset`,
   `<source>`, `<link>`, `og:` and `twitter:` image meta), every CSS file (`url()`, `@import`), and the
   JavaScript in them (inline `<script>` and public `.js`). For each local reference, resolve it the way
   Vercel would (relative to the page, `cleanUrls`, `vercel.json` rewrites and redirects) and require it
   to exist in `public/`. `fetch('/api/...')` calls must match an `api/*.js` file or a rewrite. External
   URLs are ignored but listed in the report.
4. **Dynamic-asset coverage.** The scanner extracts string literals that look like local paths
   (leading `/` or a known folder, and a known asset extension) from JavaScript. Every such path must be
   allowlisted, and every allowlist entry marked `dynamic` must still be referenced somewhere, so a stale
   entry or an unlisted new asset both fail the build.

## JS-only assets (explicit)

Referenced only from JavaScript or runtime code, so a plain HTML scan would miss them:

| Asset | Referenced from |
|---|---|
| `research/media/research-intro.mp4` (16,830,094 bytes) | `research/index.html` script, `/research/media/research-intro.mp4` |
| `research/media/research-outro.mp4` (13,875,331 bytes) | `research/index.html` script, `/research/media/research-outro.mp4` |
| `research/media/intro-poster.jpg`, `outro-poster.jpg` | `research/index.html` script and markup |
| `privacy.html` | `fetch('/privacy.html')` in `research/index.html` (privacy dialog) |
| `admin/config.yml` | loaded by Decap CMS from `admin/index.html` through a relative `config.yml` |
| `/api/*` routes | `fetch()` in the research, admin, diagnostic and home pages |

Both videos are listed with `dynamic: true`, are compared by length and hash in the parity crawl, and
are checked for `Accept-Ranges` and a `206` on a range request, because browsers need that to seek.
The Decap CMS script itself loads from `unpkg.com`; that is external and unchanged.

## Crawl-and-hash parity (migration gate)

- `scripts/audit/crawl-parity.mjs --base <url> --manifest <file>` requests every route in the manifest and
  records status, content type, byte length and sha256. A `--compare` mode diffs two result files.
- The baseline manifest is produced from production before the change: the routes, plus the
  expected-404 list (the 61 non-public files). It is committed under `tests/fixtures/` (not served).
- Previews are behind Vercel authentication, so they are crawled from the authenticated browser pane or
  through the Vercel connector, not `curl`. The crawl is throttled to 4 at a time with about 1 s between
  requests, per operations/workflow.md, to stay under the Security Checkpoint.
- Expected differences are listed explicitly: the toolbar `<script>` tag Vercel appends to preview HTML
  (strip it before hashing; with it removed the homepage was byte-identical on 2 Oct), and the intended 404s.
  Any other difference fails the check.
- This is a gate for the migration release and a repeatable tool, not a per-commit test, because page
  content legitimately changes between commits. Per commit, the hook runs checks 1 to 4 above.

## The 17 internal HTML pages

Four are not pages at all: `partials/feedback.html`, `partials/footer.html`, `partials/nav.html` and
`learnings/_article-template.html` are build inputs. The other 13 are research review and preview pages:
`research/benchmark-preview` (plus `/available`, `/building`, `/partial`), `legacy-v3`,
`lifecycle-email-preview`, `purpose-preview`, `referral-sharing-preview`, `results-preview-v3`,
`results-preview-v4`, `results-preview-v4-own`, `return-link-email-preview`, `ux-review`.
None is linked from a public page. Under the allowlist none is in `public/`, so production returns 404
for all 17. If Graham wants the 13 review pages kept for previews (D1 option a2), `build-public` copies
them only when `VERCEL_ENV` is not `production`, adds `noindex`, and the parity manifest marks them
preview-only. The build scripts that generate several of them keep working because they run before
`build-public` and write to the repo root.

## Pre-push hook and local server

- The hook already builds the pushed commit in a throwaway worktree. After the change it runs the full
  build (including `build-public` and `check-public`), then serves `public/` (not the worktree root)
  with `scripts/hooks/serve.py` taking a directory argument, then runs the smoke suite as now.
- Smoke specs that use `SMOKE_HTML_EXT=1` request `.html` paths; `public/` mirrors the layout, so they
  keep working. Specs that need a file outside the allowlist over HTTP would now fail, which is the
  point; none is known (to be confirmed by running the suite against `public/` first).
- A `npm run serve` script builds then serves `public/` locally, so day-to-day checks match production.
- The hook fails the push if `public/` differs from the allowlist, a forbidden path appears, or a
  referenced asset is missing.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| A needed file is missing from the allowlist, so a public asset returns 404 | Checks 1, 3 and 4 at build; parity crawl before release; production smoke run after |
| JS-only asset (videos, posters) missed | Explicit `dynamic` entries, scanner self-check, length and hash comparison, range request |
| Build step becomes part of the deploy path and ships an incomplete site | Fails closed: any check failure fails the Vercel build, so nothing deploys |
| `outputDirectory` change alters how `cleanUrls`/rewrites resolve | Same layout inside `public/`; verified on a preview against the baseline; first-class acceptance test |
| API functions lose files they import | They are built from the root, not `public/`; API parity check; no runtime file reads were found on 2 Oct, re-confirmed during implementation |
| Preview toolbar tag causes false parity failures | Strip the known tag before hashing and say so |
| Crawl trips the Vercel Security Checkpoint | Throttle as above; use the authenticated browser |
| Previous production deployments no longer exist to roll back to | Confirm a rollback candidate exists before release; see `FB-20261002-PREVIEW-RETENTION` |

## Rollout

1. Approve this proposal; implement on `chore/public-allowlist` off `main`; hook-clean.
2. Preview: crawl-and-hash parity, 404 checks, API parity, 390px spot checks, rollback rehearsal.
3. Report to Graham with the diff of the allowlist, the parity report and the preview URL; he approves the head.
4. Release; production smoke run and a post-release crawl; decision-log row.
5. After a clean day, simplify `.vercelignore` (D3).

## Rollback

Set `outputDirectory` to `.` in `vercel.json` and redeploy, or promote the previous production
deployment from Vercel. The interim `.vercelignore` entries stay until step 5, so rollback never
re-exposes the files hidden on 2 Oct.
