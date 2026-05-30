// src/app/api/admin/notifications/send/route.ts
// ============================================================
// Admin Send Notification API
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { scopeCanSeeUser } from "@/core/admin/scopedList";
import { NotificationService } from "@/lib/notifications";
import { NotificationType, NotificationChannel, NotificationScope } from "@prisma/client";

export const runtime = "nodejs";

/**
 * POST /api/admin/notifications/send
 * Send notification to hub/tenant/user.
 * 🔐 Solo administradores. Para scope USER, el target debe estar en el
 * scope del admin (evita spam/phishing in-app a usuarios arbitrarios).
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAdminWithScope();
  if (authResult.error) return authResult.error;
  const auth = authResult.user;

  try {
    const body = await req.json();
    const {
      scope,
      userId,
      type,
      title,
      message,
      channels,
      priority = 5,
    } = body;

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
    }

    // Get hub/tenant context
    const hubId = auth.hubs?.[0]?.id;
    // Coerce null → undefined so downstream Notification helpers
    // accept it (their signature is `string | undefined`).
    const tenantId = auth.primaryTenantId ?? undefined;

    let targetUsers: string[] = [];
    let notificationScope: NotificationScope = "PERSONAL";

    switch (scope) {
      case "USER":
        if (!userId) {
          return NextResponse.json({ ok: false, error: "userId required for USER scope" }, { status: 400 });
        }
        // El target debe estar dentro del scope del admin.
        if (!(await scopeCanSeeUser(authResult.scope, userId))) {
          return NextResponse.json({ ok: false, error: "Usuario fuera de tu scope" }, { status: 403 });
        }
        targetUsers = [userId];
        notificationScope = "PERSONAL";
        break;

      case "HUB":
        if (!hubId) {
          return NextResponse.json({ ok: false, error: "No hub context" }, { status: 400 });
        }
        const hubMembers = await prisma.hubMembership.findMany({
          where: { hubId },
          select: { userId: true },
        });
        targetUsers = hubMembers.map((m) => m.userId);
        notificationScope = "HUB";
        break;

      case "TENANT":
        if (!tenantId && !auth.isSuperAdmin) {
          return NextResponse.json({ ok: false, error: "No tenant context" }, { status: 400 });
        }
        const tenantUsers = await prisma.user.findMany({
          where: {
            primaryTenantId: tenantId,
            active: true,
          },
          select: { id: true },
        });
        targetUsers = tenantUsers.map((u) => u.id);
        notificationScope = "TENANT";
        break;

      default:
        return NextResponse.json({ ok: false, error: "Invalid scope" }, { status: 400 });
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ ok: false, error: "No users to notify" }, { status: 400 });
    }

    // Queue notifications for all users
    const notificationIds: string[] = [];
    for (const targetUserId of targetUsers) {
      const ids = await NotificationService.queue({
        userId: targetUserId,
        type: type as NotificationType,
        title,
        message,
        channels: channels as NotificationChannel[],
        priority,
        scope: notificationScope,
        hubId: scope === "HUB" ? hubId : undefined,
        tenantId,
      });
      notificationIds.push(...ids);
    }

    return NextResponse.json({
      ok: true,
      notificationIds,
      recipientCount: targetUsers.length,
    });
  } catch (error) {
    console.error("[Admin Send Notification]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
