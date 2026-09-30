# Phase 4: One Turbulent Ground — product specification revision 1

## Purpose

Establish one coherent Turbulent Ground product across the main domain while preserving every valid participant entry and continuation path and creating one enforceable product-change workflow for Graham, Claude Code and Codex.

## Users and context

- A new visitor arriving at the root domain.
- A person opening a private invitation.
- A person opening a participant's referral link.
- An existing participant returning through a secure link or reminder.
- A completed participant viewing results or sharing the study.
- Graham initiating or approving product changes.
- Claude Code or Codex assessing and implementing an approved change.

## Evidence

The source direction and current-state evidence are recorded in `evidence-snapshot.md` and Airtable item `FB-20260930-PHASE4`.

## Interpretation

Phase 4 names the site and operating-model consolidation. It does not rename Phase 3 questionnaire versions or combine historically incompatible benchmark cohorts. Invite-only and referral experiences are modes of entry into the same product, not separate products or microsites.

## Desired outcome

The domain presents one proposition, one coherent journey and one governed product-development process without breaking links, weakening consent or obscuring attribution.

## Constraints

- No existing invitation, referral, resume, results or unsubscribe link may silently fail because of the migration.
- Tokens, participant data and referral identifiers must retain their existing security and privacy properties.
- Historical instrument/version identifiers and benchmark eligibility rules remain unchanged unless separately specified and approved.
- Specification approval does not authorise implementation; implementation approval does not authorise release.
- Production migration must be reversible until route, email, analytics and data-integrity checks pass.
- Product changes initiated in chat must be recorded in Airtable and represented by a current OpenSpec revision before implementation.
- Existing work in the shared checkout must not be absorbed or committed without ownership verification.

## Assumptions

- The current Phase 3 participant journey is the baseline product to consolidate around.
- `/learnings` remains a useful supporting destination.
- Legacy Phase 2/Care Capital pages can remain reachable during migration without remaining prominent in navigation.
- One Airtable product-decision queue can represent work across the consolidated product if its scope description and fields are updated deliberately.

## Unknowns

- Which legacy routes receive material traffic or external links.
- Whether `/research` should permanently redirect to `/` or remain a compatibility renderer.
- Which main-site documents should be archived, merged or retained as historical records.
- The exact analytics event migration and reporting baseline.
- Whether the existing Airtable table name/description should be broadened or a linked cross-product table should be created.
- The final visual, information-architecture and copy treatment at the root.

## Non-goals

- Rewriting the questionnaire or changing its scoring and benchmark methodology.
- Merging incompatible questionnaire versions or fabricating benchmarks.
- Removing participant privacy, consent, retention or withdrawal controls.
- Deleting legacy pages before inventory, redirect and rollback evidence exists.
- Building a separate invite-only or referral product.
- Authorising a production release in this revision.

## Acceptance criteria

- An approved route inventory maps every public, invite, referral, return, results, unsubscribe, privacy, learning and legacy URL to its Phase 4 behaviour.
- Root, invite-only and referral entry all reach the same product while preserving the correct context and attribution.
- Existing secure continuation links and emails remain valid through the cutover or have an explicitly tested compatibility path.
- Questionnaire version identifiers and benchmark cohorts are unchanged by the site phase label.
- Navigation, metadata, social previews, feedback UI and emails consistently express the Phase 4 proposition.
- Claude Code and Codex read the same canonical work state, backlog, decisions and handoffs.
- A product change cannot progress to implementation without an Airtable record, a current OpenSpec revision and Graham's explicit approval of that revision.
- A product change cannot progress to production without a reviewable implementation, recorded verification and Graham's separate release approval.
- The migration has a tested rollback and no known broken critical links.

## ADDED Requirements

### Requirement: One canonical product
The domain SHALL present the Phase 3 research-led experience as the canonical Turbulent Ground product under the Phase 4 consolidation.

#### Scenario: Root visit
- **WHEN** a visitor opens `/`
- **THEN** they encounter the canonical proposition and can begin or continue the appropriate product journey without first choosing between a main site and a research site.

#### Scenario: Research compatibility
- **WHEN** a visitor opens `/research` or a supported research URL
- **THEN** the request resolves to the corresponding Phase 4 state without losing approved parameters or showing a competing product proposition.

### Requirement: Inclusive entry-state continuity
The product SHALL support public, invite-only and referral entry as distinct states of one journey.

#### Scenario: Private invitation
- **WHEN** a person follows a valid private invitation
- **THEN** the system recognises the invitation, preserves the intended one-to-one context and applies the approved identity, consent and eligibility behaviour.

#### Scenario: Referral
- **WHEN** a person follows a valid referral link
- **THEN** the system recognises the opaque referral code, reveals no referrer personal data and preserves approved attribution through eligible completion.

#### Scenario: Public entry
- **WHEN** a person arrives without invitation or referral context
- **THEN** they can use the approved public self-service entry without being treated as an invited or referred participant.

### Requirement: Participant continuity
The migration SHALL preserve consent, save-and-return, reminders, completion, results, benchmarks, unsubscribe, withdrawal and retention behaviour.

#### Scenario: Existing participant returns
- **WHEN** an existing participant opens a valid secure return or results link issued before cutover
- **THEN** the intended state loads without requiring a new identity or exposing token data.

### Requirement: Historical research integrity
The Phase 4 label SHALL NOT alter questionnaire version identifiers, question meaning, response storage or benchmark cohort eligibility.

#### Scenario: Results calculation
- **WHEN** a participant receives results after Phase 4 launches
- **THEN** comparisons continue to use the approved instrument-version and minimum-eligibility rules rather than the site phase label.

### Requirement: Legacy-route safety
Legacy product routes SHALL remain available or redirect through an approved mapping until verified safe to retire.

#### Scenario: Unknown legacy dependency
- **WHEN** inventory or production verification finds a used legacy route without an approved destination
- **THEN** that route remains compatible and the release is not treated as complete.

### Requirement: Model-neutral operating system
Claude Code and Codex SHALL use the same repository-backed product context and handoff protocol.

#### Scenario: Either assistant receives a request
- **WHEN** Graham asks Claude Code or Codex for a product change
- **THEN** the assistant reads the same canonical phase brief, workflow, work state, decision log and backlog before changing product files.

### Requirement: Airtable and OpenSpec gates
Every non-emergency product change SHALL have an Airtable intake record and a current OpenSpec revision before implementation.

#### Scenario: Direct chat request
- **WHEN** Graham requests a product change in chat
- **THEN** the assistant creates or links the Airtable intake, drafts or updates OpenSpec, and requests approval of the exact revision rather than treating the chat message as release authority.

#### Scenario: Material revision
- **WHEN** evidence, requirements, scope or acceptance criteria materially change
- **THEN** approval returns to Pending for the new exact revision.

#### Scenario: Release
- **WHEN** an approved implementation is ready
- **THEN** production changes wait for a separate explicit release decision and are verified after deployment.

### Requirement: Staged migration
Implementation SHALL be decomposed into independently reviewable governance, product-cutover and cleanup releases.

#### Scenario: Stage ordering
- **WHEN** Phase 4 implementation begins
- **THEN** the shared governance layer is established first, the product route cutover follows with compatibility and rollback, and legacy cleanup occurs only after production evidence supports it.

