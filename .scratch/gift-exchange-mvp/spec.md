# Spec: Gift Exchange MVP

Status: ready-for-agent

Vocabulary follows `GLOSSARY.md`. Decisions recorded in `docs/adr/0001` (secret links instead of accounts), `0002` (Neon with server-only data access) and `0003` (the Draw is a single circle).

## Problem Statement

Friends who run a Secret Santa end up with a paper draw that someone has to supervise, or a group chat where the secrecy leaks, wishlists get lost, and nobody remembers the date, place or budget. The existing apps make everyone create an account before they can join, which is too much for a casual group of friends. The Host has no simple way to see who has joined, who still needs to fill in a wishlist, or when everyone is ready, and Participants have no reliable place to see what their Recipient actually wants.

## Solution

A mobile-first web app with no accounts. A Host creates an Exchange with its Event Details and gets an Access Code and a Host Link. Friends join with the code (or a join link), pick a display name and fill in a three-item Wishlist. Each Participant gets a Personal Link that brings them back from any device. The Host watches the waiting room fill up, closes registration and runs the Draw. Each Participant then opens a gift-box reveal showing only their own Recipient, that person's Wishlist, and the Event Details. Nobody, including the Host, can see the full set of Assignments. All data lives in a shared Postgres database that only the server reads and writes.

## User Stories

### Creating an Exchange

1. As a Host, I want to create an Exchange by giving it a name, so that my friends recognise which Secret Santa they're joining.
2. As a Host, I want to set the event date, time and location when I create the Exchange, so that everyone knows when and where gifts are handed over.
3. As a Host, I want to set an optional gift budget as an amount and a currency, so that everyone spends a similar amount.
4. As a Host, I want the currency to default from my browser's locale, so that I usually don't have to change it.
5. As a Host, I want to add an optional description, instructions and notes, so that I can share things like "no gift cards" or a dress code.
6. As a Host, I want to set the maximum number of Participants (3 to 50), so that the Exchange matches the size of my group.
7. As a Host, I want the app to generate an Access Code for me, so that I don't have to invent one and it can't be guessed.
8. As a Host, I want the Access Code shown as two groups of four characters (like `K7QM-3XRP`) with no look-alike characters, so that friends can read it aloud and type it without mistakes.
9. As a Host, I want a one-tap "copy join link" (`/join/<code>`), so that I can paste it into the group chat and friends skip typing the code.
10. As a Host, I want to be made to save my Host Link before I continue, with copy and share buttons and an explicit confirmation, so that I can't lose control of the Exchange by clearing my browser.
11. As a Host, I want to be offered "Join as a Participant too" right after creating, so that I can give and receive a gift like everyone else.
12. As a Host who also joins, I want my Host Link and my Personal Link kept separate, so that my host powers and my own Assignment don't get mixed up.

### Joining

13. As a Participant, I want to enter an Access Code in any case and with or without the dash, so that small typing differences don't stop me.
14. As a Participant, I want a join link to fill in the code for me, so that joining from the group chat takes one tap.
15. As a Participant, I want a clear message when the code doesn't exist, so that I know to check it with the Host.
16. As a Participant, I want to see the Exchange name and Event Details before I join, so that I know I'm joining the right one.
17. As a Participant, I want to join with only a display name, so that I can fill in my Wishlist later.
18. As a Participant, I want a clear message when my display name is already taken (ignoring case and extra spaces), so that I can pick another.
19. As a Participant, I want a clear message when the Exchange is full, so that I know to talk to the Host.
20. As a Participant, I want a clear message when registration is closed, so that I understand why I can't join.
21. As a Participant, I want my Personal Link shown right after I join, with a copy button and a "save this link" prompt, so that I can come back from another device.

### Coming back

22. As a Participant, I want this device to remember me, so that I don't need my link every time.
23. As a Participant, I want opening my Personal Link on any device to sign me in there, so that I can switch from my laptop to my phone.
24. As a Participant, I want the secret part of my link removed from the address bar once it has signed me in, so that it doesn't end up in screenshots or browser history.
25. As a Participant, I want a "copy my personal link" action on my page, so that I can save it later if I skipped that step.
26. As a person in several Exchanges, I want the landing page to list the Exchanges remembered on this device, so that I can jump straight into each one.
27. As a Participant who lost my link, I want the Host to be able to give me a new one, so that I'm not locked out.
28. As a Host, I want to re-issue a Participant's Personal Link, which stops the old one working, so that I can help a friend who lost theirs.
29. As a Host, I want opening my Host Link on any device to open the dashboard there, so that I can manage the Exchange from my phone.
30. As a Host who is also a Participant, I want a switcher between "Host dashboard" and "My exchange" on a device that holds both links, so that I can move between my two roles in one tap.
31. As a person whose link is no longer valid (re-issued, removed or deleted), I want a plain explanation instead of an error page, so that I know what happened and who to ask.

