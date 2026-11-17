# 01: Shared gift box drawn in the reveal

**What to build:** The reveal shows the new hand-drawn gift box instead of the span-based box. It is a layered SVG: a body with a shaded right face, gold wrapping-paper stars, ribbon and a ground shadow, plus a separate lid with an under-lid shadow, a bow with knot and tails, and a gift tag on a string. The box keeps its shape inside flex rows. The reveal opens exactly as it does today; this ticket only changes how the box is drawn. It is the prefactor that the landing page, the Participant card and the reveal celebration all reuse.

Reference: the gift box in `prototype/festive-motion` (see `.scratch/festive-pass/spec.md`, "Gift box illustration").

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] One shared gift box component, reused unchanged by later tickets. Its lid is addressable on its own and transforms from its bottom centre. It has a slot behind the drawing and a slot in front of it.
- [ ] The box never shrinks in a flex row.
- [ ] SVG ids come from a sanitised `useId()`, so two boxes can appear on one page.
- [ ] The reveal uses the new box and keeps the `data-gift-lid` hook. The existing pointer lid lift, keyboard behaviour and reduced-motion behaviour are unchanged.
- [ ] Wherever the box is purely decorative, it is hidden from assistive technology.
- [ ] The existing reveal tests, including `openAndExpectMotion` in all three modes, `auditPage` and the hydration test, pass. `pnpm test` and `pnpm verify` pass.
