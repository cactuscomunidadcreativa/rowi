/**
 * 🏭 Orquestador Hiring: personas (SEI) → HiringReportData.
 *
 * Reemplaza los JSONs de /tmp del smoke test: a partir de un líder + N
 * candidatos (cada uno con sus 8 competencias SEI, 18 talentos, 8 outcomes,
 * brain style, EQ), invoca los motores REALES del repo y produce el
 * HiringReportData que consume buildReporteFullHiring / buildPerfilCandidato.
 *
 * Es un PORT fiel de los scripts de referencia (affinity-hiring / lvs-hiring):
 * misma calibración por contexto (ROUTE_CFG), mismas vistas LVS, mismo cálculo
 * de bandas. La parte pura (este archivo) no toca Prisma — recibe las personas
 * ya cargadas; el loader Prisma vive en build-report-data.prisma.ts.
 */
import {
  compAffinity135, collaboration135, understanding135, talentSynergyFactor,
  closenessMultiplier, collScoreBBP, CTX, clamp, to100, seiLevel135,
  type Project, type CompKey,
} from "@/domains/affinity/lib/affinityEngine";
import { calculateVitalSigns } from "@/lib/vital-signs/calculate";
import type { HiringReportData, HiringCandidate } from "@/lib/deliverables/reporte-full-hiring";

// ── Persona de entrada (lo que el loader Prisma produce) ──
export interface HiringPerson {
  name: string;
  eq: number;
  brain: string | null; // brain brief profile
  style: string | null; // change style
  leadProfile: string | null; // influence/lead profile
  comp: Record<CompKey, number | null>; // 8 competencias 70-130
  tals: Record<string, number | null>; // 18 talentos 70-130 (claves camelCase del engine)
  outs: { key: string; score: number | null }[]; // 8 outcomes
  role?: string; // "Candidata" | "Líder del proceso"
}

const CONTEXTS: Project[] = ["leadership", "execution", "innovation", "decision", "conversation", "relationship"];

// Calibración por contexto (port de affinity-hiring.mts ROUTE_CFG).
const ROUTE_CFG: Record<Project, { cal: number; bonus: { keys: string[]; mult: number } | null }> = {
  leadership: { cal: 0.94, bonus: null },
  execution: { cal: 0.90, bonus: { keys: ["prioritizing", "commitment", "problemSolving"], mult: 1.04 } },
  innovation: { cal: 0.93, bonus: { keys: ["imagination", "vision", "design", "riskTolerance"], mult: 1.05 } },
  decision: { cal: 0.96, bonus: { keys: ["criticalThinking", "dataMining", "modeling", "problemSolving"], mult: 1.03 } },
  conversation: { cal: 0.95, bonus: { keys: ["connection", "reflecting", "collaboration", "adaptability"], mult: 1.05 } },
  relationship: { cal: 0.92, bonus: null },
};

interface AffinityCell { heat135: number; band: "hot" | "warm" | "cold" }

/** Afinidad de un contexto entre líder a y candidato b (port exacto). */
function affinity(a: HiringPerson, b: HiringPerson, project: Project): AffinityCell {
  const cfg = ROUTE_CFG[project];
  const { score: growth, growth: growthRaw } = compAffinity135(a.comp, b.comp, project);
  const tFactor = talentSynergyFactor(project, a.tals, b.tals);
  const collab = collaboration135(a.brain, b.brain, a.comp, b.comp, tFactor);
  const understand = understanding135(a.outs, b.outs, project);
  const W = CTX[project];
  const closeAdj = closenessMultiplier("neutral");
  let composite135 = (W.growth * growth + W.collab * collab + W.understand * understand) * cfg.cal * closeAdj;
  if (cfg.bonus) {
    const shared = cfg.bonus.keys.filter((tk) => (b.tals[tk] ?? 0) >= 108 && (a.tals[tk] ?? 0) >= 108);
    if (shared.length >= 2) composite135 *= cfg.bonus.mult;
  }
  if (project === "leadership") {
    const vals = Object.values(a.comp).filter((v): v is number => v != null);
    const dMean = vals.length > 1 ? vals.reduce((s, v) => s + Math.abs(v - (growthRaw ?? 67.5)), 0) / vals.length : 0;
    if (dMean > 15) composite135 *= 0.95;
  }
  composite135 = clamp(composite135, 0, 135);
  return { heat135: Math.round(composite135), band: composite135 >= 108 ? "hot" : composite135 >= 92 ? "warm" : "cold" };
}

// Vistas LVS (port de lvs-hiring.mts): LVS = Motivación + Cambio + Ejecución.
const LVS_DRIVERS = ["MOTIVATION", "CHANGE", "EXECUTION"];
const bandOf = (s: number | null): "low" | "mid" | "high" => (s == null ? "mid" : s < 90 ? "low" : s >= 110 ? "high" : "mid");

// Talentos: el engine usa camelCase; calculateVitalSigns usa lowercase. Mapa.
const TAL_VS_KEY: Record<string, string> = {
  dataMining: "datamining", emotionalInsight: "emotionalinsight", criticalThinking: "criticalthinking",
  riskTolerance: "risktolerance", problemSolving: "problemsolving", design: "designing",
};
function talsForVs(tals: Record<string, number | null>): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const [k, v] of Object.entries(tals)) out[TAL_VS_KEY[k] ?? k.toLowerCase()] = v;
  return out;
}

