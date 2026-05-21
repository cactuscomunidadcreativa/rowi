/**
 * Pulse Point inference from SEI + Brain Talent snapshots.
 *
 * For each of the 15 pulse points, scores are inferred as the weighted average
 * of the SEI competencies that activate it (weight 0.5) and the Brain Talents
 * that support it (weight 0.5). When a snapshot is missing data, only the
 * available channel is used. Scores are kept on the raw Six Seconds scale
 * (typical 70–130, norm = 100). The view layer maps them to bands.
 */

import {
  DRIVERS,
  PULSE_POINTS,
  type DriverCode,
  type PulsePointCode,
  type Quadrant,
  type SeiKey,
  type BrainTalentKey,
} from "./catalog";

export interface InputSeiCompetencies {
  EL: number | null;
  RP: number | null;
  ACT: number | null;
  NE: number | null;
  IM: number | null;
  OP: number | null;
  EMP: number | null;
  NG: number | null;
}

export type InputBrainTalents = Partial<Record<BrainTalentKey, number | null>>;

export interface PulsePointResult {
  code: PulsePointCode;
  driver: DriverCode;
  esName: string;
  enName: string;
  esFunction: string;
  enFunction: string;
  score: number | null;
  competencyComponent: number | null;
  talentComponent: number | null;
  band: "low" | "mid" | "high" | "unknown";
  delta: number | null;
  contributingCompetencies: Array<{ key: SeiKey; score: number }>;
  contributingTalents: Array<{ key: BrainTalentKey; score: number }>;
}

export interface DriverResult {
  code: DriverCode;
  esName: string;
  enName: string;
  esNeed: string;
  enNeed: string;
  score: number | null;
  band: "low" | "mid" | "high" | "unknown";
  pulsePoints: PulsePointResult[];
}

export interface VitalSignsResult {
  drivers: DriverResult[];
  pulsePoints: PulsePointResult[];
  quadrant: {
    code: Quadrant | "BALANCED";
    esName: string;
    enName: string;
    scores: Record<Quadrant, number | null>;
  };
  benchmark: { mean: number; source: string };
  coverage: {
    hasSei: boolean;
    hasTalents: boolean;
    seiCount: number;
    talentCount: number;
  };
}

const BENCHMARK_MEAN = 100;

/**
 * Predictor keys recognized by the calibrated engine.
 * - 8 SEI competencies (uppercase: EL, RP, ACT, NE, IM, OP, EMP, NG)
 * - 18 Brain Talents (camelCase: dataMining, ... — matches BenchmarkCorrelation.competencyKey
 *   convention from benchmarks; note catalog uses lowercase keys, so we normalize)
 * - 6 aggregated groups (grp:focus_data, ...)
 *
 * Note: the catalog `BrainTalentKey` uses lowercase ("emotionalinsight"), while
 * benchmarks store camelCase ("emotionalInsight"). This helper normalizes both
 * directions so the same talent values match either source.
 */
const TALENT_CAMEL_BY_LOWER: Record<string, string> = {
  datamining: "dataMining",
  modeling: "modeling",
  prioritizing: "prioritizing",
  connection: "connection",
  emotionalinsight: "emotionalInsight",
  collaboration: "collaboration",
  reflecting: "reflecting",
  adaptability: "adaptability",
  criticalthinking: "criticalThinking",
  resilience: "resilience",
  risktolerance: "riskTolerance",
  imagination: "imagination",
  proactivity: "proactivity",
  commitment: "commitment",
  problemsolving: "problemSolving",
  vision: "vision",
  designing: "designing",
  entrepreneurship: "entrepreneurship",
};

const GROUP_DEFS: Record<string, string[]> = {
  "grp:focus_data": ["dataMining", "modeling", "prioritizing"],
  "grp:focus_people": ["connection", "emotionalInsight", "collaboration"],
  "grp:decisions_evaluative": ["reflecting", "adaptability", "criticalThinking"],
  "grp:decisions_innovative": ["resilience", "riskTolerance", "imagination"],
  "grp:drive_practical": ["proactivity", "commitment", "problemSolving"],
  "grp:drive_idealistic": ["vision", "designing", "entrepreneurship"],
};

export interface WeightRow {
  predictor: string;
  weight: number;
}

export type WeightsByPp = Partial<Record<PulsePointCode, WeightRow[]>>;

