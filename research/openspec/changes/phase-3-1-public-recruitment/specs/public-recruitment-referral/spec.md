# Phase 3.1 public recruitment and referral — product specification revision 1

## Purpose

Specify a governed public recruitment and participant-referral capability for the Phase 3 research study. This document defines required behavior, data, events, evidence boundaries, edge cases and acceptance criteria. It deliberately leaves consequential product choices at the human review gate.

## Users and context

- **Prospective participant:** encounters a public, direct, organic, social or referred link.
- **Participant:** gives informed consent and starts or completes the questionnaire.
- **Referring participant:** optionally shares after completion.
- **Graham:** owns consequential product and research decisions.
- **Research, analytics, product, quality and specification agents:** observe approved data, identify patterns and propose work within defined authority.
- **Data subject:** may exercise access, objection, withdrawal or deletion rights regardless of referral role.
- **Abusive or automated actor:** may generate invalid visits, starts, completions or referral patterns.

The intended research population is not defined precisely enough in the brief. Public availability must not silently redefine the population.

## Evidence

### Observed evidence

- The brief states the Phase 3.1 research questions, intended loop and human-governance model.
- The current repository requires an owner-created single-use Identity token for lookup, save and submission.
- Current privacy material describes an invite-only study.
- Instrument and rationale versions, consent, progress and completion eligibility are already recorded.
- No approved referral model, event ledger, public-entry model, attribution policy or recruitment-analysis threshold exists.

### Evidence gaps

- No public-recruitment baseline.
- No observed demand for sharing or recruiter recognition.
- No tested proposition performance.
- No agreed target population, eligibility boundary or sampling strategy.
- No evidence that a larger referred sample will improve rather than narrow diversity.
- No measured fraud, duplicate or bot rate.
- No approved legal basis, retention period or withdrawal behavior for referral relationships.
- No approved threshold for comparing propositions or allowing an agent to propose a change.

## Interpretation

Recruitment attribution is research data. It must be versioned, auditable and analysed with completion and sample composition rather than clicks alone. Referral lineage is pseudonymous relationship data and requires privacy controls. Agent recommendations must expose uncertainty and cannot become product work without human review.

## Desired outcome

The pilot can demonstrate one complete, valid and traceable path:

`discovery → consented start → eligible completion → optional share → referred discovery → referred eligible completion → governed analysis → human decision → reviewed specification`

The system must also represent incomplete, unattributed, duplicate, withdrawn and invalid paths without silently converting them into successful recruitment.

## Data definitions

The following are logical data requirements, not a storage design.

### Participant identity

- `participant_id`: server-generated, opaque, non-guessable, stable for one participant journey.
- `access_token`: secret bearer credential used to resume or submit; MUST NOT appear in share URLs, analytics properties or public referral recognition.
- `referral_id`: public opaque code used only for attribution; MUST be separate from the access token.
- `identity_origin`: controlled values such as `owner_invite` or `public_self_service`.
- `created_at`, `started_at`, `completed_at`.
- `instrument_version`, `rationale_version`, `consent_version`, `privacy_version`.
- `completion_status` and existing eligibility result.
- Optional contact data remains separate and consent-controlled.

### Acquisition and referral

- `acquisition_id`: immutable ID for the participant's attributed acquisition record.
- `first_touch_channel`: controlled taxonomy, never free-form campaign input.
- `first_touch_proposition_id` and `proposition_version`, nullable when unknown.
- `referrer_participant_id`, nullable and server-resolved from `referral_id`.
- `referral_generation`: zero for non-referred entry; otherwise parent generation plus one.
- `landing_at`, `attribution_locked_at`.
- `attribution_status`: `attributed`, `direct`, `unknown`, `invalid_referral`, `self_referral`, or `conflicting_referral`.
- Later visits may be recorded as events but MUST NOT silently overwrite locked attribution.

### Proposition registry

- `proposition_id`: stable hypothesis ID.
- `proposition_version`: immutable version of meaning and approved copy.
- `hypothesis`: the motivation being tested, such as curiosity, participation or challenge.
- `status`: draft, approved, active, paused or retired.
- `approved_by`, `approved_at`, and source decision reference.
- Channel-specific rendering may differ only when its equivalence is documented.

### Event envelope

Every retained event must have:

