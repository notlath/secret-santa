# 04: Draw function

**What to build:** The pure Draw logic from ADR-0003, with no database or UI: shuffle the Participants with Fisher–Yates using an injected random source and make each one give to the next in a single circle. It also includes the derangement check and the close-the-gap step for removing a Participant after the Draw. Later tickets call it inside the Draw transaction.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] Draw takes Participant ids and a random source and returns Assignments forming one circle; production uses `crypto.getRandomValues`
- [ ] Derangement check rejects any result where someone gives to themselves, a Recipient repeats, or a Participant is missing as Giver or Recipient
- [ ] Close-the-gap: given the current Assignments and a removed Participant, the removed Participant's Giver takes over their Recipient, and nothing else changes
- [ ] Vitest property tests over thousands of runs and group sizes 3–50: one circle, everyone gives once and receives once, nobody gets themselves, no mutual pairs when there are 3 or more
- [ ] Vitest: close-the-gap results stay valid circles down to 2 Participants and change exactly one Giver's Recipient
- [ ] Vitest: the derangement check rejects each malformed input
