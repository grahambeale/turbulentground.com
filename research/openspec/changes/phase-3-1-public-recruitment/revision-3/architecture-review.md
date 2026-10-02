# Phase 3.1 referral sharing — architecture review

**Status:** Proposed for Graham's review  
**Authority:** Approved revision 3 specification  
**Not authorised:** implementation, migration, participant contact or release

## Boundary

The architecture owns referral identity, attribution, eligibility and approved
share-template delivery. It does not own recipient contact data or outbound
personal invitations.

## Proposed components

### Referral identity

On eligible completion, the server associates one opaque `referral_id` with the
completed participant identity. The public code is generated with sufficient
entropy, has no meaningful encoding and is stored separately from private
access/resume/results credentials.

Suggested logical fields:

- `referral_id`
- internal `referrer_participant_id`
- `issued_at`, `disabled_at`, `disabled_reason`
- source instrument and consent/privacy versions
- status: `active`, `disabled`, `withdrawn`, `expired`

The API never returns the internal participant link to a public caller.

### Sharing page access

The completion screen can receive the referral link directly after a successful
submission. A later results email uses a separate time-limited protected token
to open the participant's sharing page. That token is not the public referral
ID and is never inserted into a share message.

### Client-only invitation composer

Recipient name, recipient email and edited message remain in memory in the
browser component. They are not placed in URLs, local/session storage, form
analytics, error reporting, logs or network bodies.

Email uses a locally constructed `mailto:` URI after validation. Platform
launchers receive only the approved/edited message and public referral URL where
their supported share interface permits it. When a platform cannot accept a
recipient or text safely, the client copies the message and opens the platform
without transmitting recipient data to Turbulent Ground.

### Referral landing

The server resolves the opaque public referral ID, creates a candidate
first-touch acquisition record and serves the public research landing page. It
reveals no referrer information. Attribution locks only at consented server-side
survey start under revision 2.

## API proposal for later review

- `POST /api/research-referral/issue` — authenticated completed participant;
  idempotently returns the same active public referral URL.
- `GET /api/research-referral/resolve?r=…` — validates the public code and
  returns only coarse attribution status needed by the landing journey.
- `POST /api/research-referral/event` — accepts an allowlisted, idempotent event
  envelope containing no recipient or message data.
- `POST /api/research-referral/disable` — protected participant/admin action
  applying approved withdrawal or misuse handling.

Names are provisional. Exact routes, authentication and storage are not
approved by this review.

## Allowed measurement

Allowed client properties are limited to:

- sharing mode: `public` or `private`;
- action: `copy_link`, `copy_message`, `native_share`, `open_email` or an
  allowlisted platform launcher;
- approved proposition ID/version;
- coarse success state such as `prepared`, `copied`, `opened` or `cancelled`
  where genuinely observable.

The following are prohibited: recipient name/address/account, message text,
clipboard contents, access/resume/results tokens and survey answers.

No `opened` event is interpreted as sent or posted.

## Security and privacy controls

- Rate-limit referral resolution and event writes without fingerprinting.
- Make issue and event operations idempotent.
- Apply referrer withdrawal by disabling future resolution and severing the
  identifiable referral edge under the approved policy.
- Keep logs free of query strings containing referral IDs where practical;
  otherwise treat those IDs as pseudonymous data with bounded retention.
- Use a strict allowlist for external protocols and platform URLs.
- Encode `mailto:` fields safely and enforce practical length limits.
- Prevent recipient inputs from entering monitoring tools through automatic
  form capture or exception context.
- Fail closed if the active privacy/consent version is missing.

## Data and migration implications

No existing response is retroactively given a referral identity unless a later
explicit migration is approved. Initial rollout may issue links only to new
eligible completions. A separate decision is required before offering links to
existing participants.

Referral relationships and acquisition events require an approved retention
schedule. Aggregate, non-identifying recruitment counts may outlive disabled
links only where the privacy policy permits it.

## Verification plan for a later implementation

1. Prove a public referral ID cannot authenticate to lookup, save, submission,
   results or sharing-page endpoints.
2. Prove recipient name, email and message text produce no network request,
   browser persistence, analytics property or log entry.
3. Prove repeat issuance returns one stable active link and repeat events do not
   change counts.
4. Prove first touch locks at consented start and later links do not overwrite it.
5. Prove disabled, withdrawn, unknown, cyclic and self-referral paths reveal no
   identity and receive the specified attribution status.
6. Exercise email, copy, native share and unavailable-platform fallbacks at
   keyboard-only, screen-reader, 320-pixel, 200%-zoom and reduced-motion states.
7. Reconcile eligible referred completions against authoritative server
   response state with complete exclusions and version provenance.

## Decisions returned for approval

1. Whether persistent links are permanent until disabled or expire after a
   defined pilot period.
2. Whether existing completed participants may receive a referral link later.
3. The first-release launcher allowlist.
4. The retention period for pseudonymous referral and acquisition records.
5. The exact rate limits and operational response to abuse flags.
