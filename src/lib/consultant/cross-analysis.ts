/**
 * 🔬 Cross-Analysis Engine (Consultor)
 * =========================================================
 * Produce los "Hallazgos" que un consultor genera al cruzar datos de
 * Six Seconds: clima de equipo (TVS) ↔ SEI individual, espejo líder↔equipo,
 * deriva temporal (re-medición) y correlaciones EQ → outcomes.
 *
 * Trabaja sobre los BenchmarkDataPoint de un benchmark (el CSV ya importado),
 * separando equipos por `projectCohort`. Reusa las utilidades estadísticas
 * de @/lib/benchmarks/statistics (Pearson, media, desviación).
 *
 * Privacidad: este servicio CALCULA tanto agregados como lecturas
 * individuales (líder, persona puente). Es responsabilidad de quien consume
 * el resultado (generador de informe) decidir qué exponer — el informe
 * cliente usa solo lo agregado; el confidencial del partner puede usar lo
 * individual. Aquí no se filtra; se calcula todo y se etiqueta.
 */

import { prisma } from "@/core/prisma";
import {
  pearsonCorrelation,
  mean,
} from "@/lib/benchmarks/statistics";
import {
  EQ_COMPETENCIES,
  OUTCOMES,
} from "@/lib/benchmarks/column-mapping";
import { hashPersonId } from "@/lib/benchmarks/process-benchmark";

// Norma global Six Seconds: media 100, DE 15.
const NORM = 100;

// Las 8 competencias SEI (sin las 3 pursuits K/C/G) para el espejo y brechas.
const SEI_8 = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;

export interface MetricDelta {
  key: string;
  value: number;
  vsNorm: number; // value - 100
}

export interface CorrelationFinding {
  competencyKey: string;
  outcomeKey: string;
  r: number;
  n: number;
  strength: string;
}

export interface LeaderMirror {
  /** identificador de la persona líder (email hash o índice) — opcional */
  present: boolean;
  /** competencias donde el líder está MUY por encima del equipo (Δ desc) */
  aboveTeam: MetricDelta[];
  /** competencias donde el líder va por debajo del equipo */
  belowTeam: MetricDelta[];
}

export interface TemporalDrift {
  present: boolean;
  /** nº de personas con 2+ tomas */
  peopleWithRetest: number;
  /** movimientos por competencia: positivo = mejoró, negativo = bajó */
  improved: MetricDelta[];
  declined: MetricDelta[];
}

export interface TeamAnalysis {
  projectCohort: string;
  n: number;
  eqAverage: number | null;
  /** fortalezas (vs norma 100) ordenadas desc */
  strengths: MetricDelta[];
  /** brechas (vs norma 100) ordenadas asc (más bajas primero) */
  gaps: MetricDelta[];
}

export interface CrossAnalysisResult {
  benchmarkId: string;
  generatedAtNote: string; // el timestamp lo pone el caller (Date no disponible aquí en cierto contexto)
  totalDataPoints: number;
  teams: TeamAnalysis[];
  /** correlaciones EQ→outcome más fuertes del benchmark completo */
  topCorrelations: CorrelationFinding[];
  /** espejo líder↔equipo (si se indicó un líder por email) */
  leaderMirror: LeaderMirror | null;
  /** deriva temporal de personas re-medidas (por email repetido) */
  temporalDrift: TemporalDrift;
}

export interface CrossAnalysisOptions {
  /** email de la persona líder, para el espejo líder↔equipo (opcional) */
  leaderEmail?: string;
  /** cohorte específica a analizar para el espejo (si hay varias) */
  leaderCohort?: string;
  /** máximo de correlaciones top a devolver */
  topN?: number;
}

type DP = Record<string, any>;

function strengthLabel(r: number): string {
  const a = Math.abs(r);
  if (a >= 0.5) return "strong";
  if (a >= 0.3) return "moderate";
  if (a > 0) return "weak";
  return "none";
}

function vals(points: DP[], key: string): number[] {
  return points
    .map((p) => p[key])
    .filter((v): v is number => typeof v === "number" && !isNaN(v));
}

