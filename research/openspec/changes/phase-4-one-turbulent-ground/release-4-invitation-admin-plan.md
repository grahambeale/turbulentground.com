# Phase 4 Release 4A — invitation administration implementation plan

**Revision:** 1  
**Prepared:** 2 October 2026  
**Airtable:** `FB-20261002-PHASE4-REL4-INVITATIONS`  
**Status:** Proposed for exact implementation approval  
**Authority:** Phase 4 specification revision 1, design/architecture revision 2, and Graham's instruction to prepare the next release

## Outcome

Make private invitation creation a first-class Turbulent Ground operation at
`/admin/invitations`, without changing who can create invitations, the data an
invitation creates, the participant link format, or the participant journey.

## Problem and evidence

The current owner page at `/research/admin` is still framed as a separate
“Private research admin” product and combines three capabilities:

1. creating a personal invitation and copying a suggested invitation message;
2. sending a fictional results-email preview; and
3. manually recording research feedback.

The invitation form itself has clear labels, a visible result, a manual-copy
fallback, visible focus and `noindex` metadata. It calls the protected
`/api/research-invite` endpoint, which validates the shared access key, creates
one Identity record and returns a `/take-part?t=…` link. It never lists or
returns existing participant records.

The current structure nevertheless makes invitation work harder to find and
keeps operational language tied to the retired research silo. The combined
screen also increases the impact of future changes: an invitation edit can
accidentally affect results-preview or feedback administration.

## Affected users

- Graham, as the only intended operator creating personal invitation links.
- Invited participants, whose existing and newly generated links must continue
  to open the same recognised invitation state.
- Codex and Claude, which need one canonical capability route and one governed
  source for future invitation changes.

## Proposed scope

1. Add canonical owner route `/admin/invitations`.
2. Move the existing invitation form, result, copy-link control and invitation
   message generator into that route.
3. Use the shared Turbulent Ground admin shell and label the capability
   “Invitations”; remove “Private research admin” framing.
4. Keep the existing protected API contract and environment variables:
   `POST /api/research-invite`, `RESEARCH_ADMIN_KEY` and
   `AIRTABLE_RESEARCH_TOKEN`.
5. Keep the generated link format `https://www.turbulentground.com/take-part?t=…`.
6. Keep `/research/admin` functional as a noindex compatibility entry. It must
   reach the new canonical invitation screen without placing access keys,
   participant tokens, names or emails in a URL.
7. Leave the results-email preview and manual-feedback capabilities available
   at their existing protected location until each receives a separate packet;
   the new invitation screen must not silently copy or expose those controls.
8. Add an obvious protected-operations route back to `/admin` when the existing
   admin home can support it without weakening authentication.

## Interaction requirements

- Initial screen: access key, optional “remember on this device”, name, optional
  email, and one clear “Create invitation” action.
- Successful creation: announce success, show the generated link, focus/select
  it, offer “Copy link”, and then reveal the existing message-template controls.
- Failed creation: keep entered name/email, return a plain-language inline
  error, restore the submit button and move or announce focus appropriately.
- Copy failure: retain the existing select-and-copy-manually fallback.
- The access key is never included in generated links, analytics, logs or page
  metadata.

## Privacy and security constraints

- Preserve `noindex, nofollow, noarchive` and `Cache-Control: no-store` for the
  page and protected operation.
- Preserve timing-safe access-key comparison and same-origin API calls.
- Do not add participant lists, search, bulk export, resend, delete or edit.
- Do not expose names, emails, access keys, tokens or invitation URLs in test
  fixtures, screenshots, analytics or review records.
- Synthetic verification must stub Airtable and use generated dummy identities.
- The “remember access key” choice remains explicit and off by default. The
  page must state that anyone using the same browser profile can create invites.
- This release does not replace the shared key with accounts or change server
  authentication. That would require a separate security design.

## Accessibility requirements

- One `h1`, semantic form grouping and persistent visible labels.
- Clear required/optional states and programmatic error/status announcements.
- Visible keyboard focus for inputs, checkbox, submit, copy and message controls.
- The success region must be reachable and understandable without relying on
  colour or automatic text selection.
