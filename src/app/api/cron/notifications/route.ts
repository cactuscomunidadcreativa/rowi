// src/app/api/cron/notifications/route.ts
// ============================================================
// Notification Queue Processor (Cron Job)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications";

export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute max

/**
 * GET /api/cron/notifications
 * Process pending notifications from the queue
 * Should be called by a cron job every minute
 *
 * Headers:
 *   - x-cron-secret: Secret to authorize cron calls
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers.get("x-cron-secret");

    if (cronSecret && providedSecret !== cronSecret) {
      console.warn("[Cron Notifications] Unauthorized attempt");
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron Notifications] Starting queue processing...");

    const result = await NotificationService.processPending(100);

    console.log("[Cron Notifications] Completed:", result);

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron Notifications] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/cron/notifications
 * Manually trigger processing (for testing)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers.get("x-cron-secret");

    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50;

    const result = await NotificationService.processPending(limit);

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron Notifications] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
