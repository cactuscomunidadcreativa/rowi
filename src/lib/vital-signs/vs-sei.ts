/**
 * Cross-instrument (Vital Signs ↔ SEI) correlation engine, cohort-level.
 *
 * Each cohort (org/team/study) is measured on BOTH a VS instrument (OVS/TVS/LVS)
 * and SEI; we store the aggregate mean per dimension/competency. Correlations are
 * computed ACROSS cohorts (each cohort is one data point) — so they only become
 * meaningful once several cohorts exist. Data is aggregated/anonymous by design.
 */

import Papa from "papaparse";
import { prisma } from "@/core/prisma";
import { SOH_COLUMN_MAPPING, EQ_COMPETENCIES } from "@/lib/benchmarks/column-mapping";

export interface AggregateMetric {
  key: string;
  level: string;
  mean: number;
  n: number;
}

// SEI keys we aggregate: the 8 competencies + K/C/G + overall EQ.
const SEI_KEYS = [...EQ_COMPETENCIES, "eqTotal"];
const SEI_CORE = new Set(["K", "C", "G", "eqTotal"]);

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Aggregate an SEI CSV export into per-competency means using the same column
 * mapping as the benchmark importer. Returns null-safe means over present rows.
 */
export function aggregateSeiCsv(csv: string): {
  metrics: AggregateMetric[];
  sampleSize: number;
  errors: string[];
} {
  const errors: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const headers = parsed.meta.fields ?? [];

  const headerToKey: Record<string, string> = {};
  for (const h of headers) {
    const mapped = SOH_COLUMN_MAPPING[h];
    if (mapped && SEI_KEYS.includes(mapped)) headerToKey[h] = mapped;
  }
  if (Object.keys(headerToKey).length === 0) {
    errors.push(
      "No se encontraron columnas SEI reconocidas (p.ej. 'Enhance Emotional Literacy Score', 'Overall EQ').",
    );
    return { metrics: [], sampleSize: 0, errors };
  }

  const sums: Record<string, { sum: number; n: number }> = {};
  let rowCount = 0;
  for (const row of parsed.data) {
    let rowHasValue = false;
    for (const [h, key] of Object.entries(headerToKey)) {
      const v = toNum(row[h]);
      if (v !== null) {
        const acc = sums[key] ?? (sums[key] = { sum: 0, n: 0 });
        acc.sum += v;
        acc.n += 1;
        rowHasValue = true;
      }
    }
    if (rowHasValue) rowCount++;
  }

  const metrics: AggregateMetric[] = Object.entries(sums).map(([key, { sum, n }]) => ({
    key,
    level: SEI_CORE.has(key) ? "core" : "competency",
    mean: n > 0 ? sum / n : 0,
    n,
  }));
  return { metrics, sampleSize: rowCount, errors };
}

function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const d = Math.sqrt(dx * dy);
  return d === 0 ? 0 : num / d;
}

const MIN_COHORTS = 3; // need at least 3 cohorts for a correlation to be reported

/**
 * Recompute all VS↔SEI correlations across cohorts. Full recompute: clears and
 * rebuilds VsSeiCorrelation. Computes per vsScope (OVS/TVS/LVS) and "ALL".
 */
export async function recomputeVsSeiCorrelations() {
  const cohorts = await prisma.vsSeiCohort.findMany({ include: { metrics: true } });

  type Cohort = { vsScope: string; vs: Map<string, number>; sei: Map<string, number> };
  const data: Cohort[] = cohorts.map((c) => {
    const vs = new Map<string, number>();
    const sei = new Map<string, number>();
    for (const m of c.metrics) {
      if (m.instrument === "VS") vs.set(m.key, m.mean);
      else if (m.instrument === "SEI") sei.set(m.key, m.mean);
    }
    return { vsScope: c.vsScope, vs, sei };
  });

  const vsKeys = new Set<string>();
  const seiKeys = new Set<string>();
  for (const c of data) {
    c.vs.forEach((_, k) => vsKeys.add(k));
    c.sei.forEach((_, k) => seiKeys.add(k));
  }

  const scopes = new Set<string>(["ALL", ...data.map((d) => d.vsScope)]);

  await prisma.vsSeiCorrelation.deleteMany({});

  let written = 0;
  for (const scope of scopes) {
    const subset = scope === "ALL" ? data : data.filter((d) => d.vsScope === scope);
    for (const vk of vsKeys) {
      for (const sk of seiKeys) {
        const xs: number[] = [];
        const ys: number[] = [];
        for (const c of subset) {
          const x = c.vs.get(vk);
          const y = c.sei.get(sk);
          if (x !== undefined && y !== undefined) {
            xs.push(x);
            ys.push(y);
          }
        }
        if (xs.length < MIN_COHORTS) continue;
        await prisma.vsSeiCorrelation.create({
          data: { vsScope: scope, vsKey: vk, seiKey: sk, correlation: pearson(xs, ys), n: xs.length },
        });
        written++;
      }
    }
  }
  return { cohorts: cohorts.length, written };
}

/**
 * Render the strongest VS↔SEI correlations (by |r|) as a compact text block to
 * ground the research agent. Returns null when there is nothing to inject (no
 * cohorts have reached MIN_COHORTS yet) so the caller can skip the block
 * instead of feeding the model an empty table. Capped at `limit` rows to keep
 * the system prompt within the research token budget.
 */
export async function buildVsSeiCorrelationContext(limit = 20): Promise<string | null> {
  const cohortCount = await prisma.vsSeiCohort.count();
  const correlations = await prisma.vsSeiCorrelation.findMany({
    orderBy: { correlation: "desc" },
  });
  if (correlations.length === 0) {
    return cohortCount > 0
      ? `DATOS VS↔SEI (vivos): hay ${cohortCount} cohorte(s) cargada(s) pero ninguna correlación supera el mínimo de ${MIN_COHORTS} cohortes con datos pareados. No reportes correlaciones todavía; recomienda cargar más cohortes.`
      : null;
  }

  const top = [...correlations]
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, limit);

  const lines = top.map(
    (c) =>
      `- [${c.vsScope}] ${c.vsKey} ↔ ${c.seiKey}: r=${c.correlation.toFixed(2)} (n=${c.n} cohortes)`,
  );

  return [
    `DATOS VS↔SEI (vivos, nivel cohorte, anónimos) — ${cohortCount} cohorte(s), ${correlations.length} correlaciones calculadas.`,
    `Estas son CORRELACIONES REALES del rowiverse (Pearson entre medias de cohorte; cada cohorte = 1 punto). Cítalas con su r y n; NO inventes valores fuera de esta lista. r alto con n bajo es frágil.`,
    `Top ${top.length} por |r|:`,
    ...lines,
  ].join("\n");
}
