# Phase 3 OpenSpec pilot

**Current state (added 15 September 2026):** `FB-20260911-TEVOGK` has shipped —
Airtable shows Status `Shipped`, Release decision `Approved`, commit
`3343293bda0415786f02a8281958e3a0b4d92e7f`, verified live in production, and
Next action blank. The G1/design/prototype/implementation-approval narrative
below describes the packet's history up to and including that release; where
it says an approval, decision or release "remains Pending" or has "not yet"
happened, that reflects the document's own dated snapshot, not the current
Airtable state, which shows no open decision on this ticket as of this
correction.

This project-local OpenSpec setup pilots a specification stage for the
invite-only research project. Its first change is grounded in Airtable feedback
`FB-20260911-TEVOGK` (`recXsGlAyZTEvogkV`), not Phase 2 leadership signals.

Start with
`changes/clarify-survey-journey/review.md`. The evidence snapshot deliberately
does not copy participant free text into the repository; the verbatim source
remains in the Research Project Feedback table.

The workflow is:

`Airtable evidence → proposal → product specification → Graham review (G1) → design/prototype → implementation/release gates`

Revision 2 has passed G1; `approval.json` records Graham's actual decision and
`design.md` presents two options. Comparison prototypes now exist. The dated
`approved-question-amendment.md` records Graham's separately approved 24 statements
from rationale v1.1 and supersedes the copy-only draft. The amendment extends the
historical packet rather than retroactively rewriting its approval. At the time
of that amendment, no production results policy approvals existed within this
TEVOGK packet's own scope. That has since changed under a separate ticket:
`FB-20260914-BENCH` (benchmark/results presentation) shipped with Graham's
explicit approval at commit `917f80a7dbf461dd239d7883a96df44e6547cf38` (see
`changes/benchmark-compatibility/release.md`). That approval belongs to the
benchmark-compatibility packet, not to this TEVOGK packet, and does not
retroactively grant this packet any results-policy approval it lacked.
`implementation-approval.md` records explicit
approval of paired order in existing styling, and `tasks.md` tracks implementation.
The historical approval record covers revision 2 only; later direct approvals are
recorded as dated amendments and must be checked at their actual source. Do not
generate approval from the template or infer it from ACT, “yes”, Airtable's
`Awaiting approval` status, or OpenSpec reporting the approval artifact ready.
Only a later explicit decision from Graham on this exact review packet can be
transcribed into `approval.json`.

The upstream Airtable queue retains `Deferred`, `Duplicate` and related-evidence
handling. Merging evidence preserves each source record and returns the combined
case to Graham; it never auto-approves work.

OpenSpec 1.13.0 is installed in `tooling/node_modules`, pinned by its package and
lock files. Restore it with `npm ci --prefix openspec/tooling --ignore-scripts`
from `research`. Use the project wrapper; a global install is unnecessary.

Commands, run from `research`:

- `node openspec/run-openspec.mjs schema validate research-spec-first`
- `node openspec/run-openspec.mjs validate clarify-survey-journey --strict`
- `python3 openspec/check-gate.py` (expected to block until G1 is approved)

This setup adds no website dependency. The Codex heartbeat `review-research-feedback`
is ACTIVE, checks Airtable daily at 09:00 (reconfirmed 15 September 2026 from
its own saved `automation.toml`, not a claude.ai routine — see
`AUTOMATIC-HANDOFF.md`), and continues work after verified approval of the
current specification. The existing `research/agent-workflow.md` remains
authoritative for implementation and separate release approval.

## Airtable review integration

The complete packet is published into **Proposed solution** on the pilot ticket.
Graham reads it there, edits **Review notes**, and chooses **Graham's decision**.
Original feedback and his notes are preserved. The Codex heartbeat supplies the
background handoff after Graham's decision. Defer/Merge still operate on evidence
before ACT.

After material edits, increment `review-packet.json` revision, run
`node openspec/airtable-sync.mjs refresh`, then `publish`. Publishing changed
content returns the decision to Pending; publishing identical content preserves
the decision. `pull` retrieves Graham's decision and notes for incorporation.
`export` produces the same structured payload for connected Airtable tools.
The connector can publish without adding a local credential. Direct `publish`,
`pull` and `check` use a securely supplied `AIRTABLE_RESEARCH_TOKEN`; no token is
saved by this tooling.

Before design, transcribe only an explicit **Approved** decision on the exact
published revision into `approval.json`, including the packet digest and SHA256
of the exact Airtable Review notes. Run `node openspec/airtable-sync.mjs check`:
it verifies local approval and the live ticket's content, decision and notes.
Any mismatch blocks design. Approved with changes requires incorporating changes
and reconfirming material scope changes. Spec approval never grants release.

Graham explicitly authorised direct authenticated connector verification in this
task. When using that authorised path, read the live ticket through the connector,
compare the entire Proposed solution with `export`, require Approved, and compare
the exact Review notes digest with the approval record. Run the local record check
as well. A local snapshot is not a substitute for the authenticated live read.
