# Phase 3.1 logical data plan

**Status:** Detailed proposal for Graham's review; no Airtable fields or tables have been created.

The current application code confirms the live `Identity` table
(`tblwpricYYzx4rmiR`) and `Responses` table (`tblL9mf8VfAmbhuG7`) plus the
field IDs labelled **existing** below. The current Airtable credential cannot
read base-schema metadata, so every new field remains labelled **ID assigned on
creation**. No field ID is invented in this document.

## Separation of concerns

The public recruitment flow should keep four kinds of information separate:

1. **Private participant identity** — name, email, consent versions and a private access token. Accessible only to the research service and authorised administration.
2. **Research response** — questionnaire answers and instrument version, linked internally to the participant but never exposed through a public referral link.
3. **Public referral identity** — one random, non-meaningful referral ID for an eligible completed participant. It must not contain or reveal an Airtable record ID, name, email or response data.
4. **Operational lifecycle** — first-start time, immutable deletion deadline, one reminder state, completion state and non-identifying deletion outcome.

Recipient names, recipient email addresses and edited invitation messages are deliberately excluded. They remain in the participant's browser and are never written to Airtable, logs or analytics.

## Logical fields

### Private participant identity

- Participant ID: internal random identifier.
- Name: supplied by the participant at public start.
- Email: normalised for delivery and duplicate checks.
- Privacy version and consent version: exact versions accepted.
- Consent timestamp and public/invite-only origin.
- Private access-token digest, never the raw token.
- Withdrawal or contact-suppression state.

### Research response

- Participant ID link.
- Instrument/questionnaire version.
- Started, last-saved and submitted timestamps.
- Completion state.
- First valid referral attribution, if any.

### Referral identity and attribution

- Public referral ID: random and stable for the completed participant.
- Referral status: active, disabled or expired.
- First seen and first attributed timestamps.
- Coarse acquisition channel and campaign label where permitted.
- Conflict count for later referral links without overwriting first-touch attribution.

### Incomplete-response lifecycle

- Immutable deletion deadline: 14 days after first start.
- Reminder eligibility and one reminder-sent timestamp.
- Deletion completed timestamp and non-identifying outcome code.
- Retry/idempotency key for maintenance operations.

## Proposed Airtable delta

### Existing `Identity` table — add fields

| Field | Type | Purpose | ID |
|---|---|---|---|
| Identity Origin | Single select: `owner_invite`, `public_self_service` | Separates existing invite-only participants from public entry | Assigned on creation |
| Privacy Version | Single line text | Exact privacy wording accepted | Assigned on creation |
| Consent Version | Single line text | Exact participation wording accepted | Assigned on creation |
| Participation Consent At | Date/time, UTC | Evidence of the required choice | Assigned on creation |
| Incomplete Expires At | Date/time, UTC | Immutable 14-day deletion deadline | Assigned on creation |
| Incomplete Reminder Sent At | Date/time, UTC, optional | Enforces one reminder only | Assigned on creation |
| Lifecycle State | Single select: `created`, `started`, `completed`, `withdrawn`, `expired` | Server-authoritative state machine | Assigned on creation |
| Public Participant ID | Single line text | Opaque internal journey ID, distinct from all tokens | Assigned on creation |

Keep the existing Name (`fldGto31lmx5KwyNr`), Email
(`fldePJtCCYwLsmNjp`), private Token (`fld6danERot7gjOqb`) and Invite Status
(`fldEhm06lLDvEeF6q`). The first migration does not rename, repurpose or delete
them.

### Existing `Responses` table — add fields

| Field | Type | Purpose | ID |
|---|---|---|---|
| Acquisition | Link to `Research Acquisitions`, optional | Locks the first-touch acquisition used for this response | Assigned on creation |
| Submission Origin | Single select: `owner_invite`, `public_self_service` | Supports separate funnel and quality reporting | Assigned on creation |

Keep the existing instrument version (`fldHJ4KNzMbpzdob6`), rationale version
(`fldW2IulhhJHIdIjV`), start (`fldsN6iDwlfMkxamH`), completion
(`fld8sYjswX21vvVXz`), response token (`flduL4PmBEfH9rLpz`) and completion-floor
(`fldc1EMbDAHAO99Av`) fields unchanged.

### New `Research Referrals` table

