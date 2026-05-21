/**
 * Storage schema for BE2GROW weight versions.
 *
 * v0-hypothesis = the matrix from the EQ Latam PPTX (slides 55-74) — flat weights.
 * v1+ = calibrated weights produced by the regression job in
 *       src/app/api/cron/vital-signs-calibrate/route.ts. Promotion requires
 *       founder approval via /api/research/calibration/promote.
 *
 * Stored as JSON on the BackgroundTask model (no new table needed for v0).
 */

import type { PulsePointCode, SeiKey, BrainTalentKey } from "@/lib/vital-signs/catalog";

export interface PulsePointWeights {
  competencies: Partial<Record<SeiKey, number>>;
  talents: Partial<Record<BrainTalentKey, number>>;
  signalsWeight: number;
}

export interface BeyondWeightsVersion {
  version: string; // "v0-hypothesis" | "v1-202602" | ...
  createdAt: string;
  createdById: string | null;
  approvedAt: string | null;
  approvedById: string | null;
  active: boolean;
  weights: Record<PulsePointCode, PulsePointWeights>;
  notes: string | null;
}
