# 02: Participant joins with an Access Code

**What to build:** A friend enters an Access Code (or opens a join link), sees the Exchange's name and Event Details, picks a display name and joins. They get a Personal Link with a prompt to save it, and land on their Participant page showing the Event Details. The Host dashboard now lists Participants. Opening the Personal Link on any device signs them in there.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `participant` table per the spec's data model (normalised display name unique per Exchange, personal token hash unique)
- [ ] `/join` accepts the code in any case, with or without the dash; `/join/<code>` fills it in
- [ ] Unknown code shows a clear "no Exchange with that code" message
- [ ] Preview shows the Exchange name and Event Details before joining
- [ ] Display name 1–30 characters after trimming; a clash ignoring case and repeated whitespace shows "name taken"
- [ ] Joining is refused with a clear message when the Exchange is not `open` or is full; the count check and insert run in one transaction so simultaneous joins can't exceed the maximum
- [ ] After joining, the Personal Link is shown with a copy button and a save prompt
- [ ] `/p/<token>` sets an httpOnly cookie for that Exchange and redirects to `/e/<id>`, so the token leaves the address bar
- [ ] Participant page shows the Event Details and a "copy my personal link" action
- [ ] Host dashboard lists Participants by display name
- [ ] Vitest: join rules (unknown code, full, not open, name clash, concurrent joins at the limit) and that a Personal Link can't perform host operations
- [ ] Playwright: join from a separate browser context; opening the Personal Link in a fresh context signs that Participant in
