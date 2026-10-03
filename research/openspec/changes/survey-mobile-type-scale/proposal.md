# Proposal: phone type scale for the research survey (below 640px)

**Status: PROPOSAL ONLY.** Not reviewed, not approved, not implemented. Nothing in this
document changes the survey. Graham will put it to the methodology reviewer first.
Prepared 2 October 2026 as part C of the type-scale batch 2 request.

## 1. Why, and the rule

Graham's rule for phones (below 640px): body text 20px at about 1.55, nothing visible
under 18px, tappable text 20px or more, supporting text 18px minimum, headings stay
larger than body, desktop unchanged. It is in place on the site's content pages. The
survey after the start screen is a measurement instrument, so it was left out of that
work on purpose. Today it has text well under 18px on every screen (section 3).

The `/take-part` **start screen** (the intro, before any answer is recorded) is already
on the scale and is not part of this proposal.

## 2. Scope: presentation only

**Would change (below 640px only):** font sizes, line-heights and spacing of the consent
screen, the context screen, the statement screens (24 statements, 12 pair screens, the
final "anything else" screen) and the completion screen.

**Would not change:** statement wording and order, the 5-point scale, its anchors
("Strongly disagree" / "Strongly agree"), "Not applicable" options, the optional
context boxes, example content, validation, skip logic, consent wording, timing, the
API payload, or anything at 641px and up.

## 3. Current sizes at 390px (production, main `4d7ad1c`)

Measured with the no-record review mode; the full set (447 measurements at 320, 390 and
640px) is `tests/smoke/survey-baseline.json`. Size / line-height ratio.

| Screen | Element | Now |
|---|---|---|
| Consent | Greeting "Hi Alex, welcome." | 24.0 / 1.35 |
| | "A quick message from Graham" (video label, tappable) | **11.7** / 1.30 |
| | "Read the transcript" (tappable) | **14.4** / 1.70 |
| | Transcript text | **16.2** / 1.70 |
| | Consent checkbox labels (tappable) | **18.0** / 1.60 |
| | "Required" tag | **14.0** / 1.60 |
| | Continue button | 18.0 / 1.20 |
| Context | Page heading / group legends | 30.0 / 1.25; 23.8 / 1.25 |
| | "(optional)" tags | **15.2** / 1.25 |
| | The 25 role/seniority choice labels (tappable) | **16.2** / 1.35 |
| | Back button | **14.8** / 1.70 |
| | Continue button | 18.0 / 1.20 |
| Statements | Progress "N of 24 answered" | 22.0 count, **17.1** / 1.70 text |
| | "Pair 1 of 12 · Judgement" | 19.8 / 1.70 |
| | Statement text | 23.4 / 1.45 |
| | Response buttons 1 to 5 (numerals) | 21.6 / 1.20, 54 x 68px each |
| | "Strongly disagree / agree" labels (`.scale-labels`, 0.95rem) | about **17.1** |
| | "See an example" and its "?" icon | **14.8** and **12.6** |
| | "Not applicable" buttons | **16.6** / 1.20, 159 to 176 x 42px |
| | Optional context box, "Continue" | 18.0 |
| | Back button | **14.8** / 1.70 |
| Final screen | "Anything else?" legend | 26.0 / 1.70 |
| | Comment label / "(optional)" / textarea | 18.0 / **15.3** / about 19.8 |
| | Submit button | 18.0 / 1.20 |
| Completion | "Thank you" / video label / transcript | 34.0 / **11.7** / **16.2** |
| | Referral text, privacy line, quoting text | **16.6**, **15.1**, **15.8** |
| | Copy link, More ways to share, Save my choice | 18.0 |

