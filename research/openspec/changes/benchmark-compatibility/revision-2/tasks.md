# Tasks: benchmark compatibility revision 2

Implementation brief. Do not start until the Airtable decision for this revision is Approved. Branch per workflow.md. Decision authority: proposal.md in this folder.


Repo: `~/turbulentground` on `main`. proposal.md in this folder is the authority
for every change below. No em dashes anywhere, including code comments.

### B1. Pool v4 and v5 in the benchmark

File: `api/_research-benchmarks.js`

1. Replace the frozen empty `CROSS_VERSION_GROUPS` with one group:
   `[['phase3-v4-2026-09-13-paired', 'phase3-v5-2026-09-25-examples']]`.
2. In `computeStatementBenchmark`, when `targetVersion` is a member of a
   group, treat every record whose version is in that group as eligible,
   and report `versions` as the list actually present, not `[targetVersion]`.
3. Keep the per-token dedupe exactly as it is.
4. Add a short comment above the group citing the decision-log entry by
   date and the reversal criterion.

File: `tests/research-statement-benchmarks.test.mjs`

5. Replace `assert.deepEqual(CROSS_VERSION_GROUPS, [])` with an assertion
   that the group contains exactly v4 and v5 and nothing else.
6. Add a test: records on v4 and v5 pool for a v5 target; a v3 record does
   not; `versions` on a pooled statement lists both.

### B2. Exclusion list and orphan guard

7. Extract the exclusion-list loader from `lib/research-phase31/participation-count.js`
   into a shared module (or export it from there) so the benchmark path uses
   the identical loader, path resolution and fail-loud behaviour. Do not use
   `import.meta` (see decision log 2026-10-06 incident and the test that
   forbids it).
8. In `api/research-results-email.js`, before `computeStatementBenchmark`,
   load the list and pass the excluded ids as `options.excludedRecordIds`
   (a Set). If the list cannot be read, return 502 and do not send.
9. In `computeStatementBenchmark`, skip any record whose `id` is in
   `excludedRecordIds` before the dedupe step. Count the skips.
10. Also fetch the set of Identity tokens (one paginated list, tokens only)
    and pass it as `options.allowedTokens`. Any Responses token not in the
    set is skipped before dedupe. Count the skips separately.
11. Log a warning naming both counts when either is non-zero.
12. Tests: an excluded record id is skipped; a token absent from
    `allowedTokens` is skipped; omitting either option leaves behaviour
    unchanged; an unreadable list makes the results email return 502.
12a. `vercel.json` `functions` `includeFiles` must ship the list with the
    results-email function, as it already does for the participation count.

### B3. No `test` origin value

Dropped. `research/excluded-responses.json` is the approved and only
exclusion mechanism. Future test runs are added to that list on Graham's
say-so with a decision-log reference, per the file's own comment.

### B3a. `retake` origin value and retake tokens

13a. Add `retake` as a new choice on Identity field `fldzOXQwAKsJFvjx4`
     (schema change via the Airtable UI or API; note it in the commit).
13b. Add a single-line text field on Identity, `Previous Token`, to hold the
     participant's earlier token. Record the new field ID in the commit
     message and in the `IDENTITY_FIELD` maps.
13c. In `api/research-invite.js` (or a one-off script under `scripts/`,
     whichever matches how owner invites are currently minted), support
     creating a retake invite: new token, origin `retake`, `Previous Token`
     set, name and email copied from the existing Identity row, invite
     status `Not sent`. Do not modify the existing row's token; the earlier
     Responses row must stay reachable by it.
13d. Participant journey: `research-lookup.js`, `research-save-progress.js`,
     `research-submit.js` treat origin `retake` like `owner_invite`, and
     write `submissionOrigin` as `retake` on the Responses row.
13e. Benchmark: retake responses are included in the pooled cohort (they are
     v5 responses). `cohortSize` is unchanged in meaning. Add
     `retakeCount` to the benchmark provenance so the results email and page
     can disclose it.
13f. Nothing in this step pre-fills scale answers or comments from the
     earlier response. If a later change proposes that, it needs its own
     decision-log entry.
13g. Tests: a `retake` token completes the journey; its Responses row carries
     `submissionOrigin` `retake`; the benchmark counts it once; `retakeCount`
     reports it; the earlier token still resolves to the earlier Responses
     row.
13h. Mint the nine retake tokens only after Graham has sent the retake email
     text through his review sequence; the brief does not authorise sending.

### B4. Gate reconciliation in the participant-facing path

File: `api/research-results-email.js` and the results page copy.

14. Add a constant `BENCHMARK_ANNOUNCE_MIN_PARTICIPANTS = 30` alongside the
    existing `BENCHMARK_MIN_COHORT = 15`, with a comment explaining that the
    first is the pre-registered participant gate and the second is the
    per-statement observation floor.
15. Until the pooled cohort (`benchmark.cohortSize`) reaches 30, the results
    email and page show "X of 30 completions so far; your comparison
    unlocks at 30" rather than any means, even where a statement has 15
    observations. Keep the provenance block as it is.
16. Test: cohortSize 29 shows no means; cohortSize 30 shows means where the
    per-statement floor is met.

### B5. Verification before push

17. `npm test` green.
18. Run the results-preview endpoint and confirm the email renders the
    "X of 30" state with the current data.
19. Query Airtable directly and confirm `cohortSize` after pooling equals
    the number of distinct v4 plus v5 tokens that have an Identity row (14
    on 27 October, or 13 if the borderline v4 Research orphan is removed).
20. Commit message references the decision-log entry date. Do not push
    until Graham has read the diff.

### Out of scope for this brief

- Pooling v1 to v3. Not approved.
- Per-discipline benchmark cuts. Gate is n>=8 and no discipline except
  Product Management is there on the pooled cohort.
- The completer email. Waits on this change shipping and on the retake
  round landing first.
- The then-versus-now view for retakes (Decision 5, later addition).
