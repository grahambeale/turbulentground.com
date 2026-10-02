# Phase 3.1 retention and reminder plan

**Status:** Planning artifact only; no schedule, email or deletion process has been enabled.

## Lifecycle

- At first public start, set a fixed deletion deadline 14 days later. Saving or reopening the survey never extends it.
- A single reminder becomes eligible after seven days only when the response is incomplete, contact is permitted and no reminder has already been sent.
- Completion before the deadline ends the incomplete-response deletion path and moves the response into the approved completed-study retention policy.
- At or after the deadline, hold the email address in process memory, delete the incomplete answers and related identity/contact data, then attempt one deletion-confirmation email. Keep only a non-identifying operational outcome needed to prove the process ran.
- The deletion-confirmation email explains that automatic deletion prevents retention of an unfinished response without evidence the person still wants it included. Its only onward action is the public start page.
- An expired private return link responds with a generic deleted/expired state and offers a fresh public start. It cannot restore, identify or reveal the deleted response.

## Safety and reliability

- The maintenance job is idempotent: retries cannot send a second reminder or repeat a completed deletion.
- Unsubscribe, withdrawal, invalid address, completion and deletion suppress the reminder.
- The reminder contains only the private resume URL, never a public referral ID.
- Logs contain internal outcome codes and timestamps, not names, emails, answers or raw tokens.
- Failed sends do not extend retention. A deletion deadline remains authoritative.
- A failed deletion-confirmation email is not retried because retaining the address for retry would undermine the deletion promise. Record only `confirmation_attempted` and a coarse delivery outcome.

## Review evidence required before activation

- Dry-run list containing counts only.
- Tests for day boundaries, time zones, retries, completion races and withdrawals.
- Proof that one person cannot receive more than one incomplete-response reminder.
- Proof that deleted records cannot be resumed or reconstructed from logs.
- Manual rollback instructions that disable the scheduled job and public start without affecting invite-only participation.
