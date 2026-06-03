/**
 * Pre-SEI — scoring determinista (sin IA).
 *
 * Convierte 8 respuestas en escala 1-5 (una por competencia SEI) en:
 *  - 8 competencias SEI en escala Six Seconds (70-130, norm 100),
 *  - K/C/G (promedios por pursuit know/choose/give),
 *  - los 15 pulse points + 5 drivers + arquetipo Rowi (REUSO de calculateVitalSigns),
 *  - los 4 factores de éxito (derivados de PULSE_POINTS[].successFactors).
 *
 * Es hipótesis v0 explícita (igual que la matriz BE2GROW): el mapeo lineal 1-5 →
 * 70-130 y el motor v0 son calibrables luego con datos reales. NUNCA se presenta
 * como diagnóstico clínico. Ningún paso usa OpenAI.
 */
import {
  PULSE_POINTS,
  ROWI_ARCHETYPES,
  SEI_COMPETENCIES,
  type SeiKey,
  type Quadrant,
  type DriverCode,
} from "@/lib/vital-signs/catalog";
import { calculateVitalSigns } from "@/lib/vital-signs/calculate";
import { SEI_ORDER } from "@/lib/pre-sei/questions";

/** Respuestas crudas del Pre-SEI: una por competencia, escala 1-5. */
export type PreSeiAnswers = Record<SeiKey, number>;

export type SuccessFactor = "Effectiveness" | "Relationships" | "Wellbeing" | "QualityOfLife";

/**
 * Vistas Vital Signs que el Pre-SEI INFIERE desde las 8 respuestas:
 *   - LVS → "cómo lideras"
 *   - TVS → "cómo ves a tu equipo"
 *   - OVS → "cómo ves tu organización"
 * Las tres son la PERCEPCIÓN INDIVIDUAL de una persona, NO data normada. Solo se
 * vuelven "reales/normadas" al tomar el SEI/VS formal o al invitar gente que
 * norme la lectura. Por eso van flagueadas `inferred:true` / `normalized:false`
 * (misma semántica que `VitalSignsAssessment.source="inferred"` y
 * `VitalSignsScoreSource.sourceKind="inferred"` ya existentes).
 */
export type PreSeiVsScope = "LVS" | "TVS" | "OVS";

export interface PreSeiVsView {
  scope: PreSeiVsScope;
  /** Etiqueta de intención de la vista (i18n key se resuelve en la UI). */
  lensKey: string;
  /** Score global de la vista (promedio de drivers relevantes), 70-130 o null. */
  score: number | null;
  band: "low" | "mid" | "high" | "unknown";
  /** SIEMPRE true en el Pre-SEI: es proyección, no medición. */
  inferred: true;
  /** SIEMPRE false en el Pre-SEI: no hay norma hasta SEI/VS real o invitar gente. */
  normalized: false;
  /** Drivers que sustentan esta vista, con su score inferido. */
  drivers: Array<{ code: DriverCode; score: number | null; band: string }>;
}

export interface PreSeiResult {
  /** Competencias en escala Six Seconds 70-130 (norm 100). */
  competencies: Record<SeiKey, number>;
  /** K/C/G: promedio de competencias por pursuit, escala 70-130. */
  kcg: { K: number; C: number; G: number };
  /** Los 5 drivers, escala 70-130 (null si falta data). */
  drivers: Array<{ code: DriverCode; score: number | null; band: string }>;
  /** Top 3 pulse points por score. */
  topPulsePoints: Array<{ code: string; esName: string; enName: string; score: number | null }>;
  /** Arquetipo Rowi dominante (del cuadrante del motor VS). */
  archetype: {
    quadrant: Quadrant | "BALANCED";
    esName: string;
    enName: string;
    esTagline: string | null;
    enTagline: string | null;
    emoji: string | null;
  };
  /** Factores de éxito, escala 70-130 (null si ningún pulse point lo cubre). */
  successFactors: Record<SuccessFactor, number | null>;
  /** Las 3 vistas VS inferidas (LVS/TVS/OVS), todas no-normadas. */
  vsViews: PreSeiVsView[];
}

/**
 * Mapeo v0 (hipótesis, calibrable) de cada vista VS a los drivers que la sustentan.
 * No es OVS/TVS/LVS oficial — es proyección desde la auto-percepción del Pre-SEI.
 *   - LVS (cómo lideras): dirección + crecimiento + logro → MOTIVATION, CHANGE, EXECUTION
 *   - TVS (cómo ves a tu equipo): vínculo + confianza → TEAMWORK, TRUST
 *   - OVS (cómo ves tu organización): ejecución + cambio + confianza → EXECUTION, CHANGE, TRUST
 */
const VS_VIEW_DRIVERS: Record<PreSeiVsScope, { lensKey: string; drivers: DriverCode[] }> = {
  LVS: { lensKey: "preSei.vs.lens.lead", drivers: ["MOTIVATION", "CHANGE", "EXECUTION"] },
  TVS: { lensKey: "preSei.vs.lens.team", drivers: ["TEAMWORK", "TRUST"] },
  OVS: { lensKey: "preSei.vs.lens.org", drivers: ["EXECUTION", "CHANGE", "TRUST"] },
};

/** Escala mínima/máxima de respuesta del Pre-SEI. */
export const ANSWER_MIN = 1;
export const ANSWER_MAX = 5;

