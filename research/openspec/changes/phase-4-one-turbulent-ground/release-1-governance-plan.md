# Phase 4 Release 1 — governance implementation plan

**Status:** Proposed for Graham's implementation approval  
**Authority:** Phase 4 specification revision 1 and design/architecture revision 2  
**Release 1 outcome:** one model-neutral product-change workflow shared by Codex and Claude  
**Not authorised:** implementation, schema mutation, commit, preview, merge or production release

## Why Release 1 comes first

Phase 4 spans the homepage, participant journey, invitations, privacy, administration and legacy routes. Implementing those changes while the repository still has separate main-site and research control systems would recreate the split Phase 4 is intended to remove. Release 1 therefore changes governance only; it does not change the website or participant experience.

## Intended implementation

### 1. Canonical product brief

Create a tracked root `PHASE-4.md` that points to the approved OpenSpec package and states the durable product decisions in plain language. It is an orientation document, not a second specification.

### 2. Shared operating layer

Create:

```text
operations/
├── workflow.md
├── work-state.json
├── decision-log.md
├── backlog.md
└── handoffs/
    └── README.md
```

- `workflow.md` is the single source of truth for product-change intake, evidence, specification, design, implementation, preview, release and verification gates.
- `work-state.json` carries one exclusive, expiring product-change lease with runner, work item, phase and checkpoint.
- `decision-log.md` is an append-only index of approved product decisions and their Airtable/OpenSpec references; it contains no participant data.
- `backlog.md` is an index, not a competing queue. Airtable remains authoritative for status and owner decisions.
- `handoffs/README.md` defines the minimum resumable handoff format without storing secrets or participant data.

### 3. Thin assistant bootstraps

Replace the lane-specific operational detail in root `AGENTS.md` and `CLAUDE.md` with equivalent thin instructions to read `operations/work-state.json`, `operations/workflow.md` and the applicable OpenSpec/Airtable item before acting.

Both bootstraps must say the same substantive thing. Provider-specific mechanics are allowed only when they describe a verified runtime capability; they cannot create different product gates.

### 4. Compatibility adapters

Keep `_experiment/sprint-state.json`, `_experiment/orchestration-prompt.md`, `research/work-state.json` and `research/agent-workflow.md` in place for the first governance release.

Add a clear supersession banner to the two legacy protocols and define how an existing scheduled run or historical record is read. Do not delete, rewrite or import historical sprint/research logs. New product changes use the shared lease and workflow after cutover.

### 5. Airtable scope migration

Before any schema write, inspect the live Research Project Feedback schema and produce an exact schema-change sub-packet. The preferred design is to broaden the existing decision table and add a `Lane` choice covering at least `Product`, `Participation`, `Content`, `Operations` and `Legacy`.

This plan does not itself authorise that schema mutation. If the live schema or automations make broadening unsafe, return with a linked-table alternative rather than creating a second unconnected queue.

### 6. OpenSpec gate

Document one invariant sequence for material product changes:

1. capture or link the Airtable decision;
2. collect evidence without inventing missing data;
3. publish an exact revisioned OpenSpec packet;
4. record Graham's approval against hashes;
5. implement on a reviewable branch;
6. verify a preview and affected journey;
7. obtain separate release approval;
8. deploy and verify production;
9. close the record with commit, URLs and evidence.

Direct messages to Codex or Claude enter this same sequence. A direct request supplies intent and, where explicit, implementation authority; it does not silently supply production-release authority.

## Files in scope

Expected tracked changes for the implementation review:

- `PHASE-4.md` — new;
- `operations/workflow.md` — new;
- `operations/work-state.json` — new;
- `operations/decision-log.md` — new;
- `operations/backlog.md` — new;
- `operations/handoffs/README.md` — new;
- `AGENTS.md` — thin bootstrap update;
- `CLAUDE.md` — thin bootstrap update;
- `_experiment/orchestration-prompt.md` — supersession/compatibility banner only;
- `research/agent-workflow.md` — supersession/compatibility banner only;
- compatibility state documentation if validation proves it necessary.

No site HTML, CSS, JavaScript, APIs, email templates, participant records, analytics configuration, redirects or Vercel settings are in Release 1.

## Acceptance criteria

1. A fresh Codex task and a fresh Claude Code session independently discover the same canonical workflow and state.
2. Both refuse a second active lease and can resume an expired lease from its checkpoint.
3. A product request received in either assistant produces or links the same Airtable/OpenSpec evidence trail.
4. Implementation approval and release approval remain separate and cannot be inferred from one another.
5. Existing main-site and research historical records remain readable and unchanged.
6. No participant data, access token or private Airtable content is introduced into tracked files.
7. The compatibility path for any scheduled legacy runner is documented and tested before legacy protocols are retired.
8. Markdown links resolve, JSON parses and the Phase 4 OpenSpec package passes strict validation.

## Verification plan

- Parse every new or changed JSON file.
- Run strict OpenSpec validation.
- Run repository link/path checks for all bootstrap references.
- Simulate: free lease, competing lease, expired takeover and checkpoint handoff.
- Start one clean Codex context and one clean Claude context against the shared checkout; record which instructions each discovers.
- Use a synthetic decision only—never participant data—to exercise Airtable/OpenSpec linkage.
- Confirm no product/runtime files appear in the staged diff.
- Confirm no production deployment is triggered.

## Rollback

Before release, rollback is deleting the new operating layer and reverting the bootstrap/banner changes. After release, restore the previous bootstraps as the active entry points, leave the new files intact for audit and set the shared workflow to suspended. Never roll back by deleting historical decision or handoff evidence.

## Known constraints

- Existing unrelated working-tree changes mean implementation must stage only an explicit allowlist.
- Airtable schema shape and automations require a separate live inspection before mutation.
- Any recurring Claude/Codex automation must be inventoried before the shared lease becomes authoritative.
- Release 1 does not solve route, privacy, admin or content migration; it makes those later changes governable.

## Decision requested

Approve this Release 1 governance implementation plan. Approval permits the listed repository changes and preparation of an Airtable schema-change sub-packet. It does not permit Airtable schema mutation, a Git push, preview deployment or production release without their subsequent gates.
