/**
 * 📊 API: Sales Dashboard
 * GET /api/admin/sales/dashboard - Obtener métricas de ventas y suscripciones
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";

// =========================================================
// GET — Dashboard de Ventas
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, 1y

    // Calcular fechas según período
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // =====================================================
    // MÉTRICAS DE USUARIOS
    // =====================================================

    // Total de usuarios
    const totalUsers = await prisma.user.count();

    // Usuarios nuevos en el período
    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Usuarios por estado de onboarding
    const usersByStatus = await prisma.user.groupBy({
      by: ["onboardingStatus"],
      _count: true,
    });

    // Usuarios activos (con actividad en el período)
    const activeUsers = await prisma.user.count({
      where: {
        onboardingStatus: "ACTIVE",
      },
    });

    // Usuarios en trial
    const usersInTrial = await prisma.user.count({
      where: {
        trialEndsAt: { gt: now },
        onboardingStatus: { in: ["ACTIVE", "ONBOARDING", "PENDING_SEI"] },
      },
    });

    // Trials que expiran pronto (próximos 7 días)
    const expiringTrials = await prisma.user.count({
      where: {
        trialEndsAt: {
          gt: now,
          lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // =====================================================
    // MÉTRICAS DE PLANES
    // =====================================================

    // Usuarios por plan
    const usersByPlan = await prisma.user.groupBy({
      by: ["planId"],
      _count: true,
      where: {
        planId: { not: null },
      },
    });

    // Obtener nombres de planes
    const plans = await prisma.plan.findMany({
      select: { id: true, name: true, priceUsd: true },
    });

    const planMap = new Map(plans.map((p) => [p.id, p]));
    const usersByPlanWithNames = usersByPlan.map((item) => ({
      planId: item.planId,
      planName: planMap.get(item.planId!)?.name || "Sin Plan",
      priceUsd: planMap.get(item.planId!)?.priceUsd || 0,
      count: item._count,
    }));

    // =====================================================
    // MÉTRICAS DE SUSCRIPCIONES (si hay integración Stripe)
    // =====================================================

    // Suscripciones activas
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: "ACTIVE" },
    });

    // Suscripciones por estado
    const subscriptionsByStatus = await prisma.subscription.groupBy({
      by: ["status"],
      _count: true,
    });

    // Nuevas suscripciones en el período
    const newSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Suscripciones canceladas en el período
    const cancelledSubscriptions = await prisma.subscription.count({
      where: {
        status: "CANCELLED",
        cancelledAt: { gte: startDate },
      },
    });

    // =====================================================
    // MÉTRICAS DE PAGOS
    // =====================================================

    // Total de pagos en el período
    const paymentsInPeriod = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "SUCCEEDED",
      },
      select: {
        amountCents: true,
        currency: true,
      },
    });

    const totalRevenue = paymentsInPeriod.reduce(
      (sum, p) => sum + p.amountCents,
      0
    );

    // Pagos por día (para gráfico)
    const paymentsByDay = await prisma.payment.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: { gte: startDate },
        status: "SUCCEEDED",
      },
      _sum: {
        amountCents: true,
      },
    });

    // =====================================================
    // MÉTRICAS SEI
    // =====================================================

    // Solicitudes SEI pendientes
    const pendingSeiRequests = await prisma.seiRequest.count({
      where: { status: "PENDING" },
    });

    // Solicitudes SEI completadas en el período
    const completedSeiInPeriod = await prisma.seiRequest.count({
      where: {
        status: "COMPLETED",
        completedAt: { gte: startDate },
      },
    });

    // SEI por estado
    const seiByStatus = await prisma.seiRequest.groupBy({
      by: ["status"],
      _count: true,
    });

    // =====================================================
    // MÉTRICAS DE ADQUISICIÓN
    // =====================================================

    // Adquisiciones por fuente
    const acquisitionsBySource = await prisma.userAcquisition.groupBy({
      by: ["source"],
      _count: true,
      where: {
        registeredAt: { gte: startDate },
      },
    });

    // Conversiones (usuarios que pasaron a pago)
    const conversions = await prisma.userAcquisition.count({
      where: {
        convertedAt: { not: null },
        registeredAt: { gte: startDate },
      },
    });

    // =====================================================
    // MÉTRICAS DE CUPONES
    // =====================================================

    // Cupones usados en el período
    const couponsUsed = await prisma.couponRedemption.count({
      where: {
        redeemedAt: { gte: startDate },
      },
    });

    // Top cupones
    const topCoupons = await prisma.couponRedemption.groupBy({
      by: ["couponId"],
      _count: true,
      orderBy: {
        _count: {
          couponId: "desc",
        },
      },
      take: 5,
    });

    // =====================================================
    // RESPUESTA
    // =====================================================

    return NextResponse.json({
      ok: true,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),

      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
        inTrial: usersInTrial,
        expiringTrials,
        byStatus: usersByStatus.map((s) => ({
          status: s.onboardingStatus,
          count: s._count,
        })),
        byPlan: usersByPlanWithNames,
      },

      subscriptions: {
        active: activeSubscriptions,
        new: newSubscriptions,
        cancelled: cancelledSubscriptions,
        byStatus: subscriptionsByStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
      },

      revenue: {
        totalCents: totalRevenue,
        totalUsd: totalRevenue / 100,
        paymentsCount: paymentsInPeriod.length,
        // byDay: paymentsByDay,
      },

      sei: {
        pending: pendingSeiRequests,
        completedInPeriod: completedSeiInPeriod,
        byStatus: seiByStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
      },

      acquisition: {
        bySource: acquisitionsBySource.map((a) => ({
          source: a.source,
          count: a._count,
        })),
        conversions,
        conversionRate: newUsers > 0 ? (conversions / newUsers) * 100 : 0,
      },

      coupons: {
        usedInPeriod: couponsUsed,
        topCoupons: topCoupons.map((c) => ({
          couponId: c.couponId,
          count: c._count,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error GET /api/admin/sales/dashboard:", error);
    return NextResponse.json(
      { ok: false, error: "Error loading sales dashboard" },
      { status: 500 }
    );
  }
}
