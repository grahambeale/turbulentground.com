# Phase 3.1 public recruitment and referral — specification revision 2

This is the normative revision 2 amendment to revision 1. Where the two
conflict, this document governs. Unchanged revision 1 requirements remain in
force. No design, implementation, data collection or release is approved.

## Intended participants

Public participation is intended for adults aged 18 or over who work in product
development or a closely related organisational role and have direct experience
of AI affecting their work.

Proposed participant-facing eligibility wording:

> This study is for people aged 18 or over who work in or alongside product
> development and have experience of how AI is affecting their work. If that
> broadly describes you, you can take part. The study is exploratory and its
> participants are not assumed to represent every product professional or the
> wider workforce.

A separate screener is not proposed for the first pilot. Participants confirm
the statement before contact details are collected. An uncertain participant
may continue only if they reasonably consider their work closely related; the
response records that self-declared basis. A clearly ineligible response may be
retained under the approved policy but is excluded from trusted recruitment and
benchmark analysis.

## Upfront name and email

Name and email address are required before a public participant begins. They
are used to administer participation, prevent duplicate responses, support
save-and-return, send at most one incomplete-survey reminder and exercise data
rights. They remain logically separated from answer data.

Proposed participant-facing wording:

> Enter your name and email address to begin. I use them to administer the
> study, prevent duplicate responses and let you return if you leave before
> finishing. If you start but do not submit, I may send one reminder with a
> private resume link. Your unfinished response and contact details will be
> deleted seven days after you start unless you complete the survey sooner.
> This does not sign you up for ongoing study emails.

The optional study-email checkbox remains separate, unchecked by default and
unnecessary for participation, referral sharing or receipt of an explicitly
requested personal comparison.

## Incomplete responses, reminder and deletion

- The incomplete-response deadline is seven calendar days after the server's
  recorded `started_at`. Returning does not extend it.
- One reminder may be sent approximately three days after the most recent
  activity, only while the response remains incomplete and before expiry.
- The reminder states the exact deletion date, contains no answer or sensitive
  survey information and uses a time-limited private resume token.
- No second incomplete-response reminder is permitted.
- Submission, withdrawal or expiry immediately disables the resume token and
  cancels any unsent reminder.
- At expiry, the operational system deletes incomplete answers, name, email,
  identity linkage, reminder state and resume credentials. It may retain only a
  minimal non-identifying deletion audit containing policy version, deletion
  timestamp and success/failure state.
- A completed response moves to the published completed-study retention policy.

The resumed survey must display the original deletion deadline. A failed
deletion becomes an operational incident and may not be silently marked as
complete.

## Identity and credential separation

- `participant_id` is an internal opaque identifier.
- `access_token` and every resume token are private bearer credentials.
- `referral_id` is a public opaque attribution identifier and cannot retrieve,
  resume, alter or submit any response.
- Public URLs contain no name, email, answer, internal record ID, access token
  or resume token.
- A referral ID supplied to a participant-data endpoint is rejected without
  disclosing whether any participant exists.
- Referral identifiers may be disabled following withdrawal, misuse or expiry
  without invalidating a completed response.

## Attribution

The first valid referral encountered in the same browser during the seven days
before consented survey start is the candidate first touch. It is locked when
required consent is completed and the server creates the started response.
Later referral encounters become non-authoritative events and never overwrite
the acquisition record.

The first pilot accepts incomplete cross-device attribution and reports it as a
limitation. It does not use fingerprinting to join devices. Self-referrals,
cycles, invalid codes and implausible chains are labelled and excluded from
credited-referral metrics. Referral relationships do not expose either person's
identity or answers.

Withdrawal by a referred participant removes or irreversibly severs their
identifiable referral edge under the approved withdrawal policy. Withdrawal by
a referrer disables future use of their referral ID; already irreversibly
aggregated counts need not be reconstructed, but no identifiable relationship
may remain available for analysis.

## Sharing

Optional sharing is presented only after a successful submission:

1. on the completion experience; and
2. in a results/comparison email the participant separately requested.

Sharing does not affect access to results. The participant can skip it. Links
contain only the approved public referral ID plus approved proposition/version
information. A referral succeeds only when the referred person submits one
valid, eligible response. Visits, clicks, starts, incomplete responses,
duplicates and excluded responses do not count.

The first pilot provides no referral count, ranking, reward or recognition.

## Proposition hypotheses

Later copy review must return three meaningfully different hypotheses:

- **Curiosity:** understand how your experience compares and what the study is
  learning;
- **Participation:** contribute experience to a shared evidence base for product
  teams and organisations;
- **Constructive challenge:** help question weak assumptions about making the AI
  shift successfully.

These are directions, not approved copy. Every rendered version has an
immutable proposition ID and copy version. Performance is judged by valid
eligible completions and sample quality, not clicks alone.

## Server-authoritative event contract

The authoritative events are `survey_start`, `survey_complete`,
`referred_start`, `referred_complete`, `referral_invalid`,
`attribution_conflict`, `resume_reminder_sent`, `incomplete_expired` and
`withdrawal_applied`. They are emitted from successful server state changes.

Client events may describe landing and sharing interactions but cannot create
or override a start, completion, eligibility result or referral credit. Every
metric defines numerator, denominator, exclusions, attribution status,
instrument version, proposition version and observation window. Analytics must
contain no names, email addresses, answers or free text.

## Abuse and data quality

The implementation proposal must return explicit limits for approval. At
minimum it must provide:

- idempotency for identity creation, save, submission and retained events;
- bounded identity and submission attempts per coarse network/time window;
- server-authoritative single completion per participant identity;
- explicit candidate, valid, duplicate, automated, withdrawn and excluded
  validity states;
- retention of auditable source evidence while suspicious journeys are excluded
  from trusted metrics.

Fingerprinting, CAPTCHA, incentives and covert tracking are outside scope and
require separate evidence and approval.

## Analysis and agents

No proposition is described as better or used to change recruitment until a
separate analysis plan defines minimum valid sample per proposition, uncertainty
method, stopping rule, channel/cohort imbalance rule and treatment of multiple
comparisons. Until then, reporting is descriptive and labelled insufficient for
a winner decision.

Agents must separate observed evidence, interpretation, uncertainty and
recommendation. Any proposed change to messaging, targeting, recruitment or the
participant experience creates an attributable decision item for Graham. Agents
cannot implement or release such a change automatically.

## Main-site transition is separate

Homepage repositioning, removal of diagnostic/Care Capital promotion, sitemap
changes and `noindex, follow` treatment for retained legacy pages belong to a
separate main-site OpenSpec. That work must preserve the Learnings area and the
legacy pages' direct URLs. Nothing in this research packet authorises those
main-site changes.

## Revision 2 acceptance gate

Before design or architecture work begins:

- Graham approves this exact revision 2 packet;
- the public eligibility and upfront-contact wording is approved;
- the privacy notice and consent changes are reviewed as participant-facing
  legal information, not treated as cosmetic copy;
- the reminder/deletion mechanism, referral lifecycle and analysis plan each
  return as separately reviewable artifacts;
- every activated rule has an accessible, privacy-safe end-to-end test plan;
- implementation and release approvals remain separate later decisions.
