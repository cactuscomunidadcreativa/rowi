/**
 * Tests for mini-SEI scoring.
 *
 * Covers: fallback (no env → 8-competency, indicative=true), reverse-scoring,
 * the indicative competency profile, version-aware clamping, and the env-backed
 * 12-item short form (indicative=false).
 */

import { scoreMiniSei, scoreMiniSeiOutcomeWeighted } from "@/lib/mini-sei/score";
import { __resetMiniSeiItemsCache } from "@/lib/mini-sei/items";

const ORIG_ITEMS = process.env.ROWI_MINISEI_ITEMS;
const ORIG_SCALE = process.env.SEI_SCALE_VERSION;

function setItemsEnv(v: string | undefined) {
  if (v === undefined) delete process.env.ROWI_MINISEI_ITEMS;
  else process.env.ROWI_MINISEI_ITEMS = v;
  __resetMiniSeiItemsCache();
}
function setScale(v: string | undefined) {
  if (v === undefined) delete process.env.SEI_SCALE_VERSION;
  else process.env.SEI_SCALE_VERSION = v;
}

afterEach(() => {
  setItemsEnv(ORIG_ITEMS);
  setScale(ORIG_SCALE);
});

describe("fallback (8-competency, no env)", () => {
  beforeEach(() => setItemsEnv(undefined));

  it("flags indicative=true and builds a competency profile", () => {
    const answers = { c_EL: 4, c_RP: 3, c_ACT: 5, c_NE: 2, c_IM: 4, c_OP: 4, c_EMP: 3, c_NG: 5 };
    const r = scoreMiniSei(answers);
    expect(r.indicative).toBe(true);
    expect(r.competencyProfile.EL).toBe(4);
    expect(r.competencyProfile.NE).toBe(2);
    expect(Object.keys(r.competencyProfile)).toHaveLength(8);
  });

  it("a uniformly-3 answer set scores at the norm mean (100), mid band", () => {
    const answers = Object.fromEntries(
      ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"].map((c) => [`c_${c}`, 3]),
    );
    const r = scoreMiniSei(answers);
    expect(r.totalEq).toBe(100);
    expect(r.totalEqBand).toBe("mid");
  });

  it("a uniformly-5 answer set scores high and clamps in range", () => {
    const answers = Object.fromEntries(
      ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"].map((c) => [`c_${c}`, 5]),
    );
    const r = scoreMiniSei(answers);
    expect(r.totalEq).toBeGreaterThan(110);
    expect(r.totalEqBand).toBe("high");
  });
});

describe("version-aware clamping", () => {
  beforeEach(() => setItemsEnv(undefined));

  it("clamps to 130 in v4 and 125 in v5 for extreme highs", () => {
    const answers = Object.fromEntries(
      ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"].map((c) => [`c_${c}`, 5]),
    );
    setScale("v4");
    expect(scoreMiniSei(answers).totalEq).toBeLessThanOrEqual(130);
    setScale("v5");
    expect(scoreMiniSei(answers).totalEq).toBeLessThanOrEqual(125);
  });
});

describe("env-backed 12-item short form", () => {
  it("uses the provisioned items, reverse-scores, and flags indicative=false", () => {
    const set = {
      version: "hybrid-v1",
      norm: { mean: 100, sd: 15 },
      items: [
        { id: "q7", competency: "ACT", reverse: false, weight: 1 },
        { id: "q20", competency: "EMP", reverse: true, weight: 1 },
        ...["EL", "RP", "NE", "IM", "OP", "NG"].map((c, i) => ({
          id: `x${i}`,
          competency: c,
          reverse: false,
          weight: 1,
        })),
      ],
    };
    setItemsEnv(JSON.stringify(set));
    // q20 is reverse-keyed: answering 1 means HIGH empathy (6-1=5).
    const answers = { q7: 4, q20: 1, x0: 4, x1: 4, x2: 4, x3: 4, x4: 4, x5: 4 };
    const r = scoreMiniSei(answers);
    expect(r.indicative).toBe(false);
    expect(r.itemsVersion).toBe("hybrid-v1");
    expect(r.competencyProfile.EMP).toBe(5); // reverse-corrected 1 → 5
  });
});

describe("outcome-weighted variant", () => {
  beforeEach(() => setItemsEnv(undefined));
  it("returns a number in range and differs from equal-weight when profile is skewed", () => {
    // High on EIM/EO/PNG (strong predictors), low elsewhere.
    const answers = { c_EL: 2, c_RP: 2, c_ACT: 2, c_NE: 2, c_IM: 5, c_OP: 5, c_EMP: 2, c_NG: 5 };
    const ow = scoreMiniSeiOutcomeWeighted(answers);
    const eq = scoreMiniSei(answers).totalEq;
    expect(ow).toBeGreaterThanOrEqual(70);
    expect(ow).toBeLessThanOrEqual(130);
    // outcome-weighted should rate this profile higher (rewards EIM/EO/PNG)
    expect(ow).toBeGreaterThan(eq);
  });
});
