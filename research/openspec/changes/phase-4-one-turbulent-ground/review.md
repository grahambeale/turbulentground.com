# Graham's specification review — Phase 4 revision 1

## Decisions to review

Please review the exact revision represented by this packet and decide whether to approve it for the next design and architecture stage.

1. **Product direction:** Phase 3 becomes the canonical Turbulent Ground product and the consolidation is called **Phase 4: One Turbulent Ground**.
2. **Entry model:** public, invite-only and referral journeys remain supported as entry states of one product.
3. **Route direction:** `/` becomes the canonical entry; `/research` and existing participant links retain compatible behaviour during migration.
4. **Research integrity:** Phase 4 does not rename questionnaire versions or merge benchmark cohorts.
5. **Legacy policy:** `/learnings` remains; Phase 2/Care Capital stops being promoted but legacy routes are not deleted until inventory and redirect evidence is approved.
6. **Shared agent workflow:** Claude Code and Codex use one model-neutral repository operating layer.
7. **Mandatory governance:** every product change enters Airtable and OpenSpec; direct chat starts intake but does not bypass exact-revision, implementation or release approval.
8. **Delivery shape:** governance foundation, product cutover and legacy cleanup are separate, reviewable releases with rollback.

## Evidence limits

- The complete live route, inbound-link and analytics inventory has not yet been produced.
- Final homepage structure, copy and visual design are intentionally deferred until this specification is approved.
- The exact Airtable information architecture for cross-product work remains a design-stage decision; the gate itself is mandatory in this revision.

## Available decisions

- **Approve** — authorise design, architecture, route inventory and migration planning against this exact revision.
- **Approve with changes** — provide the precise amendments; Codex will issue a new revision and reset the gate before proceeding.
- **Defer** — retain the packet without progressing it.
- **Reject** — close the proposal without implementation.

Approval of this packet does **not** authorise implementation or production release.

## Review history

- Revision 1 drafted by Codex on 30 September 2026 from Graham's direct product direction.
- Airtable decision remains `Pending`.

