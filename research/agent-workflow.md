# Turbulent Ground research project: on-demand agent workflow

**Version:** 1.0

**Applies to:** the invite-only research study and its participant experience

**Does not apply to:** the wider Turbulent Ground site, Care Capital diagnostic,
learnings library, homepage, or the main-site sprint experiment

## Purpose

This workflow lets agents improve the research project when work is needed. It
has no weekly cadence, sprint number, standing vote, or requirement to invent
and deploy work. A run begins only because Graham requests it or approves a
specific item in the Research Project Feedback table.

The canonical feedback queue is the **Research Project Feedback** table
`tbltQDAUZ8FF0ZDvA` in the **TurbulentGround Research** Airtable base
`app7dKDinTjxczEfD`.

## Scope boundary

Research work includes:

- the invitation, consent, questionnaire, save-and-return flow and results;
- research-specific email, unsubscribe and participant communications;
- research methods, question wording, scoring and benchmark presentation;
- research accessibility, privacy, security, analytics and administration;
- files under `research/**`, `api/research-*.js` and research-specific tests.

General website feedback is out of scope. Flag it for manual rerouting. Do not
silently turn it into research work.

The research workflow is independent of `_experiment/sprint-state.json`. Do
not claim a sprint, wait for a sprint day, add research work to sprint logs, or
allow an open but idle main-site sprint to block an approved research item.

## Authority to act

A run must have one of these triggers:

1. **Direct request:** Graham explicitly asks for a research-project change.
   That request authorises the described change, subject to normal safety and
   privacy limits.
2. **Approved feedback:** a record in Research Project Feedback has a clear
   proposed solution and Graham's decision is `Approved` or `Approved with
   changes`. Implement only what was approved.
3. **Review request:** Graham asks an agent to inspect new feedback. Review and
   propose, but do not implement until he approves.

Analytics, an agent observation, or a participant comment may create a work
item or proposal. It does not authorise implementation by itself.

## Session lease

`research/work-state.json` prevents two research agents changing the shared
project at once.

1. Read and parse it before any research action.
2. If `active_run` is set and `lease_expires` is still in the future, stop and
   report who holds the research lease and what item they are handling.
3. If the lease expired, report the takeover and resume from
   `last_checkpoint`; do not redo completed work.
4. Before a mutating run, write a unique provider-namespaced `active_run`, the
   observed runner, a concise `work_item`, phase, start time, a two-hour fixed
   expiry, and the last completed checkpoint. Read it back to confirm the claim.
5. Update `phase` and `last_checkpoint` at meaningful handoffs.
6. As the final state action, clear every field back to `null`.

A read-only review may proceed without claiming the lease if it cannot alter
files, Airtable records, messages or external state.

## Shared-checkout safety

The research and main-site systems share one checkout even though their work
queues are separate.

- Inspect the working tree before writing.
- Never overwrite, stage or commit another session's changes.
- If another active session is changing an overlapping file, stop.
- If changes are disjoint, research work may proceed without joining the
  main-site sprint.
- Keep commits limited to the approved research work. Verify the exact staged
  diff before committing.

## Run sequence

### 1. Intake and evidence

Identify the direct request or Airtable record. Preserve participant feedback
verbatim. Keep interpretation in `Agent assessment`; do not rewrite the source
comment. Check for duplicates and inspect only the evidence needed.

### 2. Propose

For unapproved feedback, write:

- the problem and who it affects;
- the evidence and any uncertainty;
- a concise proposed solution;
- methodological, privacy and accessibility implications;
- a proportionate test plan.

Set the record to `Awaiting approval` and ask Graham to approve, amend, defer
or reject it. Stop there.

### 3. Preflight

For approved implementation, test only the capabilities the run will use:

- required files and current working-tree state;
- Airtable read/write if the run updates a feedback record;
- local test or browser path needed for verification;
- repository write/push path if a commit is requested;
- production and deployment access if the change will be released.

A configured connector is not proof that it works. Never replace missing data
or a failed check with an estimate.

### 4. Implement

Make the smallest coherent change that satisfies the approved outcome. Keep
participant data out of source files, fixtures, logs, commits and prompts.
Maintain WCAG 2.2 AA, plain language, research validity and the commitments in
`privacy.html` and `privacy.md`.

### 5. Verify

Run proportionate regression, accessibility and methodological checks. For
changes affecting submission, email, consent, results, save-and-return or
unsubscribe, test the complete affected journey rather than an isolated screen.
Do not claim production success from a local preview.

### 6. Record and release

Update the Airtable record with what changed, test evidence, commit and live URL
where applicable. Status meanings are:

- `New`: captured, not yet assessed;
- `Under review`: evidence is being examined;
- `Needs clarification`: Graham's input is required before a sound proposal;
- `Awaiting approval`: proposal ready, no implementation authorised;
- `Approved`: implementation authorised;
- `In progress`: an agent has claimed the approved work;
- `Shipped`: committed, pushed, deployed and verified live;
- `Deferred`, `Rejected`, `Duplicate`: closed without implementation for the
  stated reason.

A run may correctly finish after review, proposal, local implementation or a
blocked verification. There is no requirement to deploy something merely to
complete a run. Say exactly where the work stopped and what remains.

## Privacy and research integrity

- Participant response data stays in Airtable and approved research services,
  never in this repository.
- Do not copy names, email addresses, tokens, free-text responses or individual
  scores into agent reports unless strictly necessary for the requested task.
- Use aggregate benchmarks only when the inclusion rules permit them, and state
  uncertainty in early or small samples.
- Never change question meaning, scoring direction, consent, lawful-basis copy
  or benchmark inclusion rules as a cosmetic edit. Flag the research impact.
- Never contact a participant, publish a quote or identify a respondent without
  the specific authority and consent required for that action.

## Completion report

Tell Graham:

- the outcome, in plain language;
- what was changed or proposed;
- what was verified and what was not;
- the Airtable record, commit and live URL when they exist;
- any decision or access still needed from him.
