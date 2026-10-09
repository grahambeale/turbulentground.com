#!/usr/bin/env bash
# The only sanctioned production release path (operations/workflow.md, section 6).
#
#   scripts/release.sh BRANCH APPROVED_HEAD [--specs a,b,c] [--dry-run]
#   scripts/release.sh --verify-only MAIN_SHA [--specs a,b,c]
#
# BRANCH         the branch Graham approved (as named in "approve production release: BRANCH (HEAD)")
# APPROVED_HEAD  the head commit that was previewed and approved (full or abbreviated SHA)
#
# In order, stopping everything at the first failure (set -euo pipefail, plus explicit checks):
#   1. take the work-state lease (operations/work-state.json in the shared checkout)
#   2. verify origin/BRANCH is exactly APPROVED_HEAD (otherwise the approval has lapsed)
#   3. rebase the approved commits onto origin/main in a throwaway worktree
#   4. require git patch-id equality between the approved commits and the rebased commits
#      (same content, same order; commits already on main are reported, not re-released)
#   5. push to main through the pre-push hook (never --no-verify)
#   6. wait for the Vercel production deployment of the pushed commit
#   6b. call the production API routes (scripts/release-health.sh): any 5xx fails the release and LEAVES THE LEASE HELD
#   7. run the relevant smoke specs against production, throttled
#   8. release the lease
#
# --dry-run     do steps 1 to 4, push nothing, release the lease.
# --verify-only resume after a failure at step 6 or 7 for a commit that is ALREADY on main:
#               takes the lease, then does steps 6 to 8 only. Never pushes.
# --specs       comma-separated spec names (tests/smoke/NAME.spec.js) instead of the automatic choice.
#
# Run it from any checkout of the repository; it finds the shared (primary) checkout itself.
# Needs: git, gh (authenticated), python3, node_modules in the shared checkout, core.hooksPath=scripts/hooks.
set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
PROD_URL="${RELEASE_PROD_URL:-https://www.turbulentground.com}"
DEPLOY_TIMEOUT="${RELEASE_DEPLOY_TIMEOUT:-1200}"   # seconds
SPEC_GAP="${RELEASE_SPEC_GAP:-20}"                 # seconds between production spec runs (workflow: verification crawls)

say()  { printf '[release] %s\n' "$*"; }
die()  { printf '\n[release] STOPPED: %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,29p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
}

# ---- arguments --------------------------------------------------------------------------------
mode=release; branch=""; approved=""; specs_arg=""; dry=0; verify_sha=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry=1 ;;
    --verify-only) mode=verify; shift; [ $# -gt 0 ] || usage; verify_sha=$1 ;;
    --specs) shift; [ $# -gt 0 ] || usage; specs_arg=$1 ;;
    -h|--help) usage ;;
    -*) die "unknown option $1" ;;
    *) if [ -z "$branch" ]; then branch=$1; elif [ -z "$approved" ]; then approved=$1; else die "unexpected argument $1"; fi ;;
  esac
  shift
done
if [ "$mode" = release ]; then
  [ -n "$branch" ] && [ -n "$approved" ] || usage
else
  [ "$dry" = 0 ] || die "--dry-run does not apply to --verify-only"
  [ -z "$branch$approved" ] || die "--verify-only takes only a commit"
fi

