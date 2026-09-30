# Phase 4: One Turbulent Ground — experience design

**Status:** Proposed for Graham's review  
**Authority:** Approved OpenSpec revision 1  
**Not authorised:** implementation or release

## Design conclusion

Keep the current homepage as the visual and proposition baseline. It already presents the Phase 3 idea as Turbulent Ground itself: one clear story, one primary action and one design language. The visible problem is not that the homepage needs replacing; it is that clicking through still feels like entering a separate research property.

Phase 4 should therefore create one product with two deliberate modes:

1. **Orientation mode** — the root explains the proposition, value and trust case.
2. **Participation mode** — a focused, low-distraction task flow at `/take-part`.

The modes share brand, language, privacy expectations, feedback pattern and global product identity. Participation keeps reduced navigation because leaving mid-survey is a task risk, not because it belongs to a different product.

## Current-state audit

### Step 1 — root orientation: healthy baseline

The deployed root has a strong, coherent hero, clear study proposition and prominent action. It already behaves like the Phase 4 front door. The masthead, visual language and copy should be treated as the baseline rather than redesigned during architecture work.

### Step 2 — participant entry: healthy flow, visible boundary

The participant entry uses the same palette and masthead, but its route, reduced navigation, privacy location and invite-era wording still communicate a separate area. That boundary is organisational rather than useful to the participant.

### Accessibility limits

The captures support only a visual first-screen review. Keyboard order, focus management, popup behaviour, zoom, reduced motion, screen-reader naming and full contrast require hands-on testing during implementation review. No accessibility-conformance claim is made here.

## Proposed information architecture

```text
Turbulent Ground
├── /                       Proposition and public entry
├── /take-part              Participation runtime
│   ├── public state
│   ├── private-invitation state
│   ├── referral state
│   ├── secure-return state
│   └── completion/results-sharing state
├── /learnings              Findings and ongoing learning
├── /about                  Identity, provenance and contact
├── /privacy                Layered privacy hub
│   └── #research           Participation-specific privacy section
└── /admin
    ├── /admin/invitations  Private invitation operations
    ├── /admin/participants Participant operations
    ├── /admin/results      Results operations
    ├── /admin/feedback     Feedback operations
    └── /admin/reviews      Protected review tools
```

Compatibility paths such as `/research` and the historical instrument runtime remain operational but absent from primary navigation.

`/about` is a permanent trust surface, not a temporary legacy page. It should explain who is behind Turbulent Ground, why the work exists and how to make contact without duplicating the homepage proposition. `/writing` is not a Phase 4 content area: `/learnings` is the editorial destination, while `/writing` and `/writing.html` remain compatibility redirects to LinkedIn after the redundant local file and sitemap entry are removed.

## Entry behaviour

### Public arrival

The root leads with the proposition and one primary action. Selecting it begins the public self-service state at `/take-part`. Eligibility, value, time commitment and privacy are clear before personal information is requested.

### Private invitation

A private link opens the same participation route with recognised invitation context. Personalisation is restrained and never implies obligation. The 1:1 nature is expressed through a person/invitation cue, not a lock metaphor.

The owner creates, reviews and copies private links from `/admin/invitations`. Invitation is a first-class acquisition journey within Turbulent Ground, not a separate research product or a special public microsite.

### Referral

A referral opens the same participation route with no disclosure of who referred the visitor. The proposition may acknowledge that someone thought their perspective would be valuable, but identity and response information remain private.

### Secure return

A return link resumes the saved point directly after validation. It does not send someone back through marketing content or ask them to re-enter identity information already held.

## Shared shell and components

- One masthead component and one brand lockup across public, participation, learning, privacy and admin surfaces.
- A full navigation variant for orientation/editorial pages and a reduced, clearly intentional variant for task flows.
- One site-wide feedback launcher and modal pattern.
- One privacy language system with contextual links to the relevant section.
- One button, input, checkbox, modal, video and notification system.
- One footer pattern, with task flows permitted a reduced form.
- No new decorative system is introduced in Phase 4.

## Privacy presentation

Use one layered `/privacy` hub so people can understand the whole service without reconciling competing notices. Shared facts such as controller identity, contact details and individual rights appear once. Distinct processing purposes, lawful bases, data types, recipients and retention periods remain explicit for website use, participation, invitations/referrals and optional communications. Contextual links and any in-flow privacy modal open the relevant section directly rather than repeating a second policy.

## Content hierarchy

The Phase 4 root keeps this order:

1. what the AI shift is and why perspectives matter;
2. the value of contributing;
3. who the study is for and what taking part involves;
4. trust, independence and privacy;
5. the primary participation action;
6. findings and learnings.

Phase 2 diagnostic and Care Capital content is removed from primary navigation and conversion paths. Existing learning articles are not silently rewritten; obsolete CTAs become a separate, reviewable content migration.

## Responsive and accessibility requirements

- Primary actions remain visible and understandable at 320 CSS pixels and 200% text zoom.
- Focus is moved into video/feedback dialogs and restored to the triggering control on close.
- Reduced motion removes non-essential smooth scrolling and transition effects without removing orientation.
- Invitation, referral and public states are not distinguished by colour alone.
- Participation progress remains perceivable while scrolling without obscuring questions.
- Error and confirmation states use text and programmatic status, not iconography alone.

## What this design deliberately avoids

- Replacing the established homepage visual direction.
- Putting the whole questionnaire on the homepage.
- Exposing research/admin language in the public navigation.
- Treating invite-only and referral as separate microsites.
- Deleting useful historical content merely to make the route tree look tidy.
