/**
 * Tests for the Emotional Budgeting crosses.
 *
 * Locks the two methods:
 *  - relative_z (SEI↔LVS): standardize within the subject, compare ranks.
 *    The absolute scale must NOT drive the result (the June 2026 lesson).
 *  - absolute (SEI↔TVS / TVS↔OVS / time): compare raw points on 70-130.
 */

import {
  crossRelative,
  crossAbsolute,
  crossTime,
  type PulsePointPair,
} from "@/lib/vital-signs/budget-cross";

describe("crossRelative (SEI ↔ LVS) — relative, not absolute", () => {
  it("flags a blind spot where perception ranks far above capacity", () => {
    // capacity low for CONNECTION, but the person rates themselves high there.
    const pairs: PulsePointPair[] = [
      { code: "TEAMWORK_CONNECTION", capacity: 95, perception: 5 },
      { code: "EXECUTION_ACCOUNTABILITY", capacity: 124, perception: 5 },
      { code: "MOTIVATION_MEANING", capacity: 118, perception: 4 },
      { code: "CHANGE_IMAGINATION", capacity: 97, perception: 5 },
    ];
    const res = crossRelative(pairs);
    expect(res.method).toBe("relative_z");
    // CONNECTION + IMAGINATION: low capacity, high self-rating → blind spots
    expect(res.blindSpots).toContain("TEAMWORK_CONNECTION");
    expect(res.blindSpots).toContain("CHANGE_IMAGINATION");
    // ACCOUNTABILITY/MEANING: high capacity → not blind spots
    expect(res.blindSpots).not.toContain("EXECUTION_ACCOUNTABILITY");
  });

  it("flags a hidden strength where capacity ranks far above perception", () => {
    const pairs: PulsePointPair[] = [
      { code: "MOTIVATION_MEANING", capacity: 125, perception: 3 }, // high cap, low self-rating
      { code: "TEAMWORK_CONNECTION", capacity: 95, perception: 5 },
      { code: "EXECUTION_FOCUS", capacity: 100, perception: 4 },
      { code: "CHANGE_CELEBRATION", capacity: 100, perception: 4 },
    ];
    const res = crossRelative(pairs);
    expect(res.hiddenStrengths).toContain("MOTIVATION_MEANING");
  });

  it("is invariant to the absolute level of self-ratings (generous vs strict)", () => {
    // Same RELATIVE shape, shifted up by 1 point everywhere.
    const base: PulsePointPair[] = [
      { code: "TEAMWORK_CONNECTION", capacity: 95, perception: 4 },
      { code: "EXECUTION_ACCOUNTABILITY", capacity: 124, perception: 3 },
      { code: "MOTIVATION_MEANING", capacity: 118, perception: 3 },
      { code: "CHANGE_IMAGINATION", capacity: 97, perception: 4 },
    ];
    const generous = base.map((p) => ({
      ...p,
      perception: (p.perception as number) + 1,
    }));
    const a = crossRelative(base).blindSpots;
    const b = crossRelative(generous).blindSpots;
    expect(b).toEqual(a); // shifting all self-ratings equally changes nothing
  });

  it("returns null cells when too few points to standardize", () => {
    const res = crossRelative([{ code: "TRUST_CARE", capacity: 100, perception: 4 }]);
    expect(res.pulsePoints[0].cell).toBeNull();
  });
});

describe("crossAbsolute (SEI ↔ TVS) — raw points", () => {
  it("flags blind spot when team climate exceeds capacity by > threshold", () => {
    const pairs: PulsePointPair[] = [
      { code: "TEAMWORK_CONNECTION", capacity: 94, perception: 117 }, // +23
      { code: "TRUST_COHERENCE", capacity: 110, perception: 111 }, // +1 aligned
      { code: "MOTIVATION_MEANING", capacity: 104, perception: 81 }, // -23 hidden
    ];
    const res = crossAbsolute(pairs, "SEI_TVS", 8);
    expect(res.method).toBe("absolute");
    expect(res.blindSpots).toContain("TEAMWORK_CONNECTION");
    expect(res.hiddenStrengths).toContain("MOTIVATION_MEANING");
    const coherence = res.pulsePoints.find((p) => p.code === "TRUST_COHERENCE");
    expect(coherence?.cell).toBe("aligned");
  });

  it("leaves gap null when a side is missing", () => {
    const res = crossAbsolute(
      [{ code: "TRUST_CARE", capacity: null, perception: 110 }],
      "SEI_TVS",
    );
    expect(res.pulsePoints[0].gap).toBeNull();
    expect(res.pulsePoints[0].cell).toBeNull();
  });
});

describe("crossTime — earlier vs later", () => {
  it("positive gap means improvement", () => {
    const earlier = [
      { code: "TEAMWORK_DIVERGENCE" as const, score: 95.6 },
      { code: "CHANGE_CELEBRATION" as const, score: 107.6 },
    ];
    const later = [
      { code: "TEAMWORK_DIVERGENCE" as const, score: 103.8 }, // +8.2 improved
      { code: "CHANGE_CELEBRATION" as const, score: 102.5 }, // -5.1 declined
    ];
    const res = crossTime(earlier, later, 3);
    expect(res.kind).toBe("TIME");
    expect(res.blindSpots).toContain("TEAMWORK_DIVERGENCE"); // "improved" bucket
    expect(res.hiddenStrengths).toContain("CHANGE_CELEBRATION"); // "declined" bucket
  });
});
