// src/app/api/admin/notifications/queue/route.ts
// ============================================================
// Admin Notifications Queue API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * GET /api/admin/notifications/queue
 * Get notification queue for the hub/tenant
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Get hub/tenant context
    const hubId = auth.hubs?.[0]?.id;
    const tenantId = auth.primaryTenantId;

    // Build where clause
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

    if (status) where.status = status;
    if (channel) where.channel = channel;
    if (type) where.type = type;

    const notifications = await prisma.notificationQueue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        userName: n.user?.name || n.user?.email?.split("@")[0],
        type: n.type,
        channel: n.channel,
        title: n.title,
        message: n.message,
        status: n.status,
        priority: n.priority,
        scope: n.scope,
        sentAt: n.sentAt,
        createdAt: n.createdAt,
        attempts: n.attempts,
        lastError: n.lastError,
      })),
    });
  } catch (error) {
    console.error("[Admin Notifications Queue]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
