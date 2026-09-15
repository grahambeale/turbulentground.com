# Additional Airtable specifications — 13 September 2026

**Current state (added 15 September 2026):** All four tickets below have since
been decided in Airtable. `FB-20260909-C784C0` shipped at commit
`5db38fe254dafb663470eab0a01846aac3d678c9`. `FB-20260909-0A05E2` is Deferred.
`FB-20260911-PRX2ZX` and `FB-20260909-92A9DA` are Duplicate/Rejected, merged
into `FB-20260911-TEVOGK` as supporting evidence. The "no approval artifact or
design artifact has been generated" statement below describes the state as of
13 September 2026, not the present state; check Airtable for current status.

Four revision-1 review packets are published in Research Project Feedback,
Proposed solution. Prior proposals are retained above the dated new packet;
the new reconciled specification governs the proposed next step.

| Feedback | Change | Artifact after approval |
|---|---|---|
| FB-20260909-C784C0 | clarify-study-purpose | Purpose-copy preview |
| FB-20260909-0A05E2 | investigate-ai-accountability | Cognitive-review worksheet |
| FB-20260911-PRX2ZX | review-question-distinctness | Pair-by-pair worksheet |
| FB-20260909-92A9DA | check-autonomy-distinction | Focused worksheet, or Graham-directed merge/closure |

Each change contains evidence, proposal, capability spec, review and a file-digest
manifest. No approval artifact or design artifact has been generated.

The purpose ticket's existing Approved decision predates this exact copy and is
preserved. Require explicit revision-1 confirmation in Review notes or a direct
Graham message; do not infer confirmation from the unchanged select value.

## Gate for these four packets

The historical airtable-sync.mjs and check-gate.py target the original journey
pilot only. Their success must never be used to approve these additional tickets.
Before post-specification work, read the relevant live Airtable ticket through the
authenticated connector, compare the published new packet against the four local
files and their manifest hashes, and require Graham's explicit approval of that
revision. Record source, revision, packet/file digests and exact review-notes
digest in a dated approval record only after that decision exists. Recheck live
content and notes immediately before work. Mismatches or material amendments
require revision and confirmation. Local artifact readiness grants no authority.

After approved scope, proceed to the specified artifact without another
generic approach gate. The Codex heartbeat is ACTIVE and checks daily at 09:00,
performing this authenticated verification before continuing (reconfirmed
15 September 2026 from its own saved `automation.toml` — see
`AUTOMATIC-HANDOFF.md`).
Participant contact, scored-instrument changes and production release require
their specific authority. DEFER/MERGE evidence handling and separate release
approval remain intact. Keep private research records local and in Airtable.
