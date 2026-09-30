# Phase 4: One Turbulent Ground — architecture proposal

**Status:** Proposed for Graham's review  
**Authority:** Approved OpenSpec revision 1  
**Not authorised:** implementation, Airtable schema mutation, route cutover or release

## Architecture decision

Adopt a strangler-style migration: establish the unified operating system first, add canonical Phase 4 routes around the proven participant runtime second, then retire legacy product surfaces only when evidence shows they are safe to remove.

This avoids a big-bang rewrite of the survey, its APIs or participant data.

## Workstream A — governance foundation

Create a model-neutral operating layer:

```text
PHASE-4.md
operations/
├── workflow.md
├── work-state.json
├── decision-log.md
├── backlog.md
└── handoffs/
```

- `AGENTS.md` and `CLAUDE.md` become thin native entry points to the same files.
- `operations/work-state.json` owns one exclusive product-change lease across the shared checkout.
- Airtable owns intake, human decisions and release decisions.
- OpenSpec owns revisioned evidence, requirements, design, architecture and acceptance contracts.
- Direct chat creates or links intake; it never substitutes for the recorded gates.
- Existing research and sprint state files remain compatibility inputs until scheduled runners have been tested against the new bootstrap; they are not deleted in the first release.

Because the current Airtable table explicitly excludes the wider site, the approved implementation must either broaden and rename it or create a linked product-wide decisions table. The recommended first option is to broaden the existing table so its history, gates and automation remain intact, adding an explicit `Lane` field rather than duplicating the workflow.

## Workstream B — canonical product routes

- Keep the current root as the canonical orientation surface.
- Introduce `/take-part` as the canonical participation runtime.
- Keep the proven survey code and research API contracts intact during the route move.
- Make `/research` a parameter-preserving compatibility entry.
- Consolidate privacy into a layered `/privacy` hub with a directly linkable `#research` section while preserving `/research/privacy` compatibility.
- Move owner operations into capability routes under `/admin`—including invitations, participants, results, feedback and reviews—without a canonical `/admin/research` namespace.
- Keep `/about` as a permanent product route.
- Update invitation, reminder and referral URL generation only after compatibility tests pass.

The implementation may physically reuse `research/index.html` during the first cutover. File organisation is not the user experience; route and product behaviour are. A later refactor can move files once production is stable.

## Workstream C — entry-state services

The participant runtime receives an explicit server-resolved entry context:

- `public`
- `owner_invite`
- `referral`
- `secure_return`
- `legacy_resume`

The server remains authoritative for token/referral validity and locks acquisition at the approved consented-start point. The client never infers referral success from a click or share action.

Private access tokens, results tokens, unsubscribe tokens and public referral IDs remain separate. Public referral IDs are rejected by every private participant endpoint.

## Workstream D — content and navigation migration

The shared navigation builder becomes product-oriented rather than folder-oriented. It renders:

- full navigation on root, learnings and general privacy pages;
- reduced task navigation on participation and secure states;
- protected operations navigation on admin pages.

Learning articles and old pages receive CTA changes only through a separately reviewed batch with a route/link manifest. The sitemap and canonical metadata update alongside, not before, the corresponding route release.

The redundant local `writing.html` page and its sitemap entry are removed in cleanup. Existing `/writing` and `/writing.html` redirects to LinkedIn remain indefinitely as compatibility contracts.

## Workstream E — observability and rollback

Before cutover, record a baseline for root-to-start, validated start, completion, results request and eligible referral completion using authoritative existing events. Event names may be aliased during migration, but historical meaning must not change silently.

Rollback order:

1. stop emitting new canonical links;
2. restore `/research` as the primary runtime route;
3. keep all existing APIs and participant records unchanged;
4. revert navigation/canonical/sitemap changes;
5. verify invite, resume, submit, results, unsubscribe and referral compatibility;
6. leave the governance audit trail intact.

## Proposed release sequence

### Release 1 — governance foundation

Canonical Phase 4 brief, shared workflow/state, Airtable scope, OpenSpec gate and assistant bootstraps. No user-facing route change.

### Release 2 — product cutover

Canonical `/take-part`, root navigation and CTA updates, `/research` compatibility, unified privacy/admin routes, email/link-generator updates, analytics aliases and full journey verification.

### Release 3 — evidence-led cleanup

Legacy Phase 2 navigation/content demotion, reviewed CTA replacement, preview-route consolidation under `/admin/reviews` or local-only tooling, removal of the local writing page and sitemap entry, archive/redirect decisions and removal of other compatibility code only when usage and retention evidence allow it. The writing redirects themselves remain.

Each release requires its own implementation packet, preview, verification and explicit production approval.

## Security and privacy review points

- Query-bearing redirects must preserve intended state without widening token exposure.
- No participant token, referral identifier, email, answer or message enters analytics or source files.
- Recipient details in private referral composition remain browser-only.
- Admin and review surfaces remain protected and noindexed.
- Historical instrument routing remains version-aware.
- Legacy compatibility does not turn public referral IDs into authentication credentials.

## Architecture risks

| Risk | Control |
|---|---|
| Existing links break | Keep `/research` compatibility and test every issued link class |
| One-domain goal becomes a big-bang rewrite | Reuse the proven runtime and keep APIs stable initially |
| Agent workflows diverge again | One canonical workflow/state plus thin bootstraps and an exclusive lease |
| Main-site sprint history is lost | Preserve historical logs and retire protocols only through a recorded migration |
| Research validity is accidentally renamed | Keep instrument/version registry independent of Phase 4 branding |
| Legacy SEO is damaged | Inventory traffic/backlinks, use explicit redirects and update canonical/sitemap atomically |
| Referral privacy is weakened | Separate public IDs from credentials and keep recipient data local-only |
| A merged privacy page blurs distinct purposes | Layer the notice; share common facts once while keeping purpose, lawful basis and retention explicit |
| Invitation operations remain framed as a separate project | Use capability routes such as `/admin/invitations`, not `/admin/research` |