- `event_id`: unique and idempotent;
- `event_name`;
- `occurred_at` and server `received_at`;
- pseudonymous `participant_id` when one exists;
- pseudonymous `session_id`;
- `acquisition_id`;
- channel, proposition ID/version and referral generation when known;
- instrument, rationale, consent and privacy versions when participation has begun;
- `source_authority`: client or server;
- `validity_status`: candidate, valid, duplicate, automated, withdrawn or excluded;
- schema version.

Access tokens, names, email addresses, answer payloads, raw referral codes and free-text comments MUST NOT be analytics-event properties.

## Required events

| Event | Meaning | Authoritative source | Required additional properties |
|---|---|---|---|
| `public_landing_view` | Public recruitment page rendered sufficiently to be viewed | Client, deduplicated per session/page load | landing variant, channel, proposition if known |
| `referred_landing` | Landing contained a valid referral code | Server resolution plus client view | referrer participant ID, generation, proposition |
| `survey_start` | Participant gives required taking-part consent and the first research response record is created | Server | identity origin, versions |
| `referred_start` | `survey_start` with valid locked referral attribution | Server-derived | referrer, generation, proposition |
| `survey_complete` | Final submission succeeds | Server | answered-pair count, eligibility status, versions |
| `referred_complete` | Eligible `survey_complete` with valid locked referral attribution | Server-derived | referrer, generation, proposition |
| `share_option_view` | Approved share hypotheses were actually presented after successful completion | Client, bounded once per completion view | set/version of options shown |
| `share_option_selected` | Participant chose one proposition before invoking a share mechanism | Client | proposition ID/version |
| `share_action` | Participant invoked copy, native share or approved channel action | Client | proposition, action type; MUST NOT claim external posting succeeded |
| `referral_invalid` | Supplied referral code was unknown, expired, withdrawn or otherwise unusable | Server | coarse reason only |
| `attribution_conflict` | A journey presents a different valid referral after attribution is locked | Server | no public identity data |
| `withdrawal_applied` | Approved withdrawal/deletion policy was applied to participant and referral data | Server/admin | policy outcome, not request text |

A click on an external share target is not evidence that content was posted. A `share_action` is therefore an invocation measure only.

## Metric definitions

- **Public completion rate:** valid eligible public completions / valid public survey starts.
- **Referral visit-to-start rate:** valid referred starts / valid referred landing sessions.
- **Referral start-to-completion rate:** valid eligible referred completions / valid referred starts.
- **Completed referred participants:** distinct eligible completed participants with valid referral attribution.
- **Recruiters with an eligible referral:** distinct completed referrers credited with at least one eligible referred completion.
- **Proposition completion yield:** eligible referred completions attributed to a proposition / valid referred landing sessions for that proposition.
- **Referral depth:** maximum valid generation in a cycle-free chain.
- **Recruitment quality:** completion eligibility plus approved sample-composition and data-quality checks; it MUST NOT be reduced to clicks or raw completion count.

Every reported metric must show its numerator, denominator, time window, exclusions, unknown-attribution count and proposition version. No proposition may be called a winner without an approved analysis threshold and uncertainty method.

## Edge cases

The implementation specification must handle and test:

1. missing, malformed, unknown, expired or withdrawn referral codes;
2. a valid referral opened after a direct visit;
3. two different referral links opened before start;
4. a different referral link opened after start;
5. a participant opening their own referral link;
6. referral cycles and implausible generation jumps;
7. the same link opened on multiple devices or in private browsing;
8. multiple people sharing a device;
9. refreshes and repeated client events;
10. blocked cookies, JavaScript, analytics or storage;
11. an offline or interrupted share action;
12. copied links with tracking parameters removed;
13. platform previews or bots opening shared links;
14. automated starts or rapid synthetic completions;
15. partial responses that never complete;
16. a completed participant revisiting the survey or completion page;
17. withdrawal or deletion of a referrer with retained referred participants;
18. withdrawal of a referred participant;
19. proposition copy changing while old links remain active;
20. instrument or rationale version changing mid-journey;
21. accessibility technology activating share controls;
22. participants unable or unwilling to use native social sharing;
23. public participants who do not supply an email address;
24. proposition performance differences caused by channel or cohort mix;
25. small cells that risk identifying a participant or organisation;
26. Airtable or analytics writes succeeding only partially;
27. duplicate events arriving out of order;
28. clock skew between client and server;
29. a referrer later becoming ineligible or excluded for data quality;
30. public-entry abuse exhausting service or Airtable limits.

