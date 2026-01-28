import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * GET /api/hub/emotions/summary?hubId=&tenantId=&from=&to=
 * Devuelve KPIs: valence promedio, conteos, K/C/G medios, totales por tipo de evento,
 * snapshots/competencias, progreso, affinity heat y uso de batches.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hubId = url.searchParams.get("hubId") || undefined;
  const tenantId = url.searchParams.get("tenantId") || undefined;
  const from = url.searchParams.get("from") ? new Date(url.searchParams.get("from")!) : undefined;
  const to = url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : undefined;

  // Filtros base por rango/escopo
  const dateWhere = (field = "createdAt") =>
    from || to
      ? { [field]: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {};

  // EmotionalEvents
  const events = await prisma.emotionalEvent.findMany({
    where: {
      ...(hubId ? { contextType: "hub", contextId: hubId } : {}),
      ...(tenantId ? { contextType: "tenant", contextId: tenantId } : {}),
      ...dateWhere("createdAt"),
    },
    select: { type: true, intensity: true, valence: true, createdAt: true },
  });

  const valences = events.map(e => e.valence ?? 0);
  const avgValence = valences.length ? valences.reduce((a, b) => a + b, 0) / valences.length : 0;

  const byType: Record<string, number> = {};
  for (const e of events) byType[e.type] = (byType[e.type] ?? 0) + 1;

  // EQ Snapshots (K/C/G + overall4)
  const eqSnapshots = await prisma.eqSnapshot.findMany({
    where: {
      ...(hubId ? { member: { hubId } } : {}),
      ...(tenantId ? { member: { tenantId } } : {}),
      ...dateWhere("at"),
    },
    select: { K: true, C: true, G: true, overall4: true, at: true },
  });

  const avg = (arr: (number | null | undefined)[]) => {
    const vals = arr.filter((n): n is number => typeof n === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const kAvg = avg(eqSnapshots.map(s => s.K));
  const cAvg = avg(eqSnapshots.map(s => s.C));
  const gAvg = avg(eqSnapshots.map(s => s.G));
  const overall4Avg = avg(eqSnapshots.map(s => s.overall4 ?? 0));

  // Subfactores/competencias/valores/talentos (distribuciones)
  const [subfactors, competencies, values, talents] = await Promise.all([
    prisma.eqSubfactorSnapshot.groupBy({
      by: ["key"],
      where: { snapshot: { ...(hubId ? { member: { hubId } } : {}), ...(tenantId ? { member: { tenantId } } : {}), ...dateWhere("createdAt") } },
      _avg: { score: true },
      _count: true,
    }),
    prisma.eqCompetencySnapshot.groupBy({
      by: ["key"],
      where: { snapshot: { ...(hubId ? { member: { hubId } } : {}), ...(tenantId ? { member: { tenantId } } : {}), ...dateWhere("createdAt") } },
      _avg: { score: true },
      _count: true,
    }),
    prisma.eqValueSnapshot.groupBy({
      by: ["key"],
      where: { snapshot: { ...(hubId ? { member: { hubId } } : {}), ...(tenantId ? { member: { tenantId } } : {}), ...dateWhere("createdAt") } },
      _avg: { score: true },
      _count: true,
    }),
    prisma.talentSnapshot.groupBy({
      by: ["key"],
      where: { snapshot: { ...(hubId ? { member: { hubId } } : {}), ...(tenantId ? { member: { tenantId } } : {}), ...dateWhere("createdAt") } },
      _avg: { score: true },
      _count: true,
    }),
  ]);

  // Progress (check-ins)
  const progressCount = await prisma.eqProgress.count({
    where: {
      ...(hubId ? { member: { hubId } } : {}),
      ...(tenantId ? { member: { tenantId } } : {}),
      ...dateWhere("createdAt"),
    },
  });

  // Affinity (última fotografía de afinidad “calor” promedio)
  const affLearning = await prisma.affinitySnapshot.findMany({
    where: {
      ...(hubId ? { member: { hubId } } : {}),
      ...(tenantId ? { member: { tenantId } } : {}),
      ...dateWhere("createdAt"),
    },
    select: { lastHeat135: true },
  });
  const avgAffinityHeat = avg(affLearning.map(a => a.lastHeat135 ?? 0));

  // Batches (uso)
  const batchesCount = await prisma.batch.count({
    where: { ...dateWhere("startedAt") },
  });

  // Motores IA Emocional activos
  const enginesActive = await prisma.emotionalAIEngine.count({
    where: {
      state: "active",
      ...(hubId ? { hubId } : {}),
      ...(tenantId ? { tenantId } : {}),
    },
  });

  return NextResponse.json({
    scope: { hubId: hubId ?? null, tenantId: tenantId ?? null, from: from ?? null, to: to ?? null },
    kpis: {
      avgValence, eventsCount: events.length, byType,
      kAvg, cAvg, gAvg, overall4Avg,
      progressCount, avgAffinityHeat, batchesCount, enginesActive,
    },
    distributions: {
      subfactors, competencies, values, talents,
    },
  });
}