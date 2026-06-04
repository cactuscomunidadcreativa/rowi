/**
 * Tests for SEI competency→outcome correlations + derived weights.
 * Verifies the published v5 fallback, the env override, and normalization.
 */

import {
  seiOutcomeCorrelations,
  seiCompetencyWeights,
  SEI_OUTCOME_CORRELATIONS_V5,
  __resetSeiCorrelationsCache,
  type SeiKey,
} from "@/lib/vital-signs/sei-correlations";

const ORIGINAL = process.env.SEI_OUTCOME_CORRELATIONS;
function setEnv(v: string | undefined) {
  if (v === undefined) delete process.env.SEI_OUTCOME_CORRELATIONS;
  else process.env.SEI_OUTCOME_CORRELATIONS = v;
  __resetSeiCorrelationsCache();
}
afterEach(() => setEnv(ORIGINAL));

describe("fallback to published v5 values", () => {
  it("uses manual values when env absent", () => {
    setEnv(undefined);
    const c = seiOutcomeCorrelations();
    expect(c.IM.bivariate).toBe(0.656);
    expect(c.ACT.bivariate).toBe(0.36);
    expect(c).toEqual(SEI_OUTCOME_CORRELATIONS_V5);
  });

  it("ignores malformed env and falls back", () => {
    setEnv("{{ not json");
    expect(seiOutcomeCorrelations().OP.partial).toBe(0.226);
  });
});

describe("env override", () => {
  it("accepts a full JSON override", () => {
    const fake: Record<SeiKey, { bivariate: number; partial: number }> = {
      EL: { bivariate: 0.1, partial: 0.1 }, RP: { bivariate: 0.1, partial: 0.1 },
      ACT: { bivariate: 0.1, partial: 0.1 }, NE: { bivariate: 0.1, partial: 0.1 },
      IM: { bivariate: 0.9, partial: 0.9 }, OP: { bivariate: 0.1, partial: 0.1 },
      EMP: { bivariate: 0.1, partial: 0.1 }, NG: { bivariate: 0.1, partial: 0.1 },
    };
    setEnv(JSON.stringify(fake));
    expect(seiOutcomeCorrelations().IM.bivariate).toBe(0.9);
  });

  it("accepts base64", () => {
    setEnv(Buffer.from(JSON.stringify(SEI_OUTCOME_CORRELATIONS_V5)).toString("base64"));
    expect(seiOutcomeCorrelations().NG.bivariate).toBe(0.633);
  });
});

describe("derived competency weights", () => {
  it("partial weights sum to 1 and rank EIM/EO above ACT", () => {
    setEnv(undefined);
    const w = seiCompetencyWeights("partial");
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
    expect(w.OP).toBeGreaterThan(w.ACT);
    expect(w.IM).toBeGreaterThan(w.EL);
  });

  it("bivariate basis also sums to 1", () => {
    setEnv(undefined);
    const w = seiCompetencyWeights("bivariate");
    expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });
});
