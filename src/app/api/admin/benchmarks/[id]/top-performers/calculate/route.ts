/**
 * 📊 API: Calculate Top Performers with Filters
 * GET /api/admin/benchmarks/[id]/top-performers/calculate
 * Calcula top performers en tiempo real con filtros
 *
 * MEJORAS ESTADÍSTICAS:
 * - Tamaño mínimo de muestra: 100 registros para análisis confiable
 * - Intervalos de confianza al 95%
 * - Effect size (Cohen's d) para medir magnitud real del efecto
 * - Indicadores de significancia estadística
 * - Nivel de confianza (high/medium/low) basado en tamaño de muestra
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Constantes de configuración
const MIN_TOTAL_SAMPLE = 100;      // Mínimo para calcular P90
const MIN_TOP_PERFORMER_SAMPLE = 30; // Mínimo para top performers
const CONFIDENCE_HIGH = 385;       // 95% confianza, 5% margen error
const CONFIDENCE_MEDIUM = 100;     // Confianza media
const Z_SCORE_95 = 1.96;           // Z-score para IC 95%

const EQ_COMPETENCIES = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
const EQ_ALL = ["K", "C", "G", ...EQ_COMPETENCIES];

const BRAIN_TALENTS_FOCUS = ["dataMining", "modeling", "prioritizing", "connection", "emotionalInsight", "collaboration"];
const BRAIN_TALENTS_DECISIONS = ["reflecting", "adaptability", "criticalThinking", "resilience", "riskTolerance", "imagination"];
const BRAIN_TALENTS_DRIVE = ["proactivity", "commitment", "problemSolving", "vision", "designing", "entrepreneurship"];
const BRAIN_TALENTS = [...BRAIN_TALENTS_FOCUS, ...BRAIN_TALENTS_DECISIONS, ...BRAIN_TALENTS_DRIVE];

const OUTCOMES = [
  "effectiveness", "relationships", "qualityOfLife", "wellbeing",
  "influence", "decisionMaking", "community", "network",
  "achievement", "satisfaction", "balance", "health",
];

// =========================================================
// Funciones estadísticas
// =========================================================

/**
 * Calcula la desviación estándar de un array de números
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Calcula el error estándar
 */
function calculateStdError(stdDev: number, n: number): number {
  return n > 0 ? stdDev / Math.sqrt(n) : 0;
}

/**
 * Calcula el intervalo de confianza al 95%
 */
function calculateConfidenceInterval(mean: number, stdError: number): [number, number] {
  const marginOfError = Z_SCORE_95 * stdError;
  return [mean - marginOfError, mean + marginOfError];
}

/**
 * Calcula Cohen's d (effect size)
 * Interpretación: 0.2 = pequeño, 0.5 = mediano, 0.8 = grande
 */
function calculateCohenD(
  topMean: number,
  topStd: number,
  topN: number,
  globalMean: number,
  globalStd: number,
  globalN: number
): number {
  // Pooled standard deviation
  const pooledStd = Math.sqrt(
    ((topN - 1) * Math.pow(topStd, 2) + (globalN - 1) * Math.pow(globalStd, 2)) /
    (topN + globalN - 2)
  );

  if (pooledStd === 0) return 0;
  return (topMean - globalMean) / pooledStd;
}

/**
 * Realiza un t-test para determinar significancia
 */
function calculateTTest(
  topMean: number,
  topStd: number,
  topN: number,
  globalMean: number,
  globalStd: number,
  globalN: number
): { tStatistic: number; isSignificant: boolean } {
  const pooledStd = Math.sqrt(
    ((topN - 1) * Math.pow(topStd, 2) + (globalN - 1) * Math.pow(globalStd, 2)) /
    (topN + globalN - 2)
  );

  if (pooledStd === 0) return { tStatistic: 0, isSignificant: false };

  const tStatistic = (topMean - globalMean) / (pooledStd * Math.sqrt(1/topN + 1/globalN));
  const isSignificant = Math.abs(tStatistic) > Z_SCORE_95;

  return { tStatistic, isSignificant };
}

