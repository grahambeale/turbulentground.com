# Automatic handoff after Graham's decisions

On 13 September 2026 Graham authorised automatic continuation after Airtable
approval. The existing Codex heartbeat `review-research-feedback` was updated
through the Codex automation tool, and its saved configuration was read back
**at that time**. It was then active and attached to task
`01a0458e-3900-7642-90ab-76448e63906d`, displayed as **Continue approved
research work**. No duplicate automation was created.

**Current state (reconfirmed 15 September 2026):** Read directly from
`/Users/graham/.codex/automations/review-research-feedback/automation.toml`
(the Codex desktop automation's own saved configuration, not a claude.ai
routine). `status = "ACTIVE"`. Its schedule is
`RRULE:FREQ=WEEKLY;BYHOUR=9;BYMINUTE=0;BYDAY=SU,MO,TU,WE,TH,FR,SA` — every day
of the week at 09:00, i.e. **daily at 09:00**, not every five minutes. The
five-minute cadence stated elsewhere on this page previously described this
automation incorrectly; that interval belongs to the separate
`test-product-feedback-processor` automation ("Process website product
feedback"), which is a distinct ACTIVE heartbeat scheduled
`RRULE:FREQ=MINUTELY;INTERVAL=5`, confirmed the same way from
`/Users/graham/.codex/automations/test-product-feedback-processor/automation.toml`.
It processes `Feedback submissions` (`tblgNzJHlurSlPGL9`) rather than the
Research Project Feedback queue this heartbeat handles, and is not otherwise
documented on this page.

The heartbeat reads authenticated records in Research Project Feedback. New or
activated evidence goes through specification drafting and Graham review first.
It preserves DEFER/MERGE and never creates Graham's approval. A merge records
the target while preserving both sources; it does not activate target work.

For approval, Graham identifies the current specification revision in Review
notes and selects Approved, or Approved with changes with clear amendments.
The heartbeat compares the published packet with the local manifest, verifies
the actual decision and notes, records their source and digests, then rechecks
immediately before work. Historical approval fields cannot approve new revisions.
The original pilot's gate tools do not validate other tickets; those use the
authenticated verification described in TICKET-SPECS.md.

Verified specification approval starts its scoped prototype or review artifact
without a further “continue” message. The heartbeat tests and verifies the
preview and records its URL, commit and verification in Airtable. Each new
implementation commit returns Release decision to Awaiting approval. Graham's
explicit approval of that exact reviewed commit is required for production.

The heartbeat respects the independent research lease, processes at most one
implementation or release per run, preserves shared changes, and uses synthetic
test data. It stays quiet when nothing is actionable. Graham is notified when a
specification, preview or verified release is ready, or input or a failure needs
attention. Access restrictions and automatic approval review still apply.

This is a scheduled Codex agent workflow, not an Airtable-native trigger. The
daily 09:00 schedule is a check interval, not a guarantee of completion time.
The saved configuration is verified (see "Current state" above), but whether
any given scheduled run actually produced a handoff is an operational outcome,
not something this configuration proves either way — verify it from the
Airtable record's own history (Last agent run, Verification, Commit) and from
the automation's own task/run history, not by inference from its schedule.
