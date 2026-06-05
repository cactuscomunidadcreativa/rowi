/**
 * Secrecy guard for the mini-SEI: the question presentation served to the
 * client must expose ONLY opaque position + stem — never competency, reverse,
 * weight, or the real item id. And positional answers must map back correctly
 * server-side.
 */

import {
  publicQuestions,
  answersByPosition,
  __resetMiniSeiItemsCache,
} from "@/lib/mini-sei/items";

const ORIG = process.env.ROWI_MINISEI_ITEMS;
function setEnv(v: string | undefined) {
  if (v === undefined) delete process.env.ROWI_MINISEI_ITEMS;
  else process.env.ROWI_MINISEI_ITEMS = v;
  __resetMiniSeiItemsCache();
}
afterEach(() => setEnv(ORIG));

describe("publicQuestions — no secret leakage", () => {
  it("fallback set exposes only pos + stem", () => {
    setEnv(undefined);
    const qs = publicQuestions("es");
    expect(qs.length).toBe(8);
    for (const q of qs) {
      expect(Object.keys(q).sort()).toEqual(["pos", "stem"]);
      expect(typeof q.stem).toBe("string");
      // must NOT carry competency/reverse/weight/id
      expect(q).not.toHaveProperty("competency");
      expect(q).not.toHaveProperty("reverse");
      expect(q).not.toHaveProperty("weight");
      expect(q).not.toHaveProperty("id");
    }
  });

  it("env-backed item set still exposes only pos + stem", () => {
    // Must have >= 8 items to pass the loader's short-form guard.
    const comps = ["ACT", "EMP", "EL", "RP", "NE", "IM", "OP", "NG"];
    const set = {
      version: "hybrid-v1",
      norm: { mean: 100, sd: 15 },
      items: comps.map((c, i) => ({
        id: `q${i}`,
        competency: c,
        reverse: i % 2 === 1,
        weight: 1,
        stem: { es: `Pregunta secreta ${i}` },
      })),
    };
    setEnv(JSON.stringify(set));
    const qs = publicQuestions("es");
    expect(qs[0]).toEqual({ pos: 0, stem: "Pregunta secreta 0" });
    // The serialized payload contains no competency/reverse/weight/id.
    const json = JSON.stringify(qs);
    expect(json).not.toContain("ACT");
    expect(json).not.toContain("EMP");
    expect(json).not.toContain("reverse");
    expect(json).not.toContain("q0");
  });
});

describe("answersByPosition — server-side mapping", () => {
  it("maps opaque positions back to real item ids", () => {
    const comps = ["ACT", "EMP", "EL", "RP", "NE", "IM", "OP", "NG"];
    const set = {
      version: "hybrid-v1",
      norm: { mean: 100, sd: 15 },
      items: comps.map((c, i) => ({ id: `q${i}`, competency: c, reverse: false, weight: 1 })),
    };
    setEnv(JSON.stringify(set));
    const mapped = answersByPosition({ "0": 4, "1": 2 });
    expect(mapped).toEqual({ q0: 4, q1: 2 });
  });

  it("drops out-of-range positions", () => {
    setEnv(undefined); // fallback has 8 items (pos 0-7)
    const mapped = answersByPosition({ "0": 5, "99": 3 });
    expect(Object.keys(mapped)).toHaveLength(1);
  });
});
