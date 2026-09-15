# Research feedback email intake

This is the reviewed production candidate for the email portion of
`FB-20260913-PFINTK`. It is deliberately disabled until Graham approves the
exact implementation commit for release.

The Gmail query is restricted to mail addressed to
`feedback@turbulentground.com` and excludes Sent, Drafts, Spam and Trash.
Forwarding may change `Delivered-To`, so eligibility is checked against the
preserved original `To` or `Cc` header. Automated messages are ignored to
avoid receipt loops. Attachments, missing identifiers, absent dates and
ambiguous/plain-text-free bodies are sent to human review.

Stable source identity is derived from the provider `Message-ID`, allowing a
forwarded or re-read copy to reuse the same private source record. New reply
text is separated conservatively from quoted history. The private source may
include the original message and sender address; neither is written to source
control, logs or analytics.

The normaliser does not read research answers, approve work, send mail, delete
messages or activate retention. The existing product-feedback agent remains
responsible for creating Pending tickets after durable private source capture.
Receipts and personal follow-ups remain outside this release.

Delivery was verified on 15 September 2026 using a real test message: the
original feedback recipient survived forwarding into the connected Gmail
mailbox. No message content or participant identifier is recorded here.

Run the synthetic contract test with:

```sh
node research/feedback-agent/gmail-intake.test.mjs
```
