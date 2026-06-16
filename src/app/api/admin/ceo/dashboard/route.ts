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
    // EMBUDO + DÍADAS + ECO — bloques independientes (solo dependen de
    // startDate), los disparamos en paralelo: la latencia es el MAX de un
    // round-trip, no la suma. groupBy cuenta EVENTOS por paso (no usuarios
    // únicos): pasos re-emitibles como today_completed cuentan cada cierre.
    // =====================================================
    const [
      funnelRows,
      totalDyads,
      newDyads,
      dyadsWithJoinedOther,
      activeThreadDyads,
      ecosSent,
      outcomesPositive,
      outcomesNegative,
    ] = await Promise.all([
      prisma.activityLog.groupBy({
        by: ["action"],
        where: { entity: "sia_funnel", createdAt: { gte: startDate } },
        _count: { _all: true },
      }),
      prisma.relationshipDyad.count(),
      prisma.relationshipDyad.count({ where: { createdAt: { gte: startDate } } }),
      prisma.relationshipDyad.count({ where: { otherJoined: true } }),
      prisma.ecoThread.findMany({
        where: { updatedAt: { gte: startDate } },
        distinct: ["dyadId"],
        select: { dyadId: true },
      }),
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

    const funnelCountByAction = new Map(
      funnelRows.map((r) => [r.action, r._count._all])
    );
    const funnel = FUNNEL_STEPS.map((step) => ({
      step,
      count: funnelCountByAction.get(`sia_funnel.${step}`) ?? 0,
    }));

    const activeDyads = activeThreadDyads.length;
    const outcomesTotal = outcomesPositive + outcomesNegative;
    // Cap a 100%: el feedback puede llegar para ECOs enviados ANTES de la
    // ventana, así que outcomesTotal puede superar a ecosSent en el período.
    // Mostrar ">100% capturado" confunde; lo acotamos.
    const outcomeRate = ecosSent > 0 ? Math.min(100, (outcomesTotal / ecosSent) * 100) : 0;
    const workedRate = outcomesTotal > 0 ? (outcomesPositive / outcomesTotal) * 100 : 0;

    // =====================================================
    // RETENCIÓN — el corazón del producto: ¿vuelven a cerrar el loop?
    // Cohorte CLÁSICA con denominador ACOTADO (no "todos los usuarios viejos",
    // que haría caer la métrica solo por acumulación de base):
    //  - D7  = de los registrados hace 7–14d, cuántos cerraron un today_completed
    //          en los últimos 7d (volvieron en su semana).
    //  - D30 = de los registrados hace 30–60d, cuántos cerraron un today_completed
    //          en los últimos 30d.
    // Cada horizonte usa su PROPIA ventana de actividad (antes ambas usaban 7d,
    // y D30 no tenía cota inferior → métrica engañosa). Independiente de ?period:
    // D7/D30 son horizontes fijos por definición, no afectados por el selector.
    const DAY = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY);

    // Cohortes de registro acotadas por ambos lados.
    const [cohort7, cohort30] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { lt: sevenDaysAgo, gte: fourteenDaysAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { lt: thirtyDaysAgo, gte: sixtyDaysAgo } },
      }),
    ]);

    // Señal de retorno: usuarios con today_completed dentro de cada ventana de
    // actividad. Dos consultas (7d y 30d) porque los horizontes difieren.
    const [active7Logs, active30Logs] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          action: "sia_funnel.today_completed",
          createdAt: { gte: sevenDaysAgo },
          userId: { not: null },
          user: { is: { createdAt: { lt: sevenDaysAgo, gte: fourteenDaysAgo } } },
        },
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.activityLog.findMany({
        where: {
          action: "sia_funnel.today_completed",
          createdAt: { gte: thirtyDaysAgo },
          userId: { not: null },
          user: { is: { createdAt: { lt: thirtyDaysAgo, gte: sixtyDaysAgo } } },
        },
        distinct: ["userId"],
        select: { userId: true },
      }),
    ]);
    const returned7 = active7Logs.length;
    const returned30 = active30Logs.length;

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
