# Phase 3.1 security and abuse controls

**Status:** Proposed thresholds for Graham's review; nothing is configured.

## Baseline controls

- All public requests use HTTPS, strict method/content-type checks and bounded
  request bodies.
- Access/resume/results credentials and referral IDs are separate random values.
- Store private credential digests where a migration can do so safely; never log
  raw credentials or URLs containing them.
- Apply server-side idempotency to identity creation, referral issue, event
  creation, reminder sending and deletion.
- Public errors disclose no referrer identity, Airtable ID, eligibility detail
  or whether an email address already exists.
- Recipient name, email and edited invitation text never reach Turbulent Ground.

## Proposed initial rate limits

These are cautious pilot limits, not findings about real abuse. Exceeding a
limit returns `429` without creating a record.

| Action | Proposed limit |
|---|---|
| Public identity start | 5 attempts per network source per 15 minutes; 20 per day |
| Same normalised email start/recovery | 3 per hour; 6 per day |
| Referral resolution | 120 per network source per minute |
| Referral issue/retrieve | 5 per authenticated completed participant per hour |
| Recruitment event write | 30 per participant/session per 10 minutes |
| Referral disable | 5 per authenticated participant/admin per hour |
| Protected maintenance route | Scheduler identity only; no public quota |

Network-source enforcement should use an ephemeral platform rate-limit key,
not a new Airtable IP-address field. Do not use device fingerprinting.

## Abuse flags

Flags exclude a journey from credited metrics and create a human-review count;
they do not automatically delete a valid response.

- More than 10 public starts from one referral within 10 minutes.
- More than 5 completed submissions from one ephemeral network source in one hour.
- Referral depth above 5 during the pilot.
- A participant using their own referral ID.
- A referral cycle or impossible generation jump.
- Completion faster than the approved minimum quality threshold.
- Repeated conflicting referrals after attribution lock.
- More than 20 duplicate/replayed events for one idempotency key.

## Operational response

1. Mark affected acquisition/events `candidate` or `excluded`; do not credit them.
2. Keep the participant journey usable unless security requires a temporary
   request block.
3. Disable a referral only for clear automated misuse, withdrawal or Graham's
   recorded decision.
4. Record a coarse reason and aggregate count, never raw recipient/contact data.
5. Review thresholds after the first 50 valid public starts or four weeks,
   whichever comes first. Any threshold change is versioned and human-approved.

