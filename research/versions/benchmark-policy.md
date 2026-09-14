# Statement comparison policy

Identifier: `statement-benchmark-v1-2026-09-14`.

The policy is set in `api/_research-benchmarks.js`. It uses completed responses meeting the completion floor, a known recorded question version, a valid token for deduplication, readable response JSON, and at least 15 numeric observations per displayed statement. Skips, not-applicable and invalid values are excluded. Ambiguous duplicate completion tokens are excluded rather than selecting a score. This is the project's display floor, not a claim that every sample of 15 is statistically validated.

Cross-version groups are currently empty. The compatibility audit found that V3/V4 explanatory text and presentation order changed even where statement text was identical. Historical V1/V2 variants also remain unresolved. Do not enable pooling from text similarity, storage fields or retrospectively reconstructed rationale metadata. Enabling any group requires an explicitly approved mapping and a new immutable policy identifier.

Newly sent results retain the policy identifier, computation time, minimum count, statement observation counts and included question versions in Identity / Results Benchmark Provenance. Metadata contains no raw answers or tokens. Response labels and previously sent emails are unchanged. This metadata describes the calculation at generation time; reproduction requires the corresponding source records and policy revision to remain available under the retention policy.

The revised paired results show statement comparisons independently. No overall, contribution or conditions benchmark is constructed from different statement cohorts. Historical V3 rendering retains its original wording and interpretation.

Run `node tests/research-statement-benchmarks.test.mjs` and `node tests/research-instrument-version-api.test.mjs` to verify calculation and the synthetic results-email journey. Run `node scripts/build-research-benchmark-preview.mjs` to rebuild the explicitly synthetic review scenarios.
