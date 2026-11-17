# 05: Waiting room with live updates

**What to build:** The Participant page becomes a waiting room: Participant names, the count, Ready badges and the Exchange Status in plain words. The waiting room and the Host dashboard update on their own while open, so people see others join and get Ready without reloading.

**Blocked by:** 03

**Status:** resolved

- [ ] Participant view shows display names, count, Ready badges and a plain-words Status ("Waiting for everyone to join", "Registration closed", etc.)
- [ ] No Wishlist contents of other Participants appear anywhere in the view
- [ ] Participant page and Host dashboard poll their view about every 10 seconds while the tab is visible, and refresh when the tab becomes visible again
- [ ] Polling stops while the tab is hidden
- [ ] Playwright: a second Participant joining appears on the first Participant's page and the Host dashboard without a reload
