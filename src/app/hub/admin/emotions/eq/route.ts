import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * Devuelve información emocional completa: EQ, afinidad, talentos, valores, subfactores, etc.
 * Incluye series temporales y agregados diarios/globales.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hubId = url.searchParams.get("hubId") || undefined;
  const tenantId = url.searchParams.get("tenantId") || undefined;

  // ===== 1️⃣ EQ SNAPSHOTS BÁSICOS =====
  const snapshots = await prisma.eqSnapshot.findMany({
    where: {
      ...(hubId ? { member: { hubId } } : {}),
      ...(tenantId ? { member: { tenantId } } : {}),
    },
    orderBy: { at: "asc" },
    select: {
      id: true,
      at: true,
      userId: true,
      memberId: true,
      K: true,
      C: true,
      G: true,
      overall4: true,
      EL: true,
      RP: true,
      ACT: true,
      NE: true,
      IM: true,
      OP: true,
      EMP: true,
      NG: true,
    },
  });

  const day = (d: Date) => d.toISOString().slice(0, 10);
  const group = <T>(arr: T[], keyFn: (a: T) => string): Record<string, T[]> =>
    arr.reduce((acc, item) => {
      const k = keyFn(item);
      (acc[k] ||= []).push(item);
      return acc;
    }, {} as Record<string, T[]>);

  const grouped = group(snapshots, (s: typeof snapshots[number]) => day(s.at));
  const eqSeries = Object.entries(grouped).map(([date, vals]) => {
    const avg = (k: keyof typeof vals[0]) =>
      vals.filter((v: any) => typeof v[k] === "number").reduce((a: number, b: any) => a + (b[k] as number), 0) /
      (vals.filter((v: any) => typeof v[k] === "number").length || 1);

    return {
      date,
      K: avg("K"),
      C: avg("C"),
      G: avg("G"),
      overall4: avg("overall4"),
      EL: avg("EL"),
      RP: avg("RP"),
      ACT: avg("ACT"),
      NE: avg("NE"),
      IM: avg("IM"),
      OP: avg("OP"),
      EMP: avg("EMP"),
      NG: avg("NG"),
    };
  });

  // ===== 2️⃣ COMPETENCIAS / SUBFACTORES / VALORES / TALENTOS =====
  const [competencies, subfactors, values, successFactors, talents, moods] = await Promise.all([
    prisma.eqCompetencySnapshot.groupBy({
      by: ["key"],
      where: { snapshot: { ...(hubId ? { member: { hubId } } : {}), ...(tenantId ? { member: { tenantId } } : {}) } },
      _avg: { score: true },
      _count: true,
    }),
    prisma.eqSubfactorSnapshot.groupBy({
      by: ["key"],
      where: { snapshot: { ...(hubId ? { member: { hubId } } : {}), ...(tenantId ? { member: { tenantId } } : {}) } },
      _avg: { score: true },
      _count: true,
    }),
    prisma.eqValueSnapshot.groupBy({
      by: ["key"],
      where: { snapshot: { ...(hubId ? { member: { hubId } } : {}), ...(tenantId ? { member: { tenantId } } : {}) } },
      _avg: { score: true },
      _count: true,
    }),
    prisma.eqSuccessFactorSnapshot.groupBy({
      by: ["key"],
      where: { snapshot: { ...(hubId ? { member: { hubId } } : {}), ...(tenantId ? { member: { tenantId } } : {}) } },
      _avg: { score: true },
      _count: true,
    }),
    prisma.talentSnapshot.groupBy({
      by: ["key"],
      where: { snapshot: { ...(hubId ? { member: { hubId } } : {}), ...(tenantId ? { member: { tenantId } } : {}) } },
      _avg: { score: true },
      _count: true,
    }),
    prisma.eqMoodSnapshot.groupBy({
      by: ["mood"],
      where: { snapshot: { ...(hubId ? { member: { hubId } } : {}), ...(tenantId ? { member: { tenantId } } : {}) } },
      _avg: { intensity: true, valence: true },
      _count: true,
    }),
  ]);

  // ===== 3️⃣ AFINIDAD PROMEDIO =====
  const affinitySnapshots = await prisma.affinitySnapshot.findMany({
    where: {
      ...(hubId ? { member: { hubId } } : {}),
      ...(tenantId ? { member: { tenantId } } : {}),
    },
    select: { lastHeat135: true, context: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const affinitySeries = group(affinitySnapshots, (s: typeof affinitySnapshots[number]) => day(s.createdAt));
  const affinity = Object.entries(affinitySeries).map(([date, vals]) => ({
    date,
    heat: vals.reduce((a: number, b: any) => a + (b.lastHeat135 ?? 0), 0) / vals.length,
  }));

  // ===== 4️⃣ PROGRESO / CHECK-INS =====
  const progress = await prisma.eqProgress.groupBy({
    by: ["mood"],
    where: {
      ...(hubId ? { member: { hubId } } : {}),
      ...(tenantId ? { member: { tenantId } } : {}),
    },
    _count: true,
  });

  // ===== 5️⃣ EVENTOS EMOCIONALES =====
  const emotionalEvents = await prisma.emotionalEvent.groupBy({
    by: ["type"],
    where: {
      ...(hubId ? { contextType: "hub", contextId: hubId } : {}),
      ...(tenantId ? { contextType: "tenant", contextId: tenantId } : {}),
    },
    _count: true,
    _avg: { valence: true, intensity: true },
  });

  // ===== 6️⃣ MÉTRICAS GLOBALES =====
  const kpi = {
    totalSnapshots: snapshots.length,
    avgK: avg(eqSeries.map(s => s.K)),
    avgC: avg(eqSeries.map(s => s.C)),
    avgG: avg(eqSeries.map(s => s.G)),
    avgOverall: avg(eqSeries.map(s => s.overall4)),
    avgValence: avg(moods.map(m => m._avg.valence ?? 0)),
    avgIntensity: avg(moods.map(m => m._avg.intensity ?? 0)),
    avgAffinityHeat: avg(affinity.map(a => a.heat)),
    totalEvents: emotionalEvents.reduce((a, b) => a + b._count, 0),
    totalProgress: progress.reduce((a, b) => a + b._count, 0),
  };

  return NextResponse.json({
    kpi,
    series: {
      eq: eqSeries,
      affinity,
    },
    distributions: {
      competencies,
      subfactors,
      values,
      successFactors,
      talents,
      moods,
      emotionalEvents,
      progress,
    },
  });
}

// ===== Helper =====
function avg(arr: (number | null | undefined)[]) {
  const vals = arr.filter((v): v is number => typeof v === "number");
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}