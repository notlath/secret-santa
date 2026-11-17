export type Assignment = { giverId: string; recipientId: string };

export type RandomSource = (maxExclusive: number) => number;

// One circle, not a general derangement (ADR-0003).
export function draw(participantIds: string[], random: RandomSource = cryptoRandom): Assignment[] {
  const order = [...participantIds];
  for (let i = order.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.map((giverId, i) => ({ giverId, recipientId: order[(i + 1) % order.length] }));
}

export function isDerangement(participantIds: string[], assignments: Assignment[]): boolean {
  const participants = new Set(participantIds);
  const givers = new Set(assignments.map((a) => a.giverId));
  const recipients = new Set(assignments.map((a) => a.recipientId));
  return (
    participants.size > 0 &&
    assignments.length === participants.size &&
    givers.size === participants.size &&
    recipients.size === participants.size &&
    assignments.every(
      (a) => a.giverId !== a.recipientId && participants.has(a.giverId) && participants.has(a.recipientId),
    )
  );
}

export function closeGap(assignments: Assignment[], removedId: string): Assignment[] {
  const removedGives = assignments.find((a) => a.giverId === removedId);
  if (!removedGives) throw new Error(`Participant ${removedId} has no Assignment`);
  if (assignments.length <= 2) throw new Error("A Draw needs at least 2 Participants after a removal");
  return assignments
    .filter((a) => a.giverId !== removedId)
    .map((a) => (a.recipientId === removedId ? { ...a, recipientId: removedGives.recipientId } : a));
}

// Rejection sampling avoids modulo bias.
export const cryptoRandom: RandomSource = (maxExclusive) => {
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % maxExclusive;
};
