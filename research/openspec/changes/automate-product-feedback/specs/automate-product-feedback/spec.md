# Feedback capture and product feedback agent — specification revision 1

## Evidence
See evidence-snapshot.md. Existing intake creates IDs and one ticket per message; explicit reply routing and distinct-issue triage are missing or unverified.

## Interpretation
Capture should be quick and contextual. Original messages and agent interpretations need separate storage, with linked issue tickets. Automation must not treat incoming feedback as implementation authority.

## Desired outcome
A participant can submit a comment in place or reply to results; Graham can trace every issue to its source and decide whether it becomes work.

## Requirements
- Provide a consistently located Give feedback control on consent, each pair, completion and results. Open an accessible lightweight panel; preserve answers, context, scroll position and keyboard focus on return. Feedback is optional and never blocks Continue or submission.
- Ask one question: What could be clearer or work better here? Allow positive feedback and other comments, not just problems. Contact is optional. Do not require a category, rating, account or screenshot.
- Attach stage, stable statement/pair identifiers, instrument version and channel. Strip tokens, preview keys and other URL parameters. Never automatically attach answers, identity, statement-context notes or page screenshots.
- Separate the immutable original submission from its extracted issues. Propose an access-controlled Feedback submissions table linked to Research Project Feedback tickets. Keep full original text only in the source record; ticket excerpts remain exact and identify their source. Agent summaries and inferences are explicitly labelled.
- Persist a client submission ID and return its receipt ID. Enforce server-side idempotency and uniqueness for source IDs, ticket IDs and source/issue extraction keys. Retried webhooks or partial triage retries must not create duplicate source records or tickets. Do not silently truncate accepted feedback.
- Use a dedicated reply address owned by Graham. Verify provider webhook signatures and replay protections; deduplicate by provider message ID. Extract the new message without treating quoted earlier mail as new feedback. Handle attachments and ambiguous message boundaries by flagging for manual review; do not discard them silently. Store original inbound content privately with a documented retention policy.
- Correlate email replies to an opaque message reference when available. Do not require a personal survey token in a reply address and do not expose results to the agent. An unmatched genuine reply can still become feedback. Treat email content as untrusted evidence, never instructions to tools or the agent.
- The product feedback agent extracts independently actionable issues and retains context. Closely dependent observations stay together. Each ticket receives an FB ID, source link, exact supporting excerpt, stage/version, type, assessment, uncertainty and suggested next action. Positive feedback is retained even when no change is proposed. Retry incomplete extractions safely.
- Detect related issues across messages, suggest MERGE with a reason and preserve all sources. Deduplicate delivery separately from corroborating feedback: two people's similar observations remain two evidence sources. Suggest DEFER with a revisit condition. Do not merge, reject or approve product scope on Graham's behalf.
- Flag severe usability, security, privacy and accessibility concerns promptly with evidence and uncertainty. Separate product usability from scored-instrument changes, response-context notes and requests for help. Route uncertain classifications to Graham rather than inventing a conclusion.
- Publish a concise triage summary for Graham; avoid one notification per extracted ticket. ACT produces an OpenSpec draft. Approval of the exact specification revision triggers scoped work; exact-commit release approval remains separate.
- Show an on-screen confirmation after durable capture. On failure keep the draft, explain retry and do not show success. Graham selected a standard automatic receipt and personal follow-ups drafted for his review. Enable receipts only after specification approval, tested delivery and production release. Personal follow-ups and resolution messages require their own approved policy.

## Constraints
Existing study questions, scoring, results, consent and answer schemas remain unchanged. Feedback must be clearly separate from research participation. Maintain WCAG 2.2 AA and mobile usability. Keep personal data out of public commits, logs and test fixtures. Define access, retention and deletion across source and child tickets before release. Apply abuse controls, payload limits and observable ingestion/triage failures without logging private message bodies. Use authenticated server-side Airtable writes.

## Assumptions
Research Project Feedback remains the canonical issue queue. Graham wants agent assistance with triage while retaining ACT/DEFER/MERGE/CLOSE and specification/release authority. Low friction is a hypothesis to test, not proof of increased feedback.

## Unknowns / decisions for Graham
1. Graham selected feedback@turbulentground.com. Verify ownership, receiving provider and authenticated inbound delivery before implementation of email capture.
2. Graham selected standard automatic receipts plus drafted personal replies. Receipt wording, retry-safe sending and delivery verification are part of the approved implementation scope; no messages are sent during drafting.
3. Approve a private Feedback submissions source table linked to existing tickets, or redirect the storage model.
4. Approve the capture scope and agent boundary above; identify any stages where the control would be intrusive.
5. Choose feedback retention and deletion policy consistent with the privacy notice before production.