# ---- the shared checkout (where the lease lives) ----------------------------------------------
here=$(git rev-parse --show-toplevel) || die "not inside a git checkout"
main_wt=$(git -C "$here" worktree list --porcelain | awk '/^worktree /{print substr($0,10); exit}')
[ -d "$main_wt/.git" ] || die "cannot find the shared checkout (got '$main_wt')"
lease_file="operations/work-state.json"
[ -d "$main_wt/node_modules" ] || die "no node_modules in $main_wt; run npm ci there first"
hooks=$(git -C "$main_wt" config core.hooksPath || true)
[ "$hooks" = "scripts/hooks" ] || die "core.hooksPath is '${hooks}', not scripts/hooks: run sh scripts/hooks/install.sh. Releases never bypass the hook."
command -v gh >/dev/null || die "gh (GitHub CLI) is required to see the production deployment"
gh auth status >/dev/null 2>&1 || die "gh is not authenticated"
slug=$(git -C "$main_wt" remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')
[ -n "$slug" ] || die "cannot work out the GitHub repository from the origin URL"

tmp=""; lease_held=0; lease_keep=0; state="not started"; pushed_sha=""

# ---- a stuck .git/index.lock fails loudly; it is never cleared automatically -----------------------------
# Locks have repeatedly been left in the shared checkout (see operations/decision-log.md). This reports the evidence
# and stops. Removing one needs Graham's yes after he has seen this output (operations/workflow.md, "Stuck locks").
index_lock="$main_wt/.git/index.lock"
lock_report() {
  local size age procs
  size=$(stat -f %z "$index_lock" 2>/dev/null || stat -c %s "$index_lock" 2>/dev/null || echo "?")
  age=$(( $(date +%s) - $(stat -f %m "$index_lock" 2>/dev/null || stat -c %Y "$index_lock" 2>/dev/null || date +%s) ))
  procs=$(ps -axo pid,etime,command 2>/dev/null | grep -E '(^| |/)git( |$)|Xcode\.app|Visual Studio Code|Code Helper|Cursor\.app|JetBrains|GitHub Desktop|Fork\.app|Tower\.app|Sourcetree|GitKraken|lazygit|gitk|Claude\.app/Contents/MacOS/Claude( |$)' | grep -v -E 'grep -E|release\.sh' | cut -c1-160 || true)
  {
    printf '[release] index.lock exists: %s\n' "$index_lock"
    printf '[release]   size: %s bytes, age: %ss (%s minutes)\n' "$size" "$age" "$((age / 60))"
    printf '[release]   running git/IDE processes:\n'
    if [ -n "$procs" ]; then printf '%s\n' "$procs" | sed 's/^/[release]     /'; else printf '[release]     none found\n'; fi
    printf '[release]   Known cause: a Cowork VM session whose mount can create but not unlink; check ~/Library/Logs/Claude/cowork_vm_node.log for "unable to unlink" at the lock'"'"'s minute.\n'
    printf '[release]   NOT removed. Show Graham this output and wait for a yes before deleting it.\n'
  } >&2
}
check_index_lock() { [ ! -e "$index_lock" ] || { lock_report; die "$1"; }; }

# ---- lease ------------------------------------------------------------------------------------
lease_take() {
  git -C "$main_wt" diff --quiet -- "$lease_file" || die "$lease_file has uncommitted edits in $main_wt: a lease is already held. Do not release over another session."
  python3 - "$main_wt/$lease_file" "$1" "$2" <<'PY' || die "the lease is held by another run, or the lease file is unreadable"
import json, sys, datetime as d
p, item, phase = sys.argv[1:4]
j = json.load(open(p))
if j.get("active_run") is not None:
    sys.exit(1)
n = d.datetime.now(d.timezone.utc)
f = "%Y-%m-%dT%H:%M:%SZ"
j.update(active_run="release.sh", runner="release.sh", work_item=item, phase=phase,
         started_at=n.strftime(f), lease_expires=(n + d.timedelta(hours=1)).strftime(f),
         last_checkpoint="lease taken by scripts/release.sh")
json.dump(j, open(p, "w"), indent=2); open(p, "a").write("\n")
PY
  lease_held=1
  say "lease taken ($1)"
}

lease_release() {
  [ "$lease_held" = 1 ] || return 0
  if [ -e "$index_lock" ]; then
    lock_report
    echo "[release] WARNING: the lease is still held in $main_wt/$lease_file because of the index.lock above. Do not delete the lock without Graham's yes." >&2
    return 0
  fi
  git -C "$main_wt" restore --source=HEAD -- "$lease_file"
  python3 - "$main_wt/$lease_file" <<'PY' || { echo "[release] WARNING: lease file is not fully cleared; clear it by hand" >&2; return 0; }
import json, sys
j = json.load(open(sys.argv[1]))
bad = [k for k, v in j.items() if k not in ("_comment", "schema_version") and v is not None]
sys.exit(1 if bad else 0)
PY
  lease_held=0
  say "lease released"
}

cleanup() {
  rc=$?
  cd "$here" 2>/dev/null || cd "$main_wt"
  if [ -n "$tmp" ] && [ -d "$tmp" ]; then
    git -C "$main_wt" worktree remove --force "$tmp/wt" >/dev/null 2>&1 || true
    rm -rf "$tmp"
    git -C "$main_wt" worktree prune
  fi
  if [ "$lease_keep" = 1 ]; then
    printf '[release] The lease is LEFT HELD (production is unhealthy). Clear it by hand in operations/work-state.json when it is safe, or let it expire.\n' >&2
  else
    lease_release || true
  fi
  if [ $rc -ne 0 ]; then
    printf '\n[release] FAILED (state: %s). Nothing after this point was done.\n' "$state" >&2
    if [ -n "$pushed_sha" ]; then
      printf '[release] %s IS ALREADY ON main. Do not push again. Fix the cause, then run:\n[release]   scripts/release.sh --verify-only %s\n' "$pushed_sha" "$pushed_sha" >&2
    fi
  fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

new_worktree() {   # $1 = commit-ish
  tmp=$(mktemp -d "${TMPDIR:-/tmp}/release.XXXXXX")
  git -C "$main_wt" worktree add -q --detach "$tmp/wt" "$1"
  ln -s "$main_wt/node_modules" "$tmp/wt/node_modules"
}

patch_ids() {      # stdin: commit shas, one per line, oldest first -> their patch-ids
  while read -r c; do
    [ -n "$c" ] || continue
    git show --format= "$c" | git patch-id --stable | cut -d' ' -f1
  done
}

# ---- steps 6 and 7 ----------------------------------------------------------------------------
wait_for_production() {   # $1 = sha
  state="waiting for the production deployment of $1"
  say "waiting for the Vercel production deployment of ${1:0:7} (up to ${DEPLOY_TIMEOUT}s)"
  local waited=0 dep_id="" st="" url=""
  while [ "$waited" -le "$DEPLOY_TIMEOUT" ]; do
    dep_id=$(gh api "repos/$slug/deployments?sha=$1&per_page=20" --jq '[.[]|select(.environment=="Production" and .creator.login=="vercel[bot]")][0].id // empty' 2>/dev/null || true)
    if [ -n "$dep_id" ]; then
      st=$(gh api "repos/$slug/deployments/$dep_id/statuses" --jq '.[0].state // empty' 2>/dev/null || true)
      case "$st" in
        success) url=$(gh api "repos/$slug/deployments/$dep_id/statuses" --jq '.[0].environment_url // ""'); say "production deployment READY: $url"; return 0 ;;
        failure|error|inactive) die "the production deployment of ${1:0:7} ended '$st' (deployment $dep_id)" ;;
      esac
    fi
    sleep 15; waited=$((waited + 15))
  done
  die "no successful production deployment of ${1:0:7} after ${DEPLOY_TIMEOUT}s (last status '${st:-none}')"
}