/** Analiza un equipo (cohorte): EQ promedio, fortalezas y brechas vs norma. */
function analyzeTeam(cohort: string, points: DP[]): TeamAnalysis {
  const eqAverage = mean(vals(points, "eqTotal"));

  const deltas: MetricDelta[] = SEI_8.map((key): MetricDelta => {
    const m = mean(vals(points, key));
    return { key: key as string, value: m ?? 0, vsNorm: (m ?? NORM) - NORM };
  }).filter((d) => d.value > 0);

  const strengths = [...deltas].sort((a, b) => b.vsNorm - a.vsNorm).slice(0, 5);
  const gaps = [...deltas].sort((a, b) => a.vsNorm - b.vsNorm).slice(0, 5);

  return {
    projectCohort: cohort,
    n: points.length,
    eqAverage,
    strengths,
    gaps,
  };
}

/** Correlaciones EQ-competencia → outcome sobre el conjunto completo. */
function computeTopCorrelations(points: DP[], topN: number): CorrelationFinding[] {
  const findings: CorrelationFinding[] = [];

  for (const comp of EQ_COMPETENCIES) {
    const compVals = points.map((p) => p[comp]);
    for (const outcome of OUTCOMES) {
      const outVals = points.map((p) => p[outcome]);
      // Emparejar solo filas con ambos valores presentes.
      const x: number[] = [];
      const y: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const a = compVals[i];
        const b = outVals[i];
        if (typeof a === "number" && !isNaN(a) && typeof b === "number" && !isNaN(b)) {
          x.push(a);
          y.push(b);
        }
      }
      if (x.length < 3) continue; // muestra mínima
      const res = pearsonCorrelation(x, y);
      if (res.strength === "none") continue;
      findings.push({
        competencyKey: comp,
        outcomeKey: outcome,
        r: Number(res.correlation.toFixed(2)),
        n: res.n,
        strength: res.strength,
      });
    }
  }

  return findings
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
    .slice(0, topN);
}

/**
 * Espejo líder↔equipo (por HASH): Δ del SEI del líder vs la media del resto
 * del equipo. El líder se identifica por su pseudónimo estable (sha256 del
 * email, guardado en sourceId) — nunca comparamos emails en claro. Esta es la
 * ruta directa: recibe el hash ya calculado y evita re-hashear.
 */
function computeLeaderMirrorByHash(
  allPoints: DP[],
  leaderHash: string,
  leaderCohort?: string
): LeaderMirror {
  if (!leaderHash) {
    return { present: false, aboveTeam: [], belowTeam: [] };
  }
  const leaderPoints = allPoints.filter((p) => p.sourceId === leaderHash);
  if (leaderPoints.length === 0) {
    return { present: false, aboveTeam: [], belowTeam: [] };
  }
  // Si el líder tiene varias tomas, usar la más reciente.
  const leader = [...leaderPoints].sort((a, b) => {
    const da = a.sourceDate ? new Date(a.sourceDate).getTime() : 0;
    const db = b.sourceDate ? new Date(b.sourceDate).getTime() : 0;
    return db - da;
  })[0];
  const cohort = leaderCohort || leader.projectCohort;
  const team = allPoints.filter(
    (p) => p.projectCohort === cohort && p.sourceId !== leaderHash
  );
  if (team.length === 0) {
    return { present: false, aboveTeam: [], belowTeam: [] };
  }

  const deltas: MetricDelta[] = SEI_8.map((key): MetricDelta | null => {
    const lv = leader[key];
    const tv = mean(vals(team, key));
    if (typeof lv !== "number" || tv === null) return null;
    return { key: key as string, value: lv, vsNorm: Number((lv - tv).toFixed(1)) };
  }).filter((d): d is MetricDelta => d !== null);

  const aboveTeam = deltas.filter((d) => d.vsNorm > 0).sort((a, b) => b.vsNorm - a.vsNorm);
  const belowTeam = deltas.filter((d) => d.vsNorm < 0).sort((a, b) => a.vsNorm - b.vsNorm);

  return { present: true, aboveTeam, belowTeam };
}

