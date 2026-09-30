# Turbulent Ground product-change workflow

**Version:** 1.0  
**Effective:** Phase 4 Release 1  
**Applies to:** every new product change, regardless of whether it starts in
Codex, Claude, Airtable, a browser annotation, participant feedback or a
scheduled runner

## Purpose

This is the single operational workflow for Turbulent Ground. It replaces the
old split between the main-site sprint protocol and the research-project
workflow for new work. Historical records remain readable and must not be
rewritten.

## Sources of truth

- `operations/work-state.json` — the only active product-change lease.
- Airtable — intake, status, Graham's decisions and release decisions.
- OpenSpec — evidence, requirements, design, architecture, acceptance criteria
  and exact revision hashes.
- Git — implementation history after commit authority is granted.
- Production — final evidence of a released outcome; preview or local success is
  never production verification.

`operations/backlog.md` and `operations/decision-log.md` are indexes. They do
not replace Airtable or OpenSpec.

## Start every task

1. Read `operations/work-state.json`.
2. If `active_run` is non-null and `lease_expires` is in the future, stop and
   report its runner, work item and checkpoint. Do not write files or external
   records.
3. If the lease expired, report the takeover and resume from `last_checkpoint`.
4. Read `PHASE-4.md`, this workflow and the relevant Airtable/OpenSpec item.
5. Inspect the shared working tree. Preserve unrelated and unowned changes.
6. Preflight only the capabilities required by the task. A configured tool is
   not proof that it works; never substitute an estimate for unavailable data.
7. Before any mutation, claim the shared lease with a provider-namespaced run
   ID, observed runner, work item, phase, start time, fixed two-hour expiry and
   last completed checkpoint. Read it back to confirm the claim.

A read-only inspection may proceed without a lease only when it cannot alter
files, external records, messages or application state.

## Authority model

- A direct request from Graham authorises the described work when its scope is
  clear. Record or link it in Airtable before material implementation.
- Feedback, analytics and agent observations provide evidence, not authority.
- Material ambiguity or a materially different solution requires a proposal.
- Specification approval, implementation approval and production-release
  approval are separate gates. Never infer one from another.
- A request to commit does not authorise a push. A push to preview does not
  authorise production. A local or preview success does not prove production.
- Destructive, costly, privacy-sensitive or externally communicative actions
  require the specific authority appropriate to that action.

## Product-change sequence

### 1. Intake

Create or link one Airtable decision. Preserve user and participant feedback
verbatim. Keep agent interpretation in assessment fields. Mark duplicates
rather than silently merging their source evidence.

### 2. Evidence and proposal

Collect only the evidence needed. State gaps and uncertainty. For a material
change, publish an OpenSpec packet containing the problem, affected users,
requirements, exclusions, privacy/accessibility/research implications, test
plan and rollback.

Set the Airtable item to `Awaiting approval`, set Graham's decision to `Pending`
and ask for approve, approve with changes, defer or reject.

### 3. Exact approval

Record Graham's decision quote, source, timestamp, revision and file hashes.
Material amendments create a new revision and reset the decision to Pending.
Approval of a parent direction does not approve a child implementation packet.

### 4. Implementation

Make the smallest coherent change within the approved packet. Maintain WCAG
2.2 AA, plain language, data minimisation and research validity. Keep personal
data, participant tokens and private responses out of source, fixtures, logs,
commits and prompts.

Use a dedicated `codex/` branch for Codex implementation unless Graham directs
otherwise. Never stage or commit another active session's work. Stage from an
explicit allowlist and inspect the exact staged diff.

### 5. Verification and preview

Run proportionate regression, accessibility, security, privacy and journey
tests. Where an affected flow includes consent, submission, email, results,
save-and-return, unsubscribe, invitation or referral, verify the complete
affected journey.

When a preview is authorised, push only the reviewed commit, reconcile the
commit SHA with the deployment and record the preview URL and evidence in
Airtable. Set release decision to `Awaiting approval` and stop.

### 6. Release

Release only when the exact implementation's Release decision is `Approved` or
Graham directly and explicitly authorises production. Merge or apply only the
reviewed commit, verify the production deployment and exercise the real
affected journey. Record commit, deployment and live evidence.

### 7. Close and release the lease

Update Airtable status, decisions, evidence, URLs, blocker and next action.
Append the durable outcome to `operations/decision-log.md`. Clear every mutable
field in `operations/work-state.json` to `null` as the final state action.

## Shared lease rules

- Only one product-change lease may be active.
- Lease expiry is authoritative; do not use an additional informal timeout.
- A runner may describe only actions it observed or performed.
- Update `phase` and `last_checkpoint` at meaningful handoffs.
- If the run stops while another person must act, release the lease after
  recording a resumable checkpoint in Airtable/OpenSpec or a handoff file.
- Do not store secrets, participant data or access tokens in the lease.

## Handoffs

Follow `operations/handoffs/README.md`. A handoff resumes work; it does not
restart discovery or silently expand scope. Corrections are new entries, never
rewrites of historical evidence.

## Compatibility with former workflows

`_experiment/orchestration-prompt.md`, `_experiment/sprint-state.json`,
`research/agent-workflow.md` and `research/work-state.json` remain historical
and transitional inputs in Release 1.

- Do not create a new sprint or research lease for Phase 4 product work.
- A legacy scheduled run already active at cutover may finish only its recorded
  checkpoint; it must not claim new Phase 4 scope.
- If a legacy state reports an active unexpired session, treat it as a possible
  overlapping writer and stop for reconciliation even when the shared lease is
  free.
- Historical logs are append-only evidence and are never imported by rewriting
  or deleting their original files.

Retirement of compatibility files requires its own reviewed change.

## Status vocabulary

Use the existing Airtable vocabulary consistently: `New`, `Under review`,
`Needs clarification`, `Awaiting approval`, `Approved`, `In progress`,
`Awaiting release approval`, `Releasing`, `Shipped`, `Changes requested`,
`Blocked`, `Release failed`, `Deferred`, `Rejected`, `Duplicate`.

Keep `Blocker` blank while safe progress is possible. Say exactly where work
stopped and what authority or evidence is still required.
