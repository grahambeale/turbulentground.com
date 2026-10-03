# Implementation evidence — chore/public-allowlist

Status: **implemented and previewed. NOT released. No production approval.**
Branch `chore/public-allowlist`; the head is quoted in Airtable `FB-20261002-SERVED-FILES`.

## What was built

`public-allowlist.json`; `scripts/build-public.mjs`; `scripts/audit/check-public.mjs`; `scripts/public-lib.mjs`;
`scripts/audit/crawl-parity.mjs` and `tests/fixtures/public-parity.json`; `tests/public-allowlist.test.mjs`
(14 tests, each check shown to fail on a deliberate fault); hook and `serve.py` serve `public/`;
`npm run serve`; `vercel.json` `outputDirectory: public`; `.gitignore` `public/`.

## Local checks (pre-push hook, 272 smoke tests plus unit tests)

- Production variant: 54 files = the allowlist; every local reference resolves; no forbidden path.
- Preview variant (`VERCEL_ENV=preview`): 73 files = 54 + 12 preview-only pages + 7 screenshots.
- `.vercelignore` conflict check, built-path scanning, stale dynamic entries: covered by unit tests.

## Preview evidence (Vercel preview, authenticated browser, throttled: 4 workers, about 0.9 s apart)

Preview `dpl_7pd8p34dDNsPZvRVkXkMavzPBbWE` (commit `e2ac7f6`), baseline recorded from production at
`f27bdc9` on 3 Oct 2026. HTML hashed with the preview toolbar tag removed.

| Check | Result |
|---|---|
| Public routes (55, including redirects `/writing` 308 and `/research/admin` 307) | 55 of 55 identical: status, content type, length, sha256 |
| `research-intro.mp4` / `research-outro.mp4` | 16,830,094 B `0330a1025dcb662a…` / 13,875,331 B `23c5a32ecad83c79…`, identical to production; range request returns 206 with `Accept-Ranges: bytes` |
| Preview-only routes (19) | all 200 on the preview; `noindex` is the first tag in `<head>`; ux-review screenshots load |
| Must-404 routes (50) | all 404 |
| API (GET, read-only): `research-participation` 200, `research-lookup` 200 `{valid:false}`, `verify` 400, `research-submit` 405, `submit` 405, `research-results-preview` 405, `research-public-start` `{enabled:false}` | identical to production except the expected preview switch |
| 390px spot checks | `/learnings`, an article, `/care-capital`, `/take-part` load with no sideways scroll and no broken images; `/take-part` shows the preview-build message |
| First preview (`7a77ea4`) | FAILED CLOSED on `.vercelignore` hiding the screenshots: see amendment 2 |
| Rollback rehearsal | a throwaway branch with `outputDirectory` set back to `.` deployed and served the repo files again (`/scripts/hooks/serve.py` 200) while `.vercelignore` still hid `CLAUDE.md` and the OpenSpec tree; branch deleted |

## Not verified

- The production variant on Vercel (a preview builds the preview variant). It is proven locally and by the hook.
  After a release, run the production parity check and `scripts/release.sh`'s production specs.
- That the production deployment's `VERCEL_ENV` is `production` at build (it is set by Vercel; the check is the
  first production parity crawl after release).
- Any behaviour of the survey after the start screen (frozen; untouched).
