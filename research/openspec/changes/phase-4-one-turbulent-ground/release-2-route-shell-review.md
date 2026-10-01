# Phase 4 Release 2 — route and shell cutover review

**Revision:** 1  
**Airtable:** `FB-20261001-PHASE4-REL2-CUTOVER`  
**Status:** Awaiting Graham's exact implementation decision

## Decision requested

Approve the exact Release 2 implementation packet in
`release-2-route-shell-plan.md`.

Approval would authorise:

- local implementation of `/take-part` and `/research` compatibility;
- the shared participant shell and removal of obsolete separate-area wording;
- migration of reviewed public and participant link emitters;
- synthetic route, journey, accessibility, privacy and rollback tests; and
- preparation of an exact verified preview for review.

Approval would not authorise:

- committing or pushing unreviewed shared-checkout changes;
- merging to `main` or production release;
- privacy or admin-route consolidation;
- questionnaire, consent, retention, email-policy or benchmark changes;
- participant contact or use of real participant data; or
- legacy/content cleanup.

## Evidence limits

The packet is grounded in the approved Phase 4 route inventory, architecture
and current repository. Authoritative production route counts and the final
legacy-v3 retention horizon are not currently available in this packet. The
implementation preflight must record those as observed values or explicit
unknowns; it must never infer zero traffic.

## Available decisions

- **Approve** — authorise the exact revision 1 local implementation and preview.
- **Approve with changes** — state the amendments; revision 2 will return.
- **Defer** — retain the Phase 4 direction without starting the cutover.
- **Reject** — return Release 2 to planning.
