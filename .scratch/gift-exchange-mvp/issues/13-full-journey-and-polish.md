# 13: Full-journey check and polish pass

**What to build:** A final pass that proves the whole MVP works end to end on phone and desktop, by keyboard alone, and that the UI meets the `emil-design-eng` standard across every page.

**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12

**Status:** ready-for-agent

- [ ] Playwright full journey at phone and desktop sizes: Host creates and joins, 3 Participants join in separate browser contexts and fill in Wishlists, Host closes and draws, everyone reveals, reload shows the same Recipient, a Personal Link restores a session in a fresh context, Host-only URLs refuse a Participant cookie
- [ ] Keyboard-only pass through the whole flow; every control named and reachable; focus visible
- [ ] ui-sdk keyboard, focus and ARIA checks on forms, dialogs, toasts and the meter
- [ ] Color contrast checked in a real browser (text 4.5:1, control edges and focus rings 3:1)
- [ ] Every action has visible loading, success and error feedback
- [ ] `emil-design-eng` review of every page, reported as a Before/After/Why table, with the agreed fixes applied
- [ ] Spec's acceptance criteria all demonstrably met