## Constraints

- Preserve WCAG 2.2 AA, keyboard access, reduced-motion behavior and a non-social copy-link alternative.
- Preserve existing instrument and rationale versioning and historical responses.
- Preserve separate consent for taking part, results email and study emails.
- Do not expose the access token, participant identity, referral graph or recruiter ranking publicly.
- Do not place answer data, contact data or free text in recruitment analytics.
- Do not interpret a referral as endorsement, consent to contact, or proof of relationship.
- Do not count a referral as successful until the recruited response meets the approved completion/eligibility rule.
- Do not silently change attribution, metric definitions, proposition meaning or exclusions after data collection begins.
- Do not allow an agent to activate, retire or rewrite a proposition; alter eligibility or attribution; publish findings; contact participants; or create product work without a recorded human decision.
- Privacy wording, lawful basis, retention and withdrawal handling must be approved before public data collection.
- Design, implementation and release remain separate downstream gates.

## Assumptions requiring review

1. The intended population includes people who discover the study publicly, not only Graham's professional network.
2. Adults can self-assess whether they work in or alongside product development and are experiencing AI-related work changes.
3. No incentive is offered for participation or referrals.
4. A server-issued pseudonymous identity can preserve duplicate controls without requiring a name or email.
5. First-touch attribution is more appropriate than last-touch or multi-touch attribution for the first pilot.
6. Referral recognition is private and based only on eligible completions.
7. Three materially different propositions are enough for the first learning cycle.
8. Cross-device attribution may remain incomplete in the first pilot if the limitation is reported.
9. Current completion eligibility remains the definition of a valid recruited completion.
10. Public recruitment data can be retained long enough to analyse a defined pilot window.
11. Referral links can remain usable after proposition copy is retired, while retaining their original proposition version.
12. The public-site narrative transition can be separated from the minimum recruitment/referral capability.

None of these assumptions is approved by this document.

## Unknowns

- Exact public eligibility and whether a screener is necessary.
- Whether minors or people outside the intended work context can participate.
- Expected traffic, completion and abuse volumes.
- Approved recruitment-channel taxonomy.
- Attribution window and whether direct-first journeys can later become referred.
- How duplicate people can be detected without disproportionate tracking.
- Whether a public participant should receive results without providing email.
- Retention and withdrawal propagation through the referral graph.
- Minimum sample size and uncertainty method for proposition comparison.
- Diversity or coverage criteria required before calling recruitment “quality”.
- Whether private recognition motivates useful sharing or gaming.
- Whether share copy requires platform-specific variants.
- Which system is the authoritative event ledger.
- Operational response when analytics and response writes disagree.
- Agent monitoring cadence, alert thresholds and review workload.
- Whether the public-site information architecture should change in this same initiative.
- Legal review needed for public recruitment, relationship data and social sharing.

## Proposed implementation decisions — inactive pending human review

The recommendations below are proposals, not approvals.

