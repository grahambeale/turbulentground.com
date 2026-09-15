# Automate product feedback — proposal revision 1

## Interpretation
Low-effort contextual capture and reliable triage can remove Graham's manual transcription while keeping him responsible for product decisions. A message can contain several issues; splitting without provenance could distort the evidence. Existing ID generation is a starting point, not an end-to-end guarantee.

## Desired outcome
People can give feedback without interrupting participation, and Graham receives distinct, traceable tickets ready for evidence review and OpenSpec activation.

## Sequence
First implement and verify in-experience capture, authenticated email ingestion and agent triage. Then separately specify and approve a consent-aware return invitation with a safe new-version attempt. After the full feedback cycle is verified, investigate why participants would share and specify a general invitation mechanism.

## Scope after approval
Build a synthetic-data preview and intake/triage implementation for revision 1. Preview and test evidence return to Airtable. Production release remains a separate exact-commit decision. No outreach or sharing is authorised by this packet.


## Revision 2 amendment — Gmail and six-month retention

Graham identified the connected Gmail account used for this workflow, which receives mirrored iCloud mail. Authenticated Gmail profile confirms the account. A scoped search for feedback@turbulentground.com returned no messages, so mirrored delivery and recipient-header preservation remain unverified. Use Gmail authenticated search/read rather than configuring new iCloud forwarding. Limit ingestion to replies addressed to feedback@turbulentground.com, exclude sent/drafts/spam/trash/automated replies, separate new text conservatively and flag ambiguous bodies/attachments for review. Use Message-ID-derived stable source identity and track Gmail IDs privately; missing IDs need manual review. Do not scan unrelated inbox content.

Proposed retention: remove original messages, contacts, attachments, exact child excerpts and copied source text/checkpoints six calendar months after receipt. Retain only a reviewed synthesis with identifying details removed, a safe general stage/version, problem, uncertainty and resolution. Mark the original evidence expired; never imply the retained summary is a verbatim source. Define Gmail/iCloud/provider copies and Airtable service-history deletion limits before making participant-facing erasure promises. This policy does not delete research answers or apply retrospectively to unrelated records.

The UI direction is a quiet side tab with hover/focus label on desktop and direct tap on mobile; shorter Feedback pill remains an alternative. Opening animation, italic prompt, Send, five-second thank-you/Done state, delivery animation and returning launcher honour reduced motion. The current preview is isolated and local; no sends or live ingestion.

Graham reviews this amendment before live activation. Revision-1 approval remains historical; it does not approve the revised receiving/retention policy. Existing preview-only authority allows synthetic adapter testing. Production and participant sends remain unapproved.
