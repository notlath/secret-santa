# 07: Run the Draw and reveal

**What to build:** The Host runs the Draw after confirming, and every Participant opens a gift-box reveal showing only their own Recipient, that person's Wishlist, the budget and the Event Details. The Draw happens at most once, Wishlists lock, and the Host sees how many Participants have opened their reveal, without ever seeing the Assignments.

**Blocked by:** 04, 06

**Status:** ready-for-agent

- [ ] `assignment` table (giver unique per Exchange, recipient unique per Exchange, giver ≠ recipient)
- [ ] Start Draw opens a ui-sdk Alert Dialog: "Draw for N participants? This can't be undone."
- [ ] Draw runs only when `closed`, with at least 3 Participants all Ready; in one transaction it moves the status `closed` → `assigned` with a conditional update, uses the Draw function, runs the derangement check, and inserts every Assignment; any failure rolls back everything
- [ ] A second or concurrent Draw fails with "already drawn"
- [ ] Wishlist and display name edits are refused once `assigned`
- [ ] Participant page shows an entry to the reveal after the Draw
- [ ] Reveal page: a gift box that opens with Motion (instant under `prefers-reduced-motion`), then the Recipient's name, their three Wishlist Items with descriptions and product links (new tab, `noopener noreferrer nofollow`, domain shown), the budget and the Event Details
- [ ] Opening the reveal sets the Participant's revealed timestamp once; the Host dashboard shows "N of M have seen their Recipient" and who hasn't
- [ ] No view, including the Host's, ever contains another Participant's Assignment or the full set of Assignments
- [ ] Vitest: preconditions each block the Draw on their own, concurrent Draws (exactly one wins), atomic rollback, Assignment privacy for every role, Assignments unchanged across repeated reveals
- [ ] Playwright: Host plus 3 Participants; Host draws; each Participant reveals a Recipient who isn't themselves; reload shows the same Recipient
