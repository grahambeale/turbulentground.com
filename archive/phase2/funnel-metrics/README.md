# Funnel Metrics export (Phase 2 analytics base)

Exported 8 Oct 2026 from the Airtable base "TurbulentGround Funnel Metrics" (`app05b2ggSjfWL4RD`) before the Phase 1 and 2
decommission. Read-only copy; the Airtable base is unchanged. These tables were written weekly by the Phase 2
"Analytics Agent". The last row was written on 20 Sep 2026 and nothing has written to them since.

| File | Airtable table | Rows | Columns |
|---|---|---|---|
| `diagnostic-funnel.csv` | Diagnostic Funnel (`tblLDp3Q4di19rWDY`) | 80 | Record ID, Week Ending, Sprint Number, Step Name, Step Order, Count, Conversion From Previous Step, Low Confidence, Notes |
| `weekly-summary.csv` | Weekly Summary (`tblXQ3PbD1Oa2MbTk`) | 13 | Record ID, Week Starting, Week Ending, one column per funnel step, Article Visitors, Data Note |
| `articles-funnel.csv` | Articles Funnel (`tblnRZzSmbl2yOiCv`) | 13 | as Diagnostic Funnel |
| `share-funnel.csv` | Share Funnel (`tblqpOTqrJHer4NmF`) | 1 | as Diagnostic Funnel |

107 rows in all. Empty cells mean the field was empty in Airtable (not measured), which the tables' own notes treat as different
from zero. The Notes and Data Note text is copied verbatim.

Personal data: none. Every column is a date, a count, a step name, a flag or free-text analyst notes. The notes contain no
email addresses, no URLs and no participant identifiers; they name only the owner (Graham) and give aggregate visitor counts by
referral source. The diagnostic respondent data (Diagnostic Submissions, a different base) is not part of this export.
