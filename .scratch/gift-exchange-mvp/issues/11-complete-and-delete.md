# 11: Complete and delete the Exchange

**What to build:** After the meetup, the Host marks the Exchange Completed, which makes it read-only while everyone can still see their reveal. The Host can delete the Exchange at any time after confirming, which removes all its data and stops every link working.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] `markCompleted` moves `assigned` → `completed`, Host only; any other starting status is refused
- [ ] In `completed`, every edit (Event Details, Wishlists, removals, re-issues) is refused, and reveals stay visible
- [ ] `deleteExchange` is Host only, allowed in any status, behind an Alert Dialog; it cascades to Participants, Wishlist Items and Assignments
- [ ] After deletion, every Host and Personal Link shows the "link no longer works" explanation
- [ ] Vitest: transitions, read-only enforcement, cascade, links rejected after deletion
- [ ] Playwright: Host completes the Exchange and a Participant can still open the reveal; Host deletes it and a Participant link shows the explanation
