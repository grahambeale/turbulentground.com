# TurbulentGround runner bootstrap

First determine which work lane the request belongs to.

For work exclusively about the invite-only research project (`research/**`,
`api/research-*.js`, research-specific tests, study emails or media, the
Research Project Feedback table, or the participant experience), read
`research/work-state.json` first and then read `research/agent-workflow.md` in
full. Follow that on-demand workflow. Do not claim or update a main-site sprint.

For all other work, read `_experiment/sprint-state.json` first, then read
`_experiment/orchestration-prompt.md` and every input it requires. Follow the
main-site sprint protocol exactly.

If a request spans both lanes, separate it into independently reviewable work
items. For both lanes, work in the shared checkout, check for overlapping
changes before writing, complete the relevant capability preflight, never
fabricate data, and never commit another active session's work.

## Claude local-terminal observation

Plain `rm` has repeatedly removed stale Git lock files from Claude's local terminal sessions on Graham's Mac. This is an observation about that access path on this machine, not a universal Claude behavior and not an assertion about Codex or any other runner. Use the detected filesystem-profile procedure in `_experiment/orchestration-prompt.md`; do not copy or infer a separate Git recovery procedure from this note.
