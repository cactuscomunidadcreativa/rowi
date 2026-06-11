/**
 * Unit tests for the Pre-SEI deterministic scoring engine.
 *
 * The load-bearing risk is the 1-5 → 70-130 scale mapping: `calculateVitalSigns`
 * assumes the Six Seconds scale (norm 100), so feeding raw 1-5 would silently
 * produce garbage pulse points. These tests pin the scale boundaries, the 1:1
 * competency mapping, K/C/G by pursuit, success factors, and the archetype that
 * the VS engine derives. All pure — no DB, no IA.
 */
import {
  seiScore,
  isValidAnswer,
  validateAnswers,
  scorePreSei,
  type PreSeiAnswers,
} from "@/lib/pre-sei/scoring";
import { SEI_ORDER } from "@/lib/pre-sei/questions";

function answersAll(value: number): PreSeiAnswers {
  return SEI_ORDER.reduce((acc, sei) => {
    acc[sei] = value;
    return acc;
  }, {} as PreSeiAnswers);
}

describe("seiScore — escala 1-5 → 70-130", () => {
  it("mapea los bordes y el centro", () => {
    expect(seiScore(1)).toBe(70);
    expect(seiScore(2)).toBe(85);
    expect(seiScore(3)).toBe(100); // norma
    expect(seiScore(4)).toBe(115);
    expect(seiScore(5)).toBe(130);
  });

  it("clampa valores fuera de rango", () => {
    expect(seiScore(0)).toBe(70);
    expect(seiScore(6)).toBe(130);
  });
});

describe("validación de respuestas", () => {
  it("acepta enteros 1-5", () => {
    for (const v of [1, 2, 3, 4, 5]) expect(isValidAnswer(v)).toBe(true);
  });

  it("rechaza no-enteros y fuera de rango", () => {
    for (const v of [0, 6, 3.5, -1, "3", null, undefined, NaN]) {
      expect(isValidAnswer(v)).toBe(false);
    }
  });

  it("validateAnswers acepta las 8 claves válidas", () => {
    expect(validateAnswers(answersAll(3))).toBeNull();
  });

  it("validateAnswers rechaza falta de clave, valor inválido y claves extra", () => {
    const missing = { ...answersAll(3) } as Record<string, unknown>;
    delete missing[SEI_ORDER[0]];
    expect(validateAnswers(missing)).toMatch(/missing/);

    const bad = { ...answersAll(3), [SEI_ORDER[0]]: 9 };
    expect(validateAnswers(bad)).toMatch(/invalid/);

    const extra = { ...answersAll(3), FOO: 3 };
    expect(validateAnswers(extra)).toMatch(/unexpected/);

    expect(validateAnswers(null)).toMatch(/object/);
  });
});

describe("scorePreSei", () => {
  it("mapea 1:1 las 8 respuestas a 8 competencias en escala 70-130", () => {
    const r = scorePreSei(answersAll(4));
    for (const sei of SEI_ORDER) {
      expect(r.competencies[sei]).toBe(115);
    }
  });

  it("todo-3 → todas las competencias y drivers en la norma (100)", () => {
    const r = scorePreSei(answersAll(3));
    for (const sei of SEI_ORDER) expect(r.competencies[sei]).toBe(100);
    expect(r.kcg).toEqual({ K: 100, C: 100, G: 100 });
    // Drivers en la norma → todos 100.
    for (const d of r.drivers) expect(d.score).toBe(100);
    // NOTA: con drivers empatados, el motor VS (calculate.ts) elige un cuadrante
    // dominante determinista (el primero en orden), NO "BALANCED". BALANCED solo
    // ocurre sin datos numéricos. El arquetipo siempre trae nombre.
    expect(r.archetype.esName).toBeTruthy();
  });

  it("K/C/G promedian por pursuit (know=EL,RP / choose=ACT,NE,IM,OP / give=EMP,NG)", () => {
    const a = answersAll(3);
    a.EL = 5; a.RP = 5; // know → 130
    a.EMP = 1; a.NG = 1; // give → 70
    const r = scorePreSei(a);
    expect(r.kcg.K).toBe(130);
    expect(r.kcg.G).toBe(70);
    expect(r.kcg.C).toBe(100); // choose sin cambios
  });

  it("devuelve top 3 pulse points ordenados desc", () => {
    const r = scorePreSei(answersAll(4));
    expect(r.topPulsePoints).toHaveLength(3);
    const scores = r.topPulsePoints.map((p) => p.score ?? 0);
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1]);
    expect(scores[1]).toBeGreaterThanOrEqual(scores[2]);
  });

  it("computa los 4 factores de éxito", () => {
    const r = scorePreSei(answersAll(3));
    for (const f of ["Effectiveness", "Relationships", "Wellbeing", "QualityOfLife"] as const) {
      expect(r.successFactors[f]).toBe(100);
    }
  });

  it("expone las 3 vistas VS (LVS/TVS/OVS), todas inferidas y NO normadas", () => {
    const r = scorePreSei(answersAll(4));
    expect(r.vsViews.map((v) => v.scope).sort()).toEqual(["LVS", "OVS", "TVS"]);
    for (const v of r.vsViews) {
      expect(v.inferred).toBe(true);
      expect(v.normalized).toBe(false);
      expect(v.lensKey).toMatch(/^preSei\.vs\.lens\./);
      expect(v.drivers.length).toBeGreaterThan(0);
      expect(typeof v.score).toBe("number"); // con datos hay score
    }
  });

  it("las vistas VS reflejan el score de sus drivers (todo-3 → 100)", () => {
    const r = scorePreSei(answersAll(3));
    for (const v of r.vsViews) {
      expect(v.score).toBe(100);
      expect(v.band).toBe("mid");
    }
  });

  it("sesgar competencias hacia un driver inclina el arquetipo", () => {
    // CHANGE se nutre de OP/NE/ACT/RP/NG → LINTERNA. Subir TODAS esas al
    // máximo y hundir el resto: con el desempate real (top-segundo ≥ 3,
    // fix F7), el sesgo debe ser inequívoco para producir arquetipo.
    const a = answersAll(1);
    a.OP = 5; a.NE = 5; a.RP = 5; a.ACT = 5; a.NG = 5;
    const r = scorePreSei(a);
    // El cuadrante dominante NO debe ser BALANCED cuando hay sesgo claro.
    expect(r.archetype.quadrant).not.toBe("BALANCED");
    // Arquetipo con tagline/emoji presentes cuando hay cuadrante.
    expect(r.archetype.emoji).toBeTruthy();
  });

  it("respuestas PAREJAS → BALANCED honesto (regresión 'siempre Cartografía')", () => {
    const r = scorePreSei(answersAll(3));
    expect(r.archetype.quadrant).toBe("BALANCED");
  });
});
