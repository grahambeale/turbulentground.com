# Benchmark compatibility, revision 2: pool V4 and V5, orphan guard, gate reconciliation, retakes

Date: 2026-10-27. State: specification awaiting Graham's decision.
Supersedes nothing in revision 1. Revision 1's exclusion of V1 to V3 stands.
Source of this packet: Cowork session with Graham, 26 and 27 October 2026.
Airtable intake: none (no Airtable item), consistent with every Phase 4
entry in `operations/decision-log.md`. Intake is the decision-log row drafted
at the end of this file. Graham's decision: Pending.

## Problem

1. The participant-facing benchmark compares only same-version completions.
   On 27 October the V5 cohort was 5 and V4 was 9. Neither reaches any gate,
   and most participants emailed about the benchmark would never see one on
   the version they completed.
2. Five test completions, all Graham's own, were identified and approved for
   exclusion on 6 October (`operations/decision-log.md`, two entries that
   day). The approved mechanism is `research/excluded-responses.json`, which
   the homepage participation count reads and fails loudly without, and
   which states that any benchmark or analysis must read the same list.
   The benchmark (`api/_research-benchmarks.js`) and the results email do
   not read it. Four of the five were counted in the benchmark cohort until
   27 October.

   Deviation, 27 October: the drafting session recommended, and Graham
   carried out, deletion of four of those five Responses records
   (`recSb8eWUrKUCQWdT`, `recCl7XWscZCUUbMy`, `rec3L74uHSmNBHjMr`,
   `recJ9ffZOxOK2j3IP`). That contradicts the 6 October decision to keep the
   records untouched and append-only. Cause: the session read the code and
   the data but not the decision log before recommending. Correction
   requested of Graham: restore the four from Airtable's trash while it
   still holds them. The exclusion list remains the mechanism.
3. Two gates were being conflated: the code's per-statement floor of 15
   observations and the pre-registered participant gate of 30 completions.
4. Thirteen people completed V1 to V3 and cannot be compared with anyone.

## Evidence

- Programmatic comparison of `api/_research-instruments.js`: all 24 statement
  texts, domain keys, storage fields, scale and order are byte-identical
  between V4 and V5. The only change is `V5_EXAMPLES`, the optional help under
  each statement.
- `research/index.html` renders that help collapsed (`help.hidden = true`)
  behind a toggle in both versions. A participant who never opened it
  answered an identical instrument.
- `api/research-submit.js` refuses any token without an Identity row (403),
  so every orphan once had one.
- `api/_research-benchmarks.js` dedupes by token but performs no Identity
  existence check.
- Responses table, 27 October, completed rows by version after the four
  deletions: V1 6, V2 5, V3 2, V4 9, V5 5. Total 27, of which one
  (`recTBBSB5qhlxbB3C`, V4) is on the exclusion list. Real completions 26.
  Pooled V4 plus V5 after exclusions: 13.
- Recruitment-route evidence: 60 distinct people invited directly, 23
  completed (about 38 per cent). One community post (Product Network UK,
  7 October) produced one completion, possibly two.
- Methodology review run 27 October (research-methodology-reviewer): pooling
  is defensible if the entry names the count as trigger and design as
  justification, states equivalence as an assumption, and pre-commits a
  reversal criterion. Serious findings: construct validity (help text changed),
  analysis integrity (decision made after seeing counts). Both addressed below.

## Decisions requested

### D1. Pool V4 and V5 into one benchmark cohort

Trigger: the count. Justification: the design. Equivalence is assumed on
design grounds, not demonstrated, and cannot be at current n.

Reversal criterion, pre-committed: when V4 and V5 each have at least 15
completions, compare per-statement means. If the absolute difference exceeds
0.5 on the 1 to 5 scale for more than 4 of 24 statements, pooling is reversed,
the benchmark is recomputed on V5 alone, and every participant who received a
pooled comparison is told.

Disclosure: any published comparison states the cohort spans two versions
differing in optional explanatory examples, equivalence assumed.

V1 to V3 remain unpooled.

### D2. Benchmark reads the approved exclusion list; Identity check as second guard

