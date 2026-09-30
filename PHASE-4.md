# Phase 4: One Turbulent Ground

Phase 4 makes the public site, participation journey, invitations, learnings,
privacy and operations one product rather than separate main-site and research
areas.

## Approved direction

- `/` remains the proposition and public entry point.
- `/take-part` becomes the canonical participation runtime; `/research` remains
  a parameter-preserving compatibility entry.
- Public, invitation, referral, secure-return and legacy-resume states use one
  server-authoritative runtime.
- `/learnings` and `/about` remain permanent.
- `/privacy` becomes one layered notice with a directly linkable research
  participation section.
- Private invitations remain a first-class journey and are administered through
  capability routes such as `/admin/invitations`, not a separate research silo.
- The local Writing page is retired while its LinkedIn redirects remain.
- Phase 2 and Care Capital are unpromoted before any evidence-led retirement.

## Product-change authority

All new product changes follow [operations/workflow.md](operations/workflow.md)
and use [operations/work-state.json](operations/work-state.json) as the sole
active product-change lease. Airtable records human decisions; OpenSpec records
the exact evidence and revision approved.

Historical main-site and research records remain evidence. They do not create
new authority after the shared workflow cutover.

## Approved source package

The current approved product specification and architecture are in:

`research/openspec/changes/phase-4-one-turbulent-ground/`

- specification revision 1;
- design and architecture revision 2;
- Release 1 governance implementation revision 1.

Later route, privacy, admin, content and legacy cleanup work requires its own
implementation packet and release decision.
