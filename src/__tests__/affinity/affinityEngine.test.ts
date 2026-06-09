/**
 * Regresión del núcleo puro del Affinity Engine.
 * Fija matrices, pesos y fórmulas tras unificar la lógica en una sola
 * fuente de verdad (antes duplicada en api/affinity/utils.ts).
 *
 * Si un cambio de calibración altera estos valores, este test DEBE fallar
 * a propósito — entonces se actualiza con intención, no por accidente.
 */
import {
  CTX,
  COMP_WEIGHTS,
  SUB_WEIGHTS,
  TALENT_WEIGHTS,
  collScoreBBP,
  closenessMultiplier,
  normCloseness,
  normalizeProject,
  seiLevel135,
  to100,
  compAffinity135,
  collaboration135,
  understanding135,
  talentSynergyFactor,
  resolveCtx,
  resolveCompWeights,
  type CompKey,
} from "@/domains/affinity/lib/affinityEngine";

const PROJECTS = [
  "innovation",
  "execution",
  "leadership",
  "conversation",
  "relationship",
  "decision",
] as const;

const COMP_KEYS: CompKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

describe("affinityEngine — integridad de matrices", () => {
  it("los pesos de las 3 dimensiones suman 1.0 en cada contexto", () => {
    for (const p of PROJECTS) {
      const w = CTX[p];
      expect(w.growth + w.collab + w.understand).toBeCloseTo(1.0, 5);
    }
  });

  it("los pesos de competencias suman 1.0 y cubren las 8 claves", () => {
    for (const p of PROJECTS) {
      const w = COMP_WEIGHTS[p];
      expect(Object.keys(w).sort()).toEqual([...COMP_KEYS].sort());
      const sum = COMP_KEYS.reduce((s, k) => s + w[k], 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it("los pesos de subfactores suman 1.0 en cada contexto", () => {
    for (const p of PROJECTS) {
      const sum = Object.values(SUB_WEIGHTS[p]).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it("los pesos de talentos suman 1.0 en cada contexto", () => {
    for (const p of PROJECTS) {
      const sum = Object.values(TALENT_WEIGHTS[p]).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });
});

describe("affinityEngine — matriz BBP (Brain Brief Profile)", () => {
  it("la diagonal vale 60 (similitud sin diversidad)", () => {
    const styles = ["Strategist", "Scientist", "Guardian", "Deliverer", "Inventor", "Energizer", "Sage", "Visionary"];
    for (const s of styles) {
      expect(collScoreBBP(s, s)).toBe(60);
    }
  });

  it("es simétrica (A×B === B×A)", () => {
    expect(collScoreBBP("Strategist", "Scientist")).toBe(collScoreBBP("Scientist", "Strategist"));
    expect(collScoreBBP("Visionary", "Deliverer")).toBe(collScoreBBP("Deliverer", "Visionary"));
  });

  it("estilos desconocidos o nulos caen al neutro 60", () => {
    expect(collScoreBBP(null, "Scientist")).toBe(60);
    expect(collScoreBBP("Inexistente", "Scientist")).toBe(60);
    expect(collScoreBBP(undefined, undefined)).toBe(60);
  });
});

describe("affinityEngine — normalizadores", () => {
  it("normalizeProject mapea alias en español al contexto correcto", () => {
    expect(normalizeProject("ejecucion")).toBe("execution");
    expect(normalizeProject("liderazgo")).toBe("leadership");
    expect(normalizeProject("relaciones")).toBe("relationship");
    expect(normalizeProject(null)).toBe("execution"); // default
    expect(normalizeProject("xyz")).toBe("execution"); // fallback
  });

  it("closenessMultiplier descuenta según cercanía", () => {
    expect(closenessMultiplier("cercano")).toBe(1.0);
    expect(closenessMultiplier("neutral")).toBe(0.9);
    expect(closenessMultiplier("lejano")).toBe(0.75);
  });

  it("normCloseness reconoce variantes multiidioma", () => {
    expect(normCloseness("vicino")).toBe("close");
    expect(normCloseness("lontano")).toBe("far");
    expect(normCloseness("")).toBe("neutral");
  });
});

describe("affinityEngine — escalas y niveles", () => {
  it("to100 convierte 0..135 a 0..100 y satura", () => {
    expect(to100(135)).toBe(100);
    expect(to100(0)).toBe(0);
    expect(to100(67.5)).toBe(50);
  });

  it("seiLevel135 etiqueta por umbrales", () => {
    expect(seiLevel135(70)).toBe("Desafío");
    expect(seiLevel135(85)).toBe("Emergente");
    expect(seiLevel135(100)).toBe("Funcional");
    expect(seiLevel135(112)).toBe("Diestro");
    expect(seiLevel135(125)).toBe("Experto");
  });
});

describe("affinityEngine — dimensiones de afinidad", () => {
  const full = (v: number): Record<CompKey, number | null> => ({
    EL: v, RP: v, ACT: v, NE: v, IM: v, OP: v, EMP: v, NG: v,
  });

  it("Growth: dos perfiles idénticos y altos dan score alto y acotado", () => {
    const { score, baseSim } = compAffinity135(full(120), full(120), "execution");
    expect(baseSim).toBe(135); // sin diferencias → similitud máxima
    expect(score).toBeGreaterThan(120);
    expect(score).toBeLessThanOrEqual(135);
  });

  it("Growth: perfiles muy dispares bajan baseSim", () => {
    const a = compAffinity135(full(120), full(120), "execution");
    const b = compAffinity135(full(120), full(40), "execution");
    expect(b.baseSim).toBeLessThan(a.baseSim);
  });

  it("Collaboration: estilos complementarios superan a estilos iguales", () => {
    const comp = full(100);
    const same = collaboration135("Scientist", "Scientist", comp, comp, 1.0);
    const complementary = collaboration135("Scientist", "Strategist", comp, comp, 1.0);
    expect(complementary).toBeGreaterThan(same);
  });

  it("Understanding: outcomes idénticos dan el máximo (135)", () => {
    const outs = [
      { key: "influence", score: 100 }, { key: "decisionMaking", score: 100 },
      { key: "network", score: 100 }, { key: "community", score: 100 },
      { key: "balance", score: 100 }, { key: "health", score: 100 },
      { key: "achievement", score: 100 }, { key: "satisfaction", score: 100 },
    ];
    expect(understanding135(outs, outs, "leadership")).toBe(135);
  });

  it("talentSynergyFactor queda en el rango [0.9, 1.1]", () => {
    const hi = talentSynergyFactor("execution", { prioritizing: 135, problemSolving: 135, commitment: 135 }, { prioritizing: 135, problemSolving: 135, commitment: 135 });
    const lo = talentSynergyFactor("execution", { prioritizing: 0, problemSolving: 0, commitment: 0 }, { prioritizing: 0, problemSolving: 0, commitment: 0 });
    expect(hi).toBeGreaterThanOrEqual(0.9);
    expect(hi).toBeLessThanOrEqual(1.1);
    expect(lo).toBeCloseTo(0.9, 5);
    expect(hi).toBeGreaterThan(lo);
  });

  it("sin datos de talentos comunes, el factor es neutro 1.0", () => {
    expect(talentSynergyFactor("execution", {}, {})).toBe(1.0);
  });
});

describe("affinityEngine — pesos inyectables (Fase 4/6)", () => {
  it("resolveCtx sin override devuelve el peso hardcoded del contexto", () => {
    expect(resolveCtx("execution")).toEqual(CTX.execution);
  });

  it("resolveCtx con override usa los pesos calibrados", () => {
    const override = { ctx: { execution: { growth: 0.5, collab: 0.3, understand: 0.2 } } };
    expect(resolveCtx("execution", override)).toEqual({ growth: 0.5, collab: 0.3, understand: 0.2 });
    // un contexto NO incluido en el override cae al hardcoded
    expect(resolveCtx("leadership", override)).toEqual(CTX.leadership);
  });

  it("resolveCompWeights respeta override parcial por contexto", () => {
    expect(resolveCompWeights("decision")).toEqual(COMP_WEIGHTS.decision);
    const custom = { EL: 0.2, RP: 0.1, ACT: 0.1, NE: 0.1, IM: 0.1, OP: 0.1, EMP: 0.1, NG: 0.2 };
    const override = { compWeights: { decision: custom } };
    expect(resolveCompWeights("decision", override)).toEqual(custom);
    expect(resolveCompWeights("execution", override)).toEqual(COMP_WEIGHTS.execution);
  });
});
