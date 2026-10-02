# Graham's specification review — Phase 3.1 public recruitment and referral, revision 1

## Decisions to review

This packet contains no approval, design or implementation. Review each consequential decision below using **ACT**, **DEFER**, **MERGE** or **CLOSE**. A single overall ACT is insufficient where individual decisions differ.

| ID | Decision | Recommendation | Your decision | Rationale / amendments |
|---|---|---|---|---|
| D01 | Controlled public self-service identity issuance | ACT | Pending | |
| D02 | Define and disclose the intended participant population | ACT | Pending | |
| D03 | Immutable first-touch attribution locked at consented start | ACT | Pending | |
| D04 | Separate public referral ID from secret access token | ACT | Pending | |
| D05 | Test three proposition hypotheses; exact copy reviewed later | ACT | Pending | |
| D06 | Offer sharing after completion; success means eligible referred completion | ACT | Pending | |
| D07 | Private recruiter recognition | DEFER | Pending | |
| D08 | Approve logical event/metric contract before storage architecture | ACT | Pending | |
| D09 | Privacy, consent, retention and withdrawal approval before collection | ACT | Pending | |
| D10 | Proportionate abuse controls; no fingerprinting/incentive/CAPTCHA by default | ACT | Pending | |
| D11 | Agents analyse and propose only under a later approved analysis plan | ACT | Pending | |
| D12 | Separate the wider public-site transition into its own OpenSpec | MERGE | Pending | |
| D13 | Optional post-completion email capture; never required to participate/share | ACT | Pending | |
| D14 | Approved analysis thresholds before proposition conclusions or strategy changes | ACT | Pending | |

## Evidence limits

The supplied brief is the source of intent, not evidence that the proposed behaviors will work. This review has no public-recruitment baseline, participant-sharing research, approved legal assessment, sample-size analysis, abuse data or evidence that recruiter recognition improves recruitment quality.

An ACT decision accepts a direction for further specification. It does not validate the assumption, approve final copy, choose a design, select architecture, authorise implementation or authorise release.

## Missing assumptions requiring explicit response

Record an amendment or MERGE destination if any of these must be answered before a decision:

1. Who is eligible to participate publicly?
2. Are participants required to be adults?
3. Is self-declared relevance sufficient, or is a screener needed?
4. What attribution window applies before consented start?
5. What data is retained when a participant or referrer withdraws?
6. What minimum evidence permits proposition comparison?
7. What sample-composition criteria define recruitment quality?
8. What volume and abuse assumptions must the architecture support?
9. Can the pilot tolerate incomplete cross-device attribution?
10. Should public participants without email receive any result beyond the on-screen completion experience?
11. Is referral recognition useful enough to justify storing and showing it?
12. Who approves privacy/legal wording and the analysis plan?

## Available decisions

- **ACT:** enough evidence and clarity exist to progress this decision into the next specification/design gate stated in the row. ACT does not mean build.
- **DEFER:** preserve the decision and state what evidence, date or threshold should reopen it.
- **MERGE:** name the related decision or OpenSpec that should own it. Preserve provenance; do not silently combine scope.
- **CLOSE:** remove the proposed capability from Phase 3.1 unless materially new evidence appears.

Material amendments produce revision 2 and return for review. Decisions apply only to the exact revision and ID recorded here.

## Review history

- **Revision 1, 24 September 2026:** initial OpenSpec produced from the Phase 3.1 brief and current repository state.
- **Current status:** Awaiting Graham review.
- **Next allowed action:** incorporate recorded decisions into a revised specification or, where explicitly ACTed, prepare post-specification design work only after the exact review gate is recorded.
- **Prohibited at this stage:** design, prototype, implementation, deployment, participant recruitment, live analytics collection or automated proposition changes.
