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

A production release approval names a branch and covers the head commit that was
previewed and reported at the time of approval. Before releasing, confirm the
branch head still matches that commit. If it has changed, the approval lapses:
stop and request approval again, quoting the new head.

An approval survives a rebase onto a moved base if, and only if, all three hold:

1. the change set is patch-identical to the approved head: `git range-diff` of the
   approved commits against the rebased commits shows every commit as unchanged
   (`=`), with no content change, including no conflict resolution that alters a line;
2. the pre-push hook passes on the new head; and
3. the report to Graham quotes both heads, the approved head and the rebased head,
   and says the change set was proven identical.

Any content change, however small, still lapses the approval: stop and request
approval again, quoting the new head. A conflict that needed a manual edit counts as
a content change unless `git range-diff` still shows the commit unchanged.

#### Releases go through `scripts/release.sh` only

Production releases are made with `scripts/release.sh BRANCH APPROVED_HEAD`, where both come from
Graham's approval ("approve production release: BRANCH (HEAD)"). It is the only sanctioned release
path: do not push to `main` by hand, with `git push`, from a script of your own, or with
`--no-verify`. The script, in order and stopping everything at the first failure:

1. takes the work-state lease (and refuses if another run holds it);
2. verifies `origin/BRANCH` is exactly the approved head, otherwise the approval has lapsed;
3. rebases onto `origin/main` in a throwaway worktree;
4. requires `git patch-id` equality between the approved commits and the rebased commits, the same
   content in the same order (a conflict, a merge commit or any difference aborts with a message);
5. pushes to `main` through the pre-push hook;
6. waits for the Vercel production deployment of the pushed commit;
7. runs the relevant smoke specs against production, one at a time and throttled
   (see Verification crawls);
8. releases the lease.

Use `--dry-run` to do steps 1 to 4 only. If it stops after the push (the deployment fails, or a
production spec fails), the commit is already on `main`: do not push again; fix the cause and run
`scripts/release.sh --verify-only MAIN_SHA`. The report to Graham quotes the approved head and the
released head and says the patch-ids matched. `--specs a,b` overrides the automatic spec choice.
It needs `gh` (authenticated), `python3`, `node_modules` in the shared checkout and
`core.hooksPath=scripts/hooks`.

### 7. Close and release the lease

Update Airtable status, decisions, evidence, URLs, blocker and next action.
Append the durable outcome to `operations/decision-log.md`. Clear every mutable
field in `operations/work-state.json` to `null` as the final state action.

## Push discipline and the pre-push hook

Never push with a failing test; command chains must stop on first failure (set -e or &&).

A hook enforces it. `scripts/hooks/pre-push` is committed to the repository and runs, for
the exact commit being pushed (in a throwaway worktree, so uncommitted changes and the
checked-out branch do not matter): `npm run build` (it fails if that changes any tracked
file, meaning the generated pages are stale), `npm test`, and the Playwright smoke suite in
`tests/smoke` (except `diagnostic.spec.js`, which drives the live site) against that commit
served locally. Any failure blocks the push. Deleting a remote branch is not tested. It
takes a few minutes, which is the point.

Install it once in every clone (it covers all of that clone's worktrees):

    sh scripts/hooks/install.sh

That sets `core.hooksPath` to `scripts/hooks`. Check with `git config core.hooksPath`. It
needs `node_modules` in the clone (`npm ci`), Playwright's browsers (`npx playwright
install chromium`) and `python3`. Do not bypass it with `--no-verify`: a push that needs
a bypass is a push that must not happen. If the hook itself is wrong, fix the hook in its
own change. Production smoke runs (`SMOKE_TEST_BASE_URL=https://www.turbulentground.com
npx playwright test`) remain a separate post-release check.

### Verification crawls

Throttle every crawl or hash check against production or a preview: one request at a
time or small concurrency (4 at most) with a delay of about 1 second between requests,
and pause between batches of roughly 100 requests. Bursts trip Vercel's Security
Checkpoint (a 403 with `x-vercel-mitigated: challenge`), which blocks that IP or browser
session for several minutes and makes later results look like failures. If a 403 carries
that header, it is the checkpoint and not the site: wait, slow down, and re-check from
the authenticated browser pane or the Vercel connector rather than recording a failure.

## Shared lease rules

- Only one product-change lease may be active.
- Take the lease for any session that pushes to the remote or writes to Airtable,
  including investigations, doc-only changes and review-branch refreshes. Read-only
  work that touches neither needs no lease. Claim it before the first push or
  Airtable write, keep `phase` and `last_checkpoint` current, and clear it last.
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
