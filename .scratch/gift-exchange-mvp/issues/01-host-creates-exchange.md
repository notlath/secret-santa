# 01: Host creates an Exchange and lands on the dashboard

**What to build:** A Host opens the app, fills in the Exchange name, maximum Participants and Event Details (date, time, location, optional budget and currency, description, instructions, notes), and creates the Exchange. They get an Access Code and a Host Link, must save the Host Link before continuing, and land on a Host dashboard showing the Exchange and its Access Code. This ticket also sets up the project skeleton every later ticket builds on. See the spec's "Stack and boundaries", "Credential layer", "Access Code generator" and "Data model" sections.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] Next.js App Router project with pnpm, Tailwind (cranberry/pine/cream/gold tokens meeting WCAG AA, display + body fonts through next/font), `@ui-sdk/react` pinned exactly at 0.1.0-beta.3 with `@layer ui-sdk;` above the Tailwind import
- [ ] Neon Postgres through Drizzle, accessed only from server code, with migrations; Vitest runs against a real, disposable Postgres
- [ ] Playwright set up with phone and desktop projects
- [ ] `exchange` table per the spec's data model, with status starting `open`
- [ ] Access Code: 8 characters with no look-alikes (no 0, O, 1, I, L), unique, shown as `XXXX-XXXX`, with retry on collision
- [ ] Host Link token of at least 128 bits; only its SHA-256 hash is stored
- [ ] Exchange module `createExchange` validates every field on the server (name 1–60, location 1–120, max Participants 3–50, budget positive with at most 2 decimals and a currency required when an amount is set, text fields up to 1,000) and returns typed errors
- [ ] Create page built from ui-sdk Field, Input, Textarea, Number Input, Date Input, Time Input and Select; currency defaults from the browser locale
- [ ] After creating, a screen shows the Access Code and the Host Link with copy and share buttons and an explicit "I've saved it" step before continuing
- [ ] `/h/<token>` sets an httpOnly, Secure, SameSite=Lax cookie for that Exchange and redirects to the clean Host dashboard URL
- [ ] Host dashboard shows the name, Event Details (date and time exactly as entered, money formatted with `Intl`), the Access Code and a "copy join link" (`/join/<code>`)
- [ ] The Host dashboard refuses requests without a valid Host cookie
- [ ] Vitest: create validation and Host credential checks through the Exchange module
- [ ] Playwright: create an Exchange, save the link, reach the dashboard, at phone and desktop sizes
