# 03: Wishlist and Ready

**What to build:** A Participant fills in three Wishlist Items (name, optional description, optional product link), can save a draft and come back, and can change their display name. They see whether they're Ready. The Host dashboard shows each Participant's Ready status and an "N of M ready" meter.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] `wishlist_item` table (position 1–3, unique per Participant)
- [ ] Item name 1–80 characters, description up to 300, product link must be an http or https URL of at most 2,000 characters; validated in the Exchange module
- [ ] Partial Wishlists save; Ready is derived from three non-empty item names and never stored
- [ ] Participant page shows a clear Ready / not Ready state
- [ ] Display name can be changed, with the same uniqueness rule as joining
- [ ] Wishlist and display name edits are allowed in `open` and `closed` (enforced on the server)
- [ ] Host dashboard shows each Participant's Ready status and a ui-sdk Meter "N of M ready"
- [ ] A Participant's view never includes another Participant's Wishlist
- [ ] Vitest: validation, readiness, edit permissions by role and status, Wishlist privacy
- [ ] Playwright: fill in a Wishlist, see Ready; the Host sees the meter change