/** LVS inferido + 5 drivers de una persona (port). */
function lvsOf(p: HiringPerson): { score: number; band: "low" | "mid" | "high"; drivers: { code: string; score: number; band: "low" | "mid" | "high" }[] } {
  const vs = calculateVitalSigns(p.comp, talsForVs(p.tals));
  const drivers = vs.drivers
    .filter((d) => typeof d.score === "number")
    .map((d) => ({ code: d.code, score: Math.round(d.score as number), band: bandOf(d.score) }));
  const lvsDrivers = vs.drivers.filter((d) => LVS_DRIVERS.includes(d.code) && typeof d.score === "number");
  const lvsScore = lvsDrivers.length ? Math.round((lvsDrivers.reduce((s, d) => s + (d.score as number), 0) / lvsDrivers.length)) : 0;
  return { score: lvsScore, band: bandOf(lvsScore), drivers };
}

const COMP_ORDER: CompKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

/** Capacidad ponderada de una persona en un contexto (para el delta relacional). */
function weightedCapability(p: HiringPerson, project: Project): number {
  const W = CTX[project];
  const comps = COMP_ORDER.map((k) => p.comp[k]).filter((v): v is number => v != null);
  const compAvg = comps.length ? comps.reduce((a, b) => a + b, 0) / comps.length : 100;
  // proxy: media de competencias escalada por el peso growth del contexto (suficiente
  // para el signo del delta — el reporte muestra +N/sync/-N, no el valor absoluto).
  return compAvg * (0.8 + 0.4 * W.growth);
}

export interface BuildHiringOptions {
  process: string;
  meta: string;
  /** benchmark agregado: percentil EQ por persona + perfil top performer. */
  benchmark: HiringReportData["benchmark"];
  /** percentil EQ por nombre (del benchmark). Si falta uno → 50. */
  eqPercentileByName: Record<string, number>;
  /** competencias por persona vs benchmark: score/pctl/vsTop por comp. */
  competenciesByName: Record<string, HiringCandidate["competencies"]>;
  compsAtTopLevelByName: Record<string, number>;
  pctOfTopsBelowByName: Record<string, number>;
}

/**
 * PURO: arma el HiringReportData a partir de las personas + datos de benchmark.
 * leader = primera persona con role "líder"/leadProfile o la marcada; el resto
 * son candidatos. Ordena candidatos por afinidad desc.
 */
export function buildHiringReportData(leader: HiringPerson, candidates: HiringPerson[], opts: BuildHiringOptions): HiringReportData {
  const cands: HiringCandidate[] = candidates.map((c) => {
    const byCtx: Record<string, number> = {};
    const bands: Record<string, "hot" | "warm" | "cold"> = {};
    for (const ctx of CONTEXTS) {
      const cell = affinity(leader, c, ctx);
      byCtx[ctx] = cell.heat135;
      bands[ctx] = cell.band;
    }
    const avg135 = Math.round(CONTEXTS.reduce((s, k) => s + byCtx[k], 0) / CONTEXTS.length);
    const lvs = lvsOf(c);
    // relationalDelta: capacidad del candidato menos la del líder por contexto.
    const relationalDelta: Record<string, number> = {};
    for (const ctx of CONTEXTS) {
      relationalDelta[ctx] = Math.round((weightedCapability(c, ctx) - weightedCapability(leader, ctx)) * 10) / 10;
    }
    return {
      name: c.name, role: c.role ?? "Candidata", eq: c.eq, brain: c.brain ?? "—",
      changeStyle: c.style ?? "—", influence: c.leadProfile ?? "—",
      affinityAvg: avg135, affinityByContext: byCtx, affinityBands: bands,
      eqPercentile: Math.round(opts.eqPercentileByName[c.name] ?? 50),
      compsAtTopLevel: opts.compsAtTopLevelByName[c.name] ?? 0,
      pctOfTopsBelow: Math.round(opts.pctOfTopsBelowByName[c.name] ?? 0),
      competencies: opts.competenciesByName[c.name] ?? COMP_ORDER.map((k) => ({ key: k, score: c.comp[k] ?? 0, pctl: 50, vsTop: 0 })),
      relationalDelta,
      lvs: { score: lvs.score, band: lvs.band },
      lvsDrivers: lvs.drivers,
    };
  });
  cands.sort((a, b) => b.affinityAvg - a.affinityAvg);

  const leaderLvs = lvsOf(leader);
  const leaderPct = Math.round(opts.eqPercentileByName[leader.name] ?? 50);
  const bandWord = leaderLvs.band === "high" ? "alta" : leaderLvs.band === "low" ? "baja" : "media";
  const leaderMeta = `EQ ${leader.eq} · percentil mundial ${leaderPct} · LVS inferido ${leaderLvs.score} (${bandWord}) · ${leader.brain ?? "—"} · ${leader.leadProfile ?? "—"} · ${leader.style ?? "—"}`;

  return {
    process: opts.process,
    meta: opts.meta,
    leaderName: leader.name,
    leaderMeta,
    candidates: cands,
    benchmark: opts.benchmark,
  };
}
