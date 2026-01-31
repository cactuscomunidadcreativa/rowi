// src/app/api/notifications/route.ts
// ============================================================
// Notifications API - Get & manage user notifications
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";
import { NotificationService } from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * GET /api/notifications
 * Get user's notifications (in-app)
 * Query params:
 *   - limit: number of notifications to return (default 50)
 *   - unreadOnly: true/false (default true)
 *   - type: filter by notification type
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const unreadOnly = searchParams.get("unreadOnly") !== "false";
    const type = searchParams.get("type");

    // Build where clause
    const where: Record<string, unknown> = {
      userId: auth.id,
      channel: "IN_APP",
      status: { in: ["SENT", "DELIVERED"] },
    };

    if (unreadOnly) {
      where.readAt = null;
    }

    if (type) {
      where.type = type;
    }

    // Get notifications
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notificationQueue.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          actionUrl: true,
          metadata: true,
          priority: true,
          scope: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notificationQueue.count({ where }),
      prisma.notificationQueue.count({
        where: {
          userId: auth.id,
          channel: "IN_APP",
          status: { in: ["SENT", "DELIVERED"] },
          readAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      notifications,
      total,
      unreadCount,
    });
  } catch (error) {
    console.error("[Notifications GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Send a notification (admin/system use)
 * Body: { userId, type, title?, message, channels?, metadata?, actionUrl? }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, type, title, message, channels, metadata, actionUrl, hubId } = body;

    // For now, only allow users to send to themselves
    // TODO: Add admin/permission check for sending to others
    if (userId && userId !== auth.id && !auth.isSuperAdmin) {
      return NextResponse.json(
        { ok: false, error: "Cannot send notifications to other users" },
        { status: 403 }
      );
    }

    const targetUserId = userId || auth.id;

    // Queue the notification
    const notificationIds = await NotificationService.queue({
      userId: targetUserId,
      type,
      title,
      message,
      channels,
      metadata,
      actionUrl,
      hubId,
      tenantId: auth.primaryTenantId || undefined,
    });

    return NextResponse.json({
      ok: true,
      notificationIds,
    });
  } catch (error) {
    console.error("[Notifications POST]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 * Body: { notificationIds: string[] } or { markAllRead: true }
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationIds, markAllRead } = body;

    let count = 0;

    if (markAllRead) {
      count = await NotificationService.markAllAsRead(auth.id);
    } else if (notificationIds?.length > 0) {
      count = await NotificationService.markAsRead(notificationIds, auth.id);
    }

    return NextResponse.json({
      ok: true,
      markedAsRead: count,
    });
  } catch (error) {
    console.error("[Notifications PATCH]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
