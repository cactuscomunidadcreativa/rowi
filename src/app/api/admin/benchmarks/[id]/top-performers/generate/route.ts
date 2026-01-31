/**
 * 📊 API: Generate Top Performers for Benchmark
 * POST /api/admin/benchmarks/[id]/top-performers/generate
 *
 * Calcula el perfil de top performers (P90) para cada outcome.
 * Esto permite comparar a los usuarios con los mejores.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth";
import { prisma } from "@/core/prisma";
import { EQ_COMPETENCIES, OUTCOMES, BRAIN_TALENTS } from "@/lib/benchmarks";

export const maxDuration = 300; // 5 minutos

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

    console.log(`🏆 Generating top performers for benchmark: ${benchmark.name}`);

    // Eliminar top performers anteriores
    await prisma.benchmarkTopPerformer.deleteMany({
      where: { benchmarkId },
    });

    const topPerformersToCreate: any[] = [];
    const PERCENTILE_THRESHOLD = 90;

    for (const outcome of OUTCOMES) {
      // Contar registros con este outcome
      const count = await prisma.benchmarkDataPoint.count({
        where: { benchmarkId, [outcome]: { not: null } },
      });

      if (count < 30) {
        console.log(`⚠️ ${outcome}: Only ${count} records, skipping`);
        continue;
      }

      // Calcular umbral P90
      const p90Index = Math.floor(count * 0.9);
      const thresholdRecord = await prisma.benchmarkDataPoint.findFirst({
        where: { benchmarkId, [outcome]: { not: null } },
        orderBy: { [outcome]: "asc" },
        skip: p90Index,
        select: { [outcome]: true },
      });

      if (!thresholdRecord || (thresholdRecord as any)[outcome] === null) continue;
      const threshold = (thresholdRecord as any)[outcome];

      // Obtener top performers para este outcome
      const topPerformerData = await prisma.benchmarkDataPoint.findMany({
        where: { benchmarkId, [outcome]: { gte: threshold } },
        select: {
          K: true, C: true, G: true,
          EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
          dataMining: true, modeling: true, prioritizing: true, connection: true,
          emotionalInsight: true, collaboration: true, reflecting: true, adaptability: true,
          criticalThinking: true, resilience: true, riskTolerance: true,
          imagination: true, proactivity: true, commitment: true, problemSolving: true,
          vision: true, designing: true, entrepreneurship: true,
          [outcome]: true,
        },
      });

      const sampleSize = topPerformerData.length;
      if (sampleSize < 30) continue;

      // Acumuladores para promedios
      const compAccumulators: Record<string, { sum: number; count: number }> = {};
      const talentAccumulators: Record<string, { sum: number; count: number }> = {};
      const pairCounts: Record<string, { count: number; outcomeSum: number }> = {};
      const talentPairCounts: Record<string, { count: number; outcomeSum: number }> = {};

      for (const comp of ["K", "C", "G", ...EQ_COMPETENCIES]) {
        compAccumulators[comp] = { sum: 0, count: 0 };
      }
      for (const talent of BRAIN_TALENTS) {
        talentAccumulators[talent] = { sum: 0, count: 0 };
      }

      for (const dp of topPerformerData) {
        const dpAny = dp as any;

        // Acumular competencias
        for (const comp of ["K", "C", "G", ...EQ_COMPETENCIES]) {
          const val = dpAny[comp];
          if (typeof val === "number") {
            compAccumulators[comp].sum += val;
            compAccumulators[comp].count++;
          }
        }

        // Acumular talentos
        for (const talent of BRAIN_TALENTS) {
          const val = dpAny[talent];
          if (typeof val === "number") {
            talentAccumulators[talent].sum += val;
            talentAccumulators[talent].count++;
          }
        }

        // Detectar top 3 competencias para patrones
        const compScores = EQ_COMPETENCIES
          .map(comp => ({ key: comp, score: dpAny[comp] || 0 }))
          .filter(c => c.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        const outcomeValue = dpAny[outcome] || 0;

        for (let j = 0; j < compScores.length; j++) {
          for (let k = j + 1; k < compScores.length; k++) {
            const pair = [compScores[j].key, compScores[k].key].sort().join("+");
            if (!pairCounts[pair]) pairCounts[pair] = { count: 0, outcomeSum: 0 };
            pairCounts[pair].count++;
            pairCounts[pair].outcomeSum += outcomeValue;
          }
        }

        // Detectar top 3 talentos para patrones
        const talentScores = BRAIN_TALENTS
          .map(talent => ({ key: talent, score: dpAny[talent] || 0 }))
          .filter(t => t.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        for (let j = 0; j < talentScores.length; j++) {
          for (let k = j + 1; k < talentScores.length; k++) {
            const pair = [talentScores[j].key, talentScores[k].key].sort().join("+");
            if (!talentPairCounts[pair]) talentPairCounts[pair] = { count: 0, outcomeSum: 0 };
            talentPairCounts[pair].count++;
            talentPairCounts[pair].outcomeSum += outcomeValue;
          }
        }
      }

      const getAvg = (acc: { sum: number; count: number }) => acc.count > 0 ? acc.sum / acc.count : null;

      const topCompetencies = EQ_COMPETENCIES
        .map(comp => ({
          key: comp,
          avgScore: getAvg(compAccumulators[comp]) || 0,
          importance: Math.min(100, getAvg(compAccumulators[comp]) || 0),
          diffFromAvg: 0,
        }))
        .filter(c => c.avgScore > 0)
        .sort((a, b) => b.avgScore - a.avgScore);

      const topTalents = BRAIN_TALENTS
        .map(talent => ({
          key: talent,
          avgScore: getAvg(talentAccumulators[talent]) || 0,
          importance: Math.min(100, getAvg(talentAccumulators[talent]) || 0),
        }))
        .filter(t => t.avgScore > 0)
        .sort((a, b) => b.importance - a.importance);

      const commonPatterns = Object.entries(pairCounts)
        .map(([pair, data]) => ({
          competencies: pair.split("+"),
          frequency: Math.round((data.count / sampleSize) * 100),
          avgOutcome: data.count > 0 ? data.outcomeSum / data.count : 0,
        }))
        .filter(p => p.frequency >= 20)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5);

      const talentPatterns = Object.entries(talentPairCounts)
        .map(([pair, data]) => ({
          talents: pair.split("+"),
          frequency: Math.round((data.count / sampleSize) * 100),
          avgOutcome: data.count > 0 ? data.outcomeSum / data.count : 0,
        }))
        .filter(p => p.frequency >= 10)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 6);

      topPerformersToCreate.push({
        benchmarkId,
        outcomeKey: outcome,
        percentileThreshold: PERCENTILE_THRESHOLD,
        sampleSize,
        avgK: getAvg(compAccumulators["K"]),
        avgC: getAvg(compAccumulators["C"]),
        avgG: getAvg(compAccumulators["G"]),
        avgEL: getAvg(compAccumulators["EL"]),
        avgRP: getAvg(compAccumulators["RP"]),
        avgACT: getAvg(compAccumulators["ACT"]),
        avgNE: getAvg(compAccumulators["NE"]),
        avgIM: getAvg(compAccumulators["IM"]),
        avgOP: getAvg(compAccumulators["OP"]),
        avgEMP: getAvg(compAccumulators["EMP"]),
        avgNG: getAvg(compAccumulators["NG"]),
        topCompetencies,
        topTalents,
        commonPatterns,
        talentPatterns,
      });

      console.log(`🏆 ${outcome}: ${sampleSize} top performers (threshold: ${threshold})`);
    }

    if (topPerformersToCreate.length > 0) {
      await prisma.benchmarkTopPerformer.createMany({
        data: topPerformersToCreate,
        skipDuplicates: true,
      });
    }

    console.log(`✅ Created ${topPerformersToCreate.length} top performer profiles`);

    return NextResponse.json({
      ok: true,
      created: topPerformersToCreate.length,
      outcomes: topPerformersToCreate.map(tp => tp.outcomeKey),
    });
  } catch (error) {
    console.error("❌ Error generating top performers:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
