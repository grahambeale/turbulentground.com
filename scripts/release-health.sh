#!/usr/bin/env bash
# Post-deploy API health check, run by scripts/release.sh right after the production deployment is live.
#
#   scripts/release-health.sh BASE_URL
#
# Calls the three public research routes that share the api/research-invite.js function (the counter, the public-start
# switch, and lookup with a dummy token) and fails if any returns a 5xx, gets no response, or is blocked by Vercel's
# Security Checkpoint (a challenge proves nothing). A 4xx is fine: a dummy token is expected to be refused.
# Added after the 6 Oct 2026 incident, when a release put these routes into FUNCTION_INVOCATION_FAILED and the
# production specs, which never touch the API, passed. Read-only: GET requests only, no writes.
set -u
base="${1:?usage: release-health.sh BASE_URL}"
base="${base%/}"
dummy="${RELEASE_HEALTH_TOKEN:-synthetic-release-health-check}"
paths=("/api/research-participation" "/api/research-public-start" "/api/research-lookup?t=${dummy}")

hdr=$(mktemp "${TMPDIR:-/tmp}/release-health.XXXXXX")
trap 'rm -f "$hdr"' EXIT
failed=0
for p in "${paths[@]}"; do
  code=$(curl -s -o /dev/null -D "$hdr" -w '%{http_code}' --max-time 20 -A 'Mozilla/5.0 release-health' "${base}${p}" 2>/dev/null)
  rc=$?
  if [ $rc -ne 0 ]; then
    printf '[release-health] FAIL  GET %s: no response (curl exit %s)\n' "$p" "$rc" >&2; failed=1
  elif [ "${code:-000}" -ge 500 ] 2>/dev/null; then
    printf '[release-health] FAIL  GET %s -> %s (server error)\n' "$p" "$code" >&2; failed=1
  elif [ "$code" = 403 ] && grep -qi '^x-vercel-mitigated: *challenge' "$hdr"; then
    printf '[release-health] FAIL  GET %s -> 403 Vercel Security Checkpoint: the route could not be checked. Wait, then re-run the check.\n' "$p" >&2; failed=1
  else
    printf '[release-health] ok    GET %s -> %s\n' "$p" "$code"
  fi
done
exit $failed
