# Proposal: phone type scale for the research survey (below 640px) — revision 2

**Status: PROPOSAL ONLY.** Revised 3 October 2026 after the methodology review. Not approved,
not implemented. Nothing in this document changes the survey. Revision 1 was prepared
2 October 2026 as part C of the type-scale batch 2 request.

## Revision log (3 October 2026, from the methodology review, seven points)

| # | Change | Where |
|---|---|---|
| 1 | Response area exception: the 1 to 5 buttons, the scale end labels and "Not applicable" keep their current relative proportions; "Not applicable" stays on one line. The rule applies in full everywhere else. | sections 2, 4 |
| 2 | `presentationVersion` ships in the same release as, or before, the restyle: a hard dependency, enforced by a test. | section 5.3 |
| 3 | The claim that in-flight sessions keep the old presentation is removed and replaced by recording the version at start and at submit and flagging mixed sessions. | section 5.4 |
| 4 | The pre-change device type is unknown, so pre/post phone strata exist only prospectively. | section 5.5 |
| 5 | Analysis plan: pool by default; a pre/post check only with at least 15 phone responses on each side. | section 5.6 |
| 6 | The privacy notice does not cover a stored viewport bucket or layout version; wording proposed. | section 5.7 |
| 7 | Timing: ship after the 30th completion or two weeks from approval, whichever comes first. | section 5.8 |

## 1. Why, and the rule

Graham's rule for phones (below 640px): body text 20px at about 1.55, nothing visible
under 18px, tappable text 20px or more, supporting text 18px minimum, headings stay
larger than body, desktop unchanged. It is in place on the site's content pages. The
survey after the start screen is a measurement instrument, so it was left out of that
work on purpose. Today it has text well under 18px on every screen (section 3).

The `/take-part` **start screen** (the intro, before any answer is recorded) is already
on the scale and is not part of this proposal.

**One exception, from the methodology review:** the response area (the 1 to 5 buttons, the
scale end labels and "Not applicable") is not restyled. See sections 2 and 4.

## 2. Scope: presentation only

**Would change (below 640px only):** font sizes, line-heights and spacing of the consent
screen, the context screen, the statement screens (24 statements, 12 pair screens, the
final "anything else" screen) and the completion screen.

**Response area exception (not restyled):** the five response buttons (1 to 5), the scale
end labels ("Strongly disagree" / "Strongly agree") and the "Not applicable" buttons keep their
current sizes and their current proportions to one another and to the statement text.
"Not applicable" stays on one line from 320px to 639px. This is a deliberate exception to
"nothing visible under 18px" (the labels are about 17.1px and "Not applicable" is 16.6px): the
response controls are what a participant answers with, and changing their relative
prominence is the likeliest way for a typography change to move the data. The rule applies
in full to every other element on the survey screens.

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
| Tappable text | 20 | video labels, transcript toggle, consent and choice labels, Back, Continue/Submit/Copy/Save, "See an example", "More ways to share" |
| Supporting text | 18 | "Required" / "(optional)" tags, "N of 24 answered", privacy line, "?" icon |
| Headings, statement text, numerals | unchanged (all above 20) | h1, legends, statement text 23.4, response numerals 21.6 |
| **Response area: exception, unchanged** | **as now** | **1 to 5 buttons (54 x 68px, numerals 21.6), scale end labels (about 17.1), "Not applicable" (16.6, one line)** |

Layout consequences to check before any implementation (none applied):

- 25 role choices at 20px become taller cards: a longer context screen.
- "Not applicable" is **not** enlarged, so it stays on one line and keeps its current
  159 to 176 x 42px footprint. Revision 1 predicted a wrap to two lines; that no longer applies.
- A statement screen (two statements, each with five buttons, labels and a skip) gets taller
  only through the larger surrounding text, so the five-button row still fits at 320px.
  The statement text and the response controls keep today's proportions to each other.
- More scrolling per screen and a possible small change in completion time: to be measured,
  not assumed (it is one of the three pre/post checks in section 5.6).

Tests: the "no visible text under 18px" test for the survey stages must name the response
area as an explicit, documented exception (the labels and "Not applicable"), and a new
check must freeze the response area's computed sizes and prove "Not applicable" is one line at 320, 375, 390 and 639px.

