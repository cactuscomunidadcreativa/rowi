/**
 * Tests for version-aware SEI bands.
 *
 * Guards: v4 keeps the legacy 90/110 cuts; v5 uses 92/108 for the coarse view
 * and the five named ranges; the env switch selects the active version with v4
 * as the safe default.
 */

import {
  activeSeiVersion,
  coarseBand,
  fiveBand,
  seiScaleRange,
} from "@/lib/vital-signs/sei-bands";

const ORIGINAL = process.env.SEI_SCALE_VERSION;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.SEI_SCALE_VERSION;
  else process.env.SEI_SCALE_VERSION = ORIGINAL;
});

describe("activeSeiVersion + scale range", () => {
  it("defaults to v4 (70–130)", () => {
    delete process.env.SEI_SCALE_VERSION;
    expect(activeSeiVersion()).toBe("v4");
    expect(seiScaleRange()).toEqual({ min: 70, max: 130, mean: 100 });
  });
  it("v5 → 75–125", () => {
    process.env.SEI_SCALE_VERSION = "v5";
    expect(activeSeiVersion()).toBe("v5");
    expect(seiScaleRange()).toEqual({ min: 75, max: 125, mean: 100 });
  });
});

describe("coarseBand — v4 (legacy 90/110)", () => {
  it("classifies with 90/110 cuts", () => {
    expect(coarseBand(89, "v4")).toBe("low");
    expect(coarseBand(90, "v4")).toBe("mid");
    expect(coarseBand(109, "v4")).toBe("mid");
    expect(coarseBand(110, "v4")).toBe("high");
    expect(coarseBand(null, "v4")).toBe("unknown");
  });
});

describe("coarseBand — v5 (92/108)", () => {
  it("classifies with 92/108 cuts", () => {
    expect(coarseBand(91, "v5")).toBe("low");
    expect(coarseBand(92, "v5")).toBe("mid");
    expect(coarseBand(107, "v5")).toBe("mid");
    expect(coarseBand(108, "v5")).toBe("high");
  });
  it("a 91 is mid in v4 but low in v5 (the calibration shift)", () => {
    expect(coarseBand(91, "v4")).toBe("mid");
    expect(coarseBand(91, "v5")).toBe("low");
  });
});

describe("fiveBand — v5 ranges", () => {
  it("maps the five named ranges by cutoff", () => {
    expect(fiveBand(81)).toBe("challenge");
    expect(fiveBand(82)).toBe("emerging");
    expect(fiveBand(91)).toBe("emerging");
    expect(fiveBand(92)).toBe("functional");
    expect(fiveBand(107)).toBe("functional");
    expect(fiveBand(108)).toBe("skilled");
    expect(fiveBand(117)).toBe("skilled");
    expect(fiveBand(118)).toBe("expert");
    expect(fiveBand(null)).toBe("unknown");
  });
});
