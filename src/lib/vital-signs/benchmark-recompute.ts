/**
 * VS Benchmark recompute — el "cerebrito" agregador.
 *
 * Lee VitalSignsScoreSource (contributesToBenchmark=true) y materializa:
 *   - VitalSignsBenchmarkStat   (n, mean, sd, percentiles por slice demográfico)
 *   - VitalSignsBenchmarkCorrelation (Pearson r entre dimensiones del mismo scope)
 *
 * Granularidad: para Stat, computamos múltiples slices automáticamente
 * (global, por country, por gender, por ageRange, por sector). Para
 * Correlation, computamos pares dentro de un scope sobre cohortes
 * compartidas (respondent-level si possible, score-source row es
 * per-respondent).
 *
 * Idempotente vía upsert sobre el unique compuesto.
 */

import { prisma } from "@/core/prisma";

export type VitalSignsScope = "OVS" | "TVS" | "LVS" | "FVS";

interface RecomputeOptions {
  scope?: VitalSignsScope;       // optional filter; null = all scopes
  sourceKind?: "measured" | "inferred" | "combined";  // default "measured"
}

interface SourceRow {
  scope: string;
  dimension: string;
  level: string;
  value: number;
  country: string | null;
  region: string | null;
  sector: string | null;
  ageRange: string | null;
  gender: string | null;
  assessmentId: string | null;
}

const PERCENTILES = [0.10, 0.25, 0.50, 0.75, 0.90] as const;

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const idx = p * (sortedAsc.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  const frac = idx - lo;
  return sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac;
}

function meanSd(values: number[]): { mean: number; sd: number } {
  if (values.length === 0) return { mean: 0, sd: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (values.length === 1) return { mean, sd: 0 };
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1);
  return { mean, sd: Math.sqrt(variance) };
}

function pearson(xs: number[], ys: number[]): { r: number; n: number } {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return { r: 0, n };
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  return { r: denom === 0 ? 0 : num / denom, n };
}

// ----- Stats -------------------------------------------------------------

interface StatKey {
  scope: string;
  dimension: string;
  level: string;
  sourceKind: string;
  country: string | null;
  region: string | null;
  sector: string | null;
  ageRange: string | null;
  gender: string | null;
}

function statKey(k: StatKey): string {
  return [
    k.scope, k.dimension, k.level, k.sourceKind,
    k.country ?? "_", k.region ?? "_", k.sector ?? "_",
    k.ageRange ?? "_", k.gender ?? "_",
  ].join("|");
}

/**
 * Compute one Stat row from a value bucket.
 */
function statsFromBucket(values: number[]) {
  const { mean, sd } = meanSd(values);
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n: values.length,
    mean,
    sd: values.length > 1 ? sd : null,
    p10: percentile(sorted, 0.10),
    p25: percentile(sorted, 0.25),
    p50: percentile(sorted, 0.50),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.90),
  };
}

/**
 * For a given source row, generate the slice keys it contributes to.
 * Global + each single-axis slice (country, gender, ageRange, sector).
 * (Multi-axis slices are intentionally omitted to keep cardinality bounded.)
 */
function slicesForRow(r: SourceRow, sourceKind: string): StatKey[] {
  const base = { scope: r.scope, dimension: r.dimension, level: r.level, sourceKind };
  const slices: StatKey[] = [
    { ...base, country: null, region: null, sector: null, ageRange: null, gender: null },
  ];
  if (r.country) slices.push({ ...base, country: r.country, region: null, sector: null, ageRange: null, gender: null });
  if (r.gender)  slices.push({ ...base, country: null, region: null, sector: null, ageRange: null, gender: r.gender });
  if (r.ageRange) slices.push({ ...base, country: null, region: null, sector: null, ageRange: r.ageRange, gender: null });
  if (r.sector) slices.push({ ...base, country: null, region: null, sector: r.sector, ageRange: null, gender: null });
  return slices;
}

export async function recomputeBenchmarkStats(opts: RecomputeOptions = {}) {
  const sourceKind = opts.sourceKind ?? "measured";

  const where = {
    contributesToBenchmark: true,
    ...(opts.scope ? { scope: opts.scope } : {}),
    ...(sourceKind !== "combined" ? { sourceKind } : {}),
  };

  console.log("[recomputeBenchmarkStats] querying source rows…", where);
  const rows = await prisma.vitalSignsScoreSource.findMany({
    where,
    select: {
      scope: true, dimension: true, level: true, value: true,
      country: true, region: true, sector: true, ageRange: true, gender: true,
      assessmentId: true,
    },
  });
  console.log(`[recomputeBenchmarkStats] ${rows.length} rows`);

  // Bucket
  const buckets = new Map<string, { key: StatKey; values: number[] }>();
  for (const r of rows) {
    for (const key of slicesForRow(r, sourceKind)) {
      const id = statKey(key);
      let bucket = buckets.get(id);
      if (!bucket) {
        bucket = { key, values: [] };
        buckets.set(id, bucket);
      }
      bucket.values.push(r.value);
    }
  }

  console.log(`[recomputeBenchmarkStats] ${buckets.size} slice buckets`);

  // Write — Prisma's compound-unique WhereUnique type is non-null even when
  // the underlying fields are nullable, so we go findFirst + update/create.
  let written = 0;
  for (const { key, values } of buckets.values()) {
    if (values.length === 0) continue;
    const stats = statsFromBucket(values);
    const existing = await prisma.vitalSignsBenchmarkStat.findFirst({
      where: {
        scope: key.scope,
        dimension: key.dimension,
        level: key.level,
        sourceKind: key.sourceKind,
        country: key.country,
        region: key.region,
        sector: key.sector,
        ageRange: key.ageRange,
        gender: key.gender,
      },
      select: { id: true },
    });
    if (existing) {
      await prisma.vitalSignsBenchmarkStat.update({
        where: { id: existing.id },
        data: { ...stats, calculatedAt: new Date(), version: { increment: 1 } },
      });
    } else {
      await prisma.vitalSignsBenchmarkStat.create({
        data: { ...key, ...stats, version: 1 },
      });
    }
    written++;
  }
  console.log(`[recomputeBenchmarkStats] ${written} stats written`);
  return { rows: rows.length, buckets: buckets.size, written };
}

