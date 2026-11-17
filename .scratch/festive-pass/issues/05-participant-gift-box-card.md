# 05: Participant gift-box card

**What to build:** The Participant page shows one gift-box card in a fixed position near the top.
- **Before the Draw** (Exchange Status Open or Closed): the box is guarded by the cat and the card says "Your gift box opens after the Draw."
- **After the Draw** (Assigned or Completed): the plain box without the cat, the existing "Your Recipient is waiting" copy and the "Reveal my Recipient" link.

The card replaces the current after-Draw waiting card, so there is still one way to reach the reveal. The box never opens in place. When LiveRefresh moves the page past the Draw, the card just switches, with no animation.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Before the Draw, the card shows the cat guard and "Your gift box opens after the Draw.", with no reveal link.
- [ ] After the Draw, the card shows the plain box, "Your Recipient is waiting" and "Reveal my Recipient". Exactly one link on the page leads to the reveal.
- [ ] The card stays in the same position in both states. The LiveRefresh switch isn't animated.
- [ ] Under reduced motion, the card shows the plain box with no cat.
- [ ] Playwright: the card's copy and links before and after the Draw. `auditPage` passes on the Participant page before and after the Draw.
- [ ] `pnpm test` and `pnpm verify` pass.
