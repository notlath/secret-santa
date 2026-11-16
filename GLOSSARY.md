# Gift Exchange

A web app where friends run a Secret Santa: a Host sets up an Exchange, friends join with an Access Code, and a single Draw secretly decides who gives a gift to whom.

## Exchange

**Exchange**:
One Secret Santa run by one Host, with its own Access Code, Participants, Event Details and Draw.
_Avoid_: Group, event, gift exchange event

**Event Details**:
The date, time, place, budget and notes for the in-person meetup where gifts are handed over. Part of an Exchange.
_Avoid_: Event (on its own), exchange settings

**Access Code**:
The shareable code that lets someone join an Exchange as a Participant.
_Avoid_: Group code, invite code, join code

**Exchange Status**:
Where an Exchange is in its lifecycle: Open (anyone with the Access Code can join), Closed (no new Participants), Assigned (the Draw has happened) or Completed (the meetup is over).
_Avoid_: Phase, stage

## People

**Host**:
The person who controls an Exchange's settings and lifecycle. A role, separate from being a Participant; a Host may also be a Participant.
_Avoid_: Admin, organizer, owner

**Participant**:
A person who has joined an Exchange and will give one gift and receive one gift.
_Avoid_: Member, user, player

**Ready**:
A Participant whose Wishlist has all three item names filled in.
_Avoid_: Complete, done, registered

**Personal Link**:
A secret link that identifies one Participant. Whoever holds it is that Participant.
_Avoid_: Session link, login link, magic link

**Host Link**:
A secret link that grants the Host role for one Exchange.
_Avoid_: Admin link, dashboard link

## Wishlists and the Draw

**Wishlist**:
The three Wishlist Items a Participant would like to receive.
_Avoid_: Wish list, gift list, preferences

**Wishlist Item**:
One requested gift: a name, plus an optional description and product link.
_Avoid_: Wish, gift idea

**Draw**:
The single Host action that creates every Assignment in an Exchange at once.
_Avoid_: Shuffle, matching, assignment process, raffle

**Assignment**:
One pairing in an Exchange: a Giver who will buy a gift for a Recipient.
_Avoid_: Match, pair, pick

**Giver**:
The Participant in an Assignment who buys the gift.
_Avoid_: Santa, sender

**Recipient**:
The Participant in an Assignment who receives the gift.
_Avoid_: Giftee, target, match
