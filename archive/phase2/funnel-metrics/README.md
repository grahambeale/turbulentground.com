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

107 rows in all.

## How these files were produced

By a script, not by hand. Each table was read in full through the Airtable connector (`list_records_for_table`, all fields,
sorted by week and step); the script took the JSON responses, checked that the number of records returned equalled the
table's `totalRecordCount` (80, 13, 13 and 1), and wrote one CSV row per record, in the order returned, with the field
IDs mapped to the column names above. Nothing was retyped. Notes and Data Note text is verbatim from the API. Select
fields (Step Name) are written as the option's name. Checkbox fields (Low Confidence) are TRUE or FALSE; Airtable returns
an unticked box as an absent field, which is written as FALSE. Any other empty cell means the field was empty in Airtable
(not measured), which the tables' own notes treat as different from zero. Numbers are as the API returned them (the
conversion column is a fraction, for example 0.25 for 25%).

(An earlier version of these files was typed by hand and was replaced after the scripted version showed 31 cells in
`diagnostic-funnel.csv` that did not match the API: 26 Low Confidence flags and 5 conversion values. The other three files
matched exactly.)

## Personal data

None. Every column is a date, a count, a step name, a flag or free-text analyst notes. A scan of all four files found no
email addresses and no URLs, and the notes contain no participant identifiers; they name only the owner (Graham) and give
aggregate visitor counts by referral source. The diagnostic respondent data (Diagnostic Submissions, a different base) is
not part of this export.