function avg(values: Array<number | null | undefined>): number | null {
  const xs = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function band(score: number | null): "low" | "mid" | "high" | "unknown" {
  if (score === null) return "unknown";
  if (score < 90) return "low";
  if (score >= 110) return "high";
  return "mid";
}

function round1(n: number | null): number | null {
  if (n === null) return null;
  return Math.round(n * 10) / 10;
}

export function calculateVitalSigns(
  sei: InputSeiCompetencies | null,
  talents: InputBrainTalents,
): VitalSignsResult {
  const seiCount = sei
    ? Object.values(sei).filter((v) => typeof v === "number").length
    : 0;
  const talentCount = Object.values(talents).filter((v) => typeof v === "number").length;
  const hasSei = seiCount > 0;
  const hasTalents = talentCount > 0;

  const pulsePoints: PulsePointResult[] = PULSE_POINTS.map((pp) => {
    const contribComps = sei
      ? pp.competencies
          .map((key) => ({ key, score: sei[key] }))
          .filter((c): c is { key: SeiKey; score: number } => typeof c.score === "number")
      : [];
    const contribTalents = pp.talents
      .map((key) => ({ key, score: talents[key] ?? null }))
      .filter((t): t is { key: BrainTalentKey; score: number } => typeof t.score === "number");

    const competencyComponent = avg(contribComps.map((c) => c.score));
    const talentComponent = avg(contribTalents.map((t) => t.score));

    let score: number | null = null;
    if (competencyComponent !== null && talentComponent !== null) {
      score = (competencyComponent + talentComponent) / 2;
    } else if (competencyComponent !== null) {
      score = competencyComponent;
    } else if (talentComponent !== null) {
      score = talentComponent;
    }

    return {
      code: pp.code,
      driver: pp.driver,
      esName: pp.esName,
      enName: pp.enName,
      esFunction: pp.esFunction,
      enFunction: pp.enFunction,
      score: round1(score),
      competencyComponent: round1(competencyComponent),
      talentComponent: round1(talentComponent),
      band: band(score),
      delta: score === null ? null : round1(score - BENCHMARK_MEAN),
      contributingCompetencies: contribComps,
      contributingTalents: contribTalents,
    };
  });

  const drivers: DriverResult[] = DRIVERS.map((d) => {
    const pps = pulsePoints.filter((p) => p.driver === d.code);
    const driverScore = avg(pps.map((p) => p.score));
    return {
      code: d.code,
      esName: d.esName,
      enName: d.enName,
      esNeed: d.esNeed,
      enNeed: d.enNeed,
      score: round1(driverScore),
      band: band(driverScore),
      pulsePoints: pps,
    };
  });

  const motivationScore = drivers.find((d) => d.code === "MOTIVATION")?.score ?? null;
  const changeScore = drivers.find((d) => d.code === "CHANGE")?.score ?? null;
  const teamworkScore = drivers.find((d) => d.code === "TEAMWORK")?.score ?? null;
  const executionScore = drivers.find((d) => d.code === "EXECUTION")?.score ?? null;

  const quadrantScores: Record<Quadrant, number | null> = {
    MAPA: motivationScore,
    LINTERNA: changeScore,
    BOTIQUIN: teamworkScore,
    BOTAS: executionScore,
  };

  let dominant: Quadrant | "BALANCED" = "BALANCED";
  const entries = (Object.entries(quadrantScores) as [Quadrant, number | null][])
    .filter((e): e is [Quadrant, number] => typeof e[1] === "number");
  if (entries.length > 0) {
    entries.sort((a, b) => b[1] - a[1]);
    const [top, topScore] = entries[0];
    const second = entries[1]?.[1] ?? topScore;
    if (topScore - second >= 3) {
      dominant = top;
    } else {
      dominant = top;
    }
  }

  const quadrantNames: Record<Quadrant | "BALANCED", { es: string; en: string }> = {
    LINTERNA: { es: "Linterna", en: "Lantern" },
    MAPA: { es: "Mapa", en: "Map" },
    BOTIQUIN: { es: "Botiquín", en: "First Aid Kit" },
    BOTAS: { es: "Botas de Senderismo", en: "Hiking Boots" },
    BALANCED: { es: "Equilibrado", en: "Balanced" },
  };

  return {
    drivers,
    pulsePoints,
    quadrant: {
      code: dominant,
      esName: quadrantNames[dominant].es,
      enName: quadrantNames[dominant].en,
      scores: quadrantScores,
    },
    benchmark: { mean: BENCHMARK_MEAN, source: "Six Seconds Network" },
    coverage: { hasSei, hasTalents, seiCount, talentCount },
  };
}

/**
 * Get the value of a predictor (SEI, brain talent, or group) from raw inputs.
 * Returns null if the predictor data is missing.
 */
function predictorValue(
  predictor: string,
  sei: InputSeiCompetencies | null,
  talents: InputBrainTalents,
): number | null {
  // SEI: uppercase 2-3 letter codes
  if (sei && predictor in sei) {
    const v = (sei as unknown as Record<string, number | null>)[predictor];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  // Brain talent (camelCase from benchmark)
  // Catalog stores lowercase keys, so look up by lowering the camel form.
  const lowerKey = predictor.toLowerCase();
  if (lowerKey in talents) {
    const v = (talents as Record<string, number | null | undefined>)[lowerKey];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  // Group: average of its members
  if (predictor.startsWith("grp:")) {
    const members = GROUP_DEFS[predictor] ?? [];
    const values: number[] = [];
    for (const m of members) {
      const mLower = m.toLowerCase();
      const v = (talents as Record<string, number | null | undefined>)[mLower];
      if (typeof v === "number" && Number.isFinite(v)) values.push(v);
    }
    return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
  }
  return null;
}

/**
 * Calibrated calculation: when a v1+ PulsePointWeights row set is active for a
 * pulse point, use its predictor weights instead of the hardcoded BE2GROW subset.
 *
 * Weighted average per PP:
 *   score(PP) = sum( w_i * value_i ) / sum( |w_i| )
 *
 * Predictors with null values are skipped. If no calibrated row applies to a
 * pulse point (e.g. weightsByPp[PP] is undefined or empty), that PP falls back
 * to the v0 hardcoded inference produced by `calculateVitalSigns`.
 *
 * Used so that the inference engine can adopt newly trained weights without
 * losing PPs that aren't calibrated yet.
 */
export function calculateVitalSignsCalibrated(
  sei: InputSeiCompetencies | null,
  talents: InputBrainTalents,
  weightsByPp: WeightsByPp,
): VitalSignsResult {
  const baseline = calculateVitalSigns(sei, talents);

  const calibratedPps: PulsePointResult[] = baseline.pulsePoints.map((pp) => {
    const weights = weightsByPp[pp.code];
    if (!weights || weights.length === 0) return pp;

    let numerator = 0;
    let denominator = 0;
    for (const w of weights) {
      const v = predictorValue(w.predictor, sei, talents);
      if (v === null) continue;
      numerator += w.weight * v;
      denominator += Math.abs(w.weight);
    }
    if (denominator === 0) return pp;

    const score = numerator / denominator;
    return {
      ...pp,
      score: round1(score),
      band: band(score),
      delta: round1(score - BENCHMARK_MEAN),
    };
  });

  // Recompute drivers from the (potentially updated) pulse points
  const calibratedDrivers: DriverResult[] = DRIVERS.map((d) => {
    const pps = calibratedPps.filter((p) => p.driver === d.code);
    const driverScore = avg(pps.map((p) => p.score));
    return {
      code: d.code,
      esName: d.esName,
      enName: d.enName,
      esNeed: d.esNeed,
      enNeed: d.enNeed,
      score: round1(driverScore),
      band: band(driverScore),
      pulsePoints: pps,
    };
  });

  const motivationScore = calibratedDrivers.find((d) => d.code === "MOTIVATION")?.score ?? null;
  const changeScore = calibratedDrivers.find((d) => d.code === "CHANGE")?.score ?? null;
  const teamworkScore = calibratedDrivers.find((d) => d.code === "TEAMWORK")?.score ?? null;
  const executionScore = calibratedDrivers.find((d) => d.code === "EXECUTION")?.score ?? null;

  const quadrantScores: Record<Quadrant, number | null> = {
    MAPA: motivationScore,
    LINTERNA: changeScore,
    BOTIQUIN: teamworkScore,
    BOTAS: executionScore,
  };

  const entries = (Object.entries(quadrantScores) as [Quadrant, number | null][])
    .filter((e): e is [Quadrant, number] => typeof e[1] === "number");
  let dominant: Quadrant | "BALANCED" = "BALANCED";
  if (entries.length > 0) {
    entries.sort((a, b) => b[1] - a[1]);
    dominant = entries[0][0];
  }

  return {
    ...baseline,
    drivers: calibratedDrivers,
    pulsePoints: calibratedPps,
    quadrant: { ...baseline.quadrant, code: dominant, scores: quadrantScores },
  };
}