### Wishlist

32. As a Participant, I want to fill in three Wishlist Items, each with a name, an optional description and an optional product link, so that my Giver knows what I'd like.
33. As a Participant, I want to save a Wishlist that isn't finished yet, so that I can come back and finish it later.
34. As a Participant, I want to see clearly whether I'm Ready, so that I know whether I'm holding up the Draw.
35. As a Participant, I want to edit my Wishlist and display name while the Exchange is Open or Closed, so that I can fix mistakes before the Draw.
36. As a Participant, I want to be told when my Wishlist is locked after the Draw, so that I understand why I can't edit it.
37. As a Participant, I want a product link rejected unless it's a normal web address (http or https), so that I don't accidentally share something broken.
38. As a Participant, I want to keep my Wishlist private before the Draw, so that only my Giver ever sees it.

### Waiting room

39. As a Participant, I want to see the Event Details on my page, so that I always know when and where the exchange happens.
40. As a Participant, I want to see who has joined, how many there are, and who is Ready, so that I know how close we are to the Draw.
41. As a Participant, I want the waiting room to update on its own while I have it open, so that I see the Draw happen without reloading.
42. As a Participant, I want to see the current Exchange Status in plain words, so that I know what's next.

### Host dashboard

43. As a Host, I want to see every Participant with their Ready status, so that I know who to nudge.
44. As a Host, I want a "N of M ready" meter, so that I can see progress at a glance.
45. As a Host, I want the dashboard to update on its own, so that I see people join while I'm watching.
46. As a Host, I want to edit the Event Details until the Exchange is Completed, so that a change of venue doesn't break anything.
47. As a Host, I want editing Event Details to never change any Assignment, so that I can fix a typo after the Draw.
48. As a Host, I want to remove a Participant before the Draw, so that a duplicate or someone who can't come doesn't block everyone.
49. As a Host, I want to close registration, so that no new people join while I get ready for the Draw.
50. As a Host, I want to reopen registration, so that a late friend can still join before the Draw.
51. As a Host, I want the Start Draw button to stay disabled with the reason shown until the Exchange is Closed, has at least 3 Participants and everyone is Ready, so that I know exactly what's missing.
52. As a Host, I want Start Draw to ask me to confirm with the number of Participants, so that I don't start it by accident.
53. As a Host, I want the Draw to happen at most once even if I double-click or have two tabs open, so that nobody's Recipient changes behind their back.
54. As a Host, I want to see that the Draw succeeded, so that I can tell everyone to open the app.
55. As a Host, I want to see how many Participants have opened their reveal and who hasn't, so that I can nudge them.
56. As a Host who is also a Participant, I want the dashboard to never show me the Assignments, so that my own surprise isn't spoiled.
57. As a Host, I want to remove a Participant who drops out after the Draw, with their Giver taking over their Recipient, so that the Exchange still works without a full redraw.
58. As a Host, I want a warning before a removal after the Draw leaves only two Participants, so that I know both will then know who has them.
59. As a Host, I want to mark the Exchange Completed after the meetup, so that it becomes a read-only keepsake.
60. As a Host, I want to delete the Exchange after confirming, so that my friends' names and wishlists don't stay stored forever.
61. As a Participant, I want my host-only actions hidden and refused by the server, so that nobody can take over the Exchange by guessing an address.

### The reveal

62. As a Participant, I want to open a gift box to reveal my Recipient, so that finding out feels like a small moment.
63. As a Participant, I want the reveal to show the same Recipient every time I open it or reload, so that I can trust the result.
64. As a Participant, I want to see my Recipient's three Wishlist Items with descriptions and product links, so that I can choose a gift.
65. As a Participant, I want product links to open in a new tab and show their domain, so that I know where I'm going.
66. As a Participant, I want the budget and Event Details shown alongside my Recipient, so that I have everything in one place.
67. As a Participant whose Recipient changed because someone dropped out, I want to go through the reveal again with a note explaining why, so that I don't buy a gift for the wrong person.
68. As a Participant who prefers reduced motion, I want the reveal to appear without the box animation, so that it doesn't make me uncomfortable.
69. As a Participant, I want to be sure nobody else can see my Assignment, so that the secret holds.
70. As a Participant, I want to see my Recipient even after the Exchange is Completed, so that I can look back at it.

