# Phase 4 Release 2 — route and shell cutover implementation plan

**Revision:** 1  
**Prepared:** 1 October 2026  
**Airtable:** `FB-20261001-PHASE4-REL2-CUTOVER`  
**Status:** Proposed for exact implementation approval  
**Authority:** Phase 4 specification revision 1 and design/architecture revision 2

## Outcome

Make participation feel like a focused mode of Turbulent Ground rather than a
separate research property. `/take-part` becomes the canonical participant
route while every supported `/research` link continues to work without losing
invitation, referral, return or historical state.

## Affected people

- people starting through the public site;
- people using a private one-to-one invitation;
- people arriving through a referral link;
- participants resuming through a secure return link;
- historical participants routed to the version-aware legacy runtime; and
- Graham when generating or checking durable participant links.

## In scope

1. Add `/take-part` as a clean Vercel route that serves the proven participant
   runtime without duplicating its source or changing its API contracts.
2. Keep `/research` and supported `/research?...` URLs as permanent,
   parameter-preserving compatibility entries. The first release may rewrite
   internally rather than expose a browser redirect when that better protects
   token-bearing URLs and avoids history/referrer churn.
3. Preserve the five server-authoritative entry states: public,
   owner-invitation, referral, secure return and legacy resume.
4. Change new public calls to action and approved participant-link generators
   to emit `/take-part`; do not invalidate previously issued `/research` links.
5. Give `/take-part` one reduced task shell using the existing Turbulent Ground
   masthead, brand lockup and site-wide feedback pattern. It must look
   intentional rather than like a stripped microsite.
6. Remove visible copy that describes the participant flow as a separate site
   or as invite-only when the resolved entry state is public. Invitation copy
   may still acknowledge a personal invitation without implying obligation.
7. Add canonical metadata for `/take-part` while retaining `noindex` on private,
   return, preview and historical states. Query credentials must never be
   written into canonical or social metadata.
8. Keep `/api/research-*` endpoints and `/research/media/*` assets unchanged.
   Their internal names are not part of the public product experience and
   renaming them would add risk without user benefit.
9. Add automated route/parameter tests and an end-to-end synthetic journey
   matrix before any preview is considered ready.

## Explicitly out of scope

- merging the two privacy notices or moving `/research/privacy`;
- creating `/admin/invitations` or restructuring any admin route;
- changing questionnaire wording, scoring, instrument IDs or benchmark cohorts;
- changing consent, retention, reminder, withdrawal or email policy;
- migrating media or renaming research APIs;
- rewriting learning articles or their calls to action;
- removing, redirecting or relabelling Care Capital or the diagnostic;
- removing the local Writing page or changing sitemap policy; and
- deleting compatibility routes or historical governance files.

Those are independently reviewable Phase 4 releases. This packet must not be
used as authority for them.

## Route contract

| Entry | Canonical experience | Compatibility requirement |
| --- | --- | --- |
| `/take-part` | Public start | Works without invitation or referral state |
| `/take-part?t=TOKEN` | Invitation, secure return or version-aware lookup | Token remains opaque; server determines state |
| `/take-part?r=CODE` | Referral start | Referrer identity and answers remain undisclosed |
| `/research` | Same public runtime | Existing link remains functional |
| `/research?t=TOKEN` | Same token-resolved runtime | No token alteration or re-issuance |
| `/research?r=CODE` | Same referral-resolved runtime | Attribution semantics remain unchanged |
| `/research/legacy-v3?t=TOKEN` | Historical runtime | Remains noindex and version-aware |

Unknown parameters must not create participant state. Preview-only parameters
remain disabled in production unless their existing access rule permits them.

## Experience requirements

- The root remains the orientation page; participation remains a focused task
  flow rather than moving the questionnaire onto the homepage.
- Public copy explains value, approximate effort, eligibility and privacy before
  asking for personal information, subject to their separately approved copy
  and privacy decisions.
- Invitation context uses a person/invitation cue, not a lock, and does not name
  or expose the inviter unless an independently approved rule permits it.
- Referral context may say that someone thought the visitor's perspective would
  be valuable, but never reveals who referred them.
- Secure return resumes the saved point after server validation and does not
  repeat identity collection already completed.
- Existing dialog, video, form, progress, error, confirmation and feedback
  patterns are preserved unless a defect blocks this cutover.

