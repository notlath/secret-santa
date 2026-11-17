# Spec: Festive pass

Status: ready-for-agent

Vocabulary follows `GLOSSARY.md`. Primary source: the throwaway branch `prototype/festive-motion` (never merge it). The route there is `/prototype/festive` (dev only). Its settled decisions are in `PROTOTYPE-VERDICT.md`; read it with `git show prototype/festive-motion:PROTOTYPE-VERDICT.md`. The prototype's drawings, keyframes and cat sequence are the reference for how things should look and move. Copy them into the real components; don't re-derive them.

## Problem Statement

The Gift Exchange works, but apart from the gift-box reveal it feels like a form. A group of friends running a Secret Santa expect it to feel like the holidays. Right now the landing page has no picture. Joining, becoming Ready and the Host's Draw pass without any sense of occasion. Before the Draw, the Participant page gives no hint that something is waiting to be opened. The reveal, the one moment with motion, is a plain 250ms lid lift. The app needs warmth and a few moments of delight, without slowing down the controls people use again and again, and without breaking reduced-motion, keyboard or contrast rules.

## Solution

A festive layer kept to the rare moments:

- **Gentle snowfall** on the landing page, the Participant page and the reveal. Anyone can pause it, and the choice is remembered on this device.
- **A hand-drawn gift box.** One layered SVG illustration, reused on the landing page, on a gift-box card on the Participant page, and on the reveal.
- **A tuxedo cat that guards the box.** Hover over the box (or tap it on a phone) and the box starts to open. The cat peeks out from behind it, reaches over, shuts the lid with its paw, says "No peeking!" and sinks back. The cat appears on the landing page, and on the Participant page until the Draw.
- **Celebration moments:**
  - The reveal squashes the box, pops the lid, fires confetti, then shows the Recipient's name and wishes one after another.
  - A successful Draw fires confetti and swaps the Exchange Status badge.
  - Becoming Ready pops the Ready badge and shows "You're all set".
  - Arriving after joining raises the heading into view.
  - The landing page raises the illustration and headline once on load.

Everything else (buttons, fields, dialogs, the Host dashboard) stays crisp with CSS feedback only. Under reduced motion there is no snow, no cat, no confetti and no entrance motion. Activating something with the keyboard never animates. In every case the content still appears straight away.

## User Stories

### Ambient snowfall

1. As a visitor to the landing page, I want gentle snow falling behind the content, so that the app feels festive the moment I arrive.
2. As a Participant, I want the same snowfall on my Participant page and on my reveal, so that the occasion carries through my own pages.
3. As a Host, I want no snowfall on the Host dashboard, forms or error pages, so that the screens where I do work stay calm and readable.
4. As anyone, I want the snow to fall behind the content and never catch my taps or clicks, so that every control works exactly as before.
5. As anyone, I want the flakes in muted gold and warm grey, so that they show up against the cream background without hurting text contrast.
6. As anyone, I want a "Pause snow" button fixed at the bottom of the screen, so that I can stop the movement when it distracts me.
7. As anyone, I want the button to read "Let it snow" while the snow is paused, so that I can turn it back on.
8. As anyone, I want my pause choice remembered on this device across reloads and pages, so that I don't have to pause it again.
9. As a phone user, I want the pause button to be at least 44px tall and to stay clear of other controls, so that I can tap it easily without hitting something else.
10. As a reduced-motion user, I want no snowfall and no pause button at all, so that nothing moves and nothing irrelevant is shown.
11. As a keyboard or screen-reader user, I want the pause button named, focusable and operable, with a visible focus ring, so that I can control it like any other control.

### The gift box illustration

12. As anyone, I want a gift box drawn with real depth (shaded side, wrapping-paper stars, ribbon, bow with knot and tails, gift tag, ground shadow), so that it looks crafted rather than like a placeholder icon.
13. As anyone, I want the same gift box on the landing page, the Participant page and the reveal, so that the app tells one visual story.
14. As a phone user, I want the gift box to keep its shape when it sits beside text, so that it never looks squashed or lopsided.
15. As a screen-reader user, I want the decorative box hidden from assistive technology wherever it is only decoration, so that it doesn't add noise.

