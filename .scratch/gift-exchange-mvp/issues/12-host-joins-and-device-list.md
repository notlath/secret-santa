# 12: Host joins too, role switcher, and "Your exchanges on this device"

**What to build:** Right after creating, the Host is offered "Join as a Participant too" and gets their own Personal Link, separate from the Host Link. On a device holding both, a switcher moves between the Host dashboard and their Participant page. The landing page lists every Exchange remembered on this device.

**Blocked by:** 02

**Status:** resolved

- [ ] After saving the Host Link, the Host is offered to join as a Participant through the normal join rules, and gets a separate Personal Link with its own save prompt
- [ ] On a device with both cookies for an Exchange, a switcher shows "Host dashboard" and "My exchange"
- [ ] The landing page lists "Your exchanges on this device", built by a server call from the cookies that returns only names and roles of Exchanges with a valid token
- [ ] Invalid or stale cookies are left out of the list
- [ ] Vitest: the device-list call returns only valid entries and no Exchange data beyond name and role
- [ ] Playwright: Host creates and joins, switches between roles; the landing page lists the Exchange
