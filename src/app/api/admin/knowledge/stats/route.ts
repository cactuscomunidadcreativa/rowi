import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { buildTrainingDataset, summarizeDataset } from "@/ai/learning/datasetExporter";

export const runtime = "nodejs";

/* =========================================================
   📊 GET — Estado del knowledge layer (tracking)
   ---------------------------------------------------------
   Plataforma-level → SuperAdmin only (como agents/benchmarks).
   Reporta el progreso de la base de conocimiento propia:
   - cuánto ground-truth hay (la materia prima del aprendizaje)
   - catálogo de intervenciones (causal/playbook)
   - estado de calibración de pesos
   - tamaño del dataset de entrenamiento (recopilación, Fase 8)
========================================================= */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  // Helper: count tolerante a tabla ausente (migración reciente).
  const safeCount = async (fn: () => Promise<number>) => {
    try {
      return await fn();
    } catch {
      return 0;
    }
  };

  const [
    interventions,
    interventionsHypothesis,
    interventionsCalibrated,
    interventionOutcomes,
    affinityGroundTruth,
    affinityWeightsActive,
    pulseGroundTruth,
    pulseWeightsActive,
    jobProfiles,
    outcomePatterns,
    collectivePatterns,
    aiCacheEntries,
    aiCacheHits,
  ] = await Promise.all([
    safeCount(() => prisma.intervention.count()),
    safeCount(() => prisma.intervention.count({ where: { effectSource: "hypothesis_v0" } })),
    safeCount(() => prisma.intervention.count({ where: { effectSource: "calibrated_v1" } })),
    safeCount(() => prisma.interventionOutcome.count()),
    safeCount(() => prisma.affinityGroundTruth.count()),
    safeCount(() => prisma.affinityWeights.count({ where: { active: true } })),
    safeCount(() => prisma.pulsePointGroundTruth.count()),
    safeCount(() => prisma.pulsePointWeights.count({ where: { active: true } })),
    safeCount(() => prisma.jobProfile.count()),
    safeCount(() => prisma.benchmarkOutcomePattern.count()),
    safeCount(() => prisma.collectivePattern.count()),
    safeCount(() => prisma.aIResponseCache.count()),
    safeCount(async () => {
      const agg = await prisma.aIResponseCache.aggregate({ _sum: { hits: true } });
      return agg._sum.hits ?? 0;
    }),
  ]);

  // Dataset de entrenamiento (recopilación) — resumen por tarea.
  let dataset = { total: 0, byTask: {} as Record<string, number> };
  try {
    const records = await buildTrainingDataset({ limitPerSource: 5000 });
    dataset = summarizeDataset(records);
  } catch {
    // si alguna fuente falla, dejamos el resumen en 0
  }

  return NextResponse.json({
    ok: true,
    catalog: {
      interventions,
      interventionsHypothesis,
      interventionsCalibrated,
      jobProfiles,
    },
    patterns: {
      outcomePatterns,
      collectivePatterns,
    },
    groundTruth: {
      interventionOutcomes,
      affinityGroundTruth,
      pulseGroundTruth,
      total: interventionOutcomes + affinityGroundTruth + pulseGroundTruth,
    },
    calibration: {
      affinityWeightsActive,
      pulseWeightsActive,
    },
    cache: {
      entries: aiCacheEntries,
      hits: aiCacheHits,
    },
    dataset,
  });
}
