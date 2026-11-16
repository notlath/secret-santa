# 10: Edit Event Details and the Event Details page

**What to build:** The Host can edit the Event Details (date, time, location, budget, description, instructions, notes) at any time before the Exchange is Completed, without affecting any Assignment. Anyone with a link can open a read-only Event Details page.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Exchange module `updateEventDetails`, Host only, with the same validation as creation; refused when `completed`
- [ ] Host dashboard has an edit form using the same ui-sdk fields as the create page
- [ ] `/e/<id>/event` shows the Event Details read-only to any valid Host or Personal Link holder; date and time exactly as entered, money via `Intl`
- [ ] Participant pages show the updated details on their next refresh
- [ ] Vitest: role checks, validation, refused when completed; Assignments unchanged after an edit (once 07 exists, add this case there if not already covered)
- [ ] Playwright: Host changes the location; a Participant sees the new location
