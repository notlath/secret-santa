# 02: Reveal celebration

**What to build:** When a Participant opens their reveal with a pointer, the box squashes, the lid pops off (300ms), and confetti bursts from both sides in cranberry, pine, gold and cream-deep. Then the Recipient's name and their three wishes appear one after another, 80ms apart. Opening with the keyboard, or with reduced motion on, shows the name and wishes straight away with no motion and no confetti. Focus still moves to the heading as it does today. This ticket also changes the MVP spec's motion rule to the festive wording.

Reference: the RevealDemo and `celebrate()` in `prototype/festive-motion`, with preset C values (see `.scratch/festive-pass/spec.md`).

**Blocked by:** 01

**Status:** resolved

- [ ] `canvas-confetti` is added pinned exactly at `1.9.3`, and `@types/canvas-confetti` pinned exactly at `1.9.0`.
- [ ] A shared `celebrate()` helper fires two side bursts (80 particles each, spread 70, start velocity 55) with `disableForReducedMotion: true`. It is reusable by the Draw (ticket 06).
- [ ] A pointer open plays squash, lid pop, confetti, then the staggered name and wishes.
- [ ] A keyboard open and a reduced-motion open show the content straight away with no confetti canvas.
- [ ] The MVP spec's "Motion is used only for the gift-box reveal" rule is replaced with the wording in `.scratch/festive-pass/spec.md` ("Rule change in the MVP spec").
- [ ] Playwright: a pointer open creates the confetti canvas and a keyboard open does not. Both show the Recipient's name and wishes. Extend the `openAndExpectMotion` pattern rather than adding a new mechanism.
- [ ] `auditPage` passes on the reveal. `pnpm test` and `pnpm verify` pass.
