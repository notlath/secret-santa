# 03: Snowfall and pause toggle

**What to build:** Gentle snow falls behind the content on the landing page, the Participant page and the reveal. The flakes are gold at 50% opacity and warm grey (`--line-strong`) at 35%, with no blur or glow. Preset C values: 42 flakes, 4–10px, each falling for 7–12s. A "Pause snow" button is fixed at the bottom of the screen; it reads "Let it snow" while the snow is paused. The choice is remembered on this device across reloads and pages. Under reduced motion there is no snow and no button. Snow never appears on the Host dashboard, the forms or the error pages.

Reference: Snowfall and the snow toggle in `prototype/festive-motion` (see `.scratch/festive-pass/spec.md`, "Snowfall" and "Snow toggle").

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The snowfall layer is fixed in place behind the content, has `pointer-events: none`, is `aria-hidden`, and is a CSS keyframe loop. Flake positions come from a seeded random sequence, so there are no hydration mismatches.
- [ ] The toggle is a ui-sdk Button with a visible label, `aria-pressed`, a target at least 44px tall and a visible focus ring. At phone width it never covers page controls.
- [ ] The pause choice is stored in `localStorage`, with every read and write wrapped in try/catch. When storage is unavailable, the snow plays and the toggle still works on the current page.
- [ ] Under `prefers-reduced-motion: reduce`, neither the snow nor the toggle is shown.
- [ ] Playwright: the pause choice survives a reload on the landing page and is in effect on the Participant page.
- [ ] Playwright: with reduced motion, there is no snowfall and no toggle on the landing page, the Participant page or the reveal.
- [ ] Playwright: with snow playing, the landing page's call-to-action and a Participant page control click normally.
- [ ] `auditPage` passes on all three pages with snow playing, and the hydration test passes. `pnpm test` and `pnpm verify` pass.
