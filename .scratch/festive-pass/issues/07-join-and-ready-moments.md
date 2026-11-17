# 07: Join arrival and Ready moments

**What to build:**
- **First arrival after joining:** the heading on the Participant page rises into view. Later visits show no entrance motion.
- **Becoming Ready through your own edit:** the Ready badge pops and a "You're all set" message appears.
- **No motion when:** the save was made from the keyboard, reduced motion is on, or the Participant was already Ready when the page loaded. The badge and message still show straight away.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The first arrival after joining is detected with the simplest signal that needs no new storage, such as a one-shot flag on the join redirect. Reloading the page doesn't replay the rise.
- [ ] The Ready transition plays a CSS `pop` on the badge and shows "You're all set". Neither plays on page load for a Participant who is already Ready.
- [ ] A keyboard-triggered save and reduced motion both show the badge and message without motion.
- [ ] Playwright: after the Wishlist is completed, "You're all set" is visible after a pointer save and after a keyboard save. Reloading after joining doesn't replay the rise, checked through whatever the one-shot signal is.
- [ ] `auditPage` passes on the Participant page. `pnpm test` and `pnpm verify` pass.
