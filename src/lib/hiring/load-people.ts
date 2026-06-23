/**
 * 🗄️ Loader Prisma para el orquestador Hiring.
 *
 * Carga personas (líder + candidatos) desde CommunityMember + EqSnapshot
 * (+ talentos + outcomes) y las convierte en HiringPerson. Calcula también el
 * percentil EQ de cada persona y el perfil benchmark contra BenchmarkDataPoint
 * (mismo método que el endpoint positioning: count below / total).
 *
 * Separa el acceso a datos (este archivo, impuro) de la lógica de cálculo
 * (build-report-data.ts, puro y verificado).
 */
import { prisma } from "@/core/prisma";
import type { HiringPerson, BuildHiringOptions } from "./build-report-data";
import type { HiringReportData, HiringCandidate } from "@/lib/deliverables/reporte-full-hiring";
import type { CompKey } from "@/domains/affinity/lib/affinityEngine";

const COMP_ORDER: CompKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

type SnapshotWithRelations = Awaited<ReturnType<typeof loadSnapshot>>;

async function loadSnapshot(memberId: string) {
  const member = await prisma.communityMember.findUnique({ where: { id: memberId } });
  if (!member) return null;
  const snapshot = await prisma.eqSnapshot.findFirst({
    where: { memberId },
    orderBy: { at: "desc" },
    include: { talents: true, outcomes: true },
  });
  return snapshot ? { member, snapshot } : null;
}

/** Outcome key del CSV/snapshot → clave que entiende understanding135. */
const OUT_KEY: Record<string, string> = {
  Influence: "influence", "Decision Making": "decisionMaking", Community: "community",
  Network: "network", Achievement: "achievement", Satisfaction: "satisfaction",
  Balance: "balance", Health: "health",
};

function toPerson(data: NonNullable<SnapshotWithRelations>, role?: string): HiringPerson {
  const { member, snapshot } = data;
  const comp = Object.fromEntries(
    COMP_ORDER.map((k) => [k, typeof snapshot[k] === "number" ? snapshot[k] : null]),
  ) as Record<CompKey, number | null>;
  const tals: Record<string, number | null> = {};
  for (const t of snapshot.talents) tals[t.key] = typeof t.score === "number" ? t.score : null;
  const outs = snapshot.outcomes.map((o) => ({ key: OUT_KEY[o.key] ?? o.key, score: typeof o.score === "number" ? o.score : null }));
  const eqRaw = (snapshot.K ?? 0) + (snapshot.C ?? 0) + (snapshot.G ?? 0);
  return {
    name: member.name ?? member.email ?? "—",
    eq: eqRaw ? Math.round(eqRaw / 3) : Math.round(avgComp(comp)),
    brain: snapshot.brainStyle ?? member.brainStyle ?? null,
    style: snapshot.answerStyle ?? null,
    leadProfile: snapshot.jobRole ?? member.role ?? null,
    comp, tals, outs, role,
  };
}

function avgComp(comp: Record<CompKey, number | null>): number {
  const vs = COMP_ORDER.map((k) => comp[k]).filter((v): v is number => v != null);
  return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 100;
}

/** Percentil EQ de un valor contra BenchmarkDataPoint (eqTotal). */
async function eqPercentile(value: number): Promise<number> {
  const [total, below] = await Promise.all([
    prisma.benchmarkDataPoint.count({ where: { eqTotal: { not: null } } }),
    prisma.benchmarkDataPoint.count({ where: { eqTotal: { lt: value } } }),
  ]);
  return total === 0 ? 50 : Math.round((below / total) * 100);
}

export interface LoadHiringInput {
  leaderMemberId: string;
  candidateMemberIds: string[];
  process: string;
  meta?: string;
}

/**
 * Carga todo y devuelve { leader, candidates, options } listos para
 * buildHiringReportData. Si no hay snapshot de alguien, lo omite (vacío honesto).
 */
export async function loadHiringPeople(input: LoadHiringInput): Promise<{
  leader: HiringPerson; candidates: HiringPerson[]; options: BuildHiringOptions;
} | null> {
  const leaderData = await loadSnapshot(input.leaderMemberId);
  if (!leaderData) return null;
  const leader = toPerson(leaderData, "Líder del proceso");

  const candData = (await Promise.all(input.candidateMemberIds.map(loadSnapshot))).filter(
    (x): x is NonNullable<typeof x> => x !== null,
  );
  const candidates = candData.map((d) => toPerson(d, "Candidata"));
  if (candidates.length === 0) return null;

  const options = await buildOptionsFromPeople(leader, candidates, input.process, input.meta);
  return { leader, candidates, options };
}

/**
 * Calcula el BuildHiringOptions (percentiles EQ + benchmark + competencias vs
 * top) a partir de personas YA cargadas — independiente de su origen
 * (CommunityMember o CSV). Toca BenchmarkDataPoint (= pool Rowiverse), no PII.
 * Lo reusan tanto loadHiringPeople (workspace) como /api/hiring/analyze (CSV).
 */
