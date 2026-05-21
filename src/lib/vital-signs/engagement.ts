/**
 * Engagement Index 0-100 + Cohesion bands per Six Seconds spec.
 *
 * Engagement Index = composite of 5 driver means, normalized:
 *   driver_mean = 70  → index 0
 *   driver_mean = 100 → index 50
 *   driver_mean = 130 → index 100
 *
 * World class threshold (per Gallup mapping in debrief PDFs): Index ≥ 80
 * Normative distribution: 25% engaged / 50% neutral / 25% disengaged.
 *
 * Cohesion bands from SD (norm SD = 15):
 *   < 12 → high consensus
 *   12-15 → consistent
 *   15-18 → mid
 *   > 18 → low consensus (subgroups disagree)
 */

export function engagementIndexFromDriverMean(mean: number): number {
  return Math.round(Math.max(0, Math.min(100, ((mean - 70) / 60) * 100)));
}

export function cohesionBand(sd: number | null): "high" | "consistent" | "mid" | "low" | "unknown" {
  if (sd === null) return "unknown";
  if (sd < 12) return "high";
  if (sd < 15) return "consistent";
  if (sd <= 18) return "mid";
  return "low";
}

export function strengthBand(mean: number): "bottom_quartile" | "mid" | "top_quartile" {
  if (mean < 90) return "bottom_quartile";
  if (mean >= 110) return "top_quartile";
  return "mid";
}

export function engagementCategory(index: number): "engaged" | "neutral" | "disengaged" {
  if (index >= 70) return "engaged";
  if (index >= 40) return "neutral";
  return "disengaged";
}

/**
 * Rolling aggregation of microsignals into a derived pulse-point score.
 * Uses the last `days` of signals; weight = 1 / age_in_days (linear decay).
 */
export function rollingPulseScore(
  signals: Array<{ value: number; createdAt: Date }>,
  windowDays: number = 30,
  now: Date = new Date(),
): { score: number | null; count: number } {
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
  const valid = signals.filter((s) => s.createdAt.getTime() >= cutoff);
  if (valid.length === 0) return { score: null, count: 0 };

  let weightSum = 0;
  let weightedTotal = 0;
  for (const s of valid) {
    const ageDays = Math.max(0.5, (now.getTime() - s.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    const weight = 1 / ageDays;
    weightSum += weight;
    weightedTotal += weight * s.value;
  }
  return { score: weightedTotal / weightSum, count: valid.length };
}