### The cat guard

16. As a visitor to the landing page, I want a cat behind the gift box that shuts the lid when I hover over it, so that the page has a playful surprise.
17. As a phone user, I want tapping the box to play the same cat sequence, so that I get the surprise without a mouse.
18. As anyone, I want the cat to move slowly and deliberately, like a real cat peeking, so that it feels charming rather than frantic. The sequence:
    - the lid lifts and tilts;
    - the cat rises until its face clears the lid;
    - it tilts its head;
    - it reaches its paw over the box and presses the lid shut;
    - a "No peeking!" bubble appears;
    - the paw withdraws and the cat sinks back.
19. As anyone, I want the cat and its paw drawn behind the box, so that the lid covers them at every angle and there's no hard clipping edge.
20. As anyone, I want the cat to play every time I hover or tap, after a short cooldown, so that I can show it to a friend again.
21. As anyone, I want the cat to settle quickly when I move my pointer away early, and to be ready to play again, so that it never gets stuck half-way.
22. As a Participant before the Draw (Exchange Status Open or Closed), I want the cat guarding the box on my Participant page, so that I can see my gift is waiting and still sealed.
23. As a Participant after the Draw, I want the box shown without the cat, so that it's clear the box can now be opened.
24. As a reduced-motion user, I want no cat at all, so that nothing moves unexpectedly.
25. As a keyboard or screen-reader user, I want the cat hidden from assistive technology and not focusable, so that the decoration doesn't get in my way.

### The Participant's gift-box card

26. As a Participant, I want one gift-box card in a fixed position near the top of my Participant page, so that I always know where to find my Assignment.
27. As a Participant before the Draw, I want the card to say "Your gift box opens after the Draw.", so that I know what I'm waiting for.
28. As a Participant after the Draw, I want the card to keep the existing "Your Recipient is waiting" copy and the "Reveal my Recipient" button, so that the way to my reveal is unchanged.
29. As a Participant, I want the card's box to stay a picture that doesn't open in place, so that opening only ever happens on my reveal and the secret isn't spoiled on the Participant page.
30. As a Participant whose page live-refreshes when the Draw happens, I want the card to switch to its after-Draw state without an animation, so that the change is plain and doesn't feel glitchy.

### The landing page

31. As a visitor, I want the gift box illustration and the headline to rise gently into view once when the page loads, so that the first impression feels welcoming.
32. As a visitor, I want the main call-to-action to lift slightly when I hover over it, so that it feels inviting to press.
33. As a returning visitor, I want my list of remembered Exchanges to work exactly as before, so that the festive layer doesn't get in my way.

### Joining

34. As a Participant who has just joined, I want the heading on my Participant page to rise into view on my first arrival, so that joining feels like an event.
35. As a returning Participant, I want no entrance motion on later visits, so that the page feels quick when I come back to edit my Wishlist.

### Becoming Ready

36. As a Participant who has just completed my Wishlist, I want the Ready badge to pop and a "You're all set" message to appear, so that I know I've finished my part.
37. As a Participant who becomes Ready by using the keyboard, I want the badge and message to appear without animation, so that the keyboard rule is respected.

### The Draw

38. As a Host whose Draw has just succeeded, I want confetti and the Exchange Status badge to change with a scale-and-fade, so that the big moment feels like a celebration.
39. As a Host who runs the Draw with the keyboard, or with reduced motion on, I want no confetti, but the new Exchange Status shown straight away, so that I still know the Draw worked.
40. As a Host, I want the dashboard to have no snow and no other decoration, so that managing Participants stays focused.

### The reveal

41. As a Participant opening my reveal, I want the box to squash, its lid to pop off, and confetti to burst from both sides, so that finding my Recipient feels special.
42. As a Participant, I want my Recipient's name and then each of their three wishes to appear one after another, so that the reveal unfolds in order.
43. As a Participant who opens the reveal with the keyboard, I want the name and wishes shown straight away without confetti or motion, and focus moved to the heading as it does today, so that I can read on without waiting.
44. As a reduced-motion user, I want the reveal to show its content straight away with no squash, lid motion or confetti, so that nothing moves.
45. As a Participant reopening my reveal later, I want it to behave exactly as it does today, so that my Assignment reads the same.