export async function buildOptionsFromPeople(
  leader: HiringPerson,
  candidates: HiringPerson[],
  process: string,
  meta?: string,
): Promise<BuildHiringOptions> {
  // Percentiles EQ (líder + candidatos) contra el benchmark global.
  const eqPercentileByName: Record<string, number> = {};
  const all = [leader, ...candidates];
  await Promise.all(all.map(async (p) => { eqPercentileByName[p.name] = await eqPercentile(p.eq); }));

  // Perfil benchmark agregado (población + top performers) por competencia.
  const benchmark = await buildBenchmarkBlock(candidates);
  const competenciesByName: Record<string, HiringCandidate["competencies"]> = {};
  const compsAtTopLevelByName: Record<string, number> = {};
  const pctOfTopsBelowByName: Record<string, number> = {};
  // Líder + candidatos: el reporte rico muestra al líder en el ranking EQ, las
  // fichas benchmark y la tabla LVS junto a los candidatos.
  for (const c of all) {
    let atTop = 0;
    competenciesByName[c.name] = COMP_ORDER.map((k) => {
      const score = c.comp[k] ?? 0;
      const top = benchmark.topPerformers[k] ?? 999;
      const pop = benchmark.population[k] ?? 100;
      if (score >= top) atTop++;
      return { key: k, score, pctl: pctRank(score, pop), vsTop: Math.round((score - top) * 10) / 10 };
    });
    compsAtTopLevelByName[c.name] = atTop;
    pctOfTopsBelowByName[c.name] = eqPercentileByName[c.name] ?? 0;
  }

  return {
    process,
    meta: meta ?? `SEI · ${benchmark.nTotal.toLocaleString()} benchmark`,
    benchmark, eqPercentileByName, competenciesByName, compsAtTopLevelByName, pctOfTopsBelowByName,
  };
}

/** Percentil aproximado de un score vs media poblacional (DE≈15). */
function pctRank(score: number, popMean: number): number {
  const z = (score - popMean) / 15;
  // CDF normal aproximada
  const p = 0.5 * (1 + Math.tanh(z * 0.7978845608));
  return Math.max(1, Math.min(99, Math.round(p * 100)));
}

/** Bloque benchmark: población (media por comp) + top performers (p90 por comp). */
async function buildBenchmarkBlock(_candidates: HiringPerson[]): Promise<HiringReportData["benchmark"]> {
  const points = await prisma.benchmarkDataPoint.findMany({
    where: { eqTotal: { not: null } },
    select: {
      EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
      eqTotal: true, K: true, C: true, G: true, sector: true,
      effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
    },
    take: 50000,
  });
  const population: Record<string, number> = {};
  const topPerformers: Record<string, number> = {};
  const nTotal = points.length;
  // "overall success" = media de los 4 outcomes; umbral p90 = top performers.
  const overall = (p: (typeof points)[number]): number | null => {
    const xs = [p.effectiveness, p.relationships, p.qualityOfLife, p.wellbeing].filter((v): v is number => v != null);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const o4 = points.map(overall).filter((v): v is number => v != null).sort((a, b) => a - b);
  const threshold = o4.length ? o4[Math.floor(o4.length * 0.9)] : 100;
  const tops = points.filter((p) => (overall(p) ?? 0) >= threshold);
  for (const k of COMP_ORDER) {
    population[k] = mean(points.map((p) => p[k]).filter((v): v is number => v != null));
    topPerformers[k] = mean(tops.map((p) => p[k]).filter((v): v is number => v != null));
  }
  // EQ total + las 3 búsquedas (Know/Choose/Give) — filas del perfil top performer.
  const PURSUIT_KEYS = ["EQ", "K", "C", "G"] as const;
  const fieldOf = (p: (typeof points)[number], k: string) =>
    k === "EQ" ? p.eqTotal : k === "K" ? p.K : k === "C" ? p.C : p.G;
  for (const k of PURSUIT_KEYS) {
    population[k] = mean(points.map((p) => fieldOf(p, k)).filter((v): v is number => v != null));
    topPerformers[k] = mean(tops.map((p) => fieldOf(p, k)).filter((v): v is number => v != null));
  }
  const distinctive = COMP_ORDER
    .map((k) => [k, Math.round((topPerformers[k] - population[k]) * 10) / 10] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  // Sector salud (referencia, n y EQ medio) — el reporte rico lo menciona.
  const nHealthcare = points.filter((p) => /health|saúde|salud|sa[uú]de/i.test(p.sector ?? "")).length;
  return {
    nTotal, nTop: tops.length, threshold: Math.round(threshold * 10) / 10, nHealthcare,
    population, topPerformers, distinctive,
  };
}

function mean(xs: number[]): number {
  return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0;
}
