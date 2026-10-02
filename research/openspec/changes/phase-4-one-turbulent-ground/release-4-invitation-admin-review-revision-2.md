# Phase 4 Release 4A — admin navigation review

**Revision:** 2  
**Airtable:** `FB-20261002-PHASE4-REL4-INVITATIONS`  
**Decision required:** approve, approve with changes, defer or reject

## What changes

The two operational links below the invitation form become a real shared admin
navigation. It uses the public site's established desktop and mobile pattern,
but its destinations are Admin home, Invitations, and Results & feedback.

## Why this is the smallest coherent change

The repository already generates navigation from one shared template, CSS file
and script. Adding an admin configuration preserves the public interaction and
visual pattern without copying it. It also gives the invitation and tools pages
consistent wayfinding and removes the duplicated links at the bottom.

## Important boundary

The `/admin` destination is the existing CMS application. This revision links
to it but does not try to inject the Turbulent Ground header into the CMS's own
third-party interface.

## Approval requested

Approve revision 2 to implement the exact admin navigation above and prepare a
replacement preview. Production remains a separate decision after review.
