# Phase 3.1 referral sharing — experience design review

**Status:** Proposed for Graham's review  
**Authority:** Approved revision 3 specification  
**Not authorised:** implementation, participant contact or release

## Experience principle

Sharing should feel like a useful optional conclusion to participation, not a
growth demand. The participant remains in control of the channel, recipient,
wording and final send action.

## Entry points

The same sharing module is available:

1. on the completion screen, after the participant's successful submission;
2. in a requested results/comparison email, through a link back to a protected
   sharing page associated with the completed participant.

The module is not available before completion and is never required to view or
request results.

## Proposed journey

### 1. Introduction

Heading: **Invite someone whose perspective would add to the research**

Supporting copy explains that the personal link credits only a valid completed
response, reveals no answers and can be shared more than once.

Primary choices:

- **Share publicly**
- **Invite someone privately**
- **Not now**

The participant's referral link is visible with a persistent **Copy link**
control.

### 2. Share publicly

The participant chooses one of the later-approved message propositions and can:

- copy the prepared post;
- use the device share sheet;
- open a supported platform.

Before leaving Turbulent Ground, the complete editable message and personal
link remain visible. No control says “Posted” because the system cannot know
whether the external action completed.

### 3. Invite someone privately

The participant chooses a channel first:

- Email
- WhatsApp or another messaging app
- LinkedIn
- Messenger
- X direct message
- Copy message

The composer then offers:

- **First name (optional)**
- **Email address (optional; email only)**
- editable message text containing the personal referral link

A short privacy note sits beside the fields:

> These details stay on this device. Turbulent Ground does not save them or
> send the invitation for you.

The action label names the real outcome: **Open email draft**, **Copy message**
or **Open LinkedIn**—never **Send invitation**.

### 4. Return state

When the participant returns, the module says only that their message was
prepared. It does not claim it was sent. Their persistent personal link remains
available for another invitation. Recipient fields are empty.

## Content behavior

- The greeting appears only when a first name is entered.
- The message remains understandable with no name.
- The participant can edit all suggested text before opening another service.
- The referral link itself cannot be edited inside the composer.
- Clear text explains that the recipient will see eligibility, privacy and
  consent information before choosing whether to participate.

## Accessibility and responsive behavior

- The two sharing modes are buttons or tabs with a clear selected state.
- Fields have persistent visible labels, descriptions and errors.
- Copy confirmation is announced to assistive technology without moving focus.
- External-service actions identify that another app or site will open.
- Keyboard users can complete, copy, skip and return without a pointer.
- At 320 CSS pixels and 200% zoom, controls stack vertically and no message or
  link is clipped.
- Reduced motion removes decorative transitions without hiding state changes.

## Failure states

- If native sharing is unavailable, **Copy message** remains available.
- If a platform cannot accept prefilled text or a recipient, the message is
  copied first and the platform opens with a plain explanation.
- If `mailto:` cannot open, show copyable recipient, subject and message fields.
- An invalid or disabled referral link is never generated; an existing disabled
  link leads to a neutral research landing page with no referrer information.
- Offline mode permits copying an already rendered message but makes no server
  claim or attribution promise.

## Questions returned for approval

1. Should the visible personal link remain on the completion page indefinitely
   when revisited through a protected results link, or only for a defined period?
2. Which platforms belong in the first release beyond copy, native share and
   email?
3. Should the participant see a short explanation of why no referral count is
   shown, or should recognition simply be absent?
4. Which exact message propositions proceed to a separate copy review?
