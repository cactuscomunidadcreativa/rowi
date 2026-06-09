/**
 * 🧩 API: Generate Outcome Patterns for Benchmark (Fase 3 del knowledge layer)
 * POST /api/admin/benchmarks/[id]/outcome-patterns/generate
 *
 * Deriva BenchmarkOutcomePattern (el conocimiento causal "qué patrón logra
 * qué outcome") desde los BenchmarkTopPerformer ya calculados. No recomputa
 * estadística pesada: lee los top performers (que ya tienen topCompetencies +
 * commonPatterns con effect size y frecuencia) y los materializa como patrones
 * nombrados con successRate.
 *
 * Plataforma-level → SuperAdmin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Nombra un patrón a partir de sus competencias dominantes. */
function patternName(comps: string[]): string {
  const NAMES: Record<string, string> = {
    EL: "Consciencia", RP: "Lectura de patrones", ACT: "Pensamiento consecuente",
    NE: "Navegación emocional", IM: "Motivación", OP: "Optimismo",
    EMP: "Empatía", NG: "Propósito",
  };
  return comps.map((c) => NAMES[c] ?? c).join(" + ");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const { id: benchmarkId } = await params;

  const benchmark = await prisma.benchmark.findUnique({
    where: { id: benchmarkId },
    select: { id: true, name: true },
  });
  if (!benchmark) {
    return NextResponse.json({ ok: false, error: "Benchmark not found" }, { status: 404 });
  }

  // Leer los top performers ya calculados (fuente del patrón causal).
  const tops = await prisma.benchmarkTopPerformer.findMany({
    where: { benchmarkId },
  });

  if (tops.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No hay top performers. Genera top performers primero." },
      { status: 400 }
    );
  }

  // Reemplazar patrones anteriores de este benchmark.
  await prisma.benchmarkOutcomePattern.deleteMany({ where: { benchmarkId } });

  const toCreate: any[] = [];

  for (const tp of tops) {
    const topComps = (tp.topCompetencies as any[]) ?? [];
    const commonPatterns = (tp.commonPatterns as any[]) ?? [];

    // Competencias clave = las significativas con mayor effect size.
    const keyCompetencies = topComps
      .filter((c) => c.isSignificant)
      .slice(0, 4)
      .map((c) => ({
        key: c.key,
        weight: Number((c.effectSize ?? 0).toFixed(3)),
        minThreshold: Math.round(c.avgScore ?? 0),
      }));

    if (keyCompetencies.length === 0) continue;

    // El patrón más frecuente da el nombre y el successRate (% de top performers
    // que comparten ese patrón de competencias).
    const dominant = commonPatterns[0];
    const compsForName = dominant?.competencies ?? keyCompetencies.map((c) => c.key).slice(0, 2);
    const successRate = dominant?.frequency ?? null;

    const topTalents = (tp.topTalents as any[]) ?? [];
    const keyTalents = topTalents
      .filter((t) => t.isSignificant)
      .slice(0, 3)
      .map((t) => ({ key: t.key, weight: Number((t.effectSize ?? 0).toFixed(3)) }));

    toCreate.push({
      benchmarkId,
      outcomeKey: tp.outcomeKey,
      patternName: patternName(compsForName),
      patternDescription:
        `Patrón asociado a alto ${tp.outcomeKey}: ${patternName(compsForName)}. ` +
        `Derivado de ${tp.sampleSize} top performers (P${tp.percentileThreshold}).`,
      keyCompetencies,
      keyTalents: keyTalents.length ? keyTalents : undefined,
      sampleSize: tp.sampleSize,
      avgOutcomeScore: tp.thresholdValue,
      successRate,
      confidence:
        tp.confidenceLevel === "high" ? 0.9 : tp.confidenceLevel === "medium" ? 0.6 : 0.3,
    });
  }

  if (toCreate.length > 0) {
    await prisma.benchmarkOutcomePattern.createMany({ data: toCreate, skipDuplicates: true });
  }

  return NextResponse.json({
    ok: true,
    created: toCreate.length,
    outcomes: toCreate.map((p) => p.outcomeKey),
  });
}
