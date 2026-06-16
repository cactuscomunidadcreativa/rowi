/**
 * 📈 API: CEO Daily Dashboard — la vista diaria del LOOP del negocio.
 *
 * Agrega el embudo SIA (ActivityLog action="sia_funnel.<step>") + el estado del
 * moat relacional (díadas, ECOs, outcomes) + retención D7/D30. No es el panel de
 * ventas (eso vive en /api/admin/sales/dashboard): aquí medimos si el LOOP gira
 * — la cadena perfil → brecha → mensaje → outcome → retorno.
 *
 * Métrica reina (ver src/domains/metrics/lib/funnel.ts): usuarios que usan
 * ECO/afinidad para una relación real y vuelven a 7 días.
 *
 * GET ?period=7d|30d|90d  → { ok: true, funnel, dyads, eco, retention }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const dynamic = "force-dynamic";

/** Pasos del embudo que el dashboard muestra, en orden de la cadena. */
const FUNNEL_STEPS = [
  "registered",
  "mini_sei_completed",
  "onboarding_completed",
  "rel_invite_sent",
  "rel_invite_accepted",
  "eco_used",
  "eco_sent",
  "eco_feedback",
  "today_completed",
] as const;

function startDateFor(period: string, now: Date): Date {
  const d = new Date(now);
  switch (period) {
    case "7d":
      d.setDate(now.getDate() - 7);
      break;
    case "90d":
      d.setDate(now.getDate() - 90);
      break;
    case "30d":
    default:
      d.setDate(now.getDate() - 30);
  }
  return d;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";
    const now = new Date();
    const startDate = startDateFor(period, now);

    // =====================================================
    // EMBUDO — conteo de cada paso en el período (ActivityLog).
    // Distinct por usuario donde tiene sentido (un paso por persona).
    // =====================================================
    const funnelRows = await prisma.activityLog.groupBy({
      by: ["action"],
      where: {
        entity: "sia_funnel",
        createdAt: { gte: startDate },
      },
      _count: { _all: true },
    });
    const funnelCountByAction = new Map(
      funnelRows.map((r) => [r.action, r._count._all])
    );
    const funnel = FUNNEL_STEPS.map((step) => ({
      step,
      count: funnelCountByAction.get(`sia_funnel.${step}`) ?? 0,
    }));

    // =====================================================
    // DÍADAS — el objeto del negocio (relaciones declaradas).
    // Activa = con actividad de hilo ECO en el período.
    // =====================================================
    const [totalDyads, newDyads, dyadsWithJoinedOther] = await Promise.all([
      prisma.relationshipDyad.count(),
      prisma.relationshipDyad.count({ where: { createdAt: { gte: startDate } } }),
      prisma.relationshipDyad.count({ where: { otherJoined: true } }),
    ]);

    // Díadas activas = díadas con al menos un EcoThread actualizado en el período.
    const activeThreadDyads = await prisma.ecoThread.findMany({
      where: { updatedAt: { gte: startDate } },
      distinct: ["dyadId"],
      select: { dyadId: true },
    });
    const activeDyads = activeThreadDyads.length;

    // =====================================================
    // ECO — el motor de la acción + el OUTCOME (el moat).
    // =====================================================
    const [ecosSent, outcomesPositive, outcomesNegative] = await Promise.all([
      prisma.ecoMessage.count({
        where: { role: "sent", createdAt: { gte: startDate } },
      }),
      prisma.ecoMessage.count({
        where: {
          role: "feedback",
          createdAt: { gte: startDate },
          gapUsed: { path: ["worked"], equals: true },
        },
      }),
      prisma.ecoMessage.count({
        where: {
          role: "feedback",
          createdAt: { gte: startDate },
          gapUsed: { path: ["worked"], equals: false },
        },
      }),
    ]);
    const outcomesTotal = outcomesPositive + outcomesNegative;
    const outcomeRate = ecosSent > 0 ? (outcomesTotal / ecosSent) * 100 : 0;
    const workedRate = outcomesTotal > 0 ? (outcomesPositive / outcomesTotal) * 100 : 0;

    // =====================================================
    // RETENCIÓN — el corazón del producto: ¿vuelven a cerrar el loop?
    // D7 = usuarios registrados hace ≥7d que cerraron un today_completed
    // (o daily-pulse) entre el día 7 y hoy. Aproximación honesta con la data
    // que existe: cohorte de registro vs señal de actividad reciente.
    // =====================================================
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Cohortes de registro.
    const [cohort7, cohort30] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { lt: sevenDaysAgo, gte: thirtyDaysAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { lt: thirtyDaysAgo } },
      }),
    ]);

    // Usuarios de esas cohortes con un today_completed reciente (señal de retorno).
    const recentReturnLogs = await prisma.activityLog.findMany({
      where: {
        action: "sia_funnel.today_completed",
        createdAt: { gte: sevenDaysAgo },
        userId: { not: null },
      },
      distinct: ["userId"],
      select: { userId: true, user: { select: { createdAt: true } } },
    });
    const returned7 = recentReturnLogs.filter(
      (r) => r.user && r.user.createdAt < sevenDaysAgo && r.user.createdAt >= thirtyDaysAgo
    ).length;
    const returned30 = recentReturnLogs.filter(
      (r) => r.user && r.user.createdAt < thirtyDaysAgo
    ).length;

    const d7Retention = cohort7 > 0 ? (returned7 / cohort7) * 100 : 0;
    const d30Retention = cohort30 > 0 ? (returned30 / cohort30) * 100 : 0;

    return NextResponse.json({
      ok: true,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),

      funnel,

      dyads: {
        total: totalDyads,
        new: newDyads,
        active: activeDyads,
        withJoinedOther: dyadsWithJoinedOther,
      },

      eco: {
        sent: ecosSent,
        outcomesTotal,
        outcomesPositive,
        outcomesNegative,
        outcomeRate: Math.round(outcomeRate * 10) / 10,
        workedRate: Math.round(workedRate * 10) / 10,
      },

      retention: {
        cohort7,
        returned7,
        d7: Math.round(d7Retention * 10) / 10,
        cohort30,
        returned30,
        d30: Math.round(d30Retention * 10) / 10,
      },
    });
  } catch (error) {
    console.error("❌ Error GET /api/admin/ceo/dashboard:", error);
    return NextResponse.json(
      { ok: false, error: "Error loading CEO dashboard" },
      { status: 500 }
    );
  }
}
