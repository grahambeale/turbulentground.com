# Feedback automation — evidence snapshot

Revision 1, 13 September 2026. Activated by Graham's direct request in the current task.

Graham requests return invitations, feedback throughout the experience and via results-email replies, an agent that isolates distinct issues and creates identified Airtable tickets, then carefully considered sharing.

Inspected lib/research-feedback.js: submissions already receive an FB-date-random ID and create one New/Pending record in Research Project Feedback. Public sources are Research study and Results page; Email currently requires admin authority. The endpoint stores the submitted URL, which needs token redaction before broader capture.

Inspected research/index.html: optional statement context is research data, not product feedback. Study-email consent promises no more than one email every 30 days. Inspected api/research-results-email.js: the send payload has no explicit reply-to routing. A working inbound-email service has not been verified.

Authenticated Research Project Feedback queue was inspected for existing scope; no existing feedback-automation specification was identified. Verbatim participant feedback, identity, tokens and responses remain outside repository artifacts. No recipients were read or contacted.


## Revision 2 amendment — Gmail and six-month retention

Graham identified the connected Gmail account used for this workflow, which receives mirrored iCloud mail. Authenticated Gmail profile confirms the account. A scoped search for feedback@turbulentground.com returned no messages, so mirrored delivery and recipient-header preservation remain unverified. Use Gmail authenticated search/read rather than configuring new iCloud forwarding. Limit ingestion to replies addressed to feedback@turbulentground.com, exclude sent/drafts/spam/trash/automated replies, separate new text conservatively and flag ambiguous bodies/attachments for review. Use Message-ID-derived stable source identity and track Gmail IDs privately; missing IDs need manual review. Do not scan unrelated inbox content.

Proposed retention: remove original messages, contacts, attachments, exact child excerpts and copied source text/checkpoints six calendar months after receipt. Retain only a reviewed synthesis with identifying details removed, a safe general stage/version, problem, uncertainty and resolution. Mark the original evidence expired; never imply the retained summary is a verbatim source. Define Gmail/iCloud/provider copies and Airtable service-history deletion limits before making participant-facing erasure promises. This policy does not delete research answers or apply retrospectively to unrelated records.

The UI direction is a quiet side tab with hover/focus label on desktop and direct tap on mobile; shorter Feedback pill remains an alternative. Opening animation, italic prompt, Send, five-second thank-you/Done state, delivery animation and returning launcher honour reduced motion. The current preview is isolated and local; no sends or live ingestion.

Graham reviews this amendment before live activation. Revision-1 approval remains historical; it does not approve the revised receiving/retention policy. Existing preview-only authority allows synthetic adapter testing. Production and participant sends remain unapproved.