### Accessibility and quality across the board

46. As anyone, I want every festive page to pass the existing contrast and focus audit, so that the decoration never costs readability.
47. As a phone user, I want festive layers to cause no horizontal scrolling and no layout shift, so that pages stay steady.
48. As anyone, I want the controls I use repeatedly (buttons, fields, dialogs) to keep their current quick CSS feedback, so that the app still feels fast.
49. As anyone, I want no sound, so that opening the app in public is never embarrassing.
50. As anyone, I want no animated page-to-page transitions, so that moving around the app stays instant.

## Implementation Decisions

### Rule change in the MVP spec

- Replace the rule in the Gift Exchange MVP spec's "Stack and boundaries" section, "Motion is used only for the gift-box reveal; everything else uses CSS transitions, and all motion respects `prefers-reduced-motion`", with: "Motion is used for the named festive moments only (landing entrance, join arrival, becoming Ready, the Host's Draw succeeded, the reveal, and the cat guard). Everything else uses CSS transitions. Reduced motion and the no-animation-on-keyboard-activation rule apply everywhere." This is a spec change, not an ADR.

### Tuning: preset C (Jolly)

The prototype tried three intensity presets. Preset C won, and its values become fixed constants rather than configuration:

| Setting | Value |
| --- | --- |
| Flakes | 42 |
| Flake size | 4–10px |
| Fall time | 7–12s each |
| Confetti | two side bursts of 80 particles, spread 70, start velocity 55 |
| Reveal lid pop | 300ms |
| Reveal stagger | 80ms between items |
| Squash before the lid pops | yes |
| Hover wobble | ±8°, fine pointers only |

The easing is the project's existing ease-out curve.

### Modules

- **Snowfall (new, client).** A decorative layer that is fixed in place, sits behind content, has `pointer-events: none` and is `aria-hidden`.
  - It is rendered by the landing page, the Participant page and the reveal page only.
  - Flake positions come from a seeded random sequence, so the server and client render the same flakes. The prototype's seeded PRNG is the reference.
  - The animation is a CSS keyframe loop. Flakes are gold at 50% opacity and the `--line-strong` warm grey at 35%. No blur and no glow.
  - The pause choice is stored in `localStorage` under one key (the prototype used `festive-snow-paused`). Pausing stops the animation in place through a data attribute.
  - Every read and write of `localStorage` is wrapped in try/catch. If storage is unavailable, the snow plays and the toggle still works for the current page.
- **Snow toggle (new, client).** A ui-sdk Button fixed at bottom-end. Its visible label is "Pause snow" or "Let it snow", and it shows its state with `aria-pressed`. The hit target is at least 44px.
  - It is placed so it never covers page controls at phone width.
  - It isn't rendered under `prefers-reduced-motion: reduce`. The snowfall isn't rendered then either; checking the media query in CSS is enough to hide both.
- **Gift box illustration (new, shared).** A layered SVG with two parts:
  - a body: shaded right face, wrapping-paper stars, ribbon, ground shadow;
  - a separately addressable lid: under-lid shadow, bow with knot and tails, tag on a string. The lid transforms from its bottom-centre (`transform-box: fill-box`).
  - It exposes slots behind and in front of the drawing, so the cat can sit behind it and the speech bubble in front.
  - It never shrinks inside a flex row.
  - Any SVG ids (clip paths) come from a sanitised `useId()`, so several boxes can share a page.
  - It is one component, reused by the landing page, the Participant card and the reveal. The existing span-based box in the reveal is replaced by it, keeping the reveal's `data-gift-lid` hook so the existing motion test still finds the lid.
