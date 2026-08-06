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

**Unverified claim, flagged rather than silently adopted:** a session once
reported that in some other environment (referred to as a "Cowork sandbox")
the mount permits creating/writing `.git/index.lock` but not unlinking it,
making a stale lock permanently unremovable there, and prescribed an
index-free `GIT_INDEX_FILE` + `commit-tree`/`update-ref` plumbing route as
the mandatory replacement for all commits. That may be true of some other
environment, but it does not describe this machine — plain `rm` has worked
here every time it's been tried, with no permission error, across multiple
sessions. Do not take the sandbox-permissions claim as established fact for
this Mac without re-verifying it here first. If a lock ever genuinely can't
be removed with `rm` on this machine, that's the signal to fall back to the
index-free plumbing route below — not a default to reach for pre-emptively.

Index-free fallback, for that specific "rm genuinely fails" case only:

    set -e
    export GIT_OPTIONAL_LOCKS=0

    MESSAGE="<one-line commit message>"

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

A failed SHA comparison at the end is a blocked deployment to escalate to
Graham, not something to retry silently or report as shipped.
