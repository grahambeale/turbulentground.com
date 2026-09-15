# Floating feedback preview

**Current state (added 15 September 2026):** `FB-20260913-PFINTK` has since
shipped — Airtable shows Status `Shipped`, commit
`8f66f03517a42724dfdfe27b62711447eda70d02`, live in production, with Gmail
intake, receipts and retention execution still disabled (as designed). The
local-only preview URL and "no production release is authorised" statement
below describe this document's own dated snapshot, not the present state.

Preview: http://127.0.0.1:8791/feedback-preview.html
Alternative: http://127.0.0.1:8791/feedback-preview.html?placement=navigation

Built from the current paired questionnaire with network requests disabled. The floating action opens a labelled dialog with one optional feedback task and restores focus and scroll when closed. Comments stay in the current tab's memory, show a demo receipt and are lost when the page reloads. Nothing is sent to Airtable or email. This is a visual/interaction preview, not operational feedback ingestion or agent processing.

Mobile checks at 320px passed: dialog, feedback draft and questionnaire DOM preservation, duplicate demo receipt prevention, Escape, focus restoration, safe stage metadata and alternative placement. These checks do not prove server-side idempotency, triage quality or email delivery.

The empty Airtable Feedback submissions table was created (tblgNzJHlurSlPGL9), with source metadata, private original message/contact fields, triage status/checkpoint and Issues links to Research Project Feedback. Airtable base permissions apply; this does not establish separate table-level access controls. No participant data was imported.

Before a production candidate: connect durable intake, enforce idempotency, build/test the product feedback agent, verify feedback@turbulentground.com receiving, agree retention/privacy and test receipts. Graham explicitly approved preview only; no production release is authorised.

Review the floating control's visibility and placement, whether its purpose is clear, and whether the panel feels easy to dismiss and return from. Use the link alternative for comparison. No separate specification reapproval is requested for this layout review.
