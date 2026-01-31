// src/app/api/admin/notifications/stats/route.ts
// ============================================================
// Admin Notifications Stats API
// ============================================================

import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * GET /api/admin/notifications/stats
 * Get notification statistics for the hub/tenant
 */
export async function GET() {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get hub/tenant context
    const hubId = auth.hubs?.[0]?.id;
    const tenantId = auth.primaryTenantId;

    // Build where clause based on access
    const where: Record<string, unknown> = {};
    if (!auth.isSuperAdmin) {
      if (hubId) {
        where.hubId = hubId;
      } else if (tenantId) {
        where.tenantId = tenantId;
      } else {
        where.userId = auth.id;
      }
    }

    // Get counts by status
    const [total, pending, sent, delivered, failed] = await Promise.all([
      prisma.notificationQueue.count({ where }),
      prisma.notificationQueue.count({ where: { ...where, status: "PENDING" } }),
      prisma.notificationQueue.count({ where: { ...where, status: "SENT" } }),
      prisma.notificationQueue.count({ where: { ...where, status: "DELIVERED" } }),
      prisma.notificationQueue.count({ where: { ...where, status: "FAILED" } }),
    ]);

    // Get counts by channel
    const byChannelRaw = await prisma.notificationQueue.groupBy({
      by: ["channel"],
      where,
      _count: { id: true },
    });
    const byChannel: Record<string, number> = {};
    byChannelRaw.forEach((item) => {
      byChannel[item.channel] = item._count.id;
    });

    // Get counts by type
    const byTypeRaw = await prisma.notificationQueue.groupBy({
      by: ["type"],
      where,
      _count: { id: true },
    });
    const byType: Record<string, number> = {};
    byTypeRaw.forEach((item) => {
      byType[item.type] = item._count.id;
    });

    return NextResponse.json({
      ok: true,
      stats: {
        total,
        pending,
        sent,
        delivered,
        failed,
        byChannel,
        byType,
      },
    });
  } catch (error) {
    console.error("[Admin Notifications Stats]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
