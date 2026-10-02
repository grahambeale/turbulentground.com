# Graham's specification review — Phase 3.1, revision 2

**Prepared:** 25 September 2026  
**Authority:** decisions and amendments recorded by Graham in the linked Research Project Feedback records  
**Status:** Awaiting Graham's approval of this consolidated revision

This document reconciles the fourteen individual decisions from revision 1. It
does not approve design, implementation, public recruitment or release.

| ID | Outcome | Revision 2 treatment |
|---|---|---|
| D01 | ACT with changes | Require name and email before participation. Use them for study administration, duplicate control and seven-day save-and-return. Permit one incomplete-survey reminder. |
| D02 | ACT | Define the intended population, adult eligibility and treatment of uncertain or out-of-scope responses before public recruitment. |
| D03 | ACT | Use first valid referral attribution and lock it when consent is completed and the survey begins. Later touches never overwrite it. |
| D04 | ACT | Keep the public referral identifier completely separate from every private survey access or resume token. |
| D05 | ACT | Prepare three materially different proposition hypotheses—curiosity, participation and constructive challenge—for later copy review. |
| D06 | ACT with changes | Offer optional referral sharing after completion on-screen and in a requested results/comparison email. Credit only one valid, eligible submitted response. |
| D07 | DEFER | Do not add referral counts, rankings, rewards or recruiter recognition to the first public release. |
| D08 | ACT | Approve logical server-authoritative events and metric definitions before choosing storage or analytics technology. |
| D09 | ACT with changes | Public collection fails closed until revised privacy, consent, retention, reminder, withdrawal and deletion behavior is approved and active. |
| D10 | ACT | Start with idempotency, rate limits and explicit data-quality flags. Do not add fingerprinting, CAPTCHA, incentives or covert tracking without separate evidence and approval. |
| D11 | ACT | Agents may analyse and propose. They may not change recruitment, messaging, targeting or the participant experience without a new attributable human decision. |
| D12 | ACT with changes; separated | Repositioning the main homepage and retiring promotion of the diagnostic/Care Capital is a separate main-site change. Preserve Learnings and direct legacy URLs. It is not implementation scope in this research packet. |
| D13 | ACT with changes | Name and email are required upfront, but this does not opt anyone into ongoing study emails. Study-email consent remains a separate unchecked choice. |
| D14 | ACT | Approve an analysis plan before declaring a proposition winner or changing recruitment strategy. |

## Reconciled conflicts

- D02's explicit ACT review note is now reflected in its Airtable decision field.
- D04's accidentally duplicated D05 review note was replaced with the approved
  referral-ID/access-token separation instruction.
- D01 and D13 supersede revision 1's assumption that public participation would
  not require a name or email.
- D07 removes private recruiter recognition from the initial pilot.
- D12 is retained for traceability but routed to an independently reviewable
  main-site specification, in line with the repository's two-lane governance.

## Decisions still required before implementation

Revision 2 deliberately returns the following exact material for approval:

1. the eligibility and upfront-contact wording in `spec-amendment.md`;
2. the proposed seven-day incomplete-response and one-reminder policy;
3. the referral attribution window and withdrawal behavior;
4. the event, metric, abuse and analysis rules;
5. the separation of the main-site transition into its own work item.

Approval of revision 2 would authorise the next design/architecture review only.
It would not authorise implementation or production release.
