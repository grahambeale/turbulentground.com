# Phase 4 Release 4A — invitation administration review

**Revision:** 1  
**Airtable:** `FB-20261002-PHASE4-REL4-INVITATIONS`  
**Decision required:** approve, approve with changes, defer or reject

## What this release does

It gives invitation creation one canonical owner route at
`/admin/invitations`. It preserves the current access key, protected API,
Identity write and `/take-part?t=…` link. The old `/research/admin` URL remains
a protected compatibility entry.

## What the audit found

1. **Invitation creation — healthy but misplaced.** The current form is labelled,
   keyboard-readable and returns a copyable link, but it lives inside the old
   research namespace.
2. **Success and message preparation — healthy.** The screen focuses and selects
   the new link and generates optional message templates locally. These should
   be preserved rather than redesigned.
3. **Results preview — healthy but separate.** Sending a fictional results email
   is not part of invitation creation and should stay out of this release.
4. **Feedback intake — overloaded.** Manual research-feedback entry shares the
   same page and key, increasing clutter and coupling. It should remain unchanged
   until a later `/admin/feedback` packet.
5. **Security — bounded but basic.** The API uses timing-safe shared-key checking,
   writes one new Identity and never lists participants. Remembering the key in
   local storage is explicit but makes the browser profile an authorised device;
   this warning must remain clear.

## Highest-impact decision

Approve a narrow route-and-separation change now. Do not combine it with
participant dashboards, account authentication, bulk operations or the
results/feedback admin migrations.

## Evidence limits

The unauthenticated screen and source contracts were audited. No real access
key, participant record, invitation creation or email was used. Full success,
error and compatibility states must therefore be exercised with synthetic data
in the implementation preview.

## Approval requested

Approve revision 1 to authorise local implementation and a verified preview.
Production remains a separate decision after you review the exact commit.