api_health() {   # $1 = sha. Any 5xx, no response or Security Checkpoint challenge fails the release and keeps the lease.
  state="checking the production API health"
  say "calling the production API routes (scripts/release-health.sh)"
  if ! "$script_dir/release-health.sh" "$PROD_URL"; then
    lease_keep=1
    die "production API health check FAILED for ${1:0:7}. The commit is already on main: do not push again. Roll back or fix forward, then check again with: scripts/release.sh --verify-only ${1:0:7} (after clearing the held lease)."
  fi
}

choose_specs() {          # $1 = changed files, one per line; prints spec names that exist in the worktree
  local files=$1 want="internal-links"
  if [ -n "$specs_arg" ]; then want=$(echo "$specs_arg" | tr ',' ' ')
  else
    echo "$files" | grep -Eq '\.(html|css|js)$|^partials/|^styles/|^learnings/|^scripts/build-|^public-allowlist' && want="$want nav-about footer cta-one-line mobile-nav"
    echo "$files" | grep -Eq '^research/index\.html$|^api/|^lib/' && want="$want take-part-disabled survey-frozen privacy-tabs"
  fi
  local s out=""
  for s in $want; do
    if [ -f "$tmp/wt/tests/smoke/$s.spec.js" ]; then out="$out $s"; else say "spec '$s' does not exist at this commit: skipped" >&2; fi
  done
  echo "$out"
}

run_specs() {             # $1 = sha, $2 = changed files
  local chosen; chosen=$(choose_specs "$2")
  [ -n "$chosen" ] || die "no smoke spec to run against production for these changes (use --specs)"
  say "production smoke specs:$chosen (one at a time, ${SPEC_GAP}s apart, to stay under Vercel's Security Checkpoint)"
  local s first=1
  for s in $chosen; do
    [ "$first" = 1 ] || sleep "$SPEC_GAP"
    first=0
    state="running production spec $s"
    say "-- $s"
    ( cd "$tmp/wt" && SMOKE_TEST_BASE_URL="$PROD_URL" npx playwright test "$s" --reporter=line --workers=1 ) \
      || die "production smoke spec '$s' FAILED against $PROD_URL. If it is a 403 with x-vercel-mitigated: challenge, that is the Security Checkpoint (wait and re-run with --verify-only); otherwise treat the release as failed."
  done
  state="verified"
}

# ---- verify-only ------------------------------------------------------------------------------
if [ "$mode" = verify ]; then
  git -C "$main_wt" fetch -q origin
  full=$(git -C "$main_wt" rev-parse --verify "$verify_sha^{commit}") || die "unknown commit $verify_sha"
  git -C "$main_wt" merge-base --is-ancestor "$full" origin/main || die "${full:0:7} is not on origin/main: --verify-only only verifies a released commit"
  check_index_lock "refusing to start: index.lock exists in the shared checkout"
  lease_take "verify ${full:0:7}" "verification"
  new_worktree "$full"
  files=$(git -C "$tmp/wt" diff --name-only "$full^" "$full" 2>/dev/null || true)
  wait_for_production "$full"
  api_health "$full"
  run_specs "$full" "$files"
  say "VERIFIED: ${full:0:7} is live and the production specs pass"
  exit 0
