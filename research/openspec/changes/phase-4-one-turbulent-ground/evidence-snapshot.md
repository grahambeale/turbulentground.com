# Phase 4: One Turbulent Ground — evidence snapshot

## Activation

- Activated by Graham in Codex on 30 September 2026.
- Airtable intake: `FB-20260930-PHASE4` (`rec7mPoyuHoPNDl8P`).
- This is a cross-lane product-consolidation proposal. It does not authorise design, implementation, participant contact or release.

## Source record

Graham directed that Phase 2 stop, that the Phase 3 approach become the main Turbulent Ground experience, and that the artificial split between the main site and research area be removed. He proposed calling the consolidation Phase 4.

Graham subsequently required that:

- invite-only participation and the referral system are included;
- Claude Code and Codex use the same source of product and workflow truth;
- every product change initiated through either assistant enters Airtable and OpenSpec;
- chat may start intake but must not bypass specification, implementation or release gates.

## Observation

Phase 3 now provides the active product journey: public and invite entry, consent, save-and-return, questions, completion, referral sharing, results and benchmark communication. The repository and operating documents still divide that journey from the wider site and retain Phase 2-era language, routes and coordination mechanisms.

That split creates three risks:

1. users can encounter competing explanations of what Turbulent Ground is;
2. product changes can be coordinated differently depending on where a file lives or which assistant receives the request;
3. replacing routes or documents without an explicit migration can break invitation, referral, return and results links already in circulation.

## Current implementation

- `/research` contains the participant journey and supports public, invite-only, referral and secure-return entry states.
- The root site and research area have separate historical structures and operating protocols.
- Referral links, invitation links, resume links and results links may already be in email, messages or browser history.
- Questionnaire/instrument version identifiers protect comparison validity and cannot be renamed merely because the site enters Phase 4.
- Airtable `Research Product Decisions & Feedback` is the existing decision and approval queue.
- OpenSpec under `research/openspec` is the existing specification gate for the participant product.

## Related and contrary evidence

- Phase 3.1 already specifies a persistent personal referral link, public sharing and one-to-one private invitation as entry mechanisms within one study.
- Existing production use shows that the research journey can operate as the principal user-facing product.
- Legacy site content may still provide useful context, search equity or inbound links; consolidation does not prove that immediate deletion is safe.
- The existing main-site sprint protocol and research on-demand protocol protect different work areas. A unified operating model must preserve collision prevention and explicit approvals rather than simply deleting those safeguards.

## Limits

- No complete inventory of live inbound links, analytics events, search traffic or external references has yet been approved as migration evidence.
- This packet defines the product and governance outcome, not final information architecture, visual design or copy.
- Production routing, redirects, retention and archive decisions require a verified inventory during the next approved stage.

