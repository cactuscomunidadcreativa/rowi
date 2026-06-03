/**
 * Pre-SEI — adaptador entre la normativa pura (`StatFetcher` síncrono, reusa
 * `withFallbackSync`) y `BenchmarkStatistic` en la base.
 *
 * `withFallbackSync` necesita un fetcher SÍNCRONO; una query a Postgres es
 * asíncrona. Resolvemos pre-cargando una vez TODAS las stats candidatas para las
 * 8 competencias del benchmark ROWIVERSE activo, y devolviendo un closure
 * síncrono que las lee en memoria. Sin benchmark cargado → fetcher que siempre
 * devuelve null (la normativa degrada a bandas internas).
 */
import { prisma } from "@/core/prisma";
import type { FallbackContext } from "@/lib/benchmarks/fallback";
import type { CompetencyStat, StatFetcher } from "@/lib/pre-sei/normative";
import { SEI_ORDER } from "@/lib/pre-sei/questions";
import type { SeiKey } from "@/lib/vital-signs/catalog";

/** Normaliza un valor de filtro para la clave de matcheo. */
function norm(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}

/**
 * Clave de un registro de stat por (metricKey + filtros demográficos que usa la
 * cadena de fallback). Solo consideramos country/region/sector porque son los
 * campos que `FALLBACK_CHAIN` conserva; ageRange/gender se filtran aparte.
 */
function ctxKey(sei: SeiKey, ctx: FallbackContext): string {
  return [sei, norm(ctx.country), norm(ctx.region), norm(ctx.sector)].join("|");
}

export interface PreSeiStatFetcherResult {
  fetcher: StatFetcher;
  /** true si había un benchmark con stats SEI cargado. */
  hasBenchmark: boolean;
}

/**
 * Construye un StatFetcher síncrono respaldado por BenchmarkStatistic.
 * `extraFilters` (ageRange/gender) se aplican a la búsqueda inicial para que el
 * segmento sea lo más específico posible; la cadena de fallback luego relaja
 * country/region/sector.
 */
export async function buildPreSeiStatFetcher(
  extraFilters: { ageRange?: string | null; gender?: string | null } = {},
): Promise<PreSeiStatFetcherResult> {
  // Benchmark ROWIVERSE activo más reciente (la norma global del ecosistema).
  const benchmark = await prisma.benchmark.findFirst({
    where: { type: "ROWIVERSE", status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!benchmark) {
    return { fetcher: () => ({ data: null, sampleSize: 0 }), hasBenchmark: false };
  }

  // Pre-cargar todas las stats de las 8 competencias para este benchmark,
  // respetando ageRange/gender si se pasaron (o su ausencia = stats sin segmentar).
  const rows = await prisma.benchmarkStatistic.findMany({
    where: {
      benchmarkId: benchmark.id,
      metricKey: { in: SEI_ORDER as unknown as string[] },
      ageRange: extraFilters.ageRange ?? null,
      gender: extraFilters.gender ?? null,
    },
    select: {
      metricKey: true,
      country: true,
      region: true,
      sector: true,
      n: true,
      mean: true,
      stdDev: true,
    },
  });

  const byKey = new Map<string, CompetencyStat>();
  for (const r of rows) {
    if (typeof r.mean !== "number") continue;
    const key = ctxKey(r.metricKey as SeiKey, {
      country: r.country,
      region: r.region,
      sector: r.sector,
    });
    byKey.set(key, { mean: r.mean, stdDev: r.stdDev, sampleSize: r.n });
  }

  const fetcher: StatFetcher = (sei, ctx) => {
    const hit = byKey.get(ctxKey(sei, ctx));
    if (!hit) return { data: null, sampleSize: 0 };
    return { data: hit, sampleSize: hit.sampleSize };
  };

  return { fetcher, hasBenchmark: byKey.size > 0 };
}
