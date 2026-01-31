/**
 * 📊 API: Generate Top Performers for Benchmark
 * POST /api/admin/benchmarks/[id]/top-performers/generate
 *
 * Calcula y GUARDA el perfil completo de top performers (P90) para cada outcome.
 * Incluye todas las estadísticas: effect size, significancia, intervalos de confianza.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth";
import { prisma } from "@/core/prisma";
import { Prisma } from "@prisma/client";

export const maxDuration = 300; // 5 minutos

// Constantes de configuración
const MIN_TOTAL_SAMPLE = 100;
const MIN_TOP_PERFORMER_SAMPLE = 30;
const CONFIDENCE_HIGH = 385;
const CONFIDENCE_MEDIUM = 100;
const Z_SCORE_95 = 1.96;

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

function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function calculateStdError(stdDev: number, n: number): number {
  return n > 0 ? stdDev / Math.sqrt(n) : 0;
}

function calculateConfidenceInterval(mean: number, stdError: number): [number, number] {
  const marginOfError = Z_SCORE_95 * stdError;
  return [mean - marginOfError, mean + marginOfError];
}

function calculateCohenD(
  topMean: number,
  topStd: number,
  topN: number,
  globalMean: number,
  globalStd: number,
  globalN: number
): number {
  const pooledStd = Math.sqrt(
    ((topN - 1) * Math.pow(topStd, 2) + (globalN - 1) * Math.pow(globalStd, 2)) /
    (topN + globalN - 2)
  );
  if (pooledStd === 0) return 0;
  return (topMean - globalMean) / pooledStd;
}

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

function getConfidenceLevel(n: number): "high" | "medium" | "low" {
  if (n >= CONFIDENCE_HIGH) return "high";
  if (n >= CONFIDENCE_MEDIUM) return "medium";
  return "low";
}

function interpretEffectSize(d: number): "negligible" | "small" | "medium" | "large" {
  const absD = Math.abs(d);
  if (absD < 0.2) return "negligible";
  if (absD < 0.5) return "small";
  if (absD < 0.8) return "medium";
  return "large";
}

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

// 🔐 SEGURIDAD: Lista blanca de columnas permitidas para queries SQL
// Esto previene SQL injection al usar nombres de columnas dinámicos
const ALLOWED_COLUMNS = new Set([
  ...EQ_ALL,
  ...BRAIN_TALENTS,
  ...OUTCOMES,
]);

function validateColumnName(column: string): boolean {
  return ALLOWED_COLUMNS.has(column);
}

// =========================================================
// Endpoint principal
// =========================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: benchmarkId } = await params;

    // Verificar que el benchmark existe
    const benchmark = await prisma.benchmark.findUnique({
      where: { id: benchmarkId },
      select: { id: true, name: true, status: true },
    });

    if (!benchmark) {
      return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
    }

    console.log(`🏆 Generating FULL top performers for benchmark: ${benchmark.name}`);

    // Eliminar top performers anteriores
    await prisma.benchmarkTopPerformer.deleteMany({
      where: { benchmarkId },
    });

    const baseWhere = { benchmarkId };

    // =========================================================
    // Calcular estadísticas globales usando agregaciones SQL
    // (Optimizado para datasets grandes - no carga todo en memoria)
    // =========================================================
    console.log("📊 Calculating global statistics (optimized)...");
    const globalStats: Record<string, { mean: number; stdDev: number; n: number }> = {};

    // Usar agregaciones SQL directamente para cada métrica
    const allMetrics = [...EQ_ALL, ...BRAIN_TALENTS];

    for (const metric of allMetrics) {
      const result = await prisma.benchmarkDataPoint.aggregate({
        where: { ...baseWhere, [metric]: { not: null } },
        _avg: { [metric]: true },
        _count: { [metric]: true },
      });

      const mean = (result._avg as any)[metric] || 0;
      const count = (result._count as any)[metric] || 0;

      if (count > 1) {
        // 🔐 SEGURIDAD: Validar nombre de columna contra whitelist
        if (!validateColumnName(metric)) {
          console.error(`Invalid metric column: ${metric}`);
          continue;
        }

        // Calcular stdDev con SQL para evitar cargar todos los datos
        // Nota: Prisma no soporta columnas dinámicas con $queryRaw parametrizado,
        // pero validamos el nombre de columna contra una whitelist estricta arriba
        const varianceResult: any[] = await prisma.$queryRaw`
          SELECT COALESCE(STDDEV_SAMP(${Prisma.raw(`"${metric}"`)})::float, 0) as std_dev
          FROM "benchmark_data_point"
          WHERE "benchmarkId" = ${benchmarkId} AND ${Prisma.raw(`"${metric}"`)} IS NOT NULL
        `;
        const stdDev = parseFloat(varianceResult[0]?.std_dev) || 0;
        globalStats[metric] = { mean, stdDev, n: count };
      } else {
        globalStats[metric] = { mean, stdDev: 0, n: count };
      }
    }

    console.log("✅ Global statistics calculated (optimized)");

    // =========================================================
    // Calcular top performers para cada outcome
    // =========================================================
    const topPerformersToCreate: any[] = [];
    const warnings: string[] = [];

    for (const outcome of OUTCOMES) {
      console.log(`📈 Processing outcome: ${outcome}`);

      // Obtener count y percentil P90 directamente con SQL (optimizado)
      const countResult = await prisma.benchmarkDataPoint.count({
        where: { ...baseWhere, [outcome]: { not: null } },
      });
      const totalCount = countResult;

      if (totalCount === 0) {
        console.log(`⚠️ ${outcome}: No data available, skipping`);
        warnings.push(`${outcome}: sin datos disponibles`);
        continue;
      }

      // 🔐 SEGURIDAD: Validar nombre de columna contra whitelist
      if (!validateColumnName(outcome)) {
        console.error(`Invalid outcome column: ${outcome}`);
        warnings.push(`${outcome}: columna inválida`);
        continue;
      }

      // Calcular percentil P90 directamente con SQL
      // Nota: Usamos Prisma.raw para nombres de columna (validados contra whitelist)
      // y parámetros para valores de usuario (benchmarkId)
      const p90Result: any[] = await prisma.$queryRaw`
        SELECT PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY ${Prisma.raw(`"${outcome}"`)})::float as p90
        FROM "benchmark_data_point"
        WHERE "benchmarkId" = ${benchmarkId} AND ${Prisma.raw(`"${outcome}"`)} IS NOT NULL
      `;
      const threshold = parseFloat(p90Result[0]?.p90) || 0;

      let lowConfidenceSample = false;
      let insufficientReason = "";

      if (totalCount < MIN_TOTAL_SAMPLE) {
        warnings.push(`${outcome}: muestra pequeña (${totalCount} < ${MIN_TOTAL_SAMPLE} recomendados)`);
        lowConfidenceSample = true;
        insufficientReason = "small_total_sample";
      }

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

      if (sampleSize === 0) {
        console.log(`⚠️ ${outcome}: No top performers found, skipping`);
        warnings.push(`${outcome}: sin top performers encontrados`);
        continue;
      }

      if (sampleSize < MIN_TOP_PERFORMER_SAMPLE) {
        warnings.push(`${outcome}: muestra top performers pequeña (${sampleSize} < ${MIN_TOP_PERFORMER_SAMPLE} recomendados)`);
        lowConfidenceSample = true;
        insufficientReason = insufficientReason || "small_top_sample";
      }

      const confidenceLevel = getConfidenceLevel(sampleSize);

      // =========================================================
      // Calcular estadísticas de COMPETENCIAS
      // =========================================================
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
            mean, stdDev, n: values.length, stdError, ci95,
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

      // =========================================================
      // Calcular estadísticas de TALENTOS
      // =========================================================
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
            mean, stdDev, n: values.length, stdError, ci95,
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

      // =========================================================
      // Formatear top competencies (ordenadas por effect size)
      // =========================================================
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
        .sort((a, b) => b.effectSize - a.effectSize);

      // =========================================================
      // Formatear top talents (ordenados por cluster)
      // =========================================================
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

      // =========================================================
      // Calcular PATRONES de competencias
      // =========================================================
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

      // Formatear patrones con estadísticas
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

      const seenTalentPairs = new Set<string>();
      const talentPatterns = talentPatternsRaw
        .filter((p) => {
          if (seenTalentPairs.has(p.pairKey)) return false;
          seenTalentPairs.add(p.pairKey);
          return true;
        })
        .slice(0, 6)
        .map(({ pairKey, ...rest }) => rest);

      // =========================================================
      // Crear el registro completo para guardar
      // =========================================================
      topPerformersToCreate.push({
        benchmarkId,
        outcomeKey: outcome,
        percentileThreshold: 90,
        thresholdValue: threshold,
        sampleSize,
        totalPopulation: totalCount,
        confidenceLevel: lowConfidenceSample ? "low" : confidenceLevel,
        lowConfidenceSample,
        insufficientReason: insufficientReason || null,

        // Promedios de competencias
        avgK: compStats["K"]?.mean || null,
        avgC: compStats["C"]?.mean || null,
        avgG: compStats["G"]?.mean || null,
        avgEL: compStats["EL"]?.mean || null,
        avgRP: compStats["RP"]?.mean || null,
        avgACT: compStats["ACT"]?.mean || null,
        avgNE: compStats["NE"]?.mean || null,
        avgIM: compStats["IM"]?.mean || null,
        avgOP: compStats["OP"]?.mean || null,
        avgEMP: compStats["EMP"]?.mean || null,
        avgNG: compStats["NG"]?.mean || null,

        // Datos enriquecidos (JSON)
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

      console.log(`🏆 ${outcome}: ${sampleSize} top performers (threshold: ${threshold.toFixed(2)}, confidence: ${confidenceLevel})`);
    }

    // =========================================================
    // Guardar todos los top performers
    // =========================================================
    if (topPerformersToCreate.length > 0) {
      await prisma.benchmarkTopPerformer.createMany({
        data: topPerformersToCreate,
        skipDuplicates: true,
      });
    }

    console.log(`✅ Created ${topPerformersToCreate.length} FULL top performer profiles`);

    return NextResponse.json({
      ok: true,
      created: topPerformersToCreate.length,
      outcomes: topPerformersToCreate.map(tp => tp.outcomeKey),
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    console.error("❌ Error generating top performers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