| ID | Consequential decision | Agent recommendation | If ACT | If DEFER / MERGE / CLOSE |
|---|---|---|---|---|
| D01 | Define public access as self-service issuance of a server-side pseudonymous identity, while retaining single-use submission controls | ACT | Specify controlled identity issuance and recovery; no name/email required to start | DEFER keeps invite-only participation; MERGE with identity/abuse work; CLOSE removes public-entry scope |
| D02 | Define and disclose the intended public participant population before opening access | ACT | Add eligibility statement and measurement plan; a screener requires separate wording review | DEFER blocks claims about recruitment quality; MERGE with research-method review |
| D03 | Use immutable first-touch attribution, locked at consented start; later touches remain events | ACT | Implement and version the stated conflict rules | DEFER leaves attribution undefined; MERGE with analytics architecture |
| D04 | Keep access tokens and public referral IDs separate | ACT | Security/privacy invariant becomes mandatory | CLOSE means referrals cannot safely reuse the current invite token |
| D05 | Test three proposition hypotheses—curiosity, participation and challenge—without treating example copy as final | ACT | Move exact copy into a later reviewed design/copy artifact | DEFER launches no proposition experiment; MERGE with recruitment-content research |
| D06 | Offer sharing only after successful completion and count only eligible referred completions as recruitment success | ACT | Sharing and recognition are completion-gated | DEFER removes sharing from the pilot; MERGE with completion journey work |
| D07 | Offer private completed-referral feedback; no public leaderboard or rewards | DEFER pending evidence of participant value and gaming risk | If later ACT, specify privacy-safe count behavior | MERGE with motivation research; CLOSE removes recognition |
| D08 | Approve the event and metric semantics in this specification before selecting storage technology | ACT | Architecture must implement this contract | MERGE with data architecture; DEFER blocks instrumentation build |
| D09 | Update privacy, consent/version records, retention and withdrawal rules before any public collection | ACT | Legal/privacy review becomes a launch blocker | DEFER keeps the study invite-only; CLOSE removes referral lineage |
| D10 | Start with rate limits, idempotency and data-quality flags; defer invasive fingerprinting, incentives and CAPTCHA until evidence requires them | ACT | Abuse controls remain proportionate and measurable | MERGE with security review; DEFER blocks public launch if no minimum control exists |
| D11 | Let agents monitor and propose only after human-approved sample/uncertainty thresholds; agents cannot change live propositions | ACT | Create a separate analysis-governance specification | MERGE with agent operating-model work; DEFER means human-only analysis |
| D12 | Separate minimum recruitment/referral scope from the wider public-site transition | MERGE the site transition into its own OpenSpec | Recruitment can progress without silently redesigning Home/Agents/Evidence/Decisions | ACT together expands scope materially; DEFER leaves current site framing |
| D13 | Preserve optional email capture after completion for public participants; do not require email to participate or share | ACT | Results/study-email consent remains separate | MERGE with results-email specification; DEFER means public participants may not receive emailed results |
| D14 | Require an approved analysis plan before declaring proposition performance or changing recruitment strategy | ACT | Define thresholds, uncertainty, channel adjustment and stopping rules in a later artifact | DEFER permits data collection but no comparative conclusion; MERGE with analytics-agent governance |

## Non-goals

- Final landing-page, completion-page or sharing design.
- Final recruitment or share copy.
- Public recruiter rankings, incentives or rewards.
- Unrestricted anonymous submissions without a controlled participant identity.
- Device fingerprinting or covert cross-device tracking.
- Employer or workforce benchmarks from a referral sample.
- Automated proposition optimisation.
- Autonomous product approval, design, implementation or release.
- Rebuilding the whole public site.
- Changing questions, scoring, benchmark eligibility or the core research proposition.
- Contacting a referred person merely because another participant shared a link.

## Measurable acceptance criteria

These criteria define specification and future verification. Conditional criteria activate only if their corresponding decision is ACT.

### Specification readiness

- All D01–D14 decisions have an explicit ACT, DEFER, MERGE or CLOSE outcome with rationale and unresolved uncertainty.
- Every ACT decision is traceable to a requirement and at least one verification scenario.
- No design, final copy, architecture, implementation task or release approval is inferred from an ACT decision.
- Privacy, research-method and accessibility implications are recorded for every activated data field and event.

### Attribution integrity

- In a synthetic test matrix covering all 30 listed edge cases, 100% of journeys produce the expected attribution status and no access token appears in a URL, event or report.
- Replayed event IDs do not change any metric.
- A second referral after attribution lock does not overwrite the first acquisition record and emits one conflict event.
- Self-referrals and cycles are excluded from credited-completion counts and retain an auditable coarse exclusion reason.
- Proposition results always retain proposition ID and immutable version.

### Funnel integrity

- Server-authoritative starts and completions reconcile exactly with their source response/identity state in synthetic and staging tests.
- Client-only events are labelled as such and are never substituted for a server completion.
- Every reported conversion displays numerator, denominator, time window, exclusion count and unknown-attribution count.
- Partial, invalid, duplicate, automated, withdrawn and ineligible responses contribute to no credited-completion metric.
- Available, missing and blocked client analytics do not prevent consent, participation, save, completion or withdrawal.

### Privacy and security

