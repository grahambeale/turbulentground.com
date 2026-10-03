# Tasks — NOT STARTED

No task below is authorised. They are listed so the scope can be reviewed. Tick only after implementation approval.

## Before implementation
- [ ] Graham decides D1 to D4 in `proposal.md`.
- [ ] Graham approves this exact packet; record his decision, source, timestamp and file hashes.
- [ ] Take the work-state lease; create the implementation Airtable record.

## Baseline (on production, before any change)
- [ ] Produce `tests/fixtures/public-parity.json`: route, status, content type, length, sha256 for every public route, plus the 61 expected 404s. Throttled, authenticated where needed.
- [ ] Confirm the allowlist against the baseline: 53 public files plus `api/`.
- [ ] Confirm there are still no runtime file reads in `api/` and `lib/`.

## Build
- [ ] `public-allowlist.json` with reasons and `dynamic` entries.
- [ ] `scripts/build-public.mjs`.
- [ ] `scripts/audit/check-public.mjs`: exactness, forbidden paths, referenced assets, dynamic-asset coverage.
- [ ] Unit tests for the checker, each shown to fail on a deliberate fault.
- [ ] `package.json` build chain; `.gitignore` `public/`; `vercel.json` `outputDirectory`.
- [ ] `scripts/audit/crawl-parity.mjs` with throttling and compare mode.

## Hook and local serving
- [ ] `serve.py` takes a directory; hook serves `public/`; `npm run serve`.
- [ ] Run the whole smoke suite against `public/`; fix any spec that needed a non-public file.
- [ ] Update `operations/workflow.md` push-discipline section.

## Preview and release
- [ ] Preview crawl vs baseline; 404 checks; API parity; both videos incl. a range request; 390px spot checks.
- [ ] Rollback rehearsal on a preview.
- [ ] Airtable at Awaiting release approval with the allowlist diff and parity report.
- [ ] After approval: release, production smoke run, post-release crawl, decision-log row.
- [ ] After a clean day: simplify `.vercelignore` (D3).
