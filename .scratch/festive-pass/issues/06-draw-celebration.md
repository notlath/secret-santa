# 06: Draw celebration on the Host dashboard

**What to build:** When the Host's Draw succeeds after being started with a pointer, confetti fires and the Exchange Status badge changes with a CSS scale-and-fade. If the Draw is started from the keyboard, or with reduced motion on, there is no confetti and no motion, but the new Exchange Status shows straight away. The dashboard otherwise stays as it is, with no snowfall.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] A pointer-activated Draw that succeeds calls the shared `celebrate()` helper from ticket 02.
- [ ] The Exchange Status badge animates in with a `badge-in` scale-and-fade that never starts from `scale(0)` and is turned off under reduced motion.
- [ ] A keyboard-activated Draw shows the new Status with no confetti canvas.
- [ ] A failed Draw shows no celebration.
- [ ] Playwright: a pointer Draw creates the confetti canvas and a keyboard Draw does not. Both show the new Exchange Status.
- [ ] `draw.spec.ts`, `keyboard-journey.spec.ts` and `full-journey.spec.ts` pass. `pnpm test` and `pnpm verify` pass.
