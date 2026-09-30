# Phase 4 design and architecture review

## Decision requested

Approve the Phase 4 design and architecture direction for implementation planning. This decision would authorise a detailed Release 1 implementation packet only; it would not authorise code changes, Airtable schema mutation or production release.

## Decisions to approve

1. **Product shape:** retain the existing homepage as the visual/proposition baseline; treat participation as a focused mode of the same product.
2. **Canonical routes:** `/` remains the front door and `/take-part` becomes the canonical participant runtime; `/research` remains a parameter-preserving compatibility entry.
3. **Entry states:** public, private invitation, referral, secure return and historical resume use one runtime with server-authoritative context.
4. **Information architecture:** keep `/learnings` and `/about` permanently; use one layered `/privacy` hub with a directly linkable `#research` section while retaining old URLs.
5. **Invitation operations:** preserve the private-invitation journey and manage it at `/admin/invitations`, alongside capability routes for participants, results, feedback and reviews; do not create a canonical `/admin/research` silo.
6. **Writing retirement:** remove the redundant local writing page and sitemap entry during cleanup, while retaining `/writing` and `/writing.html` redirects to LinkedIn indefinitely.
7. **Legacy policy:** unpromote Phase 2/Care Capital and the diagnostic, but do not redirect or remove them before production usage, inbound-link and submission evidence is reviewed.
8. **Technical migration:** reuse the proven participant runtime and keep existing research APIs stable during the first cutover.
9. **Governance architecture:** create one model-neutral Phase 4 operating layer; Airtable records decisions, OpenSpec records exact revisions, and one exclusive lease protects the shared checkout.
10. **Airtable direction:** prefer broadening the existing decisions table with a `Lane` field over creating a second independent workflow, subject to a schema-specific implementation review.
11. **Release sequence:** governance foundation, product cutover, then evidence-led cleanup—each with separate implementation and release approval.

## Evidence and limits

- The current homepage and participant entry were captured and visually reviewed on 30 September 2026.
- Repository routes, link generators, APIs, sitemap, redirects and navigation generation were inspected.
- Full keyboard, assistive-technology and responsive testing is deferred to implementation review.
- Production route counts, external inbound links and all email-emitted URLs still need authoritative inventory before route implementation approval.
- This packet does not change the approved Phase 4 product specification.

## Available decisions

- **Approve** — authorise preparation of the Release 1 governance implementation packet.
- **Approve with changes** — state the amendments; a revised packet will return for exact approval.
- **Defer** — retain the approved specification without progressing design.
- **Reject** — return Phase 4 to specification review.

Implementation and release remain unapproved.

## Revision history

- **Revision 1 — 30 September 2026:** initial design, route inventory and architecture proposal.
- **Revision 2 — 30 September 2026:** incorporates Graham's review directions: one layered privacy notice; a permanent About page; invitations retained as a first-class journey with capability-oriented admin routes; and retirement of the local Writing page while preserving redirects.

Airtable approval is pending against the exact revision 2 hashes.
