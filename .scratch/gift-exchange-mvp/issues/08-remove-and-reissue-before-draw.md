# 08: Host removes Participants and re-issues links (before the Draw)

**What to build:** Before the Draw, the Host can remove a Participant (a duplicate, or someone who can't come) and can re-issue a lost Personal Link, which stops the old one working. Anyone opening a link that no longer works sees a plain explanation instead of an error page.

**Blocked by:** 03

**Status:** resolved

- [ ] Host can remove a Participant in `open` or `closed` after a confirmation; their Wishlist goes with them and their link stops working
- [ ] Host can re-issue a Participant's Personal Link; the new link is shown for the Host to copy; the old token's hash is replaced so it stops working
- [ ] An invalid, re-issued or removed link (and a stale cookie) shows "This link no longer works. Ask your Host for a new one."
- [ ] Only the Host can remove or re-issue; Participants are refused
- [ ] Vitest: removal and re-issue by role and status; old tokens rejected afterwards
- [ ] Playwright: Host re-issues a link; the old link in another context shows the explanation; the new link signs the Participant in
