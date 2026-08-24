# TurbulentGround runner bootstrap

Before taking any action in this repository:

1. Read `_experiment/sprint-state.json` first.
2. Read `_experiment/orchestration-prompt.md` in full.
3. Read every additional input required by that protocol.
4. Follow the shared sprint protocol exactly; it is the single source of truth.
5. Use `_experiment/sprint-state.json` as the sole source of sprint and session state.
6. Work in the shared `/Users/graham/turbulentground` checkout. Do not use an isolated worktree for sprint runs because the private experiment record is local and gitignored.
7. Complete the protocol's capability preflight through every access path the run will actually use.
8. Never substitute estimates or fabricated data when a capability fails.
9. Never commit changes authored by another active session.