- No horizontal page overflow at 320 CSS pixels or 200% text zoom.
- Motion is not required for comprehension; honour reduced-motion preferences.

## Research implications

- Invitation origin, consent, lifecycle and duplicate-prevention semantics must
  not change.
- Existing private invitation, resume, submission, results and referral journeys
  remain the same product states at `/take-part`.
- No historical Identity or Response record is migrated or relabelled.

## Assumptions and unknowns

- `RESEARCH_ADMIN_KEY` remains the approved short-term operator control.
- `/admin` currently hosts the CMS, so route integration must not break its
  authentication, redirects or static assets.
- Vercel clean-URL and directory handling for `/admin/invitations` must be proven
  in preview rather than assumed.
- Whether results preview and feedback intake ultimately become
  `/admin/results` and `/admin/feedback` is deliberately left to later packets.

## Explicitly out of scope

- participant, response or results dashboards;
- changing the invitation API payload, Identity schema or Airtable permissions;
- sending invitations or emails automatically;
- bulk invitation creation, import, edit, revoke, resend or deletion;
- changing invitation copy beyond removing obsolete product framing;
- changing `/take-part`, consent, privacy, retention, referrals or benchmarks;
- moving results-preview or feedback administration; and
- production release.

## Implementation outline

1. Start from the then-current `origin/main` in a clean `codex/` branch.
2. Extract or copy only the invitation capability into a canonical
   `/admin/invitations` page using the shared shell.
3. Add explicit compatibility handling for `/research/admin` and verify that the
   browser lands on the canonical route without query or credential leakage.
4. Keep results-preview and feedback controls at the old protected surface or a
   minimally separated compatibility page, with no functional change.
5. Add route, security, API-contract, accessibility and responsive tests.
6. Publish a protected preview only after the exact implementation passes the
   full repository suite.

## Verification plan

### Routes and security

- `/admin/invitations` returns the canonical page and is noindex/noarchive.
- `/research/admin` remains usable and safely reaches the new route.
- `/admin` CMS behaviour remains unchanged.
- Unauthorised, missing-key and malformed requests fail without data disclosure.
- The access key never appears in URL, DOM status copy, logs or returned JSON.

### Synthetic invitation journey

- Create an invitation with a synthetic name and no email against stubbed
  Airtable; assert one Identity write and a `/take-part?t=…` link.
- Repeat with a synthetic email; assert the same API contract and no email send.
- Open the generated link in preview and verify recognised invitation entry,
  consent, save-and-return, completion and referral compatibility without real
  participant data or external email.
- Verify existing `/research?t=…` compatibility for a synthetic token.

### Usability and accessibility

- Keyboard-only creation, success focus, link copy and message-copy fallback.
- Screen-reader labels, required/optional states, live status and error handling.
- 320px, desktop and 200% text zoom with no page overflow.
- Remember-key choice is off by default and its risk text remains adjacent.

### Regression

- Results-email preview and manual feedback tools remain reachable and unchanged.
- Full repository tests pass.
- No participant, response, privacy, email, referral or benchmark contract changes.

## Rollback

1. Revert the route and invitation-page commit as one unit.
2. Restore `/research/admin` as the primary owner page.
3. Leave `/api/research-invite`, environment variables and Airtable records
   untouched.
4. Re-run unauthorised, synthetic invite and old-link compatibility checks.

## Acceptance criteria

- Graham can create and copy a personal invitation at `/admin/invitations`.
- The resulting link uses `/take-part?t=…` and opens the existing invitation
  state without revealing identity.
- `/research/admin` remains a safe compatibility entry.
- Results-preview and feedback administration continue to work unchanged.
- `/admin` CMS operation is not broken.
- Security, accessibility, responsive, synthetic journey and full regression
  checks pass for the exact reviewed commit.

## Approval effect

Approval of revision 1 authorises only the implementation described above on a
dedicated `codex/` branch and preparation of a verified preview. It does not
authorise production release, participant contact, real invitation creation,
schema changes, automatic email, results/feedback admin migration, dashboards
or legacy deletion.