/**
 * Espejo líder↔equipo (por EMAIL): wrapper que hashea el email y delega en la
 * ruta por hash. Mantiene el contrato de la fase 2 (runCrossAnalysis usa email).
 */
function computeLeaderMirror(
  allPoints: DP[],
  leaderEmail: string,
  leaderCohort?: string
): LeaderMirror {
  const leaderHash = hashPersonId(leaderEmail);
  if (!leaderHash) {
    return { present: false, aboveTeam: [], belowTeam: [] };
  }
  return computeLeaderMirrorByHash(allPoints, leaderHash, leaderCohort);
}

/** Deriva temporal: personas (mismo hash) medidas 2+ veces. */
function computeTemporalDrift(allPoints: DP[]): TemporalDrift {
  // Agrupar por pseudónimo (sourceId = hash del email).
  const byPerson = new Map<string, DP[]>();
  for (const p of allPoints) {
    const id = p.sourceId;
    if (!id || typeof id !== "string" || !id.startsWith("sha256:")) continue;
    if (!byPerson.has(id)) byPerson.set(id, []);
    byPerson.get(id)!.push(p);
  }

  const retested = [...byPerson.values()].filter((arr) => arr.length >= 2);
  if (retested.length === 0) {
    return { present: false, peopleWithRetest: 0, improved: [], declined: [] };
  }

  // Para cada competencia, promediar el delta (toma más reciente − más antigua).
  const driftByKey: Record<string, number[]> = {};
  for (const arr of retested) {
    const sorted = [...arr].sort((a, b) => {
      const da = a.sourceDate ? new Date(a.sourceDate).getTime() : 0;
      const db = b.sourceDate ? new Date(b.sourceDate).getTime() : 0;
      return da - db;
    });
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    for (const key of [...SEI_8, "eqTotal"]) {
      const a = first[key];
      const b = last[key];
      if (typeof a === "number" && typeof b === "number") {
        if (!driftByKey[key]) driftByKey[key] = [];
        driftByKey[key].push(b - a);
      }
    }
  }

  const deltas: MetricDelta[] = Object.entries(driftByKey)
    .map(([key, arr]) => {
      const avg = mean(arr);
      return { key, value: avg ?? 0, vsNorm: Number((avg ?? 0).toFixed(1)) };
    })
    .filter((d) => d.value !== 0);

  const improved = deltas.filter((d) => d.vsNorm > 0).sort((a, b) => b.vsNorm - a.vsNorm);
  const declined = deltas.filter((d) => d.vsNorm < 0).sort((a, b) => a.vsNorm - b.vsNorm);

  return {
    present: true,
    peopleWithRetest: retested.length,
    improved,
    declined,
  };
}

/**
 * Ejecuta el análisis cruzado completo sobre un benchmark.
 * Carga los data points una vez y deriva todas las lecturas.
 */
export async function runCrossAnalysis(
  benchmarkId: string,
  options: CrossAnalysisOptions = {}
): Promise<CrossAnalysisResult> {
  const topN = options.topN ?? 8;

  const points: DP[] = await prisma.benchmarkDataPoint.findMany({
    where: { benchmarkId },
    // Traemos solo lo necesario para análisis (sin PII salvo lo justo).
    select: {
      projectCohort: true,
      sourceDate: true,
      sourceId: true,
      eqTotal: true,
      EL: true, RP: true, ACT: true, NE: true,
      IM: true, OP: true, EMP: true, NG: true,
      K: true, C: true, G: true,
      effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
      influence: true, decisionMaking: true, community: true, network: true,
      achievement: true, satisfaction: true, balance: true, health: true,
    },
  });

  // Agrupar por cohorte (equipo). Las filas sin cohorte van a "General".
  const byCohort = new Map<string, DP[]>();
  for (const p of points) {
    const c = p.projectCohort || "General";
    if (!byCohort.has(c)) byCohort.set(c, []);
    byCohort.get(c)!.push(p);
  }

  const teams = [...byCohort.entries()]
    .map(([cohort, pts]) => analyzeTeam(cohort, pts))
    .sort((a, b) => b.n - a.n);

  const topCorrelations = computeTopCorrelations(points, topN);

  const leaderMirror = options.leaderEmail
    ? computeLeaderMirror(points, options.leaderEmail, options.leaderCohort)
    : null;

  const temporalDrift = computeTemporalDrift(points);

  return {
    benchmarkId,
    generatedAtNote: "",
    totalDataPoints: points.length,
    teams,
    topCorrelations,
    leaderMirror,
    temporalDrift,
  };
}

