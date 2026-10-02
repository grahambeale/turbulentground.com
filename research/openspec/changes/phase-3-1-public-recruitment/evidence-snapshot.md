# Phase 3.1 public recruitment and referral — evidence snapshot

**Revision:** 1  
**Date:** 24 September 2026  
**Activation:** Graham directly requested an OpenSpec. This authorises specification work only.

## Source record

Primary source: `_experiment/phase3/3.1-recruitment/Phase 3.1 Research & Product Brief.md`.

The brief proposes a public recruitment loop:

`Recruit → Participate → Share → Recruit others → Gather evidence → Analyse → Propose → Human decision → Specify → Build`

It asks the system to support public survey entry, attributable referrals, post-completion sharing, materially different recruitment propositions, recruitment-quality measurement, persistent specialist agents, explicit ACT / DEFER / MERGE / CLOSE decisions, and a reviewed specification before downstream work.

## Observation

The brief is a product and research hypothesis. It is not participant evidence and it contains no baseline recruitment data, observed sharing behaviour, validated audience definition, legal assessment, abuse assessment, or evidence that participants want recognition for recruiting others.

Its strongest supported requirements are governance requirements:

- completion matters more than attention;
- recruitment behaviour must be treated as research evidence;
- source evidence, analysis, decisions and specifications must remain traceable;
- agents may analyse and propose but must not approve consequential changes;
- ACT permits specification, not immediate design or implementation.

## Current implementation

Repository inspection on 24 September 2026 found:

- The research is currently described as invite-only in `research/privacy.md` and `research/privacy.html`.
- `/research` requires a pre-created opaque token. A missing or unknown token cannot begin or submit the questionnaire.
- `api/research-invite.js` is owner-only and creates the Identity record and single-use token before participation.
- Lookup, partial save and final submission all validate that Identity token.
- A completed token is single-use. Existing partial responses are updated rather than duplicated.
- Responses record instrument and rationale versions, consent choices, start/completion state and completion eligibility.
- The current client emits a small Plausible research funnel, but there is no referral graph, proposition identifier, recruitment-channel taxonomy or event ledger capable of reconstructing the proposed chain.
- The completion experience can send an optional results email, but it has no approved referral-sharing flow or private recruiter recognition.
- Current privacy wording ties identity administration and duplicate prevention to a small invite-only study. Public self-service identity creation, recruitment attribution and referral recognition are not covered.
- No current repository artifact defines referral retention, withdrawal propagation, bot handling, self-referrals, cross-device attribution or proposition-analysis thresholds.

## Related and contrary evidence

Related implementation evidence shows that the project already values pseudonymous tokens, version provenance, server validation, resumable progress, completion thresholds and separate email consent. Those controls are reusable constraints.

Contrary evidence and tensions:

- Public access conflicts with the current invite-only privacy description and owner-created identity model.
- Persistent anonymous referrals still create linkable pseudonymous relationship data; “anonymous” does not mean non-personal.
- Referral growth can amplify self-selection and homophily, which may make the sample larger while making it less representative.
- Optimising completion may favour easier-to-complete cohorts or messages rather than research-relevant diversity.
- A visible recruitment count may become an incentive and alter participant behaviour.
- Social-platform clicks, browser privacy controls and cross-device journeys can make attribution incomplete.
- The brief proposes agent analysis without defining sample-size, uncertainty or false-discovery controls.

## Limits

No participant records, contact details, answer payloads or referral data were inspected. No recruitment baseline exists in the supplied brief. No legal conclusion is made. No public-entry copy, share copy, screen, architecture, database migration or analytics implementation is approved by this snapshot.
