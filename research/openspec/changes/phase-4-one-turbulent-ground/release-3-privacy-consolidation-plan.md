# Phase 4 Release 3 — privacy consolidation implementation plan

**Revision:** 1  
**Prepared:** 1 October 2026  
**Airtable:** `FB-20261001-PHASE4-REL3-PRIVACY`  
**Status:** Proposed for exact implementation approval  
**Authority:** Phase 4 specification revision 1 and design/architecture revision 2

## Outcome

Give people one accurate, readable Turbulent Ground privacy notice at
`/privacy`. The page must explain the site-wide processing first and provide a
directly linkable participation section for the AI-shift study. Existing
`/research/privacy` links must continue to reach the relevant information.

## Problem and evidence

There are currently two public notices with conflicting framing:

- `/privacy` primarily describes the retired Care Capital diagnostic, uses a
  three-year retention period and a separate privacy email address;
- `/research/privacy` describes the current participation journey, but still
  calls it invite-only and presents Turbulent Ground as a separate research
  area; and
- the live participation runtime and its historical compatibility pages link
  directly to `/research/privacy`.

This duplication makes it harder to know which notice applies and increases
the risk that future changes update one notice but not the other.

## In scope

1. Replace `/privacy` with one layered notice whose opening summary identifies
   Graham Beale as controller, gives the contact route and lets readers jump to
   the information relevant to them.
2. Include a short site-wide section covering hosting, security logs,
   privacy-preserving analytics and feedback submitted through the universal
   feedback pattern.
3. Add a stable `<section id="participation">` covering the current AI-shift
   participation journey: identity/contact data, optional profile data,
   answers and context, consent choices, results email, study email,
   quotations, referrals, retention, suppliers, AI-assisted analysis,
   international transfers, withdrawal and rights.
4. Update the current participant runtime to link to
   `/privacy#participation` without opening a second product area.
5. Correct the privacy-adjacent introduction in the current participant
   runtime so public entry no longer says the study is invite-only. A resolved
   personal invitation may acknowledge that the person was invited, without
   implying obligation or changing consent.
6. Keep `/research/privacy` as a compatibility route. It should redirect or
   rewrite to `/privacy#participation` without retaining obsolete duplicate
   content. The chosen mechanism must work on Vercel and preserve no private
   state because this URL carries no participant credential.
7. Keep historical runtime links functional. They may continue using their old
   href if compatibility routing is proven, or be changed to the canonical
   anchor when doing so does not alter historical survey behaviour.
8. Update the Markdown/source-of-truth arrangement so participation privacy
   assertions have one maintained source and automated consent tests read that
   source.
9. Use plain language and an on-page contents/jump pattern that works with
   keyboard navigation, visible focus, reduced motion and narrow screens.

## Content structure

The reviewed implementation should use this order:

1. **Privacy at a glance** — controller, purpose, contact, ICO reference and
   links to the relevant sections.
2. **Using the Turbulent Ground website** — page visits, Plausible analytics,
   server/security logs and feedback.
3. **Taking part in the AI-shift study** (`#participation`) — what participation
   involves and the complete current data-processing explanation.
4. **Services and international transfers** — Airtable, Resend, Vercel and the
   bounded use of OpenAI/Anthropic.
5. **How long information is kept** — clearly separate incomplete public-start
   deletion, completed-study retention and operational log periods.
6. **Your choices and rights** — withdraw, unsubscribe, object, access,
   correction, erasure/restriction, portability and ICO complaint.

The page may shorten repeated prose, but must not weaken or silently change a
lawful basis, consent boundary, retention promise or participant right.

## Required factual corrections

- Replace “invite-only” with wording that covers both public participation and
  personal invitations.
- Do not claim Turbulent Ground is a separate legal entity.
- Do not describe Care Capital as the current primary data journey. Historical
  diagnostic processing may be retained in a clearly labelled legacy section
  only if records or active routes still require it.
- Distinguish the 14-day deletion of incomplete public-start records from the
  up-to-24-month retention of completed identifiable study records.
- Preserve the statement that responses are pseudonymous rather than anonymous
  while the identity link exists.
- Preserve the instruction not to submit special-category data or identify
  colleagues.
- Preserve separate optional choices for study emails, a personal comparison
  and being quoted by name.

## Explicitly out of scope

- changing consent wording or checkbox behaviour in the participant form;
- changing lawful bases, retention periods, reminder timing or withdrawal
  behaviour;