| Field | Type | Purpose |
|---|---|---|
| Referral ID | Primary single line text | Random public identifier; minimum 96 bits of entropy |
| Referrer Identity | Link to `Identity`, single record | Private owner of the referral ID |
| Status | Single select: `active`, `disabled`, `withdrawn`, `expired` | Controls public resolution |
| Issued At | Date/time, UTC | Audit timestamp |
| Disabled At | Date/time, UTC, optional | Audit timestamp |
| Disabled Reason | Single select: `withdrawal`, `misuse`, `admin`, `pilot_closed` | Coarse reason only |
| Instrument Version | Single line text | Version provenance at issue |
| Privacy Version | Single line text | Version provenance at issue |
| Consent Version | Single line text | Version provenance at issue |

`Referral ID` is never accepted by lookup, save, submit, results or sharing-page
authentication. Public resolution returns only `active` or `unavailable`.

### New `Research Acquisitions` table

| Field | Type | Purpose |
|---|---|---|
| Acquisition ID | Primary single line text | Opaque internal identifier |
| Participant Identity | Link to `Identity`, single record | Journey being attributed |
| Referrer | Link to `Research Referrals`, optional | Server-resolved first referral |
| First-touch Channel | Single select: `direct`, `organic`, `email`, `linkedin`, `x`, `facebook`, `whatsapp`, `other`, `unknown` | Approved coarse taxonomy |
| Attribution Status | Single select: `candidate`, `attributed`, `direct`, `unknown`, `invalid_referral`, `self_referral`, `conflicting_referral`, `withdrawn` | Auditable outcome |
| Landing At | Date/time, UTC | First eligible landing |
| Locked At | Date/time, UTC, optional | Set once required consent creates the started response |
| Referral Generation | Integer | Cycle/depth validation |
| Proposition ID | Single line text, optional | Approved message hypothesis |
| Proposition Version | Integer, optional | Immutable copy version |
| Conflict Count | Integer, default 0 | Later valid links without overwriting first touch |

### New `Research Recruitment Events` table

| Field | Type | Purpose |
|---|---|---|
| Event ID | Primary single line text | Idempotency key |
| Event Name | Single select from the approved event allowlist | Event contract |
| Occurred At | Date/time, UTC | Client/server event time |
| Received At | Date/time, UTC | Server time |
| Participant Identity | Link to `Identity`, optional | Pseudonymous journey link |
| Acquisition | Link to `Research Acquisitions`, optional | Attribution link |
| Source Authority | Single select: `client`, `server`, `admin` | Prevents client events being treated as completions |
| Validity Status | Single select: `candidate`, `valid`, `duplicate`, `automated`, `withdrawn`, `excluded` | Quality state |
| Event Schema Version | Integer | Contract version |
| Action | Single select: `copy_link`, `copy_message`, `native_share`, `open_email`, `open_platform`, optional | Describes preparation/invocation only |
| Sharing Mode | Single select: `public`, `private`, optional | Coarse interaction only |
| Platform | Single select: `linkedin`, `x`, `facebook`, `whatsapp`, `email`, `other`, optional | Allowlisted launcher only |

This table must not contain recipient details, message text, answer data, raw
access tokens, raw referral codes or free text.

### New `Research Propositions` table

| Field | Type | Purpose |
|---|---|---|
| Proposition Key | Primary single line text | Stable ID plus immutable version |
| Proposition ID | Single line text | Stable hypothesis identifier |
| Version | Integer | Copy/meaning version |
| Hypothesis | Long text | What the wording is intended to test |
| Approved Copy | Long text | Exact reviewed message |
| Status | Single select: `draft`, `approved`, `active`, `paused`, `retired` | Human-controlled lifecycle |
| Approved By | Single line text | Decision provenance |
| Approved At | Date/time, UTC | Decision provenance |
| Decision Reference | Single line text | OpenSpec/Airtable approval reference |

## Access and safety constraints

- Public URLs resolve only the random referral ID and coarse active/inactive state.
- Public endpoints never return identity, response data, private tokens or Airtable IDs.
- The application credential receives only the minimum base/table access needed.
- Analytics receives only allowlisted recruitment events; never names, emails, messages or responses.
- Every write is idempotent and server-authoritative.

## Migration and rollback plan

1. Export field names, types and IDs for the two existing tables before mutation.
2. Create the four new tables and nullable fields. Record the real generated IDs
   in a reviewed migration manifest before application code references them.
3. Add the new nullable fields to `Identity` and `Responses`; do not backfill
   historical rows and do not change existing formulas, views or automations.
4. Run a schema-only validation. All five feature flags remain off.
5. Deploy code that can read/write the new schema only when its corresponding
   flag is enabled. Existing invite-only behavior remains the default.

Rollback order is: disable all five flags; disable the maintenance schedule;
revert application code; verify invite lookup/save/submit/results; archive new
tables; and only then remove newly created fields if they contain no required
audit evidence. Existing fields are never deleted by this migration.
