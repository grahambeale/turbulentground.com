# Paired questionnaire implementation — preview review
13 September 2026

**Current state (added 15 September 2026):** This document is a historical
preview review, written before release. `FB-20260911-TEVOGK` has since shipped
to production at commit `3343293bda0415786f02a8281958e3a0b4d92e7f` (per the
live Airtable record) — a later commit than the preview build referenced below.
The "Decision needed before release readiness" section and "Release decision
remains Pending" statement further down describe the state as of this
document's date, not the present state; check the Airtable record for the
current release and results-policy decision rather than relying on this page.

The approved paired questionnaire is implemented in the existing site styling on
`codex/paired-research-questions`, commit `41a42f8170311eb16111fe8023a64c699e04fdc8`.
The hosted preview is READY. Main and production were not changed at the time
this review was written.

A temporary shareable preview link (with a `pk` preview key and a Vercel share
token) was issued for this branch and has since expired. The stable, access-
protected branch preview URL is not reproduced here; it required Vercel
account access to open and is superseded by the canonical production site at
[www.turbulentground.com/research/](https://www.turbulentground.com/research/)
once this work ships. Expired: 9/14/2026, 11:29:02 AM.

## Completed
- All 24 exact approved statements, 12 paired screens and updated draft explanations.
- Independent answer/context fields, stable bottom-left Back, pair answer guards,
  optional final comment, progress from actual answered state.
- V4 submissions identify the new instrument. Version mismatches/unknown saved
  versions are rejected before persistence; v3 unfinished responses resume the
  frozen v3 questionnaire. Historical data is not migrated or relabelled.
- Historical benchmarks require matching instrument version and completed status,
  retaining the existing completion-floor and fifteen-response threshold.
- Revised-question results are blocked from the historical composite interpretation
  pending agreement on their presentation. Other historical versions are also
  withheld rather than interpreted as v3; unknown-version follow-up is needed.

## Verification
The actual hosted questionnaire visibly rendered every approved statement and
context field; guards, Back and the final comment passed, and preview Submit made
no API calls. Synthetic local browser/API checks cover full submission payload,
exact item identities, partial resume, legacy redirect, unknown/mismatched
versions, mobile/reduced motion and mixed-version benchmark exclusion.
Relevant consent, analytics, context, legacy journey/transition, results-email,
results-preview, feedback and unsubscribe regressions passed.
No real participant response or email was created. Production endpoints and
version-safe revised results are not yet release-verified.

## Decision needed before release readiness
Agree revised results as statement-specific own answers with same-version
benchmarks, replacing the two lens composite summaries; alternatively agree own
answers only for now. This is additional results scope, not another approval of
the questions or paired journey. Implement and verify the agreed result path,
then return for separate release approval. Release decision remains Pending;
the ticket is not yet Awaiting release approval.

Private OpenSpec approval/review records and the intentional rationale update
remain local and in Airtable. The public preview branch contains only product
implementation, approved public wording and synthetic tests; unrelated dirty
files are preserved.