- **Cat guard (new, client).** It wraps the gift box. The tuxedo cat SVG and the paw go in the behind slot and the "No peeking!" bubble goes in the front slot. The whole guard is `aria-hidden`, not focusable, `touch-manipulation` and `select-none`.
  - It plays on `pointerenter` for mouse and pen, and on `pointerup` for touch.
  - It runs as a phase sequence with Motion's `useAnimate`. A busy flag blocks overlapping plays, and a run id lets a newer run or a leave cancel an older one. The cancel works by checking the id between steps, never by awaiting an interrupted animation: a Motion promise that gets interrupted never resolves, so awaiting it leaves the cat stuck.
  - Leaving early (mouse or pen) bumps the run id, settles every part back to rest within 150ms, and then starts the cooldown.
  - It isn't rendered under reduced motion. The plain gift box shows instead.
  - The sequence below comes from the prototype (cat-guard on `prototype/festive-motion`). It is trimmed to the decision-rich values; y values are px offsets inside the stage, and the easing is the project's ease-out unless noted.

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

- **Confetti (new, client helper).** A `celebrate()` helper around `canvas-confetti`, pinned exactly at `1.9.3`, with `@types/canvas-confetti` pinned exactly at `1.9.0`.
  - It fires two side bursts in cranberry, pine, gold and cream-deep, with `disableForReducedMotion: true`.
  - Callers invoke it only when the activation came from a pointer (`event.detail !== 0`).
  - It is imported by the reveal and the Draw only.
- **Reveal (modified).**
  - The pointer-activated sequence becomes: box squash, lid pops (300ms), confetti, then the name and the three wishes stagger in 80ms apart.
  - Keyboard and reduced-motion opens show everything straight away, with no confetti.
  - Focus still moves to the heading on open.
  - The existing `pointerActivation` check is kept as the single source of the keyboard rule.
- **Participant page (modified).**
  - It gains one gift-box card in a fixed position near the top:
    - while the Exchange Status is Open or Closed, the card shows the cat guard and "Your gift box opens after the Draw.";
    - after the Draw (Assigned or Completed), it shows the plain box, the existing "Your Recipient is waiting" copy and the "Reveal my Recipient" link.
  - The card replaces the existing after-Draw "Your Recipient is waiting" card, so there is still only one place to reach the reveal.
  - When LiveRefresh swaps the state, nothing animates.
  - The heading rises only on the first arrival after joining. That arrival is already distinguishable because joining redirects to the Participant page; mark it in a way the page can read once, such as a one-shot query flag or a short-lived cookie the join action already sets. Choose the simplest option that needs no new storage.
- **Ready (modified).** When the Participant's own edit makes them Ready, the Ready badge plays a CSS pop and a "You're all set" message appears. A keyboard-triggered save or reduced motion shows both without motion. A Participant who is already Ready when the page loads sees no pop.
- **Draw (modified, Host dashboard).** When a pointer-activated Draw succeeds, confetti fires and the Exchange Status badge changes with a CSS scale-and-fade. Keyboard activation and reduced motion skip the confetti and the motion. The dashboard gets no snowfall.
- **Landing page (modified).**
  - It gains the cat-guarded gift box as hero art (`data-hero-art`).
  - The art and the headline rise once on load, using the existing `rise` keyframes or `data-entrance` stagger in global CSS.
  - The solid call-to-action lifts 2px on hover, for fine pointers only.
  - It renders the snowfall and the snow toggle.
- **Global CSS (modified).**
  - It gains the snowfall keyframes and paused state, `badge-in` (scale-and-fade), `pop`, the reveal step stagger driven by a `--stagger` custom property, and the CTA hover lift.
  - Every one of these is turned off under `prefers-reduced-motion: reduce`.
  - The hover effects use `@media (hover: hover) and (pointer: fine)`.
  - These are copied from the prototype's stylesheet, without the prototype-only parts.

### Constraints

- The server/client boundary: a server component must never import a constant from a `"use client"` module, because it arrives as a client reference rather than data. Keep shared constants in plain modules.
- ui-sdk Button `onClick` handlers take `MouseEvent<HTMLElement>`. Use `event.currentTarget`, not refs, to reach the element.
- Read the ui-sdk docs in the package before UI changes, and follow the `emil-design-eng` motion standards for every moment:
  - UI feedback under 300ms (the cat and the snowfall are the deliberate exceptions);
  - ease-out curves;
  - press scale 0.97;
  - never animate from `scale(0)`.
- No new routes. The prototype route and the prototype switcher are not brought over.

## Testing Decisions

