# Phase 4 decision index

This append-only index points to authoritative Airtable and OpenSpec records.
It contains no participant data and does not replace either system.

| Date | Decision | Airtable | OpenSpec | Outcome |
|---|---|---|---|---|
| 2026-09-30 | Phase 4 product specification revision 1 | `FB-20260930-PHASE4` | `phase-4-one-turbulent-ground` | Approved |
| 2026-09-30 | Phase 4 design and architecture revision 2 | `FB-20260930-PHASE4-DESIGN1` | `phase-4-one-turbulent-ground` | Approved |
| 2026-09-30 | Release 1 governance implementation revision 1 | `FB-20260930-PHASE4-REL1-GOV` | `phase-4-one-turbulent-ground` | Approved for local implementation; release pending |
| 2026-10-02 | Release 4A invitation administration revision 1 | `FB-20261002-PHASE4-REL4-INVITATIONS` | `phase-4-one-turbulent-ground` | Graham approved local implementation and a verified preview; production remains a separate decision |
| 2026-10-02 | Release 4A invitation administration revision 2 production release | `FB-20261002-PHASE4-REL4-INVITATIONS` | `phase-4-one-turbulent-ground` | Shipped: Graham approved production release of `25bad00`; main fast-forwarded 663d1d1..25bad00; production deployment `dpl_8JbDbzruTLDKEhfU6GamxHnYgZBs` READY from that commit. Live: `/admin/invitations` and `/research/admin-tools` show the shared admin nav with the active page marked, no-store and noindex/nofollow/noarchive; 320px hamburger visible with no sideways scroll; `/research/admin` redirects to `/admin/invitations`. Observation for Graham: that edge redirect forwards the query string, unlike the plan's intent. Authenticated admin actions not exercised |
| 2026-10-02 | Homepage rail restore production release | `FB-20261002-RAIL-RESTORE` | none (hotfix) | Shipped: Graham approved production release of `4e1db5a`; main fast-forwarded 91fd2b5..4e1db5a; production deployment `dpl_EBWBHrp8XJfcW8yxE2e9YZW9NFVF`. Restores the clickable section rail lost in `ddb8f67` and adds `scripts/audit/check-rail.mjs` to `npm run build`. Live: five labelled rail links, hover shows the tooltip; `/`, `/take-part`, `/about` 200; `/research/openspec/README.md` 404 |