- Public share URLs contain only the approved public referral identifier and proposition/version reference; they contain no access token, contact detail, answer, session ID or internal record ID.
- A person cannot retrieve a referrer's identity, answers, contact details or referral graph from the public interface or API.
- Public participation cannot begin until approved privacy/consent versions are served and recorded.
- Withdrawal tests demonstrate the approved treatment of participant identity, response, events and referral edges without corrupting aggregate counts.
- Rate-limit and idempotency tests prevent a single actor from creating unbounded identities, events or response records within approved limits.
- Logs and analytics contain no answer payloads, names, email addresses or free text.

### Sharing and accessibility

- Share controls appear only after a successful completion response.
- Each approved proposition is represented by a stable ID/version independent of its rendered copy.
- Copy-link works without native-share or social-platform support.
- Keyboard-only and screen-reader users can understand, choose, copy/share or skip every option.
- Cancelling or failing a native share does not count as a confirmed external post.
- The completion journey remains usable at 320 CSS pixels width, 200% text zoom and with reduced motion.

### Research quality

- Recruitment reporting separates direct, organic, social, referred, unknown and excluded acquisition using an approved taxonomy.
- Proposition comparisons are blocked until the approved analysis-plan threshold and uncertainty method are satisfied.
- Reports show cohort/channel composition alongside proposition performance and flag material imbalance.
- No report describes the public/referral sample as representative of product professionals or the workforce without separate evidence.
- Agent outputs distinguish observed counts, interpretation, limitations and recommendation.
- Every agent recommendation that would change product behavior creates a human-review item with ACT / DEFER / MERGE / CLOSE and cannot mutate the live system.

### End-to-end traceability

- A synthetic direct participant and a two-generation synthetic referral chain can be reconstructed from landing to eligible completion using event IDs and pseudonymous relationships.
- The trace links proposition version, instrument version, consent/privacy versions and human decision references without exposing contact or answer data.
- An agent proposal cites the approved aggregate evidence and uncertainty, a human decision is recorded, and any ACT outcome creates a new reviewed specification rather than a prototype.


## ADDED Requirements

### Requirement: Explicit human activation

The Phase 3.1 change SHALL treat D01–D14 as inactive until Graham records ACT, DEFER, MERGE or CLOSE against the exact packet revision.

#### Scenario: Consequential decision remains pending

- **WHEN** a requirement depends on a decision whose recorded outcome is Pending
- **THEN** no design, prototype, implementation, data collection or release work for that requirement may begin.

#### Scenario: Material amendment is requested

- **WHEN** Graham changes the meaning, scope, data collected or acceptance conditions of a decision
- **THEN** the packet revision increments and the amended decision returns for review.

### Requirement: Controlled public research identity

If D01 is ACT, the system SHALL allow a public prospective participant to obtain a server-issued pseudonymous identity without requiring a name or email, while preserving single-use completion and resumable progress.

#### Scenario: Eligible public visitor starts

- **WHEN** a visitor accepts the approved participation terms and starts the study
- **THEN** the server issues an opaque participant identity and separate secret access token and records the approved version provenance.

#### Scenario: Duplicate completion is attempted

- **WHEN** an already completed identity submits again
- **THEN** the server rejects the duplicate and creates no additional completed response.

### Requirement: Separate referral and access credentials

If D04 is ACT, the system SHALL use a public referral identifier that cannot be used to look up, resume, alter or submit the referrer's research response.

#### Scenario: Referral URL is inspected

- **WHEN** any approved share URL is generated
- **THEN** it contains no access token, contact detail, answer data, session ID or internal record ID.

#### Scenario: Referral code is used as an access token

- **WHEN** a public referral identifier is supplied to a research lookup, save or submission endpoint
- **THEN** access is denied and no participant data is returned or changed.

### Requirement: Deterministic referral attribution

If D03 is ACT, the system SHALL create one immutable first-touch acquisition record and lock it at consented survey start.

#### Scenario: Multiple valid referrals precede start

- **WHEN** more than one valid referral is encountered before start
- **THEN** the approved first-touch rule selects one acquisition and retains later touches as non-authoritative events.

#### Scenario: Referral changes after start

- **WHEN** a different valid referral is encountered after attribution is locked
- **THEN** the existing attribution remains unchanged and an attribution-conflict event is recorded.

### Requirement: Versioned proposition evidence

