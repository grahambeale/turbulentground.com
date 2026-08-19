# Plausible Stats API — integration notes

**Status:** created 2026-08-19 (Sprint 15 mid-week delivery session). Referenced by name in
`orchestration-prompt.md`'s file-locations table and `funnel-instrumentation-spec.md` Step 1
since at least Sprint 12, but the file itself did not exist in the repo until now — the same
"referenced but never actually written" pattern already logged for `SKILL.md` truncation and
`graham-signals.md` loss (decision-log Sprint 13, Sprint 15 row 1). Written retroactively so the
next session isn't working from a citation to nothing.

## The one thing to know before querying custom events

**Use `dimensions: ["event:name"]` via the raw `query` tool. Do not use `dimensions: ["event:goal"]`
via `get-breakdown`.**

Plausible's Stats API distinguishes between:

- **Custom events** — anything sent via `plausible('Event Name')` in the page script. These are
  recorded and queryable immediately, with no dashboard setup.
- **Goals** — a separate, dashboard-configured concept (Site Settings → Goals in the Plausible
  web UI). The `event:goal` dimension only returns rows for event names that have been
  explicitly registered as a Goal there.

This site's custom events (`Diagnostic CTA Clicked`, `Diagnostic: Started`, `Diagnostic:
Completed`, `Diagnostic: Email Submitted`) have never been registered as Goals. They fire
correctly and are recorded — confirmed by the aggregate `events` metric consistently exceeding
`pageviews` by the expected margin — but `get-breakdown` / `get-aggregate-stats` with
`dimensions: ["event:goal"]` returns an **empty result set**, every time, regardless of date
range. This looks exactly like "the events aren't firing" and was reported as an unresolved
`TOOL FAILURE` in decision-log.md Sprint 15 row 3 on that basis.

**The fix requires no dashboard access and no code change to the site.** The raw `query` tool
(`mcp__plausible__query`) accepts `dimensions: ["event:name"]` — a plain string, not constrained
to the `get-breakdown` tool's dimension enum — and reads the underlying event data directly,
bypassing the Goals requirement entirely. Verified working, this session, across three
independent ranges (`7d`, `30d`, `all`):

```
query({
  site_id: "turbulentground.com",
  dimensions: ["event:name"],
  metrics: ["visitors", "events"],
  date_range: "7d"   // or "30d", "all", or a preset the tool accepts
})
```

Returns one row per event name actually fired in the window (including `"pageview"` for ordinary
page loads), e.g.:

```json
{"metrics": [1, 1], "dimensions": ["Diagnostic CTA Clicked"]}
```

An event name absent from the result set for a given window is a genuine measured zero for that
event in that window — not a sign the query failed. (Confirmed this session: `Diagnostic:
Started` and `Diagnostic: Completed` both fired historically, per the `all`-time query, but were
correctly absent from the `7d` window because nobody triggered them that week.)

## Two remaining, genuinely open items

1. **Custom date ranges in array form fail.** Both `["2026-08-11", "2026-08-17"]` and the
   ISO-datetime-with-offset form the tool itself echoes back in its own `query.date_range` field
   (e.g. `["2026-08-12T00:00:00+01:00", "2026-08-18T23:59:59+01:00"]`) were rejected with `400
   Invalid date range` when passed back in as input this session. Only the string presets (`"7d"`,
   `"30d"`, `"all"`) were accepted. This means a session cannot currently pin a query to an exact
   Sunday–Saturday sprint week — only to "as of whatever today is." Every weekly figure pulled this
   way inherits a few days' drift from the nominal week boundary, same as several prior sprints'
   rows already note individually. Worth a follow-up to find the accepted custom-range format
   (check the underlying `plausible-mcp` connector's source, github.com/Defilan/plausible-mcp) —
   out of scope to chase further this session.
2. **Whether to register these events as Goals anyway.** Doing so would make `get-breakdown`'s
   `event:goal` path work too, and would unlock Plausible's own dashboard-side goal/funnel views
   for Graham to check without going through a session at all. This is a Plausible dashboard
   action (Site Settings → Goals), so it needs Graham, not a tool call from here. Not urgent given
   `event:name` via `query` already closes the gap — flagged as a nice-to-have, not a blocker.

## Recommendation for `funnel-instrumentation-spec.md` Step 1

Step 1 currently says only "pulls Plausible step counts via the existing Stats API pattern
(`plausible-api-integration.md`)" — now that this file exists, that line resolves to something
real. Suggest adding one clause there pointing at the `event:name`-not-`event:goal` rule above, so
a future session reads it before hitting the same TOOL FAILURE rather than after.