Bold = under 18px. Not yet measured: the expanded example text, and the personal results
email (HTML email, not the site's CSS).

## 4. Proposed sizes under the rule (below 640px)

| Role | Proposed | Applies to |
|---|---|---|
| Body text | 20 / 1.55 | transcripts, consent text, referral and quoting text, comment label |
| Tappable text | 20 | video labels, transcript toggle, consent and choice labels, Back, Continue/Submit/Copy/Save, "Not applicable", "See an example", "More ways to share" |
| Supporting text | 18 | "Required" / "(optional)" tags, "N of 24 answered", scale end labels, privacy line, "?" icon |
| Headings, statement text, numerals | unchanged (all above 20) | h1, legends, statement text 23.4, response numerals 21.6 |

Layout consequences to check before any implementation (none applied):

- 25 role choices at 20px become taller cards: a longer context screen.
- "Not applicable" buttons at 20px will wrap to two lines.
- A statement screen (two statements, each with five buttons, labels and a skip) gets
  taller; response buttons stay 54 x 68px, so the five-button row still fits at 320px.
- More scrolling per screen and a possible small change in completion time: to be
  measured, not assumed.

## 5. Research-integrity note

1. **A presentation change mid-study.** At the time of writing the study is collecting:
   `/api/research-participation` reports 27 completed against the 30-completion
   first-findings milestone, 4 of them on the current instrument version, with a
   benchmark minimum of 15 per version (2 Oct 2026, 19:58Z). Responses given before the
   change were given under the old presentation.
2. **Which instrument version.** The current version is `phase3-v5-2026-09-25-examples`
   (rationale `phase3-rationale-v1.0-2026-08-28`); earlier versions were `phase3-v3` and
   `phase3-v4-2026-09-13-paired`. Content, order, scale and logic are unchanged, so this
   is proposed as a **presentation-only change that stays on v5**: no
   `INSTRUMENT_VERSION` bump. A bump would split the cohort (benchmarks and pooling are
   per version, see `changes/benchmark-compatibility`) and would block in-progress
   participants, because a saved session with a different version is refused by the page
   (`research/index.html`, "uses a different version").
3. **How it would be logged.** Add a `presentationVersion` string (for example
   `phone-type-scale-2026-10-xx`) beside `instrumentVersion` and `rationaleVersion` in
   the saved state and in every submission, plus a viewport-width bucket at start and at
   submit, so analysts can split phone responses before and after. That is a schema
   change (an Airtable field, `api/research-submit.js`, `api/research-save-progress.js`)
   and needs its own approval; it is not part of this proposal's implementation until
   agreed. Existing in-flight sessions keep their old presentation; new sessions get the
   new one. The change is recorded in the decision log and the hypothesis log.
4. **Timing option for the reviewer.** (a) Ship now and tag; (b) wait until the 30th
   completion and the first published findings, then ship with the new tag, so the
   findings cohort is homogeneous. Desktop and tablet respondents are unaffected either
   way; the number of phone completions so far can be read from analytics.
5. **Questions for the methodology reviewer.**
   - Is a font-size and spacing change on phones a mode effect that must be modelled, or
     negligible?
   - May responses before and after be pooled for benchmarks, or kept as strata?
   - Is `presentationVersion` plus the viewport bucket enough, or is a pre/post flag
     needed in the first-findings analysis?
   - Should (a) or (b) above apply?

## 6. Acceptance, tests, rollback

- `tests/smoke/survey-frozen.spec.js` keeps the survey frozen today. If this is approved,
  regenerate `survey-baseline.json` in the same commit and say so.
- Extend the "no visible text under 18px" smoke test to the survey stages.
- Before/after screenshots at 390px for every screen, and a 320px check for sideways
  scroll.
- Rollback is a CSS revert with no data migration; the `presentationVersion` tag would
  go back to the previous value.

## 7. A note for transparency

During batch 2 the `/take-part` intro rules were found to be scoped to the whole
survey page, which changed some survey screens below 640px (60 of 447 measurements,
including checkbox labels 18 to 20px and buttons 18 to 20px). Nothing was released. It
was fixed on `design-foundations` (`9400ca1`, `8ed0ac8`) and the freeze test was added
so it cannot recur.
