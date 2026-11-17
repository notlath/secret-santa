# 04: Landing hero with the cat guard

**What to build:** The landing page gains the gift box as hero art, guarded by a tuxedo cat. Hovering over the box with a mouse or pen, or tapping it on a phone, plays a slow sequence of about 4.5s: the lid lifts, the cat peeks up from behind the box, tilts its head, reaches over and presses the lid shut with its paw, a "No peeking!" bubble appears, and the cat sinks back. It plays on every hover or tap, with a 400ms cooldown between plays. Moving the pointer away early settles everything within 150ms, and the cat can play again afterwards. The art and the headline rise once on load. The main call-to-action lifts 2px on hover (fine pointers only). Under reduced motion there is no cat (the plain box shows) and no entrance motion.

Reference: `cat-guard` and the Landing scene in `prototype/festive-motion`. The phase sequence below comes from the prototype; y values are px offsets inside the stage, and the easing is the project's ease-out unless noted:

```
rest:  catY = 70 (hidden), pawY = 24 (hidden), lid y 0 / rotate 0, bubble hidden
1. lid  y -8, rotate -6deg            250ms
2. wait                               200ms
3. cat  y 70 -> 8 (face clears lid)   900ms
4. cat  rotate 0 -> -7deg -> 0        600ms   (head tilt)
5. paw  y 24 -> -14 (over the lid)    350ms
6. paw  y 0  +  lid y 0, rotate 0     300ms   ease-in-out (together)
7. bubble opacity/scale in            200ms, hold 600ms
8. bubble out + paw y -> 24           300ms   (together), wait 200ms
9. cat  y -> 70                       800ms   ease-in-out
then 400ms cooldown before the next play
early leave: bump runId, settle all parts in 150ms, then cooldown
```

**Blocked by:** 01

**Status:** resolved

- [ ] A reusable cat guard component wraps the shared gift box. The cat and paw sit in the slot behind the box, so the lid hides them at every angle with no clipping line. The bubble sits in the slot in front.
- [ ] The cat is a detailed tuxedo SVG (silhouette, shaded side, cream bib, muzzle and paws, gold almond eyes with slit pupils, whiskers, curled tail, cranberry collar with a gold bell). The paw is a short rounded foreleg with two toe lines.
- [ ] The cat plays on `pointerenter` for mouse and pen and on `pointerup` for touch. A busy flag blocks overlapping plays. Runs are cancelled by checking a run id between steps, never by awaiting an interrupted Motion animation (an interrupted Motion promise never resolves).
- [ ] The guard is `aria-hidden`, not focusable, and uses `touch-manipulation` and `select-none`. It isn't rendered under reduced motion.
- [ ] The landing page's hero art and headline rise once on load. The call-to-action hover lift applies only under `(hover: hover) and (pointer: fine)`. Both are turned off under reduced motion.
- [ ] Playwright: with reduced motion, the landing page has no cat. The cat is absent from the accessibility tree. `auditPage` passes on the landing page.
- [ ] Manual check: hovering plays the sequence, and an early leave settles and can replay. Compare by eye with the prototype.
- [ ] `pnpm test` and `pnpm verify` pass.
