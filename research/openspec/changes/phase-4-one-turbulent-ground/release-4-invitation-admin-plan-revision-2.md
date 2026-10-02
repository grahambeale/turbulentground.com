# Phase 4 Release 4A — invitation administration implementation plan

**Revision:** 2  
**Prepared:** 2 October 2026  
**Airtable:** `FB-20261002-PHASE4-REL4-INVITATIONS`  
**Status:** Proposed for exact implementation approval  
**Supersedes:** revision 1 for implementation and release authority

## Amendment requested

Graham asked for the operational links currently placed at the bottom of the
invitation screen to become a proper admin navigation matching the public
website, including the same mobile navigation pattern.

## Outcome

Provide one reusable Turbulent Ground admin navigation across the first-party
invitation and legacy admin-tools screens. It must look and behave like the
public-site navigation while containing admin destinations rather than public
marketing destinations.

## Exact navigation

- **Admin home** — `/admin`
- **Invitations** — `/admin/invitations`
- **Results & feedback** — `/research/admin-tools`

The current route is indicated using the same active-link treatment as the
public navigation. On narrow screens, the links move into the same hamburger
and full-screen mobile menu used by the public site. The menu button, overlay,
focus visibility, Escape-to-close, body scroll lock and reduced-motion
behaviour remain shared rather than reimplemented.

## Implementation scope

1. Add an `ADMIN_NAV_CONFIG` to the existing shared navigation generator in
   `scripts/build-nav.mjs`.
2. Apply it to `/admin/invitations` and `/research/admin-tools` using the
   existing `partials/nav.html`, `partials/nav.css` and `partials/nav.js`.
3. Remove the now-duplicated `Admin home` and
   `Results preview and feedback tools` links from the bottom of the invitation
   page.
4. Use the shorter navigation label `Results & feedback`; do not rename the
   tool page or change its functions in this release.
5. Preserve the existing logo, brand lock-up, page content, protected APIs,
   access-key handling, noindex/noarchive metadata and no-store headers.

## Boundaries

- The Decap CMS application served at `/admin` keeps its own application UI;
  this release links to it but does not alter or wrap that third-party shell.
- No public-site navigation is changed.
- No admin capability, authentication, invitation, results-preview or feedback
  behaviour is changed.
- No new admin route, participant list, dashboard or account system is added.
- Production release remains a separate decision after a verified preview.

## Verification

- Generated desktop navigation contains the three exact admin destinations on
  both first-party admin pages.
- Generated mobile navigation contains the same destinations and opens, closes,
  returns focus and responds to Escape like the public menu.
- The correct route has an accessible active state.
- The invitation page no longer repeats its admin links at the bottom.
- At 320 CSS pixels and 200% text zoom there is no horizontal overflow.
- Keyboard-only and reduced-motion checks pass.
- No access key, invitation token, participant data or query state appears in
  links, markup, metadata, analytics or screenshots.
- Existing route, security, invitation, results-preview and feedback tests pass.

## Rollback

Revert the admin navigation configuration and restore the two bottom links as
one unit. No API, data or authentication rollback is required.

## Approval effect

Approval of revision 2 authorises implementation of this exact navigation
amendment on the existing Release 4A branch and preparation of a new verified
preview. It does not authorise production release.
