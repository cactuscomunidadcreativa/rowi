/**
 * Pre-SEI — normalización pre-normada (en vivo, no cron).
 *
 * Compara cada competencia SEI (escala 70-130) contra estadísticas de benchmark
 * segmentadas por demografía (edad/género/sector/país), REUSANDO la cadena de
 * fallback existente (`withFallbackSync` + `MIN_SAMPLE_SIZE`): si el segmento no
 * tiene N suficiente, baja la cadena hasta global y reporta el nivel usado.
 *
 * Si NO hay benchmark cargado, degrada a BANDAS INTERNAS (<90 / 90-110 / >110),
 * las mismas que usa `calculate.ts`. La feature funciona aun sin normas.
 *
 * El lenguaje siempre es de HIPÓTESIS, inclusivo y no clínico: el copy vive en
 * i18n (`preSei.insight.normative.*`); aquí solo se computan bandas/percentiles.
 * Ningún paso usa IA.
 */
import {
  withFallbackSync,
  type FallbackContext,
  type FallbackLevel,
} from "@/lib/benchmarks/fallback";
import { MIN_SAMPLE_SIZE } from "@/lib/benchmarks/statistics";
import type { SeiKey } from "@/lib/vital-signs/catalog";

export type NormBand = "below" | "around" | "above";

/** Estadística de una competencia para un contexto dado (de BenchmarkStatistic). */
export interface CompetencyStat {
  mean: number;
  stdDev?: number | null;
  /** Tamaño de muestra del contexto. */
  sampleSize: number;
}

/**
 * Fuente de estadísticas: dado (competencia, contexto), devuelve la stat y su N.
 * Se inyecta para mantener el módulo puro/testeable; la API la respalda con
 * consultas a `BenchmarkStatistic`.
 */
export type StatFetcher = (
  sei: SeiKey,
  ctx: FallbackContext,
) => { data: CompetencyStat | null; sampleSize: number };

export interface NormativeReading {
  sei: SeiKey;
  /** Score crudo del usuario, escala 70-130. */
  score: number;
  band: NormBand;
  /** Percentil aproximado (0-100) vs la stat, o null si no hay benchmark. */
  percentile: number | null;
  /** Nivel de la cadena de fallback que se usó, o null si bandas internas. */
  fallbackLevel: FallbackLevel | null;
  /** N de la muestra comparada (0 si bandas internas). */
  sampleSize: number;
  /** true si no había benchmark y se usaron bandas internas. */
  internalBands: boolean;
}

/** Banda interna (sin benchmark) basada en la norma 100. */
function internalBand(score: number): NormBand {
  if (score < 90) return "below";
  if (score > 110) return "above";
  return "around";
}

/** Banda relativa a una media de benchmark (±0.5 SD si hay SD, si no ±5 pts). */
function bandVsMean(score: number, mean: number, stdDev?: number | null): NormBand {
  const margin = typeof stdDev === "number" && stdDev > 0 ? stdDev * 0.5 : 5;
  if (score < mean - margin) return "below";
  if (score > mean + margin) return "above";
  return "around";
}

/**
 * Percentil aproximado de `score` en una normal(mean, sd). Sin SD no hay
 * percentil fiable → null. CDF normal vía aproximación de error function.
 */
function approxPercentile(score: number, mean: number, stdDev?: number | null): number | null {
  if (typeof stdDev !== "number" || stdDev <= 0) return null;
  const z = (score - mean) / stdDev;
  // Aproximación de Φ(z) (Abramowitz & Stegun 7.1.26 sobre erf).
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return Math.round(p * 100);
}

/** Computa la lectura normativa de una competencia. */
export function normativeForCompetency(
  sei: SeiKey,
  score: number,
  ctx: FallbackContext,
  fetchStat: StatFetcher,
  minSample: number = MIN_SAMPLE_SIZE,
): NormativeReading {
  const result = withFallbackSync<CompetencyStat>(
    ctx,
    (filteredCtx) => fetchStat(sei, filteredCtx),
    minSample,
  );

  if (result.data === null) {
    // Sin benchmark suficiente en ningún nivel → bandas internas.
    return {
      sei,
      score,
      band: internalBand(score),
      percentile: null,
      fallbackLevel: null,
      sampleSize: 0,
      internalBands: true,
    };
  }

  const { mean, stdDev } = result.data;
  return {
    sei,
    score,
    band: bandVsMean(score, mean, stdDev),
    percentile: approxPercentile(score, mean, stdDev),
    fallbackLevel: result.fallbackLevel,
    sampleSize: result.sampleSize,
    internalBands: false,
  };
}

/** Computa la lectura normativa de las 8 competencias. */
export function normativeReadings(
  competencies: Record<SeiKey, number>,
  ctx: FallbackContext,
  fetchStat: StatFetcher,
  minSample: number = MIN_SAMPLE_SIZE,
): NormativeReading[] {
  return (Object.keys(competencies) as SeiKey[]).map((sei) =>
    normativeForCompetency(sei, competencies[sei], ctx, fetchStat, minSample),
  );
}