### Everywhere

71. As anyone, I want every page to work well on a phone, so that I can use it straight from the group chat.
72. As a keyboard or screen-reader user, I want every control named, reachable and operable, so that I can take part.
73. As anyone, I want clear loading, success and error feedback on every action, so that I know whether it worked.
74. As anyone, I want dates and money formatted for my locale, so that they read naturally.
75. As anyone, I want the event date and time shown exactly as the Host entered them, so that everyone sees the same meetup time.

## Implementation Decisions

### Stack and boundaries

- Next.js App Router deployed on Vercel. Neon Postgres accessed only from server code, through Drizzle (ADR-0002). The browser never talks to the database, and no database credential reaches the client.
- pnpm as the package manager. Node runtime, not Edge, for anything that touches the database.
- UI: Tailwind CSS with `@ui-sdk/react` pinned exactly at `0.1.0-beta.3` for every control, dialog, toast and meter, styled through `data-slot` and state attributes. `@layer ui-sdk;` is declared above the Tailwind import. ui-sdk's "agent-ready" step (createAgent, WebMCP) is skipped. Motion is used for the named festive moments only (landing entrance, join arrival, becoming Ready, the Host's Draw succeeded, the reveal, and the cat guard). Everything else uses CSS transitions. Reduced motion and the no-animation-on-keyboard-activation rule apply everywhere.
- Visual direction: warm and festive without clutter. Cranberry, pine, cream and a gold accent, all meeting WCAG AA contrast; one display face for headings and a plain sans-serif for body text, through `next/font`. No generic dashboard look, heavy gradients or glow. UI work follows the `emil-design-eng` skill's standards for polish, motion and review.
- English-only interface. Dates and money are formatted with `Intl` using the viewer's locale.

### Modules

