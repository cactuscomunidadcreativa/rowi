/**
 * SEI score bands — version-aware.
 *
 * The SEI scale and its interpretive bands changed between versions:
 *
 *  - SEI v4: standardized 70–130, three-band view (low < 90, mid, high ≥ 110).
 *    This is what every CSV/report imported to date uses.
 *
 *  - SEI v5 (2026 re-norm, N=299,014): standardized to mean 100 / SD 15,
 *    clamped to [75, 125], with FIVE interpretive ranges:
 *      Challenge ≤ 81 · Emerging 82–91 · Functional 92–107 ·
 *      Skilled 108–117 · Expert > 117.
 *
 * The active version is read from env SEI_SCALE_VERSION ("v4" | "v5"), defaulting
 * to v4 so nothing changes until real v5 data arrives. A per-call override lets
 * a route classify a specific snapshot by the version it was scored under.
 *
 * coarseBand() always maps to the legacy low/mid/high triple so existing
 * callers and the band() in calculate.ts keep working unchanged.
 */

export type SeiVersion = "v4" | "v5";
export type CoarseBand = "low" | "mid" | "high" | "unknown";
export type SeiBandV5 =
  | "challenge"
  | "emerging"
  | "functional"
  | "skilled"
  | "expert"
  | "unknown";

/** Resolve the active SEI scale version from env; default v4. */
export function activeSeiVersion(): SeiVersion {
  return process.env.SEI_SCALE_VERSION === "v5" ? "v5" : "v4";
}

/** Reported clamp range per version (for axes / normalization). */
export function seiScaleRange(version: SeiVersion = activeSeiVersion()): {
  min: number;
  max: number;
  mean: number;
} {
  return version === "v5"
    ? { min: 75, max: 125, mean: 100 }
    : { min: 70, max: 130, mean: 100 };
}

/**
 * Coarse three-band classification (low / mid / high) used across the existing
 * VS code. Thresholds adapt to the active version: v4 keeps 90/110; v5 maps the
 * five ranges down — Challenge+Emerging → low, Functional → mid, Skilled+Expert
 * → high (cuts at 92 and 108).
 */
export function coarseBand(
  score: number | null,
  version: SeiVersion = activeSeiVersion(),
): CoarseBand {
  if (score === null || !Number.isFinite(score)) return "unknown";
  if (version === "v5") {
    if (score < 92) return "low";
    if (score >= 108) return "high";
    return "mid";
  }
  if (score < 90) return "low";
  if (score >= 110) return "high";
  return "mid";
}

/**
 * Full five-range v5 classification. For v4 scores this still applies the v5
 * cutoffs, which is meaningful because both use a 100-mean scale — but the
 * caller should prefer coarseBand for v4 data.
 */
export function fiveBand(score: number | null): SeiBandV5 {
  if (score === null || !Number.isFinite(score)) return "unknown";
  if (score <= 81) return "challenge";
  if (score <= 91) return "emerging";
  if (score <= 107) return "functional";
  if (score <= 117) return "skilled";
  return "expert";
}

export const SEI_V5_RANGES: ReadonlyArray<{
  band: SeiBandV5;
  esLabel: string;
  enLabel: string;
  maxInclusive: number | null; // upper bound; null = open top
  approxPct: number;
}> = [
  { band: "challenge", esLabel: "Desafío", enLabel: "Challenge", maxInclusive: 81, approxPct: 3 },
  { band: "emerging", esLabel: "Emergente", enLabel: "Emerging", maxInclusive: 91, approxPct: 16 },
  { band: "functional", esLabel: "Funcional", enLabel: "Functional", maxInclusive: 107, approxPct: 53 },
  { band: "skilled", esLabel: "Hábil", enLabel: "Skilled", maxInclusive: 117, approxPct: 24 },
  { band: "expert", esLabel: "Experto", enLabel: "Expert", maxInclusive: null, approxPct: 5 },
];