/**
 * Mapeo lineal determinista 1-5 → escala Six Seconds 70-130.
 *   1→70, 2→85, 3→100 (norma), 4→115, 5→130.
 * `calculateVitalSigns` asume la escala 70-130 (norm 100) — NO alimentar 1-5 crudo.
 */
export function seiScore(answer: number): number {
  const clamped = Math.min(ANSWER_MAX, Math.max(ANSWER_MIN, answer));
  return 70 + (clamped - 1) * 15;
}

/** ¿Es una respuesta válida del Pre-SEI? (entero 1-5) */
export function isValidAnswer(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= ANSWER_MIN && value <= ANSWER_MAX;
}

/**
 * Valida que `answers` tenga exactamente las 8 claves SEI con valores 1-5.
 * Devuelve null si es válido, o el primer problema encontrado.
 */
export function validateAnswers(answers: unknown): string | null {
  if (typeof answers !== "object" || answers === null) return "answers must be an object";
  const obj = answers as Record<string, unknown>;
  for (const sei of SEI_ORDER) {
    if (!(sei in obj)) return `missing answer for ${sei}`;
    if (!isValidAnswer(obj[sei])) return `invalid answer for ${sei} (must be integer 1-5)`;
  }
  const extra = Object.keys(obj).filter((k) => !(SEI_ORDER as readonly string[]).includes(k));
  if (extra.length > 0) return `unexpected keys: ${extra.join(", ")}`;
  return null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function avg(values: Array<number | null>): number | null {
  const xs = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (xs.length === 0) return null;
  return round1(xs.reduce((a, b) => a + b, 0) / xs.length);
}

/** Computa el resultado determinista del Pre-SEI a partir de 8 respuestas 1-5. */
export function scorePreSei(answers: PreSeiAnswers): PreSeiResult {
  // 1. 8 respuestas 1-5 → 8 competencias 70-130 (mapeo 1:1).
  const competencies = SEI_ORDER.reduce(
    (acc, sei) => {
      acc[sei] = seiScore(answers[sei]);
      return acc;
    },
    {} as Record<SeiKey, number>,
  );

  // 2. K/C/G: promedio por pursuit usando el catálogo.
  const byPursuit = (pursuit: "know" | "choose" | "give") =>
    SEI_COMPETENCIES.filter((c) => c.pursuit === pursuit).map((c) => competencies[c.key]);
  const kcg = {
    K: avg(byPursuit("know")) ?? 100,
    C: avg(byPursuit("choose")) ?? 100,
    G: avg(byPursuit("give")) ?? 100,
  };

  // 3. Pulse points + drivers + arquetipo: REUSO total del motor VS (sin talentos).
  const vs = calculateVitalSigns(competencies, {});

  const topPulsePoints = [...vs.pulsePoints]
    .filter((pp) => typeof pp.score === "number")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .map((pp) => ({ code: pp.code, esName: pp.esName, enName: pp.enName, score: pp.score }));

  const quadrant = vs.quadrant.code;
  const arch = quadrant === "BALANCED" ? null : ROWI_ARCHETYPES[quadrant];
  const archetype = {
    quadrant,
    esName: arch?.esName ?? vs.quadrant.esName,
    enName: arch?.enName ?? vs.quadrant.enName,
    esTagline: arch?.esTagline ?? null,
    enTagline: arch?.enTagline ?? null,
    emoji: arch?.emoji ?? null,
  };

  // 4. Factores de éxito: promedio de los pulse points que listan cada factor.
  const ppScoreByCode = new Map(vs.pulsePoints.map((pp) => [pp.code, pp.score]));
  const factors: SuccessFactor[] = ["Effectiveness", "Relationships", "Wellbeing", "QualityOfLife"];
  const successFactors = factors.reduce(
    (acc, factor) => {
      const scores = PULSE_POINTS.filter((pp) => pp.successFactors.includes(factor)).map(
        (pp) => ppScoreByCode.get(pp.code) ?? null,
      );
      acc[factor] = avg(scores);
      return acc;
    },
    {} as Record<SuccessFactor, number | null>,
  );

  // 5. Vistas VS inferidas (LVS/TVS/OVS) — todas no-normadas (hipótesis).
  const driverByCode = new Map(vs.drivers.map((d) => [d.code, d]));
  const vsViews: PreSeiVsView[] = (Object.keys(VS_VIEW_DRIVERS) as PreSeiVsScope[]).map((scope) => {
    const def = VS_VIEW_DRIVERS[scope];
    const drivers = def.drivers.map((code) => {
      const d = driverByCode.get(code);
      return { code, score: d?.score ?? null, band: d?.band ?? "unknown" };
    });
    const score = avg(drivers.map((d) => d.score));
    return {
      scope,
      lensKey: def.lensKey,
      score,
      band: bandFor(score),
      inferred: true as const,
      normalized: false as const,
      drivers,
    };
  });

  return {
    competencies,
    kcg: { K: round1(kcg.K), C: round1(kcg.C), G: round1(kcg.G) },
    drivers: vs.drivers.map((d) => ({ code: d.code, score: d.score, band: d.band })),
    topPulsePoints,
    archetype,
    successFactors,
    vsViews,
  };
}

/** Banda interna (sin norma) basada en la norma 100, igual que calculate.ts. */
function bandFor(score: number | null): "low" | "mid" | "high" | "unknown" {
  if (score === null) return "unknown";
  if (score < 90) return "low";
  if (score >= 110) return "high";
  return "mid";
}