// =====================================================================
// Multi-líder — vista primaria del consultor (informe tipo Bancolombia)
// =====================================================================

/** Un líder marcado + su espejo vs el equipo de su cohorte. */
export interface LeaderFinding {
  /** pseudónimo estable (sha256:<hex>) — nunca email en claro */
  personHash: string;
  /** alias legible que dio el consultor (no es PII de análisis). null si no */
  label: string | null;
  /** cohorte/equipo del líder (puede ser null si el data point no la traía) */
  projectCohort: string | null;
  /** espejo líder↔equipo para este líder */
  mirror: LeaderMirror;
}

export interface MultiLeaderAnalysisResult {
  benchmarkId: string;
  totalDataPoints: number;
  /** fortalezas/brechas por equipo (cohorte) */
  teams: TeamAnalysis[];
  /** correlaciones EQ→outcome más fuertes del benchmark completo */
  topCorrelations: CorrelationFinding[];
  /** deriva temporal de personas re-medidas */
  temporalDrift: TemporalDrift;
  /**
   * espejo de CADA líder marcado (ConsultantLeaderAssignment). Si no hay
   * líderes marcados, queda [] (vacío honesto — la UI invita a marcar líderes).
   */
  leaders: LeaderFinding[];
}

/**
 * Vista primaria del consultor: para CADA líder marcado en
 * ConsultantLeaderAssignment, calcula su espejo líder↔equipo, más las
 * correlaciones top y la deriva temporal del benchmark. Carga los data points
 * una sola vez y reutiliza la lógica de espejo por hash (sin re-hashear).
 */
export async function runMultiLeaderAnalysis(
  benchmarkId: string,
  options: { topN?: number } = {}
): Promise<MultiLeaderAnalysisResult> {
  const topN = options.topN ?? 8;

  // Cargar asignaciones de líder y data points en paralelo.
  const [assignments, points] = await Promise.all([
    prisma.consultantLeaderAssignment.findMany({
      where: { benchmarkId },
      orderBy: { createdAt: "asc" },
      select: { personHash: true, projectCohort: true, label: true },
    }),
    prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId },
      select: {
        projectCohort: true,
        sourceDate: true,
        sourceId: true,
        eqTotal: true,
        EL: true, RP: true, ACT: true, NE: true,
        IM: true, OP: true, EMP: true, NG: true,
        K: true, C: true, G: true,
        effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
        influence: true, decisionMaking: true, community: true, network: true,
        achievement: true, satisfaction: true, balance: true, health: true,
      },
    }),
  ]);

  // Agrupar por cohorte (equipo). Las filas sin cohorte van a "General".
  const byCohort = new Map<string, DP[]>();
  for (const p of points) {
    const c = p.projectCohort || "General";
    if (!byCohort.has(c)) byCohort.set(c, []);
    byCohort.get(c)!.push(p);
  }

  const teams = [...byCohort.entries()]
    .map(([cohort, pts]) => analyzeTeam(cohort, pts))
    .sort((a, b) => b.n - a.n);

  const topCorrelations = computeTopCorrelations(points, topN);
  const temporalDrift = computeTemporalDrift(points);

  // Espejo por cada líder marcado, vía hash directo (sin re-hashear emails).
  const leaders: LeaderFinding[] = assignments.map((a) => ({
    personHash: a.personHash,
    label: a.label ?? null,
    projectCohort: a.projectCohort ?? null,
    mirror: computeLeaderMirrorByHash(
      points,
      a.personHash,
      a.projectCohort ?? undefined
    ),
  }));

  return {
    benchmarkId,
    totalDataPoints: points.length,
    teams,
    topCorrelations,
    temporalDrift,
    leaders,
  };
}