// ----- Correlations ------------------------------------------------------

/**
 * Within-instrument correlations: pair every dimension with every other
 * dimension in the same scope. Cohort is the respondent (assessmentId is the
 * proxy for a single-org sample; ideally we'd pair per-respondent but that
 * info isn't carried — score-source rows are denormalized).
 *
 * Strategy: build a wide table per (scope, country|null, region|null,
 * sector|null) where columns = dimension values for that respondent index.
 * Since one respondent has N rows (one per dimension), we need a respondent
 * id. We use a synthetic respondent id from the order within (assessmentId)
 * — works because per-assessment dimensions appear in stable order.
 *
 * Simpler: use (assessmentId, rowIndex-within-dimension) pairing.
 *
 * Even simpler (and what we do here): aggregate by (assessmentId, dimension)
 * → mean, then correlate across assessments. This gives an inter-assessment
 * correlation (good for benchmark-level driver↔outcome), not within-respondent.
 * Within-respondent correlation needs a respondent_id we don't currently
 * persist; that's a future enhancement.
 */
export async function recomputeBenchmarkCorrelations(opts: RecomputeOptions = {}) {
  const sourceKind = opts.sourceKind ?? "measured";

  const where = {
    contributesToBenchmark: true,
    ...(opts.scope ? { scope: opts.scope } : {}),
    ...(sourceKind !== "combined" ? { sourceKind } : {}),
  };

  const rows = await prisma.vitalSignsScoreSource.findMany({
    where,
    select: {
      scope: true, dimension: true, value: true,
      country: true, region: true, sector: true,
      assessmentId: true,
    },
  });
  console.log(`[recomputeBenchmarkCorrelations] ${rows.length} rows`);

  // Per-respondent paired vectors require a respondent id. Since score-source
  // is per-respondent but doesn't expose its respondent id (anonymous), we
  // proxy by row-ordinal within (assessmentId, dimension). This is correct
  // when buildOvsScoreSources iterates respondents deterministically — which
  // it does (insertion order preserved by Prisma createMany).
  //
  // Group: scope → assessment → dimension → values[]
  type ByDim = Map<string, number[]>;
  type ByAssess = Map<string, ByDim>;
  const byScope: Map<string, ByAssess> = new Map();

  for (const r of rows) {
    if (!r.assessmentId) continue;
    let byAssess = byScope.get(r.scope);
    if (!byAssess) { byAssess = new Map(); byScope.set(r.scope, byAssess); }
    let byDim = byAssess.get(r.assessmentId);
    if (!byDim) { byDim = new Map(); byAssess.set(r.assessmentId, byDim); }
    let arr = byDim.get(r.dimension);
    if (!arr) { arr = []; byDim.set(r.dimension, arr); }
    arr.push(r.value);
  }

  // For each scope, compute Pearson per dimension pair within each assessment,
  // then aggregate (weighted mean of r across assessments).
  let written = 0;
  for (const [scope, byAssess] of byScope.entries()) {
    const pairAccumulator = new Map<
      string,
      { sumWeightedR: number; sumW: number; nTotal: number }
    >();

    for (const [, byDim] of byAssess.entries()) {
      const dims = Array.from(byDim.keys()).sort();
      for (let i = 0; i < dims.length; i++) {
        for (let j = i + 1; j < dims.length; j++) {
          const xKey = dims[i];
          const yKey = dims[j];
          const xs = byDim.get(xKey)!;
          const ys = byDim.get(yKey)!;
          const len = Math.min(xs.length, ys.length);
          if (len < 3) continue;
          const { r } = pearson(xs.slice(0, len), ys.slice(0, len));
          const id = `${xKey}|${yKey}`;
          let acc = pairAccumulator.get(id);
          if (!acc) { acc = { sumWeightedR: 0, sumW: 0, nTotal: 0 }; pairAccumulator.set(id, acc); }
          acc.sumWeightedR += r * len;
          acc.sumW += len;
          acc.nTotal += len;
        }
      }
    }

    for (const [id, acc] of pairAccumulator.entries()) {
      const [xKey, yKey] = id.split("|");
      const r = acc.sumW > 0 ? acc.sumWeightedR / acc.sumW : 0;

      const existing = await prisma.vitalSignsBenchmarkCorrelation.findFirst({
        where: { scope, xKey, yKey, country: null, region: null, sector: null },
        select: { id: true },
      });
      if (existing) {
        await prisma.vitalSignsBenchmarkCorrelation.update({
          where: { id: existing.id },
          data: { correlation: r, n: acc.nTotal, calculatedAt: new Date() },
        });
      } else {
        await prisma.vitalSignsBenchmarkCorrelation.create({
          data: {
            scope,
            xKey, xLevel: "auto",
            yKey, yLevel: "auto",
            correlation: r,
            n: acc.nTotal,
            country: null, region: null, sector: null,
          },
        });
      }
      written++;
    }
  }

  console.log(`[recomputeBenchmarkCorrelations] ${written} correlations written`);
  return { rows: rows.length, written };
}

export async function recomputeAll(opts: RecomputeOptions = {}) {
  const stats = await recomputeBenchmarkStats(opts);
  const correlations = await recomputeBenchmarkCorrelations(opts);
  return { stats, correlations };
}