Primary: `api/_research-benchmarks.js` and `api/research-results-email.js`
read `research/excluded-responses.json` through the same loader the
participation count uses, skip every id in it, and fail with a 502 if the
list cannot be read. One list, as the file itself requires. No new origin
value is introduced; a second exclusion mechanism is what the list forbids.

Secondary: the benchmark also excludes any Responses token with no Identity
row (existence check at compute time, not a link field; the two-store
separation is unchanged). A non-zero count from either guard is logged as a
warning so it is visible in Vercel logs.

Record-keeping: Airtable Responses records are append-only. Test runs are
excluded by the list, never by deletion. The four records deleted on 27
October are to be restored from trash.

### D3. Gate reconciliation

Both gates stand and are named separately in code:
`BENCHMARK_MIN_COHORT = 15` (per-statement observation floor) and
`BENCHMARK_ANNOUNCE_MIN_PARTICIPANTS = 30` (pre-registered participant gate).
The results email and page show no means until the pooled cohort reaches 30,
even where a statement clears 15. Until then the participant sees
"X of 30 completions so far; your comparison unlocks at 30".

Graham's position of 27 October: keep 30, do not re-register it downward. A
date gate is to be added by Graham before the first participant email: if the
pooled cohort has not reached 30 by that date, publish as a pilot with
limitations stated. Date: ____________ (Graham to set).

### D4. Earlier-version participants may retake

The nine V1 to V3 completers who consented to study emails and have an
address on file may be invited to complete the current instrument. A retake
is their first response on the paired instrument, not a duplicate. Each
retake gets a fresh token with origin `retake`; the earlier token is recorded
on the Identity row in a new `Previous Token` field; scale answers are never
pre-filled; the earlier response is kept. Pre-committed check: when retakes
number 5 or more and first-time pooled responses 15 or more, compare
per-statement means; if more than 4 of 24 differ by over 0.5, report the
benchmark both ways. Retake count is disclosed alongside the benchmark
regardless. A then-versus-now view on the retake results page is logged as a
later addition, built on the first real retake.

### D5. Sampling method recorded

Cohort plus referral (D03 to D07, phase-3-1 revisions 2 and 3) plus public
self-service. Referred participants are expected to resemble referrers;
invite source is recorded per token and routes are separable in analysis.
Any write-up states this. Paid advertising was considered 26 October and
parked.

## Affected users

All 27 current completers (results page and any future email), the nine
retake candidates, and every future participant.

## Exclusions

- Pooling V1 to V3.
- Per-discipline cuts (gate n>=8; only Product Management is there).
- Pre-filling any answer or comment on a retake.
- Sending any participant email. Each email is its own externally
  communicative action and needs its own authority.
- The then-versus-now retake view.

## Privacy, accessibility, research implications

Privacy: no new personal data. `Previous Token` holds a token, not a name,
and lives in Identity. The orphan guard reads tokens only. Research: see
D1 and D4 reversal criteria. Accessibility: the "X of 30" state is text; no
new interactive element.

## Test plan

See `tasks.md`, steps 5, 6, 10, 13g, 16. `npm test` green. Results preview
rendered with real data and confirmed to show the "X of 30" state. Airtable
queried directly to confirm `cohortSize` equals distinct V4 plus V5 tokens
with an Identity row and not on the exclusion list (13 on 27 October).

## Rollback

Set `CROSS_VERSION_GROUPS` back to empty and `BENCHMARK_POLICY_ID` back to
v1. Provenance stored with each results email records which policy computed
it, so affected participants are identifiable by policy ID without reading
responses.

## Decision-log row (intake)

| 2026-10-27 | Benchmark compatibility revision 2: pool V4 and V5, benchmark reads the exclusion list, gate reconciliation, retakes, sampling method recorded | none (no Airtable item) | `research/openspec/changes/benchmark-compatibility/revision-2` | Proposed, awaiting Graham's decision. Also records a deviation: four excluded test records were deleted from Airtable on 27 October against the 6 October append-only decision; restore from trash requested. |

## Implementation preview

`implementation-preview-benchmarks.diff` shows the `_research-benchmarks.js`
change for D1 to D3. It is a preview, not an applied change. Callers,
schema changes and tests are specified in `tasks.md` and are not yet written.