## Accessibility requirements

- All route states remain usable at 320 CSS pixels and 200% text zoom.
- Keyboard order and visible focus remain logical through masthead, dialogs,
  forms and navigation.
- Video and feedback dialogs move focus inside, trap it while open, close with
  Escape and restore focus to their trigger.
- Reduced motion removes non-essential transitions, including smooth scrolling,
  without removing orientation or state feedback.
- Entry states, errors and confirmations are communicated in text and
  programmatically, not by colour or icon alone.
- The persistent progress treatment must not obscure questions or controls.

## Privacy, security and research-integrity constraints

- Never put access tokens, referral identifiers, names, emails or answers into
  analytics, logs, canonical URLs, social metadata or test fixtures.
- Preserve the distinction between private access credentials and public
  referral identifiers; referral codes must fail against private endpoints.
- Compatibility handling must not widen referrer leakage for token-bearing URLs.
- Use synthetic credentials for tests and remove any synthetic records created
  for end-to-end verification.
- Preserve instrument/version routing and benchmark eligibility exactly.
- Do not claim the public sample represents product professionals or the wider
  workforce.

## Evidence required before implementation begins

1. A code-level inventory of every route, script, API and template that emits
   `/research` participant links.
2. Available production route counts for `/research`, `/research/privacy`,
   `/research/legacy-v3` and known preview routes, explicitly marking any source
   that is unavailable rather than inferring zero.
3. The known retention horizon for valid legacy-v3 continuation links, or a
   decision to retain that route indefinitely.
4. A confirmed Vercel routing mechanism that preserves all supported query
   parameters and does not expose credentials through a new redirect hop.

Inbound-link evidence is useful but not a blocker for retaining `/research`,
because this packet keeps it compatible rather than deleting it.

## Verification plan

### Static and routing

- Validate `vercel.json` and the production build.
- Assert `/take-part` and `/research` serve the same reviewed runtime.
- Assert supported `t`, `r`, preview and legacy parameters reach the intended
  state without appearing in canonical/social metadata.
- Assert unknown, invalid, expired and disabled values fail safely.

### Synthetic journey matrix

Run each journey from both `/take-part` and its `/research` compatibility form:

1. public start;
2. valid private invitation;
3. existing participant/secure return;
4. valid referral;
5. invalid invitation and invalid referral;
6. historical-v3 resume;
7. save, reload and resume;
8. submit and completion;
9. requested results email and unsubscribe link; and
10. feedback dialog submission in preview-safe mode.

Verify no duplicate participant identity or response is created by route
compatibility and that first-touch attribution remains unchanged.

### Accessibility and responsive

- Keyboard and screen-reader smoke tests for entry, video dialog, consent,
  questions, submission and feedback dialog.
- 320px, common mobile, desktop and 200% zoom checks.
- Reduced-motion and focus-restoration checks.

### Preview gate

A preview is reviewable only when it supports non-sensitive synthetic states,
the exact commit is recorded, and the journey matrix passes. Preview success is
not production approval.

## Rollback

1. Stop emitting new `/take-part` links.
2. Restore `/research` as the primary visible participant route.
3. Revert root CTA, canonical and shared-shell changes as one reviewed commit.
4. Leave `/api/research-*`, participant records, tokens and referral IDs
   untouched.
5. Re-run invitation, return, referral, submit, results and unsubscribe checks.
6. Preserve the Airtable/OpenSpec audit trail.

## Acceptance criteria

- `/take-part` is the canonical participant route and the root points to it.
- Every supported old `/research` entry remains safe and functional.
- Public, invitation, referral, secure-return and legacy states retain their
  existing server-authoritative meaning.
- New invitation/referral/return emitters use `/take-part` only after their old
  equivalents pass compatibility tests.
- The participant shell visibly belongs to Turbulent Ground without adding
  distracting orientation navigation to the task flow.
- No questionnaire, benchmark, API contract, consent or retention behavior is
  changed by this release.
- The complete synthetic journey matrix, accessibility checks and rollback
  rehearsal pass for the exact reviewed commit.

## Approval effect

Approval of revision 1 authorises local implementation on a dedicated
`codex/` branch and preparation of a verified preview. It does not authorise a
push to `main`, production deployment, participant contact, privacy/admin
consolidation, content migration or legacy cleanup.
