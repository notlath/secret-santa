import { describe, expect, it } from "vitest";
import { closeGap, cryptoRandom, draw, isDerangement, type Assignment } from "./draw";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

// Follows Giver -> Recipient from the first Giver and returns the circle's
// length, or -1 if the walk revisits someone before getting back to the start.
function circleLength(assignments: Assignment[]): number {
  const next = new Map(assignments.map((a) => [a.giverId, a.recipientId]));
  const start = assignments[0].giverId;
  const seen = new Set<string>();
  let current = start;
  do {
    if (seen.has(current)) return -1;
    seen.add(current);
    current = next.get(current)!;
  } while (current !== start);
  return seen.size;
}

describe("draw", () => {
  it("makes every Participant give once and receive once in a single circle", () => {
    const participants = ids(5);
    const assignments = draw(participants);

    expect(assignments).toHaveLength(5);
    expect(new Set(assignments.map((a) => a.giverId))).toEqual(new Set(participants));
    expect(new Set(assignments.map((a) => a.recipientId))).toEqual(new Set(participants));
    expect(circleLength(assignments)).toBe(5);
  });

  it("over thousands of seeded runs for 3–50 Participants, always forms one circle with no self or mutual pairs", () => {
    const random = seeded(42);
    for (let run = 0; run < 5000; run++) {
      const n = 3 + (run % 48);
      const participants = ids(n);
      const assignments = draw(participants, random);

      expect(assignments).toHaveLength(n);
      expect(new Set(assignments.map((a) => a.giverId)).size).toBe(n);
      expect(new Set(assignments.map((a) => a.recipientId))).toEqual(new Set(participants));
      expect(circleLength(assignments)).toBe(n);

      const recipientOf = new Map(assignments.map((a) => [a.giverId, a.recipientId]));
      for (const { giverId, recipientId } of assignments) {
        expect(recipientId).not.toBe(giverId);
        expect(recipientOf.get(recipientId)).not.toBe(giverId);
      }
    }
  });

  it("is driven by the injected random source", () => {
    const participants = ids(10);
    expect(draw(participants, seeded(7))).toEqual(draw(participants, seeded(7)));
    expect(draw(participants, seeded(7))).not.toEqual(draw(participants, seeded(8)));
  });

  it("does not change the caller's list of Participant ids", () => {
    const participants = ids(6);
    draw(participants, seeded(1));
    expect(participants).toEqual(ids(6));
  });
});

describe("isDerangement", () => {
  const participants = ["a", "b", "c"];
  const pair = (giverId: string, recipientId: string): Assignment => ({ giverId, recipientId });

  it("accepts a valid circle", () => {
    expect(isDerangement(participants, [pair("a", "b"), pair("b", "c"), pair("c", "a")])).toBe(true);
  });

  it("accepts every Draw result", () => {
    const random = seeded(3);
    for (let n = 3; n <= 50; n++) {
      expect(isDerangement(ids(n), draw(ids(n), random))).toBe(true);
    }
  });

  it.each([
    ["someone gives to themselves", [pair("a", "a"), pair("b", "c"), pair("c", "b")]],
    ["a Recipient repeats", [pair("a", "b"), pair("b", "a"), pair("c", "a")]],
    ["a Participant is missing as Giver", [pair("a", "b"), pair("b", "c")]],
    ["a Participant is missing as Recipient", [pair("a", "b"), pair("b", "a"), pair("c", "x")]],
    ["a Giver gives twice", [pair("a", "b"), pair("a", "c"), pair("b", "a"), pair("c", "a")]],
    ["a Giver is not a Participant", [pair("a", "b"), pair("b", "c"), pair("x", "a")]],
    ["there are no Assignments", []],
  ])("rejects the result when %s", (_, assignments) => {
    expect(isDerangement(participants, assignments)).toBe(false);
  });
});

describe("closeGap", () => {
  it("hands the removed Participant's Recipient to their Giver and changes nothing else", () => {
    const assignments: Assignment[] = [
      { giverId: "a", recipientId: "b" },
      { giverId: "b", recipientId: "c" },
      { giverId: "c", recipientId: "d" },
      { giverId: "d", recipientId: "a" },
    ];
    expect(closeGap(assignments, "b")).toEqual([
      { giverId: "a", recipientId: "c" },
      { giverId: "c", recipientId: "d" },
      { giverId: "d", recipientId: "a" },
    ]);
  });

  it("keeps a valid single circle down to 2 Participants, changing exactly one Giver's Recipient each time", () => {
    const random = seeded(99);
    for (let run = 0; run < 200; run++) {
      const n = 3 + (run % 48);
      let remaining = ids(n);
      let assignments = draw(remaining, random);

      while (remaining.length > 2) {
        const removed = remaining[random(remaining.length)];
        const before = new Map(assignments.map((a) => [a.giverId, a.recipientId]));
        assignments = closeGap(assignments, removed);
        remaining = remaining.filter((id) => id !== removed);

        expect(isDerangement(remaining, assignments)).toBe(true);
        expect(circleLength(assignments)).toBe(remaining.length);
        const changed = assignments.filter((a) => before.get(a.giverId) !== a.recipientId);
        expect(changed).toHaveLength(1);
        expect(before.get(changed[0].giverId)).toBe(removed);
      }
    }
  });

  it("refuses to leave a single Participant giving to themselves", () => {
    const assignments: Assignment[] = [
      { giverId: "a", recipientId: "b" },
      { giverId: "b", recipientId: "a" },
    ];
    expect(() => closeGap(assignments, "a")).toThrow(/at least 2/);
  });

  it("refuses to remove someone who has no Assignment", () => {
    const assignments = draw(["a", "b", "c"], seeded(5));
    expect(() => closeGap(assignments, "x")).toThrow(/no Assignment/);
  });
});

describe("cryptoRandom", () => {
  it("returns every integer in [0, max) and nothing outside it", () => {
    for (const max of [1, 2, 3, 7, 50]) {
      const seen = new Set<number>();
      for (let i = 0; i < 2000; i++) {
        const value = cryptoRandom(max);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(max);
        seen.add(value);
      }
      expect(seen.size).toBe(max);
    }
  });
});

// Deterministic RandomSource (mulberry32) so property-test failures are reproducible.
function seeded(seed: number) {
  let a = seed;
  return (maxExclusive: number) => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * maxExclusive);
  };
}
