# Phase 4 Release 1 — local implementation review

**Status:** Local implementation complete; commit, push and release unapproved  
**Implementation authority:** Release 1 governance implementation revision 1  
**Airtable:** `FB-20260930-PHASE4-REL1-GOV`

## Implemented

- Added `PHASE-4.md` as the concise product-direction entry point.
- Added the canonical `operations/workflow.md` and exclusive
  `operations/work-state.json` lease.
- Added an append-only decision index, backlog index and safe handoff format.
- Replaced the separate Codex and Claude lane bootstraps with equivalent shared
  workflow instructions; retained only Claude's verified local-terminal note.
- Added compatibility banners to the former sprint and research protocols
  without rewriting their historical content.
- Recorded the exact local implementation approval.
- Inspected the live Airtable schema and prepared a separately gated schema
  change packet at `airtable-schema-change.md`.

No public HTML, CSS, JavaScript, API, email, participant record, redirect,
analytics configuration or deployment setting was changed.

## Verification

### Static and structural

- New and changed JSON parses successfully.
- Every required governance path exists.
- Both bootstraps reference the same canonical workflow and lease.
- Synthetic lease decisions pass for a free lease, an unexpired competing lease
  and an expired takeover.
- Strict Phase 4 OpenSpec validation passes.
- `git diff --check` passes for the scoped files.

### Fresh-runner discovery

A new read-only Codex CLI session independently reported:

1. canonical workflow: `operations/workflow.md`;
2. sole active lease: `operations/work-state.json`;
3. `_experiment` and `research` workflows: compatibility-only;
4. implementation approval does not imply production release.

A new read-only Claude Code session, capped at USD 0.10, independently returned
the same four answers. Neither session modified the repository.

### Airtable

- Live base and table discovery passed.
- Release 1 implementation approval is recorded on
  `FB-20260930-PHASE4-REL1-GOV`.
- Schema proposal `FB-20260930-PHASE4-AIRTABLE1` was created as Awaiting
  approval.
- No table, field, choice, automation or historical record was mutated.

## Known limits

- The schema proposal still needs its own decision and automation/view
  inventory before mutation.
- No commit or preview exists because neither was authorised by revision 1.
- The existing unrelated working-tree changes remain untouched; any future
  commit must use an explicit allowlist.
- The legacy state files remain in place for transitional conflict detection.

## Next gate

The local governance implementation is ready for commit and a GitHub/Vercel
preview only if Graham explicitly authorises those actions. Production release
would remain a later, separate decision after reviewing the committed diff and
any preview evidence.