If D05 is ACT, the system SHALL associate every displayed and selected share proposition with an immutable hypothesis ID and copy version.

#### Scenario: Proposition copy changes

- **WHEN** approved copy is materially changed
- **THEN** a new proposition version is created and existing events retain the prior version.

#### Scenario: Old shared link is opened

- **WHEN** a link generated under a retired proposition remains valid
- **THEN** its recruitment events remain attributed to the original proposition version.

### Requirement: Server-authoritative recruitment outcomes

If D08 is ACT, the system SHALL derive survey starts, completions and referred completions from server state rather than client analytics.

#### Scenario: Client completion event is missing

- **WHEN** a valid server submission succeeds but client analytics is blocked
- **THEN** the completion remains valid and reporting identifies the missing client event without inventing one.

#### Scenario: Client reports completion without server success

- **WHEN** a client event claims completion but no successful server submission exists
- **THEN** the journey is excluded from completion and credited-referral metrics.

### Requirement: Recruitment-quality reporting

If D14 is ACT, the system SHALL report recruitment performance with complete denominators, exclusions, uncertainty and cohort/channel composition.

#### Scenario: Evidence is below the approved analysis threshold

- **WHEN** proposition evidence fails the approved sample or uncertainty rule
- **THEN** no winner is declared and the report states that evidence is insufficient.

#### Scenario: Proposition cohorts differ materially

- **WHEN** channel or participant composition differs under the approved imbalance rule
- **THEN** the report flags the difference and does not attribute the outcome to proposition wording alone.

### Requirement: Completion-gated sharing

If D06 is ACT, the system SHALL make referral sharing available only after a successful completion and SHALL credit only eligible referred completions.

#### Scenario: Participant has not completed

- **WHEN** a participant views or resumes an incomplete questionnaire
- **THEN** no personal referral-sharing control or recruiter recognition is issued.

#### Scenario: Referred response is ineligible

- **WHEN** a referred participant submits but does not meet the approved completion/eligibility rule
- **THEN** the response is retained under its approved policy but no successful referral is credited.

### Requirement: Privacy and withdrawal control

If D09 is ACT, public collection SHALL remain disabled until approved privacy, consent, retention and withdrawal rules cover public identity and referral relationships.

#### Scenario: Required policy version is absent

- **WHEN** public entry is requested without an approved active privacy and consent version
- **THEN** identity creation fails closed and no research or referral record is created.

#### Scenario: Withdrawal affects a referral relationship

- **WHEN** a participant exercises an approved withdrawal or deletion right
- **THEN** the system applies the approved treatment to identity, response, events and referral edges and records a non-identifying audit outcome.

### Requirement: Proportionate abuse and event controls

If D10 is ACT, the system SHALL provide idempotency, bounded identity/event creation and explicit validity states without introducing unapproved fingerprinting or incentives.

#### Scenario: Event is replayed

- **WHEN** an existing event ID is received again
- **THEN** no count or state changes.

#### Scenario: Automated or abusive pattern is detected

- **WHEN** the approved data-quality rule flags a journey
- **THEN** the journey is labelled and excluded from credited metrics without silently deleting source evidence.

### Requirement: Accessible sharing fallback

If D05 and D06 are ACT, the completion experience SHALL provide a keyboard- and screen-reader-operable copy-link path that does not depend on a social platform or native share API.

#### Scenario: Native sharing is unavailable

- **WHEN** the device has no supported native share mechanism
- **THEN** the participant can still choose an approved proposition, copy its attributable link or skip sharing.

#### Scenario: Native share is cancelled

- **WHEN** the participant closes the native share sheet without a verifiable result
- **THEN** the system records at most a share invocation and does not claim an external post.

### Requirement: Governed agent recommendations

If D11 is ACT, agents SHALL separate observed data, interpretation, uncertainty and recommendation and SHALL create a human decision item before any live recruitment change.

#### Scenario: Agent identifies apparent proposition improvement

- **WHEN** an agent detects a performance pattern
- **THEN** it produces a source-linked proposal with limitations and ACT / DEFER / MERGE / CLOSE options and makes no live change.

#### Scenario: Human chooses ACT

- **WHEN** Graham records ACT on the exact proposal
- **THEN** work may progress to a reviewed specification and not directly to design, implementation or release.
