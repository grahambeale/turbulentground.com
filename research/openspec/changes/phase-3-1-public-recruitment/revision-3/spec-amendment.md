# Phase 3.1 public recruitment and referral — specification revision 3

This is the normative revision 3 amendment. Revision 1 plus revision 2 remains
the governing specification except where this document adds to D06. No design,
implementation, participant contact or release is approved.

## Persistent personal referral link

After one valid, eligible survey completion, the server issues or reveals one
persistent personal referral link for that participant.

- The link contains only the participant's opaque public `referral_id` and any
  approved proposition/version reference.
- It contains no participant name, email, answer, internal record ID, access
  token, resume token or results token.
- It may be reused across public posts, direct messages and email invitations.
- It remains attributable to the same participant across supported channels.
- It can be disabled following withdrawal, expiry, abuse or a data-rights
  request without affecting the participant's completed response.
- Opening the link gives no access to the referrer's identity, response,
  results or referral history.
- Referral success remains one valid, eligible submitted response. Clicks,
  starts, incomplete responses, duplicates and exclusions do not count.

The initial release does not show referral counts, rankings, rewards or public
recognition.

## Sharing modes

The participant is offered two equally optional paths after completion and in a
requested results/comparison email:

1. **Share publicly** — copy the personal link, invoke the device's native share
   sheet, or open a supported social platform with approved message text where
   the platform permits it.
2. **Invite someone privately** — prepare a personalised message for one person
   and then open the participant's own email or messaging service.

Neither path affects access to results. A plain copy-link fallback is always
available and works without a social account or native share API.

## Private invitation composer

The composer may accept:

- an optional recipient first name, used only to personalise the greeting;
- an optional recipient email address when the participant chooses email;
- a selected approved message proposition;
- the participant's persistent personal referral link.

Recipient name and email are ephemeral local inputs:

- they are not submitted to Turbulent Ground servers;
- they are not written to Airtable, analytics, logs, browser persistence or the
  participant's research record;
- they are cleared when the composer closes or after the external service is
  opened;
- they are never used for study emails, reminders, marketing or follow-up;
- they do not create a participant identity before the recipient independently
  opens the link and chooses to take part.

For email, the browser may open a `mailto:` draft containing the recipient,
approved subject, personalised message and referral link. Turbulent Ground does
not send the message. For LinkedIn, WhatsApp, Messenger, X and similar services,
the experience may copy the prepared message and open the service. Because
platforms differ, the interface must not promise that a named recipient or full
message can always be prefilled.

Only one intended recipient is composed at a time. Bulk entry, address-book
upload, automated sending and server-side delivery are outside scope.

## Message requirements

Every suggested message must:

- make clear that it comes from the participant, not an automated Turbulent
  Ground mailing system;
- identify the link as an invitation to Graham Beale's AI-and-work research;
- avoid implying that participation is required or rewarded;
- avoid exposing the participant's answers, comparison or referral activity;
- avoid claiming that the recipient is eligible before they review the public
  eligibility statement;
- allow the participant to edit the message before sending.

Proposed neutral private-message structure:

> Hi [first name] — I've taken part in Graham Beale's research into how AI is
> changing work in and around product teams. I thought your perspective might
> be valuable. You can read about it and decide whether to take part here:
> [personal referral link]

This is example structure for design review, not approved final copy.

## Events and measurement

The system may record that the participant selected public sharing, private
invitation, copy link, email or another supported channel. It must not record
the intended recipient's name, address, account identifier or message text.

Opening an external service records at most a share invocation. It is not proof
that a message or post was sent. Attribution begins only when the referral link
is later opened and follows the revision 2 first-touch rules.

## Accessibility and failure behavior

- All sharing and composer controls are keyboard and screen-reader operable.
- Labels explain that recipient details remain on the device and are not saved.
- The message and link can be copied without relying on any external platform.
- If an external app is unavailable or blocks prefilling, the prepared text
  remains available to copy and nothing is reported as sent.
- Cancelling an email draft or share sheet creates no success claim.
- The flow remains usable at 320 CSS pixels, 200% text zoom and with reduced
  motion.

## Revision 3 approval gate

Before design or architecture begins, Graham must approve this exact revision
3 amendment together with the revision 2 packet. Later review must return the
exact message variants, platform behavior, referral-link lifecycle and local-
only data-flow verification. Implementation and release remain separate gates.
