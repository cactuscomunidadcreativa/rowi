/**
 * Unit tests for the Vital Signs inference engine (v0 hardcoded + v1 calibrated).
 *
 * These are PURE functions (no IO) — they map SEI competencies + Brain Talents
 * onto the 15 BE2GROW pulse points, 5 drivers, and a dominant quadrant. They are
 * the scoring core of Emotional Budgeting, so this suite pins:
 *
 * - The 0.5 / 0.5 competency↔talent weighting and single-channel fallback.
 * - Band boundaries (low <90, mid, high ≥110) and delta vs the 100 benchmark.
 * - round1 rounding behaviour.
 * - Coverage flags / counts.
 * - Quadrant dominance + the all-null → BALANCED case.
 * - The calibrated engine: empty weights → identical to baseline, weighted
 *   average per PP, group + camelCase talent predictors, and the
 *   denominator-zero fallback to v0.
 */

import {
  calculateVitalSigns,
  calculateVitalSignsCalibrated,
  type InputSeiCompetencies,
  type InputBrainTalents,
  type WeightsByPp,
} from "@/lib/vital-signs/calculate";

const NULL_SEI: InputSeiCompetencies = {
  EL: null, RP: null, ACT: null, NE: null,
  IM: null, OP: null, EMP: null, NG: null,
};

function sei(overrides: Partial<InputSeiCompetencies>): InputSeiCompetencies {
  return { ...NULL_SEI, ...overrides };
}

/** Every SEI competency set to the same value. */
function uniformSei(v: number): InputSeiCompetencies {
  return { EL: v, RP: v, ACT: v, NE: v, IM: v, OP: v, EMP: v, NG: v };
}

const ALL_TALENT_KEYS = [
  "datamining", "modeling", "prioritizing",
  "connection", "emotionalinsight", "collaboration",
  "reflecting", "adaptability", "criticalthinking",
  "resilience", "risktolerance", "imagination",
  "proactivity", "commitment", "problemsolving",
  "vision", "designing", "entrepreneurship",
] as const;

function uniformTalents(v: number): InputBrainTalents {
  const out: Record<string, number> = {};
  for (const k of ALL_TALENT_KEYS) out[k] = v;
  return out as InputBrainTalents;
}

describe("calculateVitalSigns — coverage + empty input", () => {
  it("returns all-null scores and BALANCED quadrant when there is no data", () => {
    const res = calculateVitalSigns(NULL_SEI, {});

    expect(res.coverage).toEqual({
      hasSei: false,
      hasTalents: false,
      seiCount: 0,
      talentCount: 0,
    });
    expect(res.pulsePoints).toHaveLength(15);
    expect(res.drivers).toHaveLength(5);
    for (const pp of res.pulsePoints) {
      expect(pp.score).toBeNull();
      expect(pp.band).toBe("unknown");
      expect(pp.delta).toBeNull();
    }
    for (const d of res.drivers) {
      expect(d.score).toBeNull();
      expect(d.band).toBe("unknown");
    }
    expect(res.quadrant.code).toBe("BALANCED");
    expect(res.quadrant.esName).toBe("Equilibrado");
    expect(Object.values(res.quadrant.scores).every((s) => s === null)).toBe(true);
  });

  it("accepts a null SEI object entirely (talents-only respondent)", () => {
    const res = calculateVitalSigns(null, uniformTalents(80));
    expect(res.coverage.hasSei).toBe(false);
    expect(res.coverage.hasTalents).toBe(true);
    expect(res.coverage.talentCount).toBe(18);
    // Every PP has supporting talents, so every PP resolves via the talent channel.
    for (const pp of res.pulsePoints) {
      expect(pp.competencyComponent).toBeNull();
      expect(pp.talentComponent).toBe(80);
      expect(pp.score).toBe(80);
      expect(pp.band).toBe("low"); // 80 < 90
    }
  });
});

describe("calculateVitalSigns — band boundaries + benchmark delta", () => {
  it("classifies the canonical boundary values (90 mid, 110 high, <90 low)", () => {
    expect(calculateVitalSigns(uniformSei(89), {}).drivers[0].band).toBe("low");
    expect(calculateVitalSigns(uniformSei(90), {}).drivers[0].band).toBe("mid");
    expect(calculateVitalSigns(uniformSei(109), {}).drivers[0].band).toBe("mid");
    expect(calculateVitalSigns(uniformSei(110), {}).drivers[0].band).toBe("high");
  });

  it("computes delta against the 100 benchmark mean", () => {
    const res = calculateVitalSigns(uniformSei(120), {});
    expect(res.benchmark).toEqual({ mean: 100, source: "Six Seconds Network" });
    for (const pp of res.pulsePoints) {
      expect(pp.score).toBe(120);
      expect(pp.delta).toBe(20);
      expect(pp.band).toBe("high");
    }
  });
});

