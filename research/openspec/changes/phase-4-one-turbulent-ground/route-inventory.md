# Phase 4 route and dependency inventory

**Prepared:** 30 September 2026  
**Basis:** OpenSpec revision 1, approved by Graham  
**Status:** Proposed migration map; no routing change is authorised

## Inventory method and limits

This inventory combines the deployed homepage and participant-entry captures with the current repository, `vercel.json`, `sitemap.xml`, navigation builder, participant APIs and approved Phase 3.1 recruitment/referral architecture.

It is a code and first-screen inventory, not yet a complete external-link or analytics inventory. Before implementation, production analytics and known outbound email templates must be checked for every legacy path in this document.

## User-facing route map

| Current route | Current role | Phase 4 destination | Cutover treatment |
|---|---|---|---|
| `/` | Phase 3 proposition and research recruitment homepage | `/` | Keep as canonical Phase 4 entry; refine only after a separate visual/copy review |
| `/research` | Participant runtime for invitation, continuation and completion | `/take-part` | Create the canonical product route, then preserve `/research` as a parameter-preserving compatibility entry |
| `/research?t=…` | Private invitation and secure return | `/take-part?t=…` | Preserve query string and token semantics; old links must continue to work |
| `/research?r=…` | Approved referral-entry shape | `/take-part?r=…` | Preserve opaque referral recognition and attribution; do not expose referrer identity |
| `/research/privacy` | Research-specific privacy notice | `/privacy#research` | Consolidate into one layered privacy hub with a directly linkable participation section; keep a permanent compatibility route |
| `/research/legacy-v3` | Resume path for historical instrument v3 | Compatibility-only runtime | Keep noindex and unpromoted until all eligible incomplete records have expired or completed |
| `/research/admin` | Owner research administration | `/admin` and capability routes such as `/admin/invitations` | Move into a capability-oriented admin area; preserve authentication and noindex |
| `/research/media/*` | Intro/outro media | Stable asset path initially | Do not move during route cutover; asset relocation is cleanup work |
| `/learnings` | Editorial library | `/learnings` | Keep canonical |
| `/learnings/*` | Individual articles | Same route | Keep canonical; replace obsolete diagnostic CTAs in a separately approved content migration |
| `/about` | Identity, provenance and contact | `/about` | Keep as a permanent Phase 4 page and align its proposition, navigation and calls to action |
| `/care-capital` | Historical framework page | Keep initially | Unpromote; decide archive or learning conversion after evidence |
| `/diagnostic` | Historical Care Capital diagnostic | Keep initially | Unpromote and label as legacy if reachable; no immediate redirect without submission and inbound-link evidence |
| `/writing` and `/writing.html` | Redirects to Graham's LinkedIn, with a redundant local `writing.html` file and sitemap entry | Redirect-only compatibility | Remove the local page and sitemap entry during cleanup; retain both redirects indefinitely |
| `/privacy` | General site privacy | `/privacy` | Replace with one layered notice covering website use, participation, communications and rights; expose the participation section at `#research` |
| `/admin` | CMS administration | `/admin` | Keep as the operations home, with `/admin/invitations`, `/admin/participants`, `/admin/results`, `/admin/feedback` and `/admin/reviews` |

## Preview and internal routes

The repository contains benchmark, purpose, results and journey preview pages. These are review tools, not public product destinations. Phase 4 should move them behind `/admin/reviews/…` when they need hosted access, or make them local-only, require existing access control and apply `noindex, nofollow`. That consolidation is cleanup work and must not delay the participant cutover.

## API inventory

The first route cutover should keep the existing API names stable:

- `/api/research-lookup`
- `/api/research-save-progress`
- `/api/research-submit`
- `/api/research-capture-email`
- `/api/research-results-email`
- `/api/research-unsubscribe`
- `/api/research-invite`
- `/api/research-results-preview`

The approved Phase 3.1 architecture also reserves later, separately reviewed referral and public-entry capabilities. Public referral identifiers must never authenticate against lookup, save, submit or results endpoints.

Renaming APIs for visual tidiness would add risk without user benefit. Phase 4 may present product-neutral URLs while leaving these internal endpoints stable until a dedicated API migration is justified.

## Link-generating dependencies

The following dependencies can create durable links and therefore gate the cutover:

1. invitation generation currently returns `https://www.turbulentground.com/research?t=…`;
2. reminder and secure-return emails can contain `/research?t=…`;
3. participant referral links use or are designed to use `/research?r=…`;
4. results and unsubscribe emails link to research APIs or participation routes;
5. saved browser history and messages may contain old routes indefinitely;
6. `research/index.html` sends historical v3 responses to `/research/legacy-v3.html?t=…`;
7. the shared navigation builder currently treats research pages as a separate stripped configuration;
8. the sitemap promotes Phase 2 routes but currently omits the research/privacy product routes;
9. learning articles contain repeated `/diagnostic` calls to action;
10. social metadata, canonical tags and the root Open Graph image must remain aligned with the root proposition.
11. the current general privacy notice conflicts with the richer participation notice and must not be mechanically concatenated;
12. `writing.html` and the sitemap entry can drift from the already-configured LinkedIn redirects unless removed together.

## Compatibility contract

- Compatibility routes preserve all allowlisted query parameters and drop unknown tracking data only where an approved privacy rule requires it.
- Private tokens and public referral IDs remain distinct credentials with distinct endpoint permissions.
- Redirects must not place token-bearing URLs in third-party analytics, referrers or logs beyond the existing approved exposure.
- Existing links work before, during and after cutover; a canonical-tag change alone is not compatibility.
- Unknown, disabled or expired invitation/referral states fail safely and reveal no participant identity.
- `/research` is not removed until email templates, invite generation, referral generation, production analytics and critical-link tests all point to the canonical route or prove compatibility.

## Required evidence before implementation approval

- Production request counts for every route listed above, with no inferred zeros.
- Search Console or equivalent inbound-link evidence where available.
- An inventory of every email/template/script that emits a participant URL.
- A parameter-by-parameter redirect test for invite, referral, preview, resume and legacy-version states.
- A confirmed retention horizon for the legacy v3 continuation route.
- A rollback test that restores the current `/research` runtime without changing participant records.