- Tests check behaviour, not looks. They assert what a person can perceive or do: whether something is present, whether it moved at all, whether a click lands, and whether a choice survives a reload. They never assert durations, easing, flake counts or pixel positions. Timing was judged by eye in the prototype, and the prototype stays as the reference for it.
- **One seam: the existing Playwright browser suite, at the phone and desktop sizes it already runs.** No new seam and no unit tests. These are presentational changes, and the Exchange module's behaviour doesn't change. New specs reuse the existing fixtures and helpers:
  - **Snow pause persists:** on the landing page, pausing the snow and reloading still shows it paused, with the toggle reading "Let it snow". The same choice is in effect on the Participant page.
  - **Reduced motion:** with `reducedMotion: "reduce"`, the landing page, Participant page and reveal render no snowfall layer, no snow toggle and no cat.
  - **Snow never blocks clicks:** with snow playing, the landing page's primary call-to-action and a Participant page control can be clicked normally. Playwright's actionability check fails if the snowfall layer intercepts the pointer.
  - **Keyboard skips celebration but shows content:**
    - opening the reveal and running the Draw from the keyboard creates no confetti canvas, and the Recipient's name and wishes (or the new Exchange Status) are visible straight away;
    - a pointer activation does create the confetti canvas.
    - `openAndExpectMotion` in `e2e/fixtures.ts` already covers pointer, reduced-motion-pointer and keyboard for the reveal. Extend that pattern (or add a sibling helper alongside it) for confetti on the reveal and the Draw, rather than inventing a new mechanism.
  - **Participant card:** before the Draw, the card shows "Your gift box opens after the Draw." and has no reveal link. After the Draw, it shows "Your Recipient is waiting" and the "Reveal my Recipient" link, and still only one link leads to the reveal.
  - **Accessibility:** `auditPage` (contrast and focus) passes on the landing page, the Participant page before and after the Draw, and the reveal, with snow playing. The cat and the snowfall are absent from the accessibility tree.
  - **Existing suites stay green**, especially `draw.spec.ts`, `keyboard-journey.spec.ts`, `full-journey.spec.ts` and `hydration.spec.ts`. The seeded snowfall must not cause hydration warnings.
- Prior art:
  - `openAndExpectMotion` and its three opening modes in `e2e/fixtures.ts`;
  - `auditPage` in `e2e/a11y.ts`;
  - the hydration check in `hydration.spec.ts`;
  - the multi-context Draw flows in `draw.spec.ts` and `full-journey.spec.ts`.
- Verification follows `docs/agents/development.md`: run `pnpm test` first, then `pnpm verify` in the background.

## Out of Scope

- Animated page-to-page transitions.
- Sound of any kind.
- Snowfall or decoration on the Host dashboard, the create and join forms, or error and invalid-link pages.
- Motion on repeated controls beyond the CSS feedback they already have.
- Opening the gift box anywhere except the reveal.
- A cat after the Draw, or a cat anywhere except the landing page and the Participant card.
- Animating the Participant card's switch from before-Draw to after-Draw when LiveRefresh updates it.
- Configurable intensity presets: preset C is fixed.
- The post-MVP issue `.scratch/post-mvp/issues/01-remove-hint.md`, which stays a separate ticket.
- Merging or reusing the `prototype/festive-motion` branch or its `/prototype/festive` route and switcher.

## Further Notes

- Prototype pitfalls to avoid repeating:
  - **Squashed box:** the gift box squashed in a side-by-side flex row until it was made `shrink-0`.
  - **Cat in front of the lid:** the cat was drawn in front of the open lid until it moved to the behind slot.
  - **Stuck cat:** the cat got stuck after an early leave until the cancel became a run-id check.
  - **500 error:** importing presets from a client module into a server page caused an HTTP 500.
- Cream flakes are invisible on the cream background; that is why the flakes are gold and warm grey.
- Chrome DevTools MCP has no Chrome binary on this machine. For a visual check, run Playwright's Chromium from a temporary script inside the repo, so that it resolves `@playwright/test`, and delete the script afterwards.
- `canvas-confetti` is a new runtime dependency. Pin it exactly, as the repo does with `@ui-sdk/react`.
