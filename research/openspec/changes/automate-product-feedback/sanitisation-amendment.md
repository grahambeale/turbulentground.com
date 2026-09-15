# Post-approval sanitisation amendment — 15 September 2026

This is not a new revision of scope or policy. It records a governance-hygiene
correction made after revision 2 was approved, and it requires Graham's own
explicit approval before this packet can be treated as the current approved
record.

## Why the personal address was removed

A governance-correction review found Graham's personal email address had been
copied, as plain operational context ("the connected Gmail account is
[address]"), into four already-approved packet files and into one fallback
identifier seed inside the packet's own code. It was not participant data and
was never a credential, but it does not belong in a document intended to enter
version control as part of the project's public-adjacent governance record.
The address has been removed and is not reproduced anywhere in this amendment.

## Files changed

- `evidence-snapshot.md`
- `proposal.md`
- `specs/automate-product-feedback/spec.md`
- `review.md`

Each had the identical sentence "Graham identified the connected Gmail account
as [address]; it receives mirrored iCloud mail." reworded to "Graham
identified the connected Gmail account used for this workflow, which receives
mirrored iCloud mail." No other wording, requirement, constraint, acceptance
criterion or decision in any of these four files was touched.

- `agent-preview/gmail-intake.mjs` — see the separate technical assessment
  below; this file is implementation code, not an approval-gated packet file,
  but the change is recorded here for completeness since it originated from
  the same sanitisation pass.

## The prose change does not alter the approved policy

The reworded sentence changes only how the Gmail account is identified in
prose. It does not change: which inbox is monitored, the scope restriction to
replies addressed to the public feedback address, the exclusion rules
(sent/drafts/spam/trash/automated replies), the Message-ID-based stable
identity rule, the six-month retention policy, the disabled state of Gmail
intake/receipts/retention execution, or any acceptance criterion in
`specs/automate-product-feedback/spec.md`. Every requirement Graham approved
in revision 2 is unchanged in substance.

## Whether the fallback-code change has a behavioural or compatibility effect

`gmail-intake.mjs` computes each source's stable ID as
`'EMAIL-' + hash(messageId || fallbackSeed)`. The fallback seed (previously
containing the personal email address, now a neutral string) is used **only**
when a message has no `Message-ID` header. That is a narrow, already-flagged
path: the same code path that reaches the fallback also always sets
`disposition: 'Needs review'` with reason `'Missing Message-ID; duplicate copy
handling needs review'` — such sources were never eligible for automatic
deduplication or retry matching under the original design, by the spec's own
requirement to route missing-ID sources to manual review.

Changing the fallback seed string does change the computed `source.id` for any
message that would take that fallback path, compared with the old seed. This
is a technical change, not a cosmetic one, and is recorded as such here.

**Compatibility check performed:** searched the live `Feedback submissions`
table (`tblgNzJHlurSlPGL9`) for any existing record whose Submission ID begins
with the `EMAIL-` prefix this normaliser produces — zero records found. This is
consistent with the packet's own prior evidence that Gmail intake has never
ingested a real message (a scoped recipient search previously returned zero
messages, the table was created empty, and Gmail intake remains disabled in
the shipped production configuration). No message content was read to reach
this conclusion — only the non-content Submission ID field was queried.

**Conclusion:** no previously processed source IDs exist that this change
could invalidate. The fallback seed change is safe to carry forward. If this
conclusion is later found to be wrong (a hidden earlier ingestion run, a
migrated identifier, etc.), the fallback change must be treated as a breaking
compatibility issue requiring its own review before Gmail intake is ever
enabled.

**Tests:** the existing synthetic tests (`gmail-intake.test.mjs`,
`retention-plan.test.mjs`, `validate-extraction.test.mjs`) were re-run after
these changes and pass. No real participant or mailbox data was used or added.

## Previously approved packet digests (historical, unchanged)

Recorded in `approved-revision-2.json` and preserved verbatim in
`review-packet.json` under `approved_files_historical`. Not reproduced again
here beyond noting that all four are SHA-256 digests of the pre-sanitisation
file contents, computed and pinned at the time Graham approved revision 2.

## New sanitised file digests

Recorded in `review-packet.json` under `files`, replacing the placeholder that
previously (incorrectly) still showed the pre-sanitisation digests as if they
were current. These are SHA-256 digests of the four files as they now stand,
after the wording correction above.

## Status

The original revision-2 approval (`approved-revision-2.json`) remains
historical evidence of what Graham approved on its own terms and is not
altered, overwritten, or reinterpreted by this amendment. It does not, by
itself, approve the sanitised text above — a packet whose file contents no
longer match its approved digests is not self-approving.

**This exact sanitised amendment — the four reworded files, the unchanged
policy, and the fallback-code compatibility assessment above — requires
Graham's own explicit approval before this packet can be committed as the
current approved record.** Until that approval exists, this file's status is
"awaiting approval," not "approved."

**Update, 15 September 2026:** Graham has approved this exact amendment. See
`sanitisation-approval.json` for the recorded decision, source and the
sanitised file digests it covers. This packet's `review-packet.json` now
reflects that approval. The original revision-2 approval in
`approved-revision-2.json` remains separate, historical, and unchanged.