describe("calculateVitalSigns — channel averaging", () => {
  it("averages the competency and talent channels 50/50 when both present", () => {
    // comp channel = 100, talent channel = 120 → (100 + 120) / 2 = 110 → high
    const res = calculateVitalSigns(uniformSei(100), uniformTalents(120));
    for (const pp of res.pulsePoints) {
      expect(pp.competencyComponent).toBe(100);
      expect(pp.talentComponent).toBe(120);
      expect(pp.score).toBe(110);
      expect(pp.band).toBe("high");
    }
  });

  it("falls back to the single available channel and ignores missing competencies", () => {
    // Only EMP is present. PPs that include EMP resolve via that single value;
    // PPs without EMP and without talents stay null.
    const res = calculateVitalSigns(sei({ EMP: 100 }), {});
    expect(res.coverage.seiCount).toBe(1);

    const transparency = res.pulsePoints.find((p) => p.code === "TRUST_TRANSPARENCY")!;
    expect(transparency.contributingCompetencies).toEqual([{ key: "EMP", score: 100 }]);
    expect(transparency.competencyComponent).toBe(100);
    expect(transparency.talentComponent).toBeNull();
    expect(transparency.score).toBe(100);

    // MOTIVATION_MASTERY competencies are [RP, IM, ACT] — none set, no talents.
    const mastery = res.pulsePoints.find((p) => p.code === "MOTIVATION_MASTERY")!;
    expect(mastery.competencyComponent).toBeNull();
    expect(mastery.score).toBeNull();
    expect(mastery.band).toBe("unknown");
  });

  it("rounds component + score to one decimal place", () => {
    // TRUST_TRANSPARENCY competencies [EMP, ACT, EL, NG] → avg(100,100,100,102)=100.5
    const res = calculateVitalSigns(
      sei({ EMP: 100, ACT: 100, EL: 100, NG: 102 }),
      {},
    );
    const transparency = res.pulsePoints.find((p) => p.code === "TRUST_TRANSPARENCY")!;
    expect(transparency.competencyComponent).toBe(100.5);
    expect(transparency.score).toBe(100.5);
  });
});

describe("calculateVitalSigns — quadrant", () => {
  it("maps drivers to quadrants and picks the top scorer as dominant", () => {
    const res = calculateVitalSigns(uniformSei(100), {});
    // MAPA←MOTIVATION, LINTERNA←CHANGE, BOTIQUIN←TEAMWORK, BOTAS←EXECUTION
    expect(res.quadrant.scores.MAPA).toBe(
      res.drivers.find((d) => d.code === "MOTIVATION")!.score,
    );
    expect(res.quadrant.scores.BOTAS).toBe(
      res.drivers.find((d) => d.code === "EXECUTION")!.score,
    );
    // Uniform input → all driver scores equal → a dominant quadrant is still
    // chosen (never BALANCED once there is numeric data).
    expect(res.quadrant.code).not.toBe("BALANCED");
  });
});

describe("calculateVitalSignsCalibrated", () => {
  const EMPTY_WEIGHTS: WeightsByPp = {};

  it("is identical to the baseline when no weights are supplied", () => {
    const input = uniformSei(105);
    const baseline = calculateVitalSigns(input, {});
    const calibrated = calculateVitalSignsCalibrated(input, {}, EMPTY_WEIGHTS);
    expect(calibrated.pulsePoints).toEqual(baseline.pulsePoints);
    expect(calibrated.drivers).toEqual(baseline.drivers);
  });

  it("applies a per-PP weighted average and leaves other PPs on v0", () => {
    const weights: WeightsByPp = {
      TRUST_TRANSPARENCY: [{ predictor: "EMP", weight: 1 }],
    };
    const res = calculateVitalSignsCalibrated(
      sei({ EMP: 120 }),
      {},
      weights,
    );
    const transparency = res.pulsePoints.find((p) => p.code === "TRUST_TRANSPARENCY")!;
    // score = (1 * 120) / |1| = 120
    expect(transparency.score).toBe(120);
    expect(transparency.band).toBe("high");
    expect(transparency.delta).toBe(20);
  });

  it("resolves a camelCase brain-talent predictor against lowercase catalog keys", () => {
    const weights: WeightsByPp = {
      MOTIVATION_MASTERY: [{ predictor: "dataMining", weight: 1 }],
    };
    const res = calculateVitalSignsCalibrated(null, { datamining: 88 }, weights);
    const mastery = res.pulsePoints.find((p) => p.code === "MOTIVATION_MASTERY")!;
    expect(mastery.score).toBe(88);
  });

  it("resolves a grp: group predictor as the mean of its members", () => {
    const weights: WeightsByPp = {
      MOTIVATION_MASTERY: [{ predictor: "grp:focus_data", weight: 1 }],
    };
    // grp:focus_data = [dataMining, modeling, prioritizing] → mean(90,90,90)=90
    const res = calculateVitalSignsCalibrated(
      null,
      { datamining: 90, modeling: 90, prioritizing: 90 },
      weights,
    );
    const mastery = res.pulsePoints.find((p) => p.code === "MOTIVATION_MASTERY")!;
    expect(mastery.score).toBe(90);
  });

  it("falls back to the v0 PP when every calibrated predictor is missing", () => {
    const input = uniformSei(100);
    const baseline = calculateVitalSigns(input, {});
    const weights: WeightsByPp = {
      // predictor has no value in the input → denominator stays 0 → fallback
      TRUST_TRANSPARENCY: [{ predictor: "datamining", weight: 1 }],
    };
    const res = calculateVitalSignsCalibrated(input, {}, weights);
    const baseTransparency = baseline.pulsePoints.find((p) => p.code === "TRUST_TRANSPARENCY")!;
    const calTransparency = res.pulsePoints.find((p) => p.code === "TRUST_TRANSPARENCY")!;
    expect(calTransparency).toEqual(baseTransparency);
  });
});
