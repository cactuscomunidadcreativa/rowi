/**
 * Tests for the secret pulse-point map loader/applier.
 *
 * IMPORTANT: these tests use a SYNTHETIC map (made-up item numbers), never the
 * real Rowi mapping. The goal is to verify the mechanics — env decode, fallback,
 * mapping, cohort averaging — not the moat itself.
 */

import {
  loadSecretPulseMap,
  hasSecretPulseMap,
  applyPulseMap,
  applyPulseMapCohort,
  __resetSecretPulseMapCache,
  type SecretPulseMap,
} from "@/lib/vital-signs/secret-map";

const ORIGINAL = process.env.ROWI_VS_PULSE_MAP;

// Synthetic, NOT the real map.
const FAKE_MAP: SecretPulseMap = {
  TVS: {
    TRUST_CARE: [1, 2],
    MOTIVATION_MEANING: [3],
  },
  LVS: {
    MOTIVATION_MEANING: [1, 2, 3, 4],
  },
};

function setEnv(value: string | undefined) {
  if (value === undefined) delete process.env.ROWI_VS_PULSE_MAP;
  else process.env.ROWI_VS_PULSE_MAP = value;
  __resetSecretPulseMapCache();
}

afterEach(() => {
  setEnv(ORIGINAL);
});

describe("secret pulse map — fallback when unprovisioned", () => {
  it("returns null when env is absent", () => {
    setEnv(undefined);
    expect(loadSecretPulseMap()).toBeNull();
    expect(hasSecretPulseMap("TVS")).toBe(false);
    expect(applyPulseMap({ q1: 100 }, "TVS")).toBeNull();
    expect(applyPulseMapCohort([{ q1: 100 }], "TVS")).toBeNull();
  });

  it("returns null on unparseable env (no throw, no leak)", () => {
    setEnv("not-valid-json-or-base64-{{{");
    expect(loadSecretPulseMap()).toBeNull();
    expect(applyPulseMap({ q1: 100 }, "TVS")).toBeNull();
  });
});

describe("secret pulse map — decoding", () => {
  it("decodes raw JSON", () => {
    setEnv(JSON.stringify(FAKE_MAP));
    expect(hasSecretPulseMap("TVS")).toBe(true);
    expect(hasSecretPulseMap("OVS")).toBe(false);
  });

  it("decodes base64-encoded JSON", () => {
    setEnv(Buffer.from(JSON.stringify(FAKE_MAP), "utf-8").toString("base64"));
    expect(hasSecretPulseMap("TVS")).toBe(true);
    expect(hasSecretPulseMap("LVS")).toBe(true);
  });
});

describe("secret pulse map — applyPulseMap", () => {
  beforeEach(() => setEnv(JSON.stringify(FAKE_MAP)));

  it("averages composing items per pulse point", () => {
    const out = applyPulseMap({ q1: 110, q2: 90, q3: 100 }, "TVS");
    expect(out).not.toBeNull();
    const care = out!.find((p) => p.code === "TRUST_CARE");
    const meaning = out!.find((p) => p.code === "MOTIVATION_MEANING");
    expect(care?.score).toBe(100); // (110 + 90) / 2
    expect(care?.itemCount).toBe(2);
    expect(meaning?.score).toBe(100); // single item q3
    expect(meaning?.itemCount).toBe(1);
  });

  it("drops null/missing items but keeps the pulse point", () => {
    const out = applyPulseMap({ q1: 120, q2: null }, "TVS");
    const care = out!.find((p) => p.code === "TRUST_CARE");
    expect(care?.score).toBe(120); // only q1 contributed
    expect(care?.itemCount).toBe(1);
  });

  it("returns null for a scope with no map entry", () => {
    expect(applyPulseMap({ q1: 100 }, "OVS")).toBeNull();
  });
});

describe("secret pulse map — cohort", () => {
  beforeEach(() => setEnv(JSON.stringify(FAKE_MAP)));

  it("averages each pulse point across respondents", () => {
    const out = applyPulseMapCohort(
      [
        { q1: 100, q2: 100, q3: 80 }, // TRUST_CARE=100, MEANING=80
        { q1: 120, q2: 120, q3: 100 }, // TRUST_CARE=120, MEANING=100
      ],
      "TVS",
    );
    expect(out).not.toBeNull();
    const care = out!.find((p) => p.code === "TRUST_CARE");
    const meaning = out!.find((p) => p.code === "MOTIVATION_MEANING");
    expect(care?.score).toBe(110); // mean of 100 and 120
    expect(care?.respondentCount).toBe(2);
    expect(meaning?.score).toBe(90); // mean of 80 and 100
  });
});