- changing questionnaire wording, scoring, benchmark eligibility or results;
- changing data suppliers, introducing cookies or adding new analytics;
- creating `/admin/invitations` or changing invitation administration;
- deleting historical diagnostic records or compatibility routes;
- restructuring `/about`, learnings, Care Capital or other public content; and
- contacting participants.

If factual review shows that any current promise is wrong, implementation must
stop and return a revised proposal rather than silently correcting policy in a
copy edit.

## Accessibility requirements

- Use semantic headings and landmarks with one `h1`.
- The on-page contents must use real anchor links and provide visible focus.
- The anchored participation heading must not sit behind the fixed masthead;
  use `scroll-margin-top` or an equivalent non-script dependency.
- The page must work at 320 CSS pixels and 200% text zoom without horizontal
  page scrolling. Any data table must have an accessible responsive treatment.
- Reduced motion must avoid forced smooth scrolling.
- Link text must remain meaningful out of context.

## Privacy and security constraints

- Canonical and social metadata must contain only `/privacy`, never participant
  tokens, referral IDs, emails or answers.
- `/research/privacy` compatibility must not accept, copy or expose unrelated
  query parameters.
- No personal or participant data may appear in fixtures, screenshots, logs or
  the review packet.
- The merged notice must remain `noindex` until Graham separately decides that
  the legal page should be indexed.
- Contact addresses and ICO registration must be checked against the current
  approved notice before release.

## Implementation outline

1. Work from a clean branch based on the then-current `origin/main`; do not use
   the dirty shared checkout for implementation.
2. Create the layered `/privacy` content and styles while retaining the shared
   masthead, footer and universal feedback pattern.
3. Add Vercel compatibility handling for `/research/privacy` and verify the
   final browser URL and anchored destination.
4. Update the current participant privacy link and the maintained test/source
   files. Keep `/research/media/*`, `/api/research-*` and participant state
   routing unchanged.
5. Build, run the full automated suite and create a protected preview showing
   both `/privacy` and the participant journey opening the canonical section.

## Verification plan

### Content and contract

- Assert one canonical privacy page and one `#participation` section.
- Assert the current participant runtime links to that section.
- Assert `/research/privacy` remains functional and lands on the participation
  information.
- Compare every current research notice assertion with the merged notice so no
  consent, retention, supplier, lawful-basis or rights statement is lost.
- Confirm obsolete invite-only wording is absent from public-facing privacy
  copy.

### Journey checks

- From public `/take-part`, open the privacy notice and return without losing
  entered form state.
- Repeat from a synthetic personal-invitation state and a secure-return state.
- Assert the public introduction contains no invite-only claim and a genuine
  invitation state still uses appropriate invitation context.
- Verify legacy-v3 privacy links still reach the applicable notice.
- Verify unsubscribe and results-email privacy text remains consistent; do not
  send real email or modify participant data.

### Accessibility and responsive

- Keyboard through contents links, external links, feedback and return path.
- Screen-reader heading/landmark smoke test.
- 320px, common mobile, desktop and 200% zoom checks.
- Focus target visibility beneath the fixed masthead.

### Technical

- Validate `vercel.json`, production build and all JSON/HTML.
- Run the full repository test suite plus a privacy-route contract test.
- Verify no console errors, broken anchors, mixed canonical URLs or unintended
  participant API changes.

## Rollback

1. Revert the privacy-page, link and routing commit as one unit.
2. Restore `/research/privacy` as the standalone notice.
3. Restore participant links to the old route.
4. Re-run consent-copy, privacy-link and route checks.
5. Do not alter participant records, consent history or email preferences.

## Acceptance criteria

- `/privacy` is the only maintained privacy notice.
- `https://www.turbulentground.com/privacy#participation` directly identifies
  the study-specific information.
- Current and historical participation links remain functional.
- No current processing purpose, lawful basis, consent choice, retention
  promise, supplier disclosure or data-subject right is lost or contradicted.
- The notice no longer presents the current study as invite-only or as a
  separate Turbulent Ground property.
- Accessibility, responsive, privacy-route and full regression tests pass for
  the exact reviewed commit.

## Approval effect

Approval of revision 1 authorises implementation on a dedicated `codex/`
branch and preparation of a verified preview. It does not authorise production
release, a change in privacy policy, participant contact, admin-route work,
content cleanup or deletion of legacy data/routes.
