# Phase 3.1 implementation package — review summary

**Status:** Awaiting Graham's approval. No live schema, code, email, schedule or production setting has changed.

## What this package proposes

1. Extend the existing private `Identity` and `Responses` tables without
   repurposing historical fields.
2. Add separate referral, acquisition, recruitment-event and proposition tables.
3. Require name, email, adult confirmation and participation consent upfront;
   keep ongoing study-email consent separate and optional.
4. Delete incomplete answers and contact details 14 days after first start,
   with at most one reminder after seven days. Attempt one confirmation email
   after deletion, without retaining the address for retries. An expired link
   explains the deletion and offers a completely new start.
5. Issue one persistent random referral ID to an eligible completed participant;
   it remains active until disabled, withdrawn or the pilot closes.
6. Launch V1 with LinkedIn, X, Facebook, WhatsApp, email, copy-link and native
   sharing fallbacks. Recipient details and edited copy remain browser-only.
7. Offer referral IDs only to new eligible completions in the first pilot;
   existing completed participants require a later explicit decision.
8. Retain active referral identity while the link is active. Delete or
   anonymise inactive referral/acquisition/event records 90 days after the
   pilot closes; retain only non-identifying aggregate findings afterward.
9. Use the cautious pilot limits and abuse flags in
   `security-and-abuse-controls.md`, without device fingerprinting.
10. Build and release behind five independently controlled, default-off flags.

Automatic deletion is part of the trust model, not merely housekeeping. It
means an abandoned response is not kept on the assumption that the person still
wants it included in the study.

## Privacy basis for review

The copy and retention plan follow the ICO principles of data minimisation and
storage limitation: collect only what the stated purpose needs, document the
retention period and delete or anonymise data when it is no longer needed. The
ongoing study-email choice remains separate, specific, unambiguous and easy to
withdraw, consistent with ICO consent and electronic-marketing guidance.

Official guidance consulted on 26 September 2026:

- https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/data-minimisation/
- https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/
- https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/what-is-valid-consent/
- https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/

This is a product/privacy design proposal, not legal advice. Graham must confirm
the personal-project controller identity, lawful basis and final published
privacy wording before public collection begins.

## Approval effect

Approval authorises a disabled, synthetic-first implementation on a dedicated
branch plus the reviewed Airtable schema migration. It does not authorise real
participant reminders or deletions, public activation, participant contact or
production release. Those remain separate gates.
