# Version-safe implementation proposal — paired survey
Status: proposed decisions; question wording approved, implementation policy and release not approved.
Date: 13 September 2026. Source: rationale v1.1 and direct question approval.

## What is complete
The exact approved 24 statements and 24 draft explanations are in
approved-paired-survey.html, defaulting to paired screens. All original response
identities are retained as demo keys. No participant data, score, submission,
results email or production code is changed. The older comparison remains available.

## Instrument registry and storage
Propose new version phase3-v4-2026-09-13-paired (not yet assigned in production).
Record wording version and presentation order explicitly in a version manifest:
v3 uses the original deployed wording and two-pass order; proposed v4 uses the
approved wording and paired order. Capture exact deployed legacy labels separately
from the historical rationale, since these are not identical.
Use version-qualified statement IDs, for example v4:d2:s1, and an explicit
domain/statement-to-existing-storage-field mapping. Do not rename historical keys,
swap values, or imply contribution/conditions is a universal construct classification.
Treat those keys as storage identifiers only. Retain answer options, skip and
not_applicable separately; no new composite score or paired-gap ranking is authorised.

## Submission and save/resume policy — Graham decision
Current submit and partial-save routes both stamp phase3-v3-2026-09-08; lookup
returns answers without their instrument version. Merely changing the constant
would relabel resumed answers and mix questions under the same record.

Recommend existing started responses finish their original instrument and order.
New responses begin v4 only after implementation/release approval. Lookup returns
a version alongside the saved response; render the corresponding immutable
instrument. Save/submit validate a supported version against the existing record
and reject mismatches before writing. Never overwrite the existing version.
Unknown or absent legacy versions require explicit handling and investigation;
do not infer eligibility for v4. Legacy open tabs with no submitted version need
a compatibility path tied to an existing record, or a clear safe restart route
before any persistence. Preserve identity completion locks, consent and stored
answers. Do not migrate or discard unfinished responses without agreement.

## Version-safe results and benchmarks — Graham decision
Current results-email listResponsePairs loads pair JSON and completion-floor
only and pools eligible responses regardless of instrument version. It then
renders current fixed labels and two-lens summaries. This cannot safely serve
changed questions merely by updating the question copy.

Recommend fetch completed response version, then load only completed, consent-
eligible and completion-floor-eligible compatible records for that version.
Preserve existing privacy/eligibility rules and minimum-count rules within that
cohort. Verify the live schema and current implementation of those rules before
coding. Unknown versions are excluded from comparisons pending investigation.
Pagination must retain the version filter on every page. No borrowing v3 data
to fill an early v4 cohort; display unavailable rather than an invented benchmark.

Render historical results against that participant's original instrument wording
and interpretation, even when requested after v4 launch. Preserve historical
data; do not claim that the current historical email labels correctly capture
all original items. Audit and explicitly agree any correction to legacy output.
For v4, recommend statement-specific own-answer summaries within themes, with
version-compatible comparisons only where available. Remove blanket lens
composites and above/below rankings implying better/worse for v4. No new
headlines, actions, chart design or results interpretation is approved by the
question approval; prepare the resulting email design for Graham's review.
The invited cohort is descriptive, not a workforce norm or causal comparison.

## Meaning and hypothesis traceability
Adopt rationale v1.1 statement-specific interpretations and hypothesis amendments
for the revised instrument, retaining earlier hypotheses as history. High confidence
is not demonstrated accuracy; preparing for role change is not evidence of
insecurity; saved-time use for work and for personal time can coexist.
Question approval does not validate scales or authorise a new analysis score.

## Acceptance checks for implementation
- Old partial answers resume with exact old questions/order and never acquire v4.
- New partial pairs restore both individually answered states under v4.
- Version mismatch, unknown version and legacy open-tab requests cannot overwrite data.
- Submit/save preserve completion-floor and not-applicable/prefer-not-to-say handling.
- Mixed-version and paginated fixtures never enter the wrong benchmark cohort.
- Insufficient compatible cohorts produce no comparison.
- Historical email requests retain historical meaning; v4 labels match approved items.
- Full consent, completion, results and save/resume journeys pass on the preview.
Use synthetic fixtures only, with no participant messages or real submissions.

## Review gate
Graham agrees (1) legacy responses finish the original instrument, and
(2) version-separated, statement-specific results with no pooled lens composite.
These are additional implementation/result decisions, not another approval of the
24 questions. Prototype iteration continues under existing approval. Implementation
of this policy and production release remain separate. No production blocker is
cleared merely by the successful demo tests.
