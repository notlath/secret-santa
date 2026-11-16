# 09: Remove a Participant after the Draw (close the gap)

**What to build:** When someone drops out after the Draw, the Host removes them and their Giver takes over their Recipient, so only one person's Recipient changes and there's no redraw. That Giver goes through the reveal again with a note explaining why. Removing someone who would leave only 2 Participants needs an extra warning.

**Blocked by:** 07, 08

**Status:** ready-for-agent

- [ ] Removal in `assigned` uses the Draw function's close-the-gap step in one transaction: the removed Participant's Giver gets their Recipient, both of the removed Participant's Assignments are deleted, the Giver's revealed timestamp is cleared and their "Recipient changed" flag is set
- [ ] If removal would leave 2 Participants, the confirmation warns "Only 2 left, both will know who has them" before proceeding
- [ ] The affected Giver's next visit replays the reveal with the note "Your Recipient changed because <name> left"
- [ ] The Host dashboard's reveal count reflects the reset
- [ ] Vitest: exactly one Giver's Recipient changes, the circle stays valid, the reveal mark resets, the removed Participant's link stops working
- [ ] Playwright: remove a Participant after the Draw; the affected Giver sees the new Recipient and the note
