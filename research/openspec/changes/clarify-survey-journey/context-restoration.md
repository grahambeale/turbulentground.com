# Per-statement context restoration — 13 September 2026

The paired demo had omitted the existing optional contextual-feedback interaction.
Restored an Add context disclosure and labelled 1000-character textarea for every
individual statement in both layouts, keyed by the exact domain and statement
storage identity. Context does not count as an answer or enable Continue.

Demo notes and answers remain in browser-tab memory only. Continue/Back, layout
switching and review-moment navigation now preserve them; explicit Reset clears
them. Demo Save/Resume snapshots each note and individual answer. Layout switching
maps the current statement/pair without erasing data. The two statements have
separate notes, never a shared pair-level field.

Browser verification passed for all 12 B pairs and all 24 A screens, distinct
synthetic notes/scores across navigation and partial save/resume, answer guards,
local file and HTTP rendering, no API calls or page errors, and 320px layout.
Visually inspected the rendered pair with both context fields open. Back stays
bottom left of the main question content and moves down as context expands.

Corrected demo: outputs/approved-paired-survey-context.html. The corrected and
original approved-demo HTML files are repaired too. No live questionnaire,
participant submission, email, scoring, benchmark or production release changes.