**Interpretation to confirm:** "keep current relative proportions" is read here as "do not
restyle these controls". If it was meant as "scale them together by one factor so their
proportions stay the same", say so and section 4 changes.

## 5. Research-integrity note

### 5.1 A presentation change mid-study
At the time of writing the study is collecting: `/api/research-participation` reports
27 completed against the 30-completion first-findings milestone, 4 of them on the current
instrument version, with a benchmark minimum of 15 per version (3 Oct 2026, 17:18Z).
Responses given before the change were given under the old presentation.

### 5.2 Which instrument version
The current version is `phase3-v5-2026-09-25-examples` (rationale
`phase3-rationale-v1.0-2026-08-28`); earlier versions were `phase3-v3` and
`phase3-v4-2026-09-13-paired`. Content, order, scale and logic are unchanged, so this is a
**presentation-only change that stays on v5**: no `INSTRUMENT_VERSION` bump. A bump would
split the cohort (benchmarks and pooling are per version, see
`changes/benchmark-compatibility`) and would block in-progress participants, because a
saved session with a different version is refused by the page (`research/index.html`,
"uses a different version").

### 5.3 presentationVersion: a hard dependency (point 2)
A `presentationVersion` string (for example `phone-type-scale-2026-10-xx`) is recorded
beside `instrumentVersion` and `rationaleVersion` in the saved state and in every
submission. **It must ship in the same release as the restyle, or before it. The restyle
must never reach production without it.** This is enforced, not just promised:

- the restyle's CSS and the tag are one change, or the tag's change is released first and is
  live on production before the restyle is approved for release;
- a smoke/unit test fails if the restyle CSS is present while the submission payload, the
  saved state or the Airtable field does not carry `presentationVersion` (and the same test
  fails if the value is not the one the CSS declares);
- the restyle's release, which goes through `scripts/release.sh`, must include that test among the production specs it runs (`--specs`).

The tag is a schema change (an Airtable field, `api/research-submit.js`,
`api/research-save-progress.js`) and needs its own approval; it is not implemented by this
proposal. Responses recorded before the tag exists carry no `presentationVersion` and are
read as "original presentation, version unknown" (section 5.5).

### 5.4 Mixed sessions: record and flag, do not assume (point 3)
Revision 1 said in-flight sessions would keep the old presentation. That is not
guaranteed and is removed. The page is a static file: someone who loaded it before the
release and submits after it, or who saves progress and returns within the 14-day window
(a new page load), can start under one presentation and finish under another. So:

- record `presentationVersion` at **start** (first save or consent) and again at **submit**,
  as two values, plus a viewport-width bucket at each (section 5.5);
- the server derives a **`mixedPresentation`** flag when start and submit differ, and the
  field is kept on the response so it can be filtered;
- mixed sessions are counted and reported, not silently dropped or silently pooled; the
  analysis plan (5.6) says how they are treated.

### 5.5 What can and cannot be known about devices (point 4)
Nothing about device or screen is stored with a response today. The pre-change device type
is therefore **unknown**: no earlier response can be assigned to "phone" or "desktop"
afterwards. Plausible's aggregate "device type" is anonymous and cannot be linked to a
response. Consequences:

- pre/post **phone strata exist only prospectively**, for responses recorded after the tag
  and viewport bucket ship;
- every response before that is "device unknown, original presentation", including the
  cohort for the first findings (27 completed on 3 Oct), which cannot be split by device;
- the first-findings analysis must say this plainly and must not claim phone and desktop
  responses were compared for that cohort.

Proposed viewport bucket (one coarse value, not the exact width): `phone` below 640px
(the same breakpoint as the restyle), `tablet` 640 to 1023px, `desktop` 1024px and up,
read from the window width at the moment of recording.

### 5.6 Analysis plan (point 5)
- **Default: pool.** All responses on instrument v5 are analysed pooled, regardless of
  presentation version or device, as they are today. The restyle does not by itself
  create strata.
- **Pre/post check, only when there is enough data:** when there are **at least 15
  phone responses on each side** (phone = viewport bucket `phone`, "before" = original
  presentation recorded with a bucket, "after" = restyled presentation), compare, for phone
  responses only: the **"Not applicable" rate**, the **item means**, and the **median
  completion time**. Below 15 on either side the check is not run and nothing is concluded.
