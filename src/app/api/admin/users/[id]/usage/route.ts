import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { scopeCanSeeUser } from "@/core/admin/scopedList";

export const dynamic = "force-dynamic";

/* =========================================================
   📊 GET — Historial de uso de IA + métricas agregadas (scope-aware)
========================================================= */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    if (!(await scopeCanSeeUser(auth.scope, id))) {
      return NextResponse.json(
        { ok: false, error: "Usuario fuera de tu scope" },
        { status: 403 },
      );
    }

    // 🔹 1. Historial detallado (últimos 60 registros)
    const usage = await prisma.userUsage.findMany({
      where: { userId: id },
      orderBy: { day: "desc" },
      take: 60,
    });

    // 🔹 2. Resumen agregado
    const summary = {
      totalTokens:
        usage.reduce((acc, u) => acc + (u.tokensInput || 0) + (u.tokensOutput || 0), 0) || 0,
      totalSessions: usage.length,
      mostUsedFeature:
        usage
          .reduce((acc: Record<string, number>, u) => {
            const f = u.feature || "General";
            acc[f] = (acc[f] || 0) + (u.tokensInput || 0) + (u.tokensOutput || 0);
            return acc;
          }, {}) || {},
      lastUsage: usage[0]?.day || null,
    };

    // 🔹 3. IA más usada
    const mostUsedFeature =
      Object.entries(summary.mostUsedFeature)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || "N/A";

    // 🔹 4. Estructura final del resumen
    const analytics = {
      totalTokens: summary.totalTokens,
      totalSessions: summary.totalSessions,
      mostUsedFeature,
      lastUsage: summary.lastUsage,
    };

    return NextResponse.json({ ok: true, usage, analytics });
  } catch (e: any) {
    console.error("❌ Error GET /usage:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error cargando uso IA" },
      { status: 500 }
    );
  }
}