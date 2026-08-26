#!/usr/bin/env python3
"""
fetch-search-data.py

Pulls search performance data directly from the Google Search Console API and
the Bing Webmaster Tools API, computes period-over-period deltas, and writes a
structured Markdown + JSON summary to the metrics folder for the Analytics
Agent to read at Sunday discovery.

No vendor middleware. Source APIs only.

Design rules (per plausible-api-integration.md and LLM-AGNOSTIC-MIGRATION-PROPOSAL.md):
  - Fail loudly. A data gap must never be indistinguishable from zero traffic.
  - Every failed operation writes a CAPABILITY FAILURE line and sets exit code 1.
  - Preflight checks run before any consequential call, verifying the actual
    network path this process will use, not an equivalent-looking one.
  - Output is committed to the repo so the series outlives GSC's 16-month window.

Usage:
    python3 fetch-search-data.py --sprint 21
    python3 fetch-search-data.py --sprint 21 --days 7 --out ./metrics
    python3 fetch-search-data.py --preflight-only

Environment:
    GSC_OAUTH_CLIENT_JSON       Path to the OAuth 2.0 Desktop app client secret
                                file (Google Cloud > Credentials > Create
                                Credentials > OAuth client ID > Desktop app).
    GSC_OAUTH_TOKEN_PATH        Where to cache the resulting refresh token.
                                Defaults to alongside the client file, as
                                gsc-token.json. Gitignore this.
    GSC_SITE_URL                Property as registered in GSC, e.g.
                                "https://www.turbulentground.com/" or
                                "sc-domain:turbulentground.com"
    BING_API_KEY                API key from Bing Webmaster Tools > Settings.
    BING_SITE_URL               e.g. "https://www.turbulentground.com"

Note on auth: GSC service account key files are blocked by Google's org
policy (iam.disableServiceAccountKeyCreation) on most projects now, personal
ones included. OAuth is the supported alternative for a script run by a
human, and needs no key file: the first run opens a browser once, then a
cached refresh token makes every later run silent.

Dependencies:
    pip install google-auth google-auth-oauthlib requests
"""

import argparse
import json
import os
import re
import sys
from datetime import date, datetime, timedelta, timezone

import requests

GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
GSC_API = "https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"
BING_API = "https://ssl.bing.com/webmaster/api.svc/json/{method}"

# GSC data lags by roughly 2-3 days. Ending the window short of today avoids
# reporting a partial final day as a decline.
GSC_LAG_DAYS = 3

TIMEOUT = 30

failures = []


def fail(operation, detail):
    """Record a capability failure in the agreed log format."""
    line = f"CAPABILITY FAILURE - {operation} - local - {detail}"
    failures.append(line)
    print(line, file=sys.stderr)


# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------

def preflight():
    """Verify credentials and outbound network on the exact paths used below.

    Cowork's sandbox has previously shown that one working access path does not
    prove a second path behaves identically. Do not skip this.
    """
    ok = True

    required = {
        "GSC_OAUTH_CLIENT_JSON": os.environ.get("GSC_OAUTH_CLIENT_JSON"),
        "GSC_SITE_URL": os.environ.get("GSC_SITE_URL"),
        "BING_API_KEY": os.environ.get("BING_API_KEY"),
        "BING_SITE_URL": os.environ.get("BING_SITE_URL"),
    }
    for name, value in required.items():
        if not value:
            fail("preflight:env", f"{name} not set")
            ok = False

    client_path = required["GSC_OAUTH_CLIENT_JSON"]
    if client_path and not os.path.isfile(client_path):
        fail("preflight:credentials", f"OAuth client file not found at {client_path}")
        ok = False

    for label, url in (
        ("googleapis", "https://searchconsole.googleapis.com/"),
        ("bing", "https://ssl.bing.com/webmaster/api.svc/json/"),
    ):
        try:
            requests.head(url, timeout=TIMEOUT, allow_redirects=True)
        except requests.RequestException as e:
            fail(f"preflight:network:{label}", f"unreachable: {e.__class__.__name__}")
            ok = False

    return ok


# ---------------------------------------------------------------------------
# Google Search Console
# ---------------------------------------------------------------------------

def gsc_session():
    """Authenticate via OAuth (installed-app flow), caching the refresh token
    so only the first run needs a browser. Service account keys are blocked
    by org policy on most projects, so this is the supported path here.
    """
    try:
        from google.auth.transport.requests import AuthorizedSession, Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        fail(
            "gsc:auth",
            "google-auth-oauthlib not installed "
            "(pip install google-auth-oauthlib)",
        )
        return None

    client_path = os.environ["GSC_OAUTH_CLIENT_JSON"]
    token_path = os.environ.get(
        "GSC_OAUTH_TOKEN_PATH",
        os.path.join(os.path.dirname(client_path), "gsc-token.json"),
    )

    creds = None
    if os.path.isfile(token_path):
        try:
            creds = Credentials.from_authorized_user_file(token_path, [GSC_SCOPE])
        except Exception as e:
            fail("gsc:auth:token_load", f"{e.__class__.__name__}: {e}")

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                fail("gsc:auth:refresh", f"{e.__class__.__name__}: {e}")
                creds = None
        if not creds:
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    client_path, [GSC_SCOPE]
                )
                # Opens a browser tab. Only happens on first run or if the
                # cached token is revoked/invalid.
                creds = flow.run_local_server(port=0)
            except Exception as e:
                fail("gsc:auth:flow", f"{e.__class__.__name__}: {e}")
                return None
        try:
            with open(token_path, "w") as f:
                f.write(creds.to_json())
            os.chmod(token_path, 0o600)
        except Exception as e:
            fail("gsc:auth:token_save", f"{e.__class__.__name__}: {e}")

    return AuthorizedSession(creds)


def gsc_query(session, site, start, end, dimensions, row_limit=250):
    """One Search Analytics call. Returns rows or None on failure."""
    url = GSC_API.format(site=requests.utils.quote(site, safe=""))
    body = {
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "dimensions": dimensions,
        "rowLimit": row_limit,
    }
    try:
        r = session.post(url, json=body, timeout=TIMEOUT)
        if r.status_code == 403:
            detail = r.text[:300].replace("\n", " ")
            fail(
                "gsc:query",
                f"403 - {detail}",
            )
            return None
        r.raise_for_status()
        return r.json().get("rows", [])
    except Exception as e:
        fail(f"gsc:query:{'+'.join(dimensions)}", f"{e.__class__.__name__}: {e}")
        return None


def gsc_totals(rows):
    if not rows:
        return {"clicks": 0, "impressions": 0, "ctr": 0.0, "position": 0.0}
    clicks = sum(r.get("clicks", 0) for r in rows)
    impressions = sum(r.get("impressions", 0) for r in rows)
    weighted_pos = sum(
        r.get("position", 0) * r.get("impressions", 0) for r in rows
    )
    return {
        "clicks": clicks,
        "impressions": impressions,
        "ctr": (clicks / impressions) if impressions else 0.0,
        "position": (weighted_pos / impressions) if impressions else 0.0,
    }


def collect_gsc(days):
    site = os.environ.get("GSC_SITE_URL")
    session = gsc_session()
    if not session or not site:
        return None

    end = date.today() - timedelta(days=GSC_LAG_DAYS)
    start = end - timedelta(days=days - 1)
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days - 1)

    current_q = gsc_query(session, site, start, end, ["query"])
    previous_q = gsc_query(session, site, prev_start, prev_end, ["query"])
    pages = gsc_query(session, site, start, end, ["page"])

    if current_q is None:
        return None

    return {
        "window": {"start": start.isoformat(), "end": end.isoformat()},
        "previous_window": {
            "start": prev_start.isoformat(),
            "end": prev_end.isoformat(),
        },
        "totals": gsc_totals(current_q),
        "previous_totals": gsc_totals(previous_q) if previous_q is not None else None,
        "queries": current_q[:50],
        "pages": (pages or [])[:50],
    }


# ---------------------------------------------------------------------------
# Bing Webmaster Tools
# ---------------------------------------------------------------------------

_MS_DATE = re.compile(r"/Date\((-?\d+)")


def bing_date(value):
    """Bing returns .NET epoch-millis dates like /Date(1735689600000)/."""
    if not isinstance(value, str):
        return value
    m = _MS_DATE.search(value)
    if not m:
        return value
    return datetime.fromtimestamp(int(m.group(1)) / 1000, tz=timezone.utc).date().isoformat()


