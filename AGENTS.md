# TurbulentGround runner bootstrap

First determine which work lane the request belongs to.

## Research project lane

Use this lane when the request is exclusively about the invite-only research
project: `research/**`, `api/research-*.js`, research-specific tests, study
emails or media, the Research Project Feedback table, or the participant
experience.

1. Read `research/work-state.json` first.
2. Read `research/agent-workflow.md` in full and follow it as the single source
   of truth for the research project.
3. Do not claim, update or wait for a main-site sprint. Research work is
   initiated on demand, not by sprint cadence.
4. Do not modify `_experiment/sprint-state.json` or write research work into
   the main-site sprint logs.

## Main-site lane

For all other work, including the Care Capital diagnostic, learnings library,
homepage and site-wide systems:

1. Read `_experiment/sprint-state.json` first.
2. Read `_experiment/orchestration-prompt.md` in full.
3. Read every additional input required by that protocol.
4. Follow the shared sprint protocol exactly; it is the single source of truth.
5. Use `_experiment/sprint-state.json` as the sole source of sprint and session state.

If a request genuinely spans both lanes, separate it into independently
reviewable work items. Do not let a research change silently alter the wider
site or let a main-site sprint absorb research-project work.

For both lanes, work in the shared `/Users/graham/turbulentground` checkout,
check for overlapping changes before writing, complete the relevant capability
preflight, never fabricate data, and never commit changes authored by another
active session.
