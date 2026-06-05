/**
 * Emotional Budgeting — the four crosses.
 *
 * SEI measures CAPACITY (what a person CAN do). VS measures PERCEPTION (climate
 * or self-leadership). The GAP between them is the insight. This module turns
 * pairs of pulse-point sets into the gap, classified per pulse point.
 *
 * Four crosses (see docs/EMOTIONAL_BUDGETING.md):
 *   1. SEI ↔ TVS  — capacity vs team-climate (cohort; absolute bands)
 *   2. SEI ↔ LVS  — capacity vs self-leadership (per person; RELATIVE z-score)
 *   3. TVS ↔ OVS  — team vs organization (cohort; absolute bands)
 *   4. time       — same instrument across two points in time
 *
 * Methodological note (the June 2026 lesson): the LVS is a generous 1-5
 * self-assessment; SEI is normed 70-130. They are NOT comparable on the
 * absolute scale. The SEI↔LVS cross therefore standardizes each side WITHIN
 * the person (z-score) and compares relative positions — not raw points.
 */

import type { PulsePointCode, DriverCode } from "./catalog";

export type CrossCell = "blind_spot" | "aligned" | "hidden_strength";

export interface PulsePointPair {
  code: PulsePointCode;
  driver?: DriverCode;
  /** Capacity side (SEI-inferred), original scale. */
  capacity: number | null;
  /** Perception side (measured VS), original scale. */
  perception: number | null;
}

export interface CrossedPulsePoint {
  code: PulsePointCode;
  driver?: DriverCode;
  capacity: number | null;
  perception: number | null;
  /** Signed relative gap (perception − capacity), in the cross's working unit. */
  gap: number | null;
  cell: CrossCell | null;
}

export interface CrossResult {
  kind: "SEI_TVS" | "SEI_LVS" | "TVS_OVS" | "TIME";
  method: "absolute" | "relative_z";
  pulsePoints: CrossedPulsePoint[];
  /** Pulse points where perception most exceeds capacity (top blind spots). */
  blindSpots: PulsePointCode[];
  /** Pulse points where capacity most exceeds perception (hidden strengths). */
  hiddenStrengths: PulsePointCode[];
}

function zScores(values: Array<number | null>): Array<number | null> {
  const xs = values.filter((v): v is number => typeof v === "number");
  if (xs.length < 2) return values.map(() => null);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((s, v) => s + (v - mean) ** 2, 0) / xs.length;
  const sd = Math.sqrt(variance) || 1;
  return values.map((v) => (typeof v === "number" ? (v - mean) / sd : null));
}

/**
 * Relative cross (SEI ↔ LVS): standardize both sides within the subject and
 * compare relative positions. A blind spot is where the subject ranks
 * themselves much higher than their capacity ranks; a hidden strength is the
 * reverse. Threshold expressed in z units.
 */
export function crossRelative(
  pairs: PulsePointPair[],
  kind: CrossResult["kind"] = "SEI_LVS",
  zThreshold = 0.6,
): CrossResult {
  const zCap = zScores(pairs.map((p) => p.capacity));
  const zPer = zScores(pairs.map((p) => p.perception));

  const pulsePoints: CrossedPulsePoint[] = pairs.map((p, i) => {
    const gap = zPer[i] !== null && zCap[i] !== null ? zPer[i]! - zCap[i]! : null;
    let cell: CrossCell | null = null;
    if (gap !== null) {
      if (gap > zThreshold) cell = "blind_spot";
      else if (gap < -zThreshold) cell = "hidden_strength";
      else cell = "aligned";
    }
    return { code: p.code, driver: p.driver, capacity: p.capacity, perception: p.perception, gap, cell };
  });

  return finalize("relative_z", kind, pulsePoints);
}

/**
 * Absolute cross (SEI ↔ TVS, TVS ↔ OVS, time): both sides share a comparable
 * 70-130 scale, so compare raw points. Threshold expressed in points.
 */
export function crossAbsolute(
  pairs: PulsePointPair[],
  kind: CrossResult["kind"] = "SEI_TVS",
  pointThreshold = 8,
): CrossResult {
  const pulsePoints: CrossedPulsePoint[] = pairs.map((p) => {
    const gap =
      typeof p.perception === "number" && typeof p.capacity === "number"
        ? p.perception - p.capacity
        : null;
    let cell: CrossCell | null = null;
    if (gap !== null) {
      if (gap > pointThreshold) cell = "blind_spot";
      else if (gap < -pointThreshold) cell = "hidden_strength";
      else cell = "aligned";
    }
    return { code: p.code, driver: p.driver, capacity: p.capacity, perception: p.perception, gap, cell };
  });

  return finalize("absolute", kind, pulsePoints);
}

function finalize(
  method: CrossResult["method"],
  kind: CrossResult["kind"],
  pulsePoints: CrossedPulsePoint[],
): CrossResult {
  const withGap = pulsePoints.filter((p) => p.gap !== null) as Array<
    CrossedPulsePoint & { gap: number }
  >;
  const blindSpots = [...withGap]
    .filter((p) => p.cell === "blind_spot")
    .sort((a, b) => b.gap - a.gap)
    .map((p) => p.code);
  const hiddenStrengths = [...withGap]
    .filter((p) => p.cell === "hidden_strength")
    .sort((a, b) => a.gap - b.gap)
    .map((p) => p.code);

  return { kind, method, pulsePoints, blindSpots, hiddenStrengths };
}

/**
 * Time cross: two cohort snapshots of the SAME instrument. "capacity" carries
 * the earlier value, "perception" the later — so a positive gap = improvement.
 * cell semantics here are improved / stable / declined (reusing the union).
 */
export function crossTime(
  earlier: Array<{ code: PulsePointCode; driver?: DriverCode; score: number | null }>,
  later: Array<{ code: PulsePointCode; driver?: DriverCode; score: number | null }>,
  pointThreshold = 3,
): CrossResult {
  const laterByCode = new Map(later.map((l) => [l.code, l]));
  const pairs: PulsePointPair[] = earlier.map((e) => ({
    code: e.code,
    driver: e.driver,
    capacity: e.score, // earlier
    perception: laterByCode.get(e.code)?.score ?? null, // later
  }));
  return crossAbsolute(pairs, "TIME", pointThreshold);
}
