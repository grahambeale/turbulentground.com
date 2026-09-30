# Phase 4 Airtable schema change — review packet

**Status:** Awaiting Graham's schema-change approval  
**Inspected:** 30 September 2026 through the live Airtable connector  
**Base:** `app7dKDinTjxczEfD`  
**Table:** `tbltQDAUZ8FF0ZDvA`  
**Mutation authorised:** No

## Current live state

The table is named **Research Product Decisions & Feedback**. Its description
and the `Source` field description explicitly restrict it to the research study
and say not to use it for the wider site. It already contains the workflow
fields required for Phase 4: stable ID, source evidence, agent assessment,
proposed solution, Graham's decision, review notes, test plan, implementation
status, release decision, preview/live URLs, verification, parent decisions and
agent attribution.

Creating a second product queue would duplicate gates and make assistant
handoffs ambiguous. The lowest-risk migration is to broaden this table while
preserving every record and field ID.

## Exact proposed schema mutations

1. Rename table `tbltQDAUZ8FF0ZDvA` from **Research Product Decisions &
   Feedback** to **Turbulent Ground Product Decisions & Feedback**.
2. Replace its description with:

   > Central evidence, product-decision and approval queue for Turbulent Ground.
   > Covers product, participation, content, operations and legacy work. Preserve
   > source material separately from agent interpretation. Consequential choices
   > require Graham's explicit decision; implementation and release are separate
   > gates.

3. Add one required-for-new-records single-select field named **Lane** with
   choices:
   - `Product` — whole-domain proposition, routes, shared UI and cross-cutting work;
   - `Participation` — survey, invitation, referral, consent, email and results;
   - `Content` — About, Learnings, editorial content and public copy;
   - `Operations` — admin, governance, integrations and internal review tools;
   - `Legacy` — Phase 2, Care Capital, diagnostic and compatibility retirement.
4. Replace the `Source` field (`fldJO2SI6UznywFVp`) description with:

   > How the product evidence or request was received. Preserve the original
   > wording. Source does not imply implementation or release authority.

5. Do not rename, delete or recreate any existing field. Existing IDs and
   automations remain stable.

## Backfill plan

- Existing records remain unchanged during schema creation.
- Produce a dry-run record-ID-to-Lane manifest before backfill.
- Default historical study and participant records to `Participation` only when
  their existing scope makes that classification explicit.
- Classify Phase 4 parent and design decisions as `Product`.
- Classify Release 1 governance and future admin workflow decisions as
  `Operations`.
- Flag genuinely mixed or ambiguous records for manual review; do not infer.
- Make `Lane` operationally mandatory for new records in the workflow before
  considering Airtable-level enforcement.

## Compatibility and automation checks

Before mutation:

1. inventory Airtable views, forms, interfaces and automations referencing the
   table name or research-only description;
2. verify that API and connector integrations use table ID rather than display
   name;
3. verify website feedback ingestion and any scheduled triage continue to
   create records successfully when `Lane` is absent during transition;
4. update assistant instructions and record templates to write `Lane`;
5. test a synthetic Product record and a synthetic Participation record, then
   remove or clearly label the test records;
6. confirm existing parent links, decisions and release fields are unchanged.

## Rollback

If integrations fail, stop new writes, restore the previous table name and
descriptions, leave the new Lane data intact for audit and revert workflow
templates to omit Lane. Do not delete or recreate the table or any historical
record.

## Decision requested

Approve these exact live-schema changes and a dry-run backfill manifest. This
does not authorise the backfill itself; the manifest returns for review before
historical records are changed.
