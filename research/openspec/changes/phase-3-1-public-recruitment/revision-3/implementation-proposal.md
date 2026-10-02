# Phase 3.1 public recruitment and referral — implementation proposal

**Status:** Proposed for Graham's approval  
**Basis:** Approved specification revision 3 and approved design/architecture review  
**Not authorised:** code changes, Airtable schema changes, participant contact or release

## Recommendation

Build the capability behind disabled feature flags in six independently
reviewable slices. Do not combine public identity, retention, referral data,
sharing UI and homepage work into one release.

The first participant-facing prototype should cover only the post-completion
sharing module with synthetic referral data. It must not create live referral
IDs, contact recipients or write production Airtable records.

## Slice 0 — schema and policy readiness

Before product code:

- approve the revised public-participation privacy and consent wording;
- approve logical Airtable fields/tables for public identity, referral identity,
  acquisition, reminder state and deletion audit;
- approve referral and acquisition retention;
- approve coarse rate limits and abuse-flag handling;
- create separate feature flags for public entry, referral attribution,
  sharing UI and incomplete-response reminders;
- confirm every production credential can access only the required base and
  that application code never exposes Airtable record IDs.

No live schema mutation is part of this proposal approval. A schema plan and
rollback plan return for separate review first.

## Slice 1 — public identity and seven-day lifecycle

Create a public-start endpoint that validates adult/self-declared eligibility,
name, email, active privacy/consent versions and rate limits before issuing a
private participant access token.

Extend save-and-return state to include an immutable expiry timestamp seven
days after first start. Add a protected scheduled maintenance endpoint that:

- selects incomplete records eligible for the single day-three reminder;
- sends at most one reminder through Resend with a private resume URL;
- deletes expired incomplete response and identity/contact data;
- records only a non-identifying deletion outcome;
- is idempotent and safe to retry.

The existing invite-only route remains active during this slice. Public entry
stays disabled until end-to-end privacy, reminder, deletion and withdrawal
tests pass.

## Slice 2 — referral identity and attribution

Add standalone research endpoints following the repository's existing Vercel
function pattern:

- issue/retrieve one referral ID for an eligible completed participant;
- resolve a public referral ID to coarse attribution status;
- disable a referral ID through an authorised withdrawal/admin path;
- accept allowlisted idempotent recruitment events containing no contact,
  response or message data.

Update public start so it can lock the first valid referral encountered within
the approved seven-day window. Later links create conflict events but cannot
replace locked attribution.

## Slice 3 — post-completion sharing prototype and UI

First build a local/preview prototype using synthetic referral data. It covers:

- persistent personal link and copy control;
- public/private mode selection;
- approved-placeholder proposition selection;
- optional local first-name field;
- optional local email field for an email draft;
- editable message preview;
- copy, native-share, `mailto:` and platform-launch fallbacks;
- clear local-only privacy notice;
- keyboard, screen-reader, narrow-width, zoom and reduced-motion behavior.

The prototype sends no invitation and writes no referral data. After visual and
interaction approval, connect it to the disabled referral endpoints on a
dedicated branch and preview deployment.

## Slice 4 — results-email re-entry

Add an optional sharing call-to-action to a requested results/comparison email.
It opens a protected sharing page using a separate time-limited credential. The
public referral ID never authenticates the page and the protected credential
never appears in share text or analytics.

This slice requires email rendering, expiry, unsubscribe and token-leak tests.

## Slice 5 — reporting, abuse review and controlled pilot

Add server-authoritative reporting for starts, completions and eligible referred
completions. Keep client sharing events descriptive. Apply the approved validity
states and show complete denominators, exclusions and unknown attribution.

Run a limited pilot before broader public recruitment. No proposition winner,
message change or targeting change is permitted until the separate analysis
plan is approved and its threshold is met.

## Expected code areas

Existing files likely affected after later implementation approval:

- `research/index.html` — public entry and completion sharing journey;
- `research/privacy.md` and `research/privacy.html` — public participation,
  referral, reminder and retention wording;
- `api/research-lookup.js`, `api/research-save-progress.js` and
  `api/research-submit.js` — expiry, public origin and attribution validation;
- `api/research-results-email.js` — optional protected sharing re-entry;
- `vercel.json` — only if an approved scheduled maintenance route is used;
- research-specific API, unit and browser tests.

Proposed new standalone functions:

- `api/research-public-start.js`
- `api/research-incomplete-maintenance.js`
- `api/research-referral-issue.js`
- `api/research-referral-resolve.js`
- `api/research-referral-event.js`
- `api/research-referral-disable.js`

Names remain provisional until implementation approval.

## Safety rules

- No recipient name, email or edited invitation text leaves the browser.
- No real participant record is used in prototype fixtures or screenshots.
- No public-entry or referral flag is enabled by a code deployment alone.
- Existing invite-only participation and historical responses remain usable.
- Airtable partial failure cannot produce a valid completion or referral credit.
- Every migration has a dry-run, validation and rollback path.
- Implementation and production release remain separate approvals.

## Approval effect

Approval of this proposal authorises Slice 0 planning and a synthetic Slice 3
prototype on a dedicated branch. It does not authorise Airtable schema changes,
live participant-data writes, reminders, implementation of public endpoints or
production release.
