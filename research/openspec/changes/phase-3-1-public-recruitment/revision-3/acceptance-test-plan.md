# Phase 3.1 end-to-end acceptance tests

**Status:** Proposed release and activation criteria.

## Existing journey regression

- Owner-generated invite lookup, email capture, save/return, final submission,
  comparison email, unsubscribe and versioned results remain unchanged.
- Historical responses keep their original instrument and rationale versions.
- A public referral ID fails lookup, save, submit, results and sharing-page auth.

## Public start and consent

- Name, email, adult confirmation and participation consent are required.
- Study-email consent is separate, unchecked and independently recorded.
- Privacy/consent versions and timestamps are recorded exactly.
- Duplicate/recovery behavior reveals no account existence to an unauthorised caller.
- Limits return `429` and create no partial Identity/Response record.

## Save, reminder and deletion

- The expiry is exactly 14 calendar days from the server's first-start time
  and never moves when a participant saves, resumes or changes device.
- Only one day-seven reminder can be sent; retries and races cannot duplicate it.
- Completion, withdrawal, unsubscribe/suppression, invalid address and deletion
  each prevent a reminder.
- Expiry deletes the incomplete answers and related name/email/private access
  data; the private return link then fails safely.
- After successful deletion, one confirmation email is attempted using the
  address held only in process memory. Failure creates no retry record containing
  the address and never postpones or reverses deletion.
- The expired link shows a generic explanation and a public “Start a new
  response” action. Starting again creates a new identity, token and 14-day
  deadline; it cannot recover or join to the deleted response.
- Logs and audit rows cannot reconstruct deleted contact or answers.

## Referral and attribution

- One eligible completed participant receives one stable random referral ID.
- Unknown, malformed, disabled and withdrawn IDs reveal no referrer information.
- First valid referral locks only when consent creates the started response.
- Later referrals do not overwrite first touch and create one conflict event.
- Direct, self-referral, cycle, depth, multi-device and duplicate-event cases
  produce the approved status and credited-completion outcome.
- Only eligible completed referred responses count as recruitment success.

## Sharing V1

- The sharing module appears only after successful completion.
- Public/private selection, copy-link, copy-message, native-share fallback,
  email draft and allowlisted platform launchers work without implying a post
  was sent.
- Recipient name, email and edited message cause no Turbulent Ground request,
  analytics property, log, URL parameter, local/session storage or crash report.
- The flow works keyboard-only and with screen-reader names/status updates.
- It remains usable at 320 CSS pixels, 200% text zoom and reduced motion.

## Reporting and integrity

- Server starts/completions reconcile with authoritative Identity/Response state.
- Reports show numerator, denominator, window, exclusions and unknown attribution.
- Client share actions are labelled as preparation/invocation, not delivery.
- Proposition comparison remains disabled until its separate analysis plan is approved.

## Pass rule

Every privacy/security/consent/deletion test and every existing-journey
regression must pass. A failed or untested critical case blocks release or
activation; it cannot be waived by a successful visual preview.
