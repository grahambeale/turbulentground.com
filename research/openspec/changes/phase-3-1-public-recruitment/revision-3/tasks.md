# Phase 3.1 implementation tasks — proposed sequence

## Gate A — approve this plan

- [x] Graham approves the exact implementation proposal.
- [x] Confirm prototype uses synthetic data and no production write path.
- [x] Confirm no main-site/homepage work is included.

## Gate B — schema and policy review

- [x] Produce Airtable schema delta with existing IDs, proposed purposes and access paths; new IDs remain assigned-on-creation because schema metadata access is unavailable.
- [x] Produce retention/deletion lifecycle and rollback plan.
- [x] Produce revised privacy and consent copy.
- [x] Produce reminder email and resume/expiry copy.
- [x] Produce rate-limit and abuse-response proposal.
- [ ] Return all five artifacts for Graham's approval before mutation.

## Gate C — synthetic prototype

- [x] Create a dedicated branch from current `origin/main`.
- [x] Add a synthetic post-completion sharing state matching the live research
      visual system without changing production behavior.
- [x] Implement public/private modes, persistent link, local-only composer and
      platform fallbacks.
- [x] Verify no recipient value enters network, storage, analytics or logs.
- [ ] Test keyboard, screen reader semantics, 320px, 200% zoom and reduced motion.
- [x] Publish a protected preview and return it for Graham's review.

## Gate D — implementation approval

- [ ] Record exact approved prototype and schema/policy artifacts.
- [ ] Graham explicitly approves implementation scope.
- [ ] Claim research lease and preflight Airtable, Resend, Vercel and test paths.

## Gate E — staged build

- [ ] Implement Slice 1 public identity/lifecycle behind disabled flags.
- [ ] Verify reminder/deletion/withdrawal end to end with synthetic records.
- [ ] Implement Slice 2 referral identity and attribution behind disabled flags.
- [ ] Implement Slice 3 approved sharing UI.
- [ ] Implement Slice 4 protected results-email re-entry.
- [ ] Implement Slice 5 reporting and abuse review.
- [ ] Keep each slice in an independently reviewable commit where practical.

## Gate F — preview and release

- [ ] Run full research tests plus new API/browser/privacy tests.
- [ ] Verify existing invite-only journey and historical-version behavior.
- [ ] Publish a branch preview and record commit and evidence in Airtable.
- [ ] Graham separately approves release.
- [ ] Release flags disabled, verify production, then separately approve any
      controlled pilot activation.