fi

# ---- release ----------------------------------------------------------------------------------
state="checking for a stuck index.lock"
check_index_lock "refusing to start: index.lock exists in the shared checkout"
state="taking the lease"
lease_take "release $branch ${approved:0:7}" "release"

state="checking the approved head"
git -C "$main_wt" fetch -q origin --prune
approved_full=$(git -C "$main_wt" rev-parse --verify "$approved^{commit}") || die "cannot resolve the approved head '$approved'"
git -C "$main_wt" rev-parse --verify -q "origin/$branch" >/dev/null || die "origin/$branch does not exist"
branch_head=$(git -C "$main_wt" rev-parse "origin/$branch")
if [ "$branch_head" != "$approved_full" ]; then
  die "the approval has LAPSED. origin/$branch is ${branch_head:0:7} but the approved head is ${approved_full:0:7}. Stop and request approval again, quoting the new head (operations/workflow.md section 6)."
fi
say "origin/$branch is the approved head ${approved_full:0:7}"

main_before=$(git -C "$main_wt" rev-parse origin/main)
[ -z "$(git -C "$main_wt" rev-list --merges "origin/main..$approved_full")" ] || die "the approved range contains a merge commit; a release is a linear set of commits"

# commits to release: the ones not already (by patch-id) on main
cherry=$(git -C "$main_wt" cherry origin/main "$approved_full")
approved_commits=$(echo "$cherry" | awk '$1=="+"{print $2}')
upstream_commits=$(echo "$cherry" | awk '$1=="-"{print $2}')
[ -n "$approved_commits" ] || die "nothing to release: every commit on $branch is already on main"
n_approved=$(echo "$approved_commits" | wc -l | tr -d ' ')
if [ -n "$upstream_commits" ]; then
  say "already on main, will not be released again: $(echo "$upstream_commits" | cut -c1-8 | tr '\n' ' ')"
fi
approved_ids=$(echo "$approved_commits" | patch_ids)

state="rebasing onto origin/main"
new_worktree "$approved_full"
cd "$tmp/wt"
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] ; then die "nothing to release: $branch equals main"; fi
git rebase origin/main >/tmp/release-rebase.$$ 2>&1 || { git rebase --abort >/dev/null 2>&1 || true; tail -5 /tmp/release-rebase.$$ >&2; rm -f /tmp/release-rebase.$$; die "the rebase onto origin/main has conflicts. A conflict resolution is a content change, so the approval lapses: stop and request approval again."; }
rm -f /tmp/release-rebase.$$
new_head=$(git rev-parse HEAD)

state="checking patch-id equality"
new_commits=$(git rev-list --reverse "origin/main..HEAD")
n_new=$(echo "$new_commits" | grep -c . || true)
new_ids=$(echo "$new_commits" | patch_ids)
if [ "$approved_ids" != "$new_ids" ]; then
  {
    echo
    echo "approved patch-ids ($n_approved commits, oldest first):"; echo "$approved_ids" | sed 's/^/  /'
    echo "rebased patch-ids  ($n_new commits, oldest first):";     echo "$new_ids" | sed 's/^/  /'
  } >&2
  die "the rebased commits are NOT patch-identical to the approved commits. Any content change lapses the approval: stop and request approval again, quoting the new head."
fi
say "patch-id equality holds for $n_new commit(s): approved ${approved_full:0:7} -> rebased ${new_head:0:7}; main was ${main_before:0:7}"

if [ "$dry" = 1 ]; then
  state="dry run complete"
  say "DRY RUN: would push ${new_head:0:7} to main through the hook. Nothing was pushed."
  exit 0
fi

state="pushing through the pre-push hook"
say "pushing ${new_head:0:7} to origin/main (the pre-push hook builds and tests it; this takes minutes)"
git push origin HEAD:refs/heads/main || die "the push was refused or blocked by the hook. Nothing was released."
pushed_sha=$new_head
state="pushed; waiting for deployment"

changed=$(git diff --name-only "$main_before" "$pushed_sha")
wait_for_production "$pushed_sha"
api_health "$pushed_sha"
run_specs "$pushed_sha" "$changed"

say "RELEASED AND VERIFIED: $branch ${approved_full:0:7} is on main as ${pushed_sha:0:7} (patch-identical), production deployment is live, production specs pass."
