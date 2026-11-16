# 06: Close and reopen registration

**What to build:** The Host closes registration so no one new can join, and can reopen it for a late friend. The dashboard shows a Start Draw button that stays disabled and names exactly what's missing (still open, fewer than 3 Participants, or who isn't Ready) until the Draw would be allowed.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Exchange module `closeRegistration` and `reopenRegistration`, Host only; open → closed and closed → open succeed and every other transition is refused with an invalid-transition error
- [ ] Joining a closed Exchange shows "registration is closed"
- [ ] Wishlist edits still work while closed
- [ ] Host dashboard has close and reopen controls matching the current Status
- [ ] Start Draw is shown disabled with the specific missing condition(s) named; it is not yet wired to run a Draw
- [ ] Vitest: transitions, role checks, join refused when closed
- [ ] Playwright: Host closes registration, a new join is refused, Host reopens and the join succeeds
