# Tasks

Implementation approved 3 Oct 2026 (no release). Ticked = done on `chore/public-allowlist`; see `implementation-evidence.md`.

## Before implementation
- [x] Graham decides D1 to D4 in `proposal.md`.
- [x] Graham approves this exact packet; record his decision, source, timestamp and file hashes.
- [x] Take the work-state lease; create the implementation Airtable record.

## Baseline (on production, before any change)
- [x] Produce `tests/fixtures/public-parity.json`: route, status, content type, length, sha256 for every public route, plus the 61 expected 404s. Throttled, authenticated where needed.
- [x] Confirm the allowlist against the baseline: 53 public files plus `api/`.
- [x] Confirm there are still no runtime file reads in `api/` and `lib/`.

## Build
- [x] `public-allowlist.json` with reasons and `dynamic` entries.
- [x] `scripts/build-public.mjs`.
- [x] `scripts/audit/check-public.mjs`: exactness, forbidden paths, referenced assets, dynamic-asset coverage.
- [x] Unit tests for the checker, each shown to fail on a deliberate fault.
- [x] `package.json` build chain; `.gitignore` `public/`; `vercel.json` `outputDirectory`.
- [x] `scripts/audit/crawl-parity.mjs` with throttling and compare mode.

## Hook and local serving
- [x] `serve.py` takes a directory; hook serves `public/`; `npm run serve`.
- [x] Run the whole smoke suite against `public/`; fix any spec that needed a non-public file.
- [x] Update `operations/workflow.md` push-discipline section.

## Preview and release
- [x] Preview crawl vs baseline; 404 checks; API parity; both videos incl. a range request; 390px spot checks.
- [x] Rollback rehearsal on a preview.
- [x] Airtable at Awaiting release approval with the allowlist diff and parity report.
- [ ] After approval: release, production smoke run, post-release crawl, decision-log row.
- [x] ~~After a clean day: simplify `.vercelignore` (D3).~~ Withdrawn by Graham's D3: the interim entries stay as a second layer (one line, `research/ux-review-assets/`, had to go; see amendment 2).
