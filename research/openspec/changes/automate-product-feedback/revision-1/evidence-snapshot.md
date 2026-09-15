# Feedback automation — evidence snapshot

Revision 1, 13 September 2026. Activated by Graham's direct request in the current task.

Graham requests return invitations, feedback throughout the experience and via results-email replies, an agent that isolates distinct issues and creates identified Airtable tickets, then carefully considered sharing.

Inspected lib/research-feedback.js: submissions already receive an FB-date-random ID and create one New/Pending record in Research Project Feedback. Public sources are Research study and Results page; Email currently requires admin authority. The endpoint stores the submitted URL, which needs token redaction before broader capture.

Inspected research/index.html: optional statement context is research data, not product feedback. Study-email consent promises no more than one email every 30 days. Inspected api/research-results-email.js: the send payload has no explicit reply-to routing. A working inbound-email service has not been verified.

Authenticated Research Project Feedback queue was inspected for existing scope; no existing feedback-automation specification was identified. Verbatim participant feedback, identity, tokens and responses remain outside repository artifacts. No recipients were read or contacted.
