/**
 * SEI competency → outcome correlations (the empirical prior for the engine).
 *
 * The SEI 5.0 manual publishes the bivariate and partial correlations between
 * each competency and the Overall Outcome composite (N=279,069, ch.10.3-10.4).
 * EIM/EO/PNG are the strong predictors; ACT/EEL/RP weaker. These are the
 * numbers the BE2GROW engine should weight by instead of treating competencies
 * equally.
 *
 * Like the VS pulse map, the live values are read from an env var
 * (SEI_OUTCOME_CORRELATIONS, JSON or base64) so the calibrated/licensed numbers
 * never need to live in git. When the env is absent we fall back to the
 * published manual values below (these ARE public in the manual, so the
 * fallback is safe to ship — the env override exists for future re-calibration
 * and per-language refinement).
 */

export type SeiKey = "EL" | "RP" | "ACT" | "NE" | "IM" | "OP" | "EMP" | "NG";

export interface SeiOutcomeWeight {
  bivariate: number; // r with Overall Outcome
  partial: number; // unique r controlling for the other seven
}

/** Published SEI 5.0 manual values (ch.10.3-10.4, N=279,069). */
export const SEI_OUTCOME_CORRELATIONS_V5: Record<SeiKey, SeiOutcomeWeight> = {
  IM: { bivariate: 0.656, partial: 0.22 }, // Engage Intrinsic Motivation
  OP: { bivariate: 0.636, partial: 0.226 }, // Exercise Optimism
  NG: { bivariate: 0.633, partial: 0.151 }, // Pursue Noble Goals
  EL: { bivariate: 0.504, partial: 0.059 }, // Enhance Emotional Literacy
  RP: { bivariate: 0.501, partial: 0.048 }, // Recognize Patterns
  EMP: { bivariate: 0.443, partial: 0.134 }, // Increase Empathy
  NE: { bivariate: 0.419, partial: 0.141 }, // Navigate Emotions
  ACT: { bivariate: 0.36, partial: 0.079 }, // Apply Consequential Thinking
};

let _cache: Record<SeiKey, SeiOutcomeWeight> | undefined;

/**
 * Active correlation set: env override (SEI_OUTCOME_CORRELATIONS, JSON/base64)
 * if present and valid, else the published v5 manual values. Cached per process.
 */
export function seiOutcomeCorrelations(): Record<SeiKey, SeiOutcomeWeight> {
  if (_cache !== undefined) return _cache;
  const raw = process.env.SEI_OUTCOME_CORRELATIONS;
  if (raw && raw.trim() !== "") {
    try {
      let json = raw.trim();
      if (!json.startsWith("{")) json = Buffer.from(json, "base64").toString("utf-8");
      const parsed = JSON.parse(json) as Record<SeiKey, SeiOutcomeWeight>;
      // Minimal validation: must have all 8 keys with numeric bivariate.
      const keys: SeiKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
      if (keys.every((k) => parsed[k] && typeof parsed[k].bivariate === "number")) {
        _cache = parsed;
        return _cache;
      }
    } catch {
      // fall through to published values
    }
  }
  _cache = SEI_OUTCOME_CORRELATIONS_V5;
  return _cache;
}

/** Test seam. */
export function __resetSeiCorrelationsCache(): void {
  _cache = undefined;
}

/**
 * Normalized competency weights for outcome-aware inference. Uses the partial
 * correlation (unique contribution) by default — that's the variance each
 * competency adds beyond the others — normalized so the eight sum to 1. Pass
 * "bivariate" to weight by raw association instead.
 */
export function seiCompetencyWeights(
  basis: "partial" | "bivariate" = "partial",
): Record<SeiKey, number> {
  const corr = seiOutcomeCorrelations();
  const keys = Object.keys(corr) as SeiKey[];
  const total = keys.reduce((s, k) => s + Math.max(0, corr[k][basis]), 0) || 1;
  const out = {} as Record<SeiKey, number>;
  for (const k of keys) out[k] = Math.max(0, corr[k][basis]) / total;
  return out;
}