/**
 * Determina el nivel de confianza basado en el tamaño de muestra
 */
function getConfidenceLevel(n: number): "high" | "medium" | "low" {
  if (n >= CONFIDENCE_HIGH) return "high";
  if (n >= CONFIDENCE_MEDIUM) return "medium";
  return "low";
}

/**
 * Interpreta el effect size
 */
function interpretEffectSize(d: number): "negligible" | "small" | "medium" | "large" {
  const absD = Math.abs(d);
  if (absD < 0.2) return "negligible";
  if (absD < 0.5) return "small";
  if (absD < 0.8) return "medium";
  return "large";
}

/**
 * Calcula percentil con interpolación lineal (más preciso)
 */
function getPercentileInterpolated(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sortedValues.length) return sortedValues[sortedValues.length - 1];

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

// =========================================================
// Endpoint principal
// =========================================================

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: benchmarkId } = await params;
    const { searchParams } = new URL(req.url);

    // Filtros
    const country = searchParams.get("country");
    const region = searchParams.get("region");
    const sector = searchParams.get("sector");
    const jobFunction = searchParams.get("jobFunction");
    const jobRole = searchParams.get("jobRole");
    const ageRange = searchParams.get("ageRange");
    const gender = searchParams.get("gender");
    const education = searchParams.get("education");

    // Construir filtros base
    const baseWhere: any = { benchmarkId };
    if (country) baseWhere.country = country;
    if (region) baseWhere.region = region;
    if (sector) baseWhere.sector = sector;
    if (jobFunction) baseWhere.jobFunction = jobFunction;
    if (jobRole) baseWhere.jobRole = jobRole;
    if (ageRange) baseWhere.ageRange = ageRange;
    if (gender) baseWhere.gender = gender;
    if (education) baseWhere.education = education;

    // Calcular estadísticas globales para el subconjunto filtrado
    const globalStats: Record<string, { mean: number; stdDev: number; n: number }> = {};

    for (const metric of [...EQ_ALL, ...BRAIN_TALENTS]) {
      const dataPoints = await prisma.benchmarkDataPoint.findMany({
        where: { ...baseWhere, [metric]: { not: null } },
        select: { [metric]: true },
      });

      const values = dataPoints
        .map((dp: any) => dp[metric])
        .filter((v): v is number => v !== null && v !== undefined);

      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = calculateStdDev(values, mean);
        globalStats[metric] = { mean, stdDev, n: values.length };
      } else {
        globalStats[metric] = { mean: 0, stdDev: 0, n: 0 };
      }
    }

    const topPerformers = [];
    const warnings: string[] = [];

    for (const outcome of OUTCOMES) {
      // Obtener todos los valores del outcome para calcular P90 preciso
      const allOutcomeData = await prisma.benchmarkDataPoint.findMany({
        where: { ...baseWhere, [outcome]: { not: null } },
        select: { [outcome]: true },
        orderBy: { [outcome]: "asc" },
      });

      const outcomeValues = allOutcomeData
        .map((dp: any) => dp[outcome])
        .filter((v): v is number => v !== null && v !== undefined)
        .sort((a, b) => a - b);

      const totalCount = outcomeValues.length;

      // Validar tamaño mínimo de muestra total
      if (totalCount < MIN_TOTAL_SAMPLE) {
        warnings.push(`${outcome}: muestra insuficiente (${totalCount} < ${MIN_TOTAL_SAMPLE})`);
        continue;
      }

      // Calcular umbral P90 con interpolación
      const threshold = getPercentileInterpolated(outcomeValues, 90);

      // Obtener top performers (>= P90)
      const topPerformerData = await prisma.benchmarkDataPoint.findMany({
        where: { ...baseWhere, [outcome]: { gte: threshold } },
        select: {
          K: true, C: true, G: true,
          EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
          dataMining: true, modeling: true, prioritizing: true, connection: true,
          emotionalInsight: true, collaboration: true, reflecting: true, adaptability: true,
          criticalThinking: true, resilience: true, riskTolerance: true, imagination: true,
          proactivity: true, commitment: true, problemSolving: true, vision: true,
          designing: true, entrepreneurship: true,
          [outcome]: true,
        },
      });

      const sampleSize = topPerformerData.length;

      // Validar tamaño mínimo de top performers
      if (sampleSize < MIN_TOP_PERFORMER_SAMPLE) {
        warnings.push(`${outcome}: top performers insuficientes (${sampleSize} < ${MIN_TOP_PERFORMER_SAMPLE})`);
        continue;
      }

      const confidenceLevel = getConfidenceLevel(sampleSize);

      // Calcular estadísticas de competencias con métricas de confianza
      const compStats: Record<string, {
        mean: number;
        stdDev: number;
        n: number;
        stdError: number;
        ci95: [number, number];
        effectSize: number;
        effectInterpretation: string;
        isSignificant: boolean;
      }> = {};

      for (const comp of EQ_ALL) {
        const values = topPerformerData
          .map((dp: any) => dp[comp])
          .filter((v): v is number => v !== null && v !== undefined);

        if (values.length > 0) {
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const stdDev = calculateStdDev(values, mean);
          const stdError = calculateStdError(stdDev, values.length);
          const ci95 = calculateConfidenceInterval(mean, stdError);

          const global = globalStats[comp];
          const effectSize = calculateCohenD(mean, stdDev, values.length, global.mean, global.stdDev, global.n);
          const { isSignificant } = calculateTTest(mean, stdDev, values.length, global.mean, global.stdDev, global.n);

          compStats[comp] = {
            mean,
            stdDev,
            n: values.length,
            stdError,
            ci95,
            effectSize,
            effectInterpretation: interpretEffectSize(effectSize),
            isSignificant,
          };
        } else {
          compStats[comp] = {
            mean: 0, stdDev: 0, n: 0, stdError: 0, ci95: [0, 0],
            effectSize: 0, effectInterpretation: "negligible", isSignificant: false,
          };
        }
      }

      // Calcular estadísticas de talentos con métricas de confianza
      const talentStats: Record<string, {
        mean: number;
        stdDev: number;
        n: number;
        stdError: number;
        ci95: [number, number];
        effectSize: number;
        effectInterpretation: string;
        isSignificant: boolean;
      }> = {};

      for (const talent of BRAIN_TALENTS) {
        const values = topPerformerData
          .map((dp: any) => dp[talent])
          .filter((v): v is number => v !== null && v !== undefined);

        if (values.length > 0) {
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const stdDev = calculateStdDev(values, mean);
          const stdError = calculateStdError(stdDev, values.length);
          const ci95 = calculateConfidenceInterval(mean, stdError);

          const global = globalStats[talent];
          const effectSize = calculateCohenD(mean, stdDev, values.length, global.mean, global.stdDev, global.n);
          const { isSignificant } = calculateTTest(mean, stdDev, values.length, global.mean, global.stdDev, global.n);

          talentStats[talent] = {
            mean,
            stdDev,
            n: values.length,
            stdError,
            ci95,
            effectSize,
            effectInterpretation: interpretEffectSize(effectSize),
            isSignificant,
          };
        } else {
          talentStats[talent] = {
            mean: 0, stdDev: 0, n: 0, stdError: 0, ci95: [0, 0],
            effectSize: 0, effectInterpretation: "negligible", isSignificant: false,
          };
        }
      }

      // Top 8 competencias ordenadas por effect size (más robusto que diferencia simple)
      const topCompetencies = EQ_COMPETENCIES.map((comp) => {
        const stats = compStats[comp];
        const globalAvg = globalStats[comp]?.mean || 0;
        const diffFromAvg = stats.mean - globalAvg;
        return {
          key: comp,
          avgScore: stats.mean,
          stdDev: stats.stdDev,
          stdError: stats.stdError,
          ci95: stats.ci95,
          importance: Math.max(0, diffFromAvg * 10),
          diffFromAvg,
          effectSize: stats.effectSize,
          effectInterpretation: stats.effectInterpretation,
          isSignificant: stats.isSignificant,
        };
      })
        .filter((c) => c.avgScore > 0)
        .sort((a, b) => b.effectSize - a.effectSize); // Ordenar por effect size

      // 18 talentos en orden de cluster
      const topTalents = BRAIN_TALENTS.map((talent) => {
        const stats = talentStats[talent];
        const globalAvg = globalStats[talent]?.mean || 0;
        const diffFromAvg = stats.mean - globalAvg;
        let cluster = "focus";
        if (BRAIN_TALENTS_DECISIONS.includes(talent)) cluster = "decisions";
        if (BRAIN_TALENTS_DRIVE.includes(talent)) cluster = "drive";
        return {
          key: talent,
          avgScore: stats.mean,
          stdDev: stats.stdDev,
          stdError: stats.stdError,
          ci95: stats.ci95,
          importance: Math.max(0, diffFromAvg * 10),
          diffFromAvg,
          effectSize: stats.effectSize,
          effectInterpretation: stats.effectInterpretation,
          isSignificant: stats.isSignificant,
          cluster,
        };
      }).filter((t) => t.avgScore > 0);

      // Top 5 talentos más distintivos (por effect size)
      const topTalentsSummary = [...topTalents]
        .sort((a, b) => b.effectSize - a.effectSize)
        .slice(0, 5);

      // Calcular patrones de competencias
      const pairCounts: Record<string, { count: number; outcomeSum: number }> = {};
      const talentPairCounts: Record<string, { count: number; outcomeSum: number }> = {};

      for (const dp of topPerformerData) {
        const outcomeValue = (dp as any)[outcome] || 0;

        // Top 3 competencias de esta persona
        const compScores = EQ_COMPETENCIES.map((comp) => ({
          key: comp,
          score: (dp as any)[comp] || 0,
        }))
          .filter((c) => c.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        for (let i = 0; i < compScores.length; i++) {
          for (let j = i + 1; j < compScores.length; j++) {
            const pair = [compScores[i].key, compScores[j].key].sort().join("+");
            if (!pairCounts[pair]) pairCounts[pair] = { count: 0, outcomeSum: 0 };
            pairCounts[pair].count++;
            pairCounts[pair].outcomeSum += outcomeValue;
          }
        }

        // Top 3 talentos de esta persona
        const talentScores = BRAIN_TALENTS.map((talent) => ({
          key: talent,
          score: (dp as any)[talent] || 0,
        }))
          .filter((t) => t.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        for (let i = 0; i < talentScores.length; i++) {
          for (let j = i + 1; j < talentScores.length; j++) {
            const pair = [talentScores[i].key, talentScores[j].key].sort().join("+");
            if (!talentPairCounts[pair]) talentPairCounts[pair] = { count: 0, outcomeSum: 0 };
            talentPairCounts[pair].count++;
            talentPairCounts[pair].outcomeSum += outcomeValue;
          }
        }
      }

      // Formatear patrones con estadísticas adicionales
      const commonPatternsRaw = Object.entries(pairCounts)
        .map(([pair, data]) => {
          const frequency = (data.count / sampleSize) * 100;
          const stdError = Math.sqrt((frequency * (100 - frequency)) / sampleSize);
          return {
            competencies: pair.split("+"),
            frequency: Math.round(frequency),
            frequencyCI: [
              Math.max(0, Math.round(frequency - Z_SCORE_95 * stdError)),
              Math.min(100, Math.round(frequency + Z_SCORE_95 * stdError)),
            ] as [number, number],
            avgOutcome: data.count > 0 ? data.outcomeSum / data.count : 0,
            pairKey: pair,
            count: data.count,
          };
        })
        .filter((p) => p.frequency >= 10)
        .sort((a, b) => b.frequency - a.frequency);

      // Deduplicate by pairKey
      const seenCompPairs = new Set<string>();
      const commonPatterns = commonPatternsRaw
        .filter((p) => {
          if (seenCompPairs.has(p.pairKey)) return false;
          seenCompPairs.add(p.pairKey);
          return true;
        })
        .slice(0, 6)
        .map(({ pairKey, ...rest }) => rest);

      const talentPatternsRaw = Object.entries(talentPairCounts)
        .map(([pair, data]) => {
          const frequency = (data.count / sampleSize) * 100;
          const stdError = Math.sqrt((frequency * (100 - frequency)) / sampleSize);
          return {
            talents: pair.split("+"),
            frequency: Math.round(frequency),
            frequencyCI: [
              Math.max(0, Math.round(frequency - Z_SCORE_95 * stdError)),
              Math.min(100, Math.round(frequency + Z_SCORE_95 * stdError)),
            ] as [number, number],
            avgOutcome: data.count > 0 ? data.outcomeSum / data.count : 0,
            pairKey: pair,
            count: data.count,
          };
        })
        .filter((p) => p.frequency >= 10)
        .sort((a, b) => b.frequency - a.frequency);

      // Deduplicate by pairKey
      const seenTalentPairs = new Set<string>();
      const talentPatterns = talentPatternsRaw
        .filter((p) => {
          if (seenTalentPairs.has(p.pairKey)) return false;
          seenTalentPairs.add(p.pairKey);
          return true;
        })
        .slice(0, 6)
        .map(({ pairKey, ...rest }) => rest);

      topPerformers.push({
        id: `filtered-${outcome}`,
        outcomeKey: outcome,
        percentileThreshold: 90,
        thresholdValue: threshold,
        sampleSize,
        totalPopulation: totalCount,
        confidenceLevel,

        // Promedios de competencias
        avgK: compStats["K"].mean,
        avgC: compStats["C"].mean,
        avgG: compStats["G"].mean,
        avgEL: compStats["EL"].mean,
        avgRP: compStats["RP"].mean,
        avgACT: compStats["ACT"].mean,
        avgNE: compStats["NE"].mean,
        avgIM: compStats["IM"].mean,
        avgOP: compStats["OP"].mean,
        avgEMP: compStats["EMP"].mean,
        avgNG: compStats["NG"].mean,

        // Datos enriquecidos
        topCompetencies,
        topTalents,
        topTalentsSummary,
        commonPatterns,
        talentPatterns,

        // Metadata estadística
        statistics: {
          globalMeans: Object.fromEntries(
            Object.entries(globalStats).map(([k, v]) => [k, v.mean])
          ),
          significantCompetencies: topCompetencies.filter(c => c.isSignificant).length,
          significantTalents: topTalents.filter(t => t.isSignificant).length,
          avgEffectSizeCompetencies: topCompetencies.length > 0
            ? topCompetencies.reduce((a, b) => a + b.effectSize, 0) / topCompetencies.length
            : 0,
          avgEffectSizeTalents: topTalents.length > 0
            ? topTalents.reduce((a, b) => a + b.effectSize, 0) / topTalents.length
            : 0,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      topPerformers,
      total: topPerformers.length,
      filtered: true,
      filters: { country, region, sector, jobFunction, jobRole, ageRange, gender, education },
      warnings: warnings.length > 0 ? warnings : undefined,
      methodology: {
        minTotalSample: MIN_TOTAL_SAMPLE,
        minTopPerformerSample: MIN_TOP_PERFORMER_SAMPLE,
        confidenceLevels: {
          high: `>= ${CONFIDENCE_HIGH} registros`,
          medium: `>= ${CONFIDENCE_MEDIUM} registros`,
          low: `< ${CONFIDENCE_MEDIUM} registros`,
        },
        percentileMethod: "interpolación lineal",
        significanceTest: "t-test (α = 0.05)",
        effectSizeInterpretation: {
          negligible: "< 0.2",
          small: "0.2 - 0.5",
          medium: "0.5 - 0.8",
          large: "> 0.8",
        },
      },
    });
  } catch (error) {
    console.error("❌ Error calculating top performers:", error);
    return NextResponse.json(
      { error: "Error al calcular top performers" },
      { status: 500 }
    );
  }
}