def bing_call(method, extra=None):
    params = {
        "apikey": os.environ.get("BING_API_KEY"),
        "siteUrl": os.environ.get("BING_SITE_URL"),
    }
    if extra:
        params.update(extra)
    try:
        r = requests.get(BING_API.format(method=method), params=params, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json().get("d")
    except Exception as e:
        fail(f"bing:{method}", f"{e.__class__.__name__}: {e}")
        return None


def collect_bing():
    queries = bing_call("GetQueryStats")
    traffic = bing_call("GetRankAndTrafficStats")
    crawl = bing_call("GetCrawlStats")

    if queries is None and traffic is None and crawl is None:
        return None

    def normalise(rows):
        out = []
        for row in rows or []:
            out.append({k: bing_date(v) for k, v in row.items()})
        return out

    return {
        "queries": normalise(queries)[:50],
        "traffic": normalise(traffic)[-14:],
        "crawl": normalise(crawl)[-14:],
    }


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def delta(current, previous):
    if previous is None:
        return "no prior period"
    if previous == 0:
        return "n/a (prior period zero)" if current == 0 else f"+{current} from zero"
    change = (current - previous) / previous * 100
    return f"{change:+.1f}%"


def render_markdown(sprint, days, gsc, bing):
    lines = []
    lines.append(f"# Sprint {sprint} - search data")
    lines.append("")
    lines.append(f"Pulled {datetime.now(timezone.utc).isoformat(timespec='seconds')} "
                 f"over a {days}-day window, direct from source APIs.")
    lines.append("")

    lines.append("## Google Search Console")
    lines.append("")
    if gsc is None:
        lines.append("DATA UNAVAILABLE. See capability failures below. "
                     "Do not read this as zero traffic.")
        lines.append("")
    else:
        t = gsc["totals"]
        p = gsc["previous_totals"] or {}
        lines.append(f"Window {gsc['window']['start']} to {gsc['window']['end']} "
                     f"(ends {GSC_LAG_DAYS} days short of today; GSC data lags).")
        lines.append("")
        lines.append("| Metric | This period | Change |")
        lines.append("|---|---|---|")
        lines.append(f"| Clicks | {t['clicks']} | {delta(t['clicks'], p.get('clicks'))} |")
        lines.append(f"| Impressions | {t['impressions']} | {delta(t['impressions'], p.get('impressions'))} |")
        lines.append(f"| CTR | {t['ctr']*100:.2f}% | |")
        lines.append(f"| Avg position | {t['position']:.1f} | |")
        lines.append("")
        if gsc["queries"]:
            lines.append("Top queries:")
            lines.append("")
            lines.append("| Query | Clicks | Impressions | Position |")
            lines.append("|---|---|---|---|")
            for row in gsc["queries"][:15]:
                q = row.get("keys", ["?"])[0]
                lines.append(f"| {q} | {row.get('clicks',0)} | "
                             f"{row.get('impressions',0)} | {row.get('position',0):.1f} |")
        else:
            lines.append("No queries returned. Correctly instrumented and empty "
                         "is a different finding from broken. Confirm indexing "
                         "before interpreting.")
        lines.append("")

    lines.append("## Bing Webmaster Tools")
    lines.append("")
    if bing is None:
        lines.append("DATA UNAVAILABLE. See capability failures below.")
        lines.append("")
    else:
        if bing["queries"]:
            lines.append("| Query | Clicks | Impressions | Position |")
            lines.append("|---|---|---|---|")
            for row in bing["queries"][:15]:
                lines.append(
                    f"| {row.get('Query','?')} | {row.get('Clicks',0)} | "
                    f"{row.get('Impressions',0)} | {row.get('AvgImpressionPosition','')} |"
                )
        else:
            lines.append("No query data returned.")
        lines.append("")
        if bing["crawl"]:
            latest = bing["crawl"][-1]
            lines.append(f"Latest crawl record: {json.dumps(latest)}")
        lines.append("")

    lines.append("## Capability failures")
    lines.append("")
    if failures:
        for line in failures:
            lines.append(f"    {line}")
    else:
        lines.append("None. All operations completed.")
    lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sprint", help="Sprint number, used in the filename")
    parser.add_argument("--days", type=int, default=7, help="Window length in days")
    parser.add_argument("--out", default="./metrics", help="Output directory")
    parser.add_argument("--preflight-only", action="store_true",
                        help="Check credentials and network, then exit")
    args = parser.parse_args()

    if not preflight():
        print("\nPreflight failed. Nothing was pulled.", file=sys.stderr)
        return 1
    if args.preflight_only:
        print("Preflight passed.")
        return 0

    if not args.sprint:
        print("--sprint is required unless --preflight-only", file=sys.stderr)
        return 2

    gsc = collect_gsc(args.days)
    bing = collect_bing()

    os.makedirs(args.out, exist_ok=True)
    stem = os.path.join(args.out, f"sprint-{args.sprint}-search")

    payload = {
        "sprint": args.sprint,
        "pulled_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "window_days": args.days,
        "gsc": gsc,
        "bing": bing,
        "capability_failures": failures,
    }
    with open(f"{stem}.json", "w") as f:
        json.dump(payload, f, indent=2)
    with open(f"{stem}.md", "w") as f:
        f.write(render_markdown(args.sprint, args.days, gsc, bing))

    print(f"Wrote {stem}.md and {stem}.json")

    # Exit non-zero on any failure so a scheduled run surfaces the gap rather
    # than completing quietly with an empty report.
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