- **Exchange module** (the deep module and main test seam). A server-only interface that owns every rule: Status transitions, permissions, validation, privacy filtering and the Draw transaction. Every operation takes the caller's credential (a raw Personal Link or Host Link token, or none for anonymous operations) plus input, and returns either a result or a typed domain error. Operations:
  - `createExchange(details)` returns the Exchange, its Access Code and the raw Host Link token.
  - `lookupByAccessCode(code)` returns the public preview (name, Event Details, Status, whether it's full).
  - `join(code, displayName)` returns the new Participant and the raw Personal Link token.
  - `updateParticipant(token, { displayName?, wishlist? })`.
  - `updateEventDetails(hostToken, details)`.
  - `closeRegistration(hostToken)`, `reopenRegistration(hostToken)`.
  - `draw(hostToken)`.
  - `removeParticipant(hostToken, participantId)` covers both removal before the Draw and closing a gap after it.
  - `reissuePersonalLink(hostToken, participantId)` returns the new raw token.
  - `markRevealed(token)`.
  - `markCompleted(hostToken)`, `deleteExchange(hostToken)`.
  - `hostView(hostToken)`, `participantView(token)`, `revealView(token)`.
  Views are filtered by role in this module; it is the only place Assignment data is read.
- **Draw function** (pure). Takes the list of Participant ids and a random source, and returns Assignments forming one circle: a Fisher–Yates shuffle, then each Participant gives to the next (ADR-0003). Also exposes the derangement check (every Participant gives exactly once, receives exactly once, never to themselves) and the close-the-gap step (when a Participant is removed, their Giver takes over their Recipient). Production uses `crypto.getRandomValues`.
- **Credential layer.** Generates link tokens (at least 128 bits of randomness, URL-safe), stores only their SHA-256 hash, and turns a cookie into a token for the Exchange module. `/p/<token>` and `/h/<token>` check the token, set an httpOnly, Secure, SameSite=Lax cookie scoped to that Exchange, and redirect to the clean `/e/<exchangeId>` (or its host view). One cookie per Exchange per role. The landing page's "Your exchanges on this device" list is built from these cookies through a server call that returns only the names and roles of Exchanges with a valid token.
- **Access Code generator.** 8 characters from an alphabet without 0, O, 1, I and L (31 symbols, about 8.5×10¹¹ codes), displayed as `XXXX-XXXX`. Input is normalised (uppercased, dash and whitespace removed). Uniqueness is enforced by the database, with retry on collision. No rate limiting in the MVP.
- **Next.js layer.** Server actions and route handlers are thin: read the cookie, call the Exchange module, map domain errors to user messages. The waiting room and host dashboard poll a view endpoint about every 10 seconds while the tab is visible, and again when the tab becomes visible.

### Status machine

- Statuses: `open`, `closed`, `assigned`, `completed`.
- Transitions: open → closed, closed → open, closed → assigned (only through the Draw), assigned → completed. Every other transition is rejected.
- The Draw requires status `closed`, at least 3 Participants, and every Participant Ready. It runs in one transaction that changes the status from `closed` to `assigned` with a conditional update, so a second concurrent request matches no row and fails with "already drawn". Assignments are inserted in the same transaction after the derangement check passes. Any failure rolls back everything.
- Joining is allowed only when `open` and the Participant count is under the maximum. The count check and the insert happen in one transaction so two simultaneous joins can't exceed the maximum.
- Wishlist and display name edits are allowed in `open` and `closed` only.
- Event Details edits are allowed in every status except `completed`.
- Removing a Participant is allowed in `open`, `closed` and `assigned`. In `assigned` it closes the gap in one transaction: the removed Participant's Giver gets the removed Participant's Recipient, the Giver's revealed mark is cleared and a "Recipient changed" flag is set on them, and both of the removed Participant's Assignments are deleted. A removal that would leave 2 Participants is allowed after the Host confirms a warning. In `completed`, nothing changes.
- `completed` makes everything read-only except deletion. Reveals stay visible.
- Deleting an Exchange is allowed in every status and cascades to all its data, so every link to it stops working.

### Data model

- **exchange**: id, name, access code (unique), status, maximum Participants (3–50), event date (local date, no time zone), event time (local time, no time zone), location, description, instructions, notes, budget amount (optional, decimal), budget currency (ISO 4217 code, required when an amount is set), host token hash (unique), created and updated timestamps.
- **participant**: id, exchange id, display name, normalised display name (trimmed, inner whitespace collapsed, lowercased; unique per Exchange), personal token hash (unique), revealed at (nullable), recipient changed (boolean), recipient changed because (nullable text: the removed Participant's display name, kept so the reveal note survives their deletion), created timestamp.
- **wishlist_item**: participant id, position (1–3; unique per Participant), name, description (optional), product link (optional).
- **assignment**: exchange id, giver id (unique per Exchange), recipient id (unique per Exchange), with a check that giver and recipient differ.
- **Readiness** is derived (three items with non-empty names), not stored.
- All foreign keys cascade on delete. Database column names use snake_case.

### Validation

- Exchange name 1–60 characters. Location 1–120. Description, instructions and notes up to 1,000 each.
- Display name 1–30 characters after trimming; unique ignoring case and repeated whitespace.
- Wishlist Item name 1–80 characters. Description up to 300. Product link must parse as an `http` or `https` URL of at most 2,000 characters. Product links render with `target="_blank" rel="noopener noreferrer nofollow"` and show the link's domain.
- Budget amount positive with at most 2 decimal places.
- All validation runs on the server, in the Exchange module. The client repeats it only for instant feedback.

### Errors

- The Exchange module returns typed domain errors: not found, invalid credential, forbidden (wrong role), invalid transition, Exchange full, display name taken, not everyone Ready, too few Participants, already drawn, validation (per field). The Next.js layer maps each to a plain, friendly message, never a stack trace.
- An invalid or revoked link shows an explanation page ("This link no longer works. Ask your Host for a new one.") instead of an error page.

### Pages

- **Landing** (`/`): Create, Join, and "Your exchanges on this device".
- **Create** (`/new`): the Exchange and Event Details form, then the screen that shows the Access Code and requires saving the Host Link, with the offer to join as a Participant.
- **Join** (`/join`, `/join/<code>`): enter the code, see the preview, then pick a display name. Afterwards the Personal Link is shown with a save prompt.
- **Participant page** (`/e/<id>`): Wishlist editor, waiting room (Event Details, Participant names, Ready badges, Status), and after the Draw, the entry into the reveal.
- **Reveal** (`/e/<id>/reveal`): the gift box, then the Recipient, their Wishlist, the budget and the Event Details.
- **Host dashboard** (`/e/<id>/host`): Participants with Ready status and reveal status, the meter, Event Details editing, close or reopen, Start Draw, remove, re-issue link, mark completed, delete.
- **Event Details** (`/e/<id>/event`): read-only Event Details for any credential holder.
- **Link landing** (`/p/<token>`, `/h/<token>`): sets the cookie and redirects, or shows the "link no longer works" explanation.

## Testing Decisions

- Good tests check behaviour through a public interface and never reach into internals: what an operation returns, and what each role's view contains afterwards. No mocks of the database or our own modules. Tests don't repeat the logic they check (for example, they don't recompute a Draw to compare against).
- **Exchange module (main seam), Vitest against real Postgres** (a disposable Neon branch or a local Postgres, never production), each test creating its own Exchange:
  - Every allowed status transition succeeds, and every disallowed one fails with an invalid-transition error.
  - The Draw's preconditions (status, at least 3 Participants, everyone Ready) each block it on their own.
  - Two concurrent Draws: exactly one succeeds, and the other gets "already drawn".
  - Two concurrent joins at maximum minus one: exactly one succeeds.
  - Display name uniqueness ignores case and whitespace.
  - Wishlist edits are refused after the Draw.
  - Each operation is refused for the wrong role and for a re-issued or removed Participant's old token.
  - Privacy: a Participant's view never contains another Participant's Wishlist before the Draw, the reveal contains only the caller's own Recipient, and no view (including the Host's) ever contains the full set of Assignments.
  - Assignments don't change across repeated reveals, Event Details edits or re-issued links.
  - Removal after the Draw changes exactly one Giver's Recipient, clears their revealed mark and leaves a valid circle.
  - Deleting an Exchange makes every link to it stop working.
- **Draw function, Vitest, pure.** Over thousands of runs and group sizes from 3 to 50, check that each result is one circle, every Participant gives exactly once and receives exactly once, nobody gets themselves, and no two Participants give to each other when there are 3 or more. Close-the-gap results stay valid circles down to 2 Participants. The derangement check rejects malformed inputs: self-assignment, a repeated Recipient, a missing Giver.
- **Browser, Playwright, at phone and desktop sizes:**
  - Host creates an Exchange, saves the Host Link, and joins as a Participant.
  - Three Participants join from separate browser contexts (standing in for separate devices) and fill in their Wishlists.
  - Host closes registration and runs the Draw.
  - Each Participant opens their reveal and sees a Recipient who isn't themselves.
  - Reloading shows the same Recipient.
  - A Personal Link opened in a fresh context signs that Participant in.
  - A re-issued link's old version stops working.
  - Host-only addresses refuse a Participant's cookie.
  - ui-sdk's keyboard, focus and ARIA checks on the forms, dialogs and toasts, and a keyboard-only pass through the whole flow.
- Prior art: none. This is a new repository, so these tests set the pattern.

## Out of Scope

- Accounts, sign-in, email invitations, notifications and any email sending.
- QR-code invitations, calendar integration, countdown timers.
- Gift budget validation, wishlist product previews, gift purchase tracking.
- Exclusions (for example, couples not drawing each other).
- Recurring groups or several Exchanges tied to one person across devices (beyond the per-device list from cookies).
- Recovering a lost Host Link.
- Rate limiting on Access Code lookups.
- Automatic deletion of old Exchanges.
- A full redraw after the Draw, a Host view of all Assignments, and Participants leaving an Exchange on their own.
- Translations.
- ui-sdk's agent-ready step (createAgent, WebMCP).

## Further Notes

- The repo's `CLAUDE.md` still contains four notes copied from another project (opencode: `packages/client`, Changesets, the `dev` branch, Schema→Core dependency rules). They don't apply here and should be ignored or removed.
- `@ui-sdk/react` is a beta release; pin it exactly, read the docs shipped in the package, and expect possible API changes when upgrading.
- The Host can see any Participant's Assignment by re-issuing their link and opening it. ADR-0001 accepts this trade-off for a group of friends.
- Neon free projects scale to zero; the first request after a quiet period has a cold start of roughly half a second.