- The check is descriptive, with the 15 minimum matching the benchmark minimum; it is not a
  significance test and does not by itself justify excluding or reweighting anything.
- If the check shows a material difference, it is reported to the methodology reviewer
  before any stratified or excluded analysis; no automatic exclusion.
- Mixed sessions (5.4) are excluded from the "before" and "after" groups of the check and
  counted separately; they stay in the pooled analysis unless the reviewer says otherwise.
- The decision, the check and its numbers are recorded in the decision log and the
  hypothesis log.

### 5.7 Privacy notice (point 6)
**Finding: the notice does not cover this.** The study notice ("Taking part in the AI shift
research", in `privacy.html`, last updated 1 October 2026) lists what is collected under
"What I collect, and why": identity and invitation data, email preferences, the 24 answers,
profile and comment, **start and completion times, answered pairs and benchmark eligibility**,
unsubscribe feedback, and the random referral code. It has no row for the kind of screen
used or for the layout version a participant saw. The only device wording is in "Using the
website": Plausible's anonymous statistics (device type) and "device or browser information"
for operating and securing the site, which is aggregate or operational and is not stored
with a response. Storing a viewport bucket and a layout version with a response therefore
needs a notice change.

**Proposed wording**, as one new row in "What I collect, and why", after the times row:

> **The kind of screen you used and the layout version you saw.** Whether you took part on a
> phone, tablet or computer (taken from your browser window's width, not your exact screen
> size, device model or IP address), and which version of the survey's layout you saw, at the
> start and at the end. *To check that the survey reads the same way on every device and to
> see whether a change to its layout affects answers.* Lawful basis: legitimate interests.

Rationale for the lawful basis: it is administrative and methodological, like the times row,
and carries no content. Graham should confirm whether to match the times row ("consent and
legitimate interests").

**Release dependency.** The notice change ships in the same release as, or before, the
tag and viewport bucket, and the notice's "Last updated" date is changed with it. The bucket
is recorded only from the release onward, so no participant's earlier response is
retrospectively covered by wording they did not see. The participant-facing consent screen is
unchanged; the privacy notice is what it links to.

### 5.8 Timing (point 7)
**Ship after the 30th completion, or two weeks from approval of this proposal, whichever
comes first.** The 30th completion is read from `/api/research-participation` (27 on 3 Oct,
3 remaining). The two weeks run from the date Graham approves this revised proposal, not
from the date it is written. "Ship" means the release of the restyle, with the tag and the
notice change already live or in the same release (5.3, 5.7); the tag and notice may
and should go out earlier. Graham approves the implementation and the release separately,
as always.

### 5.9 Decisions recorded and what is still open
Decided in the methodology review: points 1 to 7 above. Still open for Graham:
the reading of "relative proportions" (section 4); the lawful basis wording (5.7); and
whether the viewport buckets above are the ones to use (5.5).


## 6. Acceptance, tests, rollback

- `tests/smoke/survey-frozen.spec.js` keeps the survey frozen today. If this is approved,
  regenerate `survey-baseline.json` in the same commit and say so.
- Extend the "no visible text under 18px" smoke test to the survey stages, with the response
  area named as the one documented exception (section 4).
- A test that the response area (1 to 5 buttons, scale end labels, "Not applicable") is
  unchanged in size, and that "Not applicable" is one line at 320, 375, 390 and 639px.
- A test that `presentationVersion` (start and submit) and `mixedPresentation` are accepted
  by the API, stored, and present whenever the restyle CSS is (section 5.3); a unit test that a
  start and submit with different versions set `mixedPresentation`.
- The privacy notice row (5.7) and its "Last updated" date change in the same release as the tag.
- Before/after screenshots at 390px for every screen, and a 320px check for sideways
  scroll.
- Rollback is a CSS revert with no data migration; the `presentationVersion` tag would
  go back to the previous value. The recorded start and submit values are kept as they were
  recorded (they describe what each participant actually saw); the privacy notice row stays.

## 7. A note for transparency

During batch 2 the `/take-part` intro rules were found to be scoped to the whole
survey page, which changed some survey screens below 640px (60 of 447 measurements,
including checkbox labels 18 to 20px and buttons 18 to 20px). Nothing was released. It
was fixed on `design-foundations` (`9400ca1`, `8ed0ac8`) and the freeze test was added
so it cannot recur.
