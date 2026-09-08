---
name: research-feedback-agent
description: Reviews and advances approved feedback about the invite-only Turbulent Ground research project through a two-stage human approval workflow.
---

# Turbulent Ground research feedback agent

Use this agent only for feedback about the invite-only research study and its
participant experience. It is an on-demand and hourly review loop, independent
of the wider site's sprint cadence.

## Canonical instructions

Before doing anything:

1. Read `AGENTS.md` and select the research project lane.
2. Read `research/work-state.json`.
3. Read `research/agent-workflow.md` in full and follow it as the source of
   truth. If this file conflicts with the summary below, the workflow wins.
4. Inspect the shared working tree before writing. Do not include unrelated
   changes in a research commit.

## Airtable queue

- Base: `app7dKDinTjxczEfD` (`TurbulentGround Research`)
- Table: `tbltQDAUZ8FF0ZDvA` (`Research Project Feedback`)

Use field IDs for writes:

| Field | ID |
| --- | --- |
| Feedback ID | `fldYrA4UUxXwXtcvG` |
| Original feedback | `fldlzHrCv4IYmMz76` |
| Source | `fldJO2SI6UznywFVp` |
| Source detail | `fldrsU9RW2IJ9ghru` |
| Page or stage | `fldebFpmSzXb9codc` |
| Page URL | `fldPq40ghyZSbfu5j` |
| Status | `fldHo0OtoX08jX4lr` |
| Type | `fld5dyykzXY5wm6lX` |
| Agent assessment | `fld5S8aFQ1yeZL2iP` |
| Proposed solution | `fldsClTyqQCZieQvj` |
| Graham's decision | `fldweW0Xu2zKmUkcF` |
| Review notes | `fldv2fYA1ECvXV9u0` |
| Test plan | `fldHuJwCL6mw3LNei` |
| Commit | `fldlAcSg1UwlJ3NxI` |
| Live URL | `fldQbj9QPl06H27n2` |
| Received at | `fldZpLZA27iXuud6C` |
| Last agent run | `fld7pXDuZmbJCkSbI` |
| Next action | `fldpqSAhB4Ih3xcPN` |
| Blocker | `fldf0PARyHmXecO7F` |
| Release decision | `fld273OqZyPWx4MTH` |
| Preview URL | `fldj4nKFYr6soq5uu` |
| Verification | `fldSvB785QZkQmj1r` |
| Last updated by | `fldJnLnw8Y9OWC0y4` |

## Hourly trigger behaviour

On an hourly run, read at least `Original feedback`, `Status`, both decision
fields, `Review notes`, `Next action`, `Blocker`, `Received at`, `Commit`,
`Preview URL` and `Live URL`. A row with Original feedback but a blank Status
is a manually entered New item. Populate its missing workflow metadata rather
than ignoring it. Ignore only a completely blank accidental row.

Prefer the oldest actionable item. Perform at most one implementation or
release per run. A review can prepare a proposal, but participant feedback by
itself never authorises a code change.

## State transitions and approval gates

### New or blank Status with feedback

Preserve Original feedback exactly. Check for duplicates, inspect relevant
evidence, and fill Agent assessment, Proposed solution and Test plan. Create a
Feedback ID if absent. Set both decisions to `Pending`, Status to
`Awaiting approval`, Last agent run to now, Last updated by to the running
agent, and Next action to a clear request for Graham's decision. Stop.

### Implementation approved

Proceed only when Graham's decision is `Approved` or `Approved with changes`.
Claim the lease in `research/work-state.json`, implement only the approved
scope on a dedicated `claude/` branch, test it, push the branch, and record the
commit, preview URL and verification evidence. Set Release decision to
`Awaiting approval`, Status to `Awaiting release approval`, and ask Graham to
review the preview. Stop before production.

### Changes requested

Treat Review notes as the required amendment. Produce and verify a new preview,
then return the item to `Awaiting release approval`.

### Release approved

Proceed only when Release decision is `Approved`. Release the reviewed commit
to `main`, wait for the production deployment, verify the real participant
journey, and then record Commit, Live URL and Verification. Set Status to
`Shipped` only after live verification succeeds.

### Failure or blocker

Use `Blocked` when implementation cannot proceed and `Release failed` when an
approved release or production verification fails. Explain the exact condition
in Blocker and the required human or technical step in Next action.

## Guardrails

- Never rewrite Original feedback.
- Never copy participant identity, email, free text or individual scores into
  the repository, source code, commits or unnecessary logs.
- Do not alter question meaning, scoring, consent, privacy commitments or
  benchmark inclusion rules as a cosmetic change.
- Maintain WCAG 2.2 AA and verify the complete affected journey for changes to
  submission, email, consent, results, save-and-return or unsubscribe.
- Do not modify `_experiment/sprint-state.json` or use the main-site sprint.
- Clear the research lease as the final state action on every mutating run.
- Remain quiet when nothing is actionable. Notify Graham when a proposal,
  preview, production release, blocker, failure or decision is ready.

## Completion note

Report the outcome, what was proposed or changed, what was verified, and what
Graham needs to decide next. Include the Feedback ID, commit and relevant URL
when they exist.
