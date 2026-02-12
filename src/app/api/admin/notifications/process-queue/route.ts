// src/app/api/admin/notifications/process-queue/route.ts
/**
 * Proxy server-side para procesar la cola de notificaciones.
 * Permite a los admins disparar el procesamiento sin exponer CRON_SECRET al cliente.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { NotificationService } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50;

    const result = await NotificationService.processPending(limit);

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Admin Process Queue] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
