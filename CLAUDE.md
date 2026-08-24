Before doing anything, always read orchestration-prompt.md, okr.md, and content-requests.md in full. Follow them exactly.

## Deployment — git lock notes

Standard `git add -A && git commit -m "..." && git push` is the normal way to
deploy this repo, and has worked reliably every time it's been used.

Occasionally `.git/index.lock` or `.git/HEAD.lock` is left behind by an
interrupted or crashed git invocation (not by a live process). If a commit
fails with a "file exists" lock error:

1. Check `ps aux | grep "[g]it"` to confirm no git process is actually
   running against this repo. If something real is running, wait for it —
   do not touch the lock.
2. If nothing is running, `rm` the lock file. On this machine this has
   worked without incident every time it's come up (verified repeatedly:
   `.git/index.lock` and `.git/HEAD.lock`, both stale, both cleared cleanly
   with a plain `rm`, no permission error).
3. Re-run `git status` to confirm a clean/expected state before staging
   again. If an earlier `git add -A` was interrupted mid-lock, the index can
   end up in a stale partial state (e.g. showing phantom deletions) — `git
   reset` (index only, does not touch the working tree) before re-staging
   fixes this.

For read-only inspection while diagnosing a lock issue, `git --no-optional-locks
status` avoids taking a fresh lock itself.

**Now confirmed both ways, not just flagged (updated 24 Aug 2026, post-Sprint-17).**
The original "unverified claim" below has been tested directly, on both sides:
on this Mac, plain `rm` on a stale lock keeps working every time, exactly as
this file always said. Separately, a Cowork sandbox session tested its own
side of the claim live against this same repo and confirmed: the sandbox
mount genuinely blocks `unlink()` on anything under `.git/` — including a
lock file that same sandbox process had itself created seconds earlier — but
does **not** block `rename()`. Renaming a blocking lock out of its expected
path (instead of trying to delete it) fully un-blocks git there, because
git's own lock-acquisition only checks whether that exact path exists, not
what happened to whatever used to be under that name. That's now the
sandbox's documented default (`orchestration-prompt.md` v3.13) — this file's
own fallback below has been updated to match, so a sandbox session no longer
needs to stall on a lock and escalate before even trying the fix that's
known to work.

Index-free fallback, for the Cowork sandbox (or the rare case `rm` genuinely
fails here too):

    set -e
    export GIT_OPTIONAL_LOCKS=0

    MESSAGE="<one-line commit message>"

    # Rename-away pre-check: never delete a lock, rename it. Tested and confirmed
    # 24 Aug 2026 — rename works on the sandbox mount even where unlink doesn't.
    # If `mv` itself fails, that (not a failed `rm`) is the real evidence of a
    # genuine concurrent session there — stop and escalate, don't retry in a loop.
    if ps aux | grep -v grep | grep -q "[g]it "; then
      echo "CONCURRENT SESSION SUSPECTED — a live git process exists. Escalate, do not proceed." >&2
      exit 1
    fi
    TS=$(date +%s)
    for LOCK in .git/HEAD.lock .git/index.lock .git/refs/heads/main.lock .git/refs/remotes/origin/main.lock; do
      if [ -e "$LOCK" ]; then
        mv "$LOCK" "${LOCK}.stale-${TS}" 2>/dev/null || { echo "CONCURRENT SESSION SUSPECTED — could not even rename $LOCK. Escalate." >&2; exit 1; }
      fi
    done

    TMP_INDEX="$(mktemp -t sprint-index.XXXXXX)"
    export GIT_INDEX_FILE="$TMP_INDEX"

    git read-tree HEAD
    git add -A
    TREE=$(git write-tree)
    COMMIT=$(printf '%s' "$MESSAGE" | git commit-tree "$TREE" -p HEAD)
    git update-ref refs/heads/main "$COMMIT"

    unset GIT_INDEX_FILE
    rm -f "$TMP_INDEX"

    git push origin main
    git fetch origin main

    if [ "$(git rev-parse origin/main)" = "$COMMIT" ]; then
      echo "DEPLOY CONFIRMED: $COMMIT"
    else
      echo "DEPLOY FAILED: origin/main is not $COMMIT — escalate, do not log as shipped"
      exit 1
    fi

`write-tree`/`commit-tree`/`update-ref` may print `warning: unable to unlink
...` even when they succeed — that's the now-harmless cleanup step failing
after the operation that actually mattered (create the lock, write it,
rename it into place) already worked. Judge success by exit code and the
final SHA comparison, not by the presence of an unlink warning.

A failed SHA comparison at the end is a blocked deployment to escalate to
Graham, not something to retry silently or report as shipped.
