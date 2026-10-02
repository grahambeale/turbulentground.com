# Phase 3.1 staged build and rollback plan

**Status:** Proposed implementation sequence; approval does not release or activate anything.

## Feature flags — all default off

- `RESEARCH_PUBLIC_ENTRY_ENABLED`
- `RESEARCH_REFERRAL_ISSUE_ENABLED`
- `RESEARCH_REFERRAL_RESOLVE_ENABLED`
- `RESEARCH_SHARING_UI_ENABLED`
- `RESEARCH_INCOMPLETE_REMINDER_ENABLED`

A deployment cannot enable a feature by itself. Each flag requires a separate
recorded activation decision after its preview and production-disabled checks.

## Stage 1 — schema only

Create the approved Airtable fields/tables, capture their generated IDs in a
migration manifest and validate no existing view, automation or API path changes.
Rollback: remove only newly created empty fields/tables.

## Stage 2 — public identity and 14-day lifecycle, disabled

Build public start, private return credential, fixed expiry and maintenance
dry-run. Do not send reminders or delete data. Exercise only synthetic records.
Rollback: keep public-entry/reminder flags off and revert functions.

## Stage 3 — referral identity and attribution, disabled

Build issue, resolve, first-touch lock, conflict, self-referral and disable
paths against synthetic records. Public referral IDs must fail every private
participant endpoint.
Rollback: keep issue/resolve flags off; archive synthetic tables after review.

## Stage 4 — approved V1 sharing experience, disabled

Integrate the approved prototype after successful completion and behind
`RESEARCH_SHARING_UI_ENABLED`. Connect only the public referral link; keep the
private composer browser-only. Add protected results-email re-entry separately.
Rollback: disable the UI flag; completion and results remain unchanged.

## Stage 5 — maintenance rehearsal

Run count-only dry runs, then synthetic send/delete rehearsals. Verify one
reminder, fixed deadlines, withdrawals, retries and deletion evidence. No real
participant reminder or deletion occurs during rehearsal.
Rollback: remove the scheduler binding and keep the reminder flag off.

## Stage 6 — production deployment with all flags off

Release reviewed code, run invite-only regression and verify that no public
route, referral link, sharing UI, reminder or deletion behavior is active.
This requires a separate release approval.

## Stage 7 — controlled pilot activation

Activate one flag at a time in this order: public entry, referral resolve,
referral issue, sharing UI, then incomplete reminder. Stop after each step for
verification. Pilot activation requires a separate human decision from code
release and must define its start/end dates and monitoring owner.
