# Automatic-deletion transparency amendment

**Decision date:** 26 September 2026  
**Decision:** Requested by Graham in direct conversation

## Principle

The participant journey must explain that incomplete responses are deleted
automatically so the research data Graham keeps is data participants have
confirmed they want included in the study.

This is expressed as a trust and data-minimisation commitment. It does not claim
that completing the survey is the only possible legal basis for processing, and
it does not replace the full privacy notice or lawful-basis decision.

## Required behaviour

1. The opening retention explanation states the automatic-deletion reason.
2. After deletion, the service attempts one confirmation email using the address
   held only in process memory after the underlying record has been deleted.
3. Confirmation failure does not delay deletion and does not retain the address
   for retry.
4. The old private return link displays a generic expired/deleted explanation.
5. “Start a new response” creates a wholly new identity, token and 14-day clock;
   it cannot recover or join to deleted data.

## Scope

This amends the implementation package only. It does not authorise a real email,
deletion, Airtable change, public activation or production release.