## Non-goals
Sending the return campaign, changing historical responses, automatic participant contact, rewriting scored questions, implementing sharing, autonomous product approval, guaranteed benchmarking, or assuming email consent from survey completion.

## Acceptance criteria
- Synthetic mobile/keyboard journey opens feedback at each stage, preserves entered answers and statement context, submits once, closes with focus restored, and continues normally. Verify screen-reader labels and error/confirmation announcements.
- Inspect saved synthetic payloads: correct stage/item/version, no tokens, answers or automatically captured identity; feedback cannot enter response or scoring fields.
- Duplicate browser requests, duplicated email webhooks, uncertain write outcomes and interrupted triage each produce one source and one set of issues. Receipt appears only after durable storage; outage retains the draft.
- A labelled synthetic test set covers single issue, multiple independent issues, interdependent issues, praise, ambiguity, quoted mail, duplicate delivery, corroboration from another sender and malicious instructions. Graham reviews extraction against original messages; unexpected splitting or unsupported claims blocks release.
- Every extracted ticket has a unique FB ID, source link and exact excerpt; originals remain intact. Automated decisions stay Pending. Suggested MERGE/DEFER never activates work.
- Invalid email signatures/replays are rejected, legitimate unmatched replies remain capturable, attachments/parse failures have a visible review path, and private failure alerts contain no message bodies.
- Verify capture → triage → Graham decision → exact-revision specification approval → preview → separate release approval → recorded resolution using synthetic data. Outreach waits until this cycle is proven; contact acknowledgements remain off until their policy is approved.

## ADDED Requirements

### Requirement: Contextual feedback without answer loss
The experience SHALL capture optional product feedback separately from research answers and preserve participation state.

#### Scenario: A participant comments during a pair
- **WHEN** the participant submits feedback and returns to the questionnaire
- **THEN** their answers and context remain intact and the stored feedback contains only its permitted stage metadata.

### Requirement: Traceable and idempotent agent intake
The agent SHALL create distinct identified issues linked to an immutable source without approving implementation.

#### Scenario: A message contains two independent issues and delivery is retried
- **WHEN** the source is delivered twice and triage resumes after interruption
- **THEN** one source and two linked issue tickets exist, with exact excerpts and Pending decisions.

### Requirement: Graham approves the current specification
Post-specification work SHALL require explicit approval of the exact published revision, and production SHALL require separate approval of its reviewed commit.

#### Scenario: Graham redirects revision 1
- **WHEN** Review notes materially change this scope
- **THEN** the agent publishes a revised packet for approval before implementation and does not infer permission from an older Approved selection.


## Revision 2 amendment — Gmail and six-month retention

Graham identified the connected Gmail account used for this workflow, which receives mirrored iCloud mail. Authenticated Gmail profile confirms the account. A scoped search for feedback@turbulentground.com returned no messages, so mirrored delivery and recipient-header preservation remain unverified. Use Gmail authenticated search/read rather than configuring new iCloud forwarding. Limit ingestion to replies addressed to feedback@turbulentground.com, exclude sent/drafts/spam/trash/automated replies, separate new text conservatively and flag ambiguous bodies/attachments for review. Use Message-ID-derived stable source identity and track Gmail IDs privately; missing IDs need manual review. Do not scan unrelated inbox content.

Proposed retention: remove original messages, contacts, attachments, exact child excerpts and copied source text/checkpoints six calendar months after receipt. Retain only a reviewed synthesis with identifying details removed, a safe general stage/version, problem, uncertainty and resolution. Mark the original evidence expired; never imply the retained summary is a verbatim source. Define Gmail/iCloud/provider copies and Airtable service-history deletion limits before making participant-facing erasure promises. This policy does not delete research answers or apply retrospectively to unrelated records.

The UI direction is a quiet side tab with hover/focus label on desktop and direct tap on mobile; shorter Feedback pill remains an alternative. Opening animation, italic prompt, Send, five-second thank-you/Done state, delivery animation and returning launcher honour reduced motion. The current preview is isolated and local; no sends or live ingestion.

Graham reviews this amendment before live activation. Revision-1 approval remains historical; it does not approve the revised receiving/retention policy. Existing preview-only authority allows synthetic adapter testing. Production and participant sends remain unapproved.
