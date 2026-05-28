// src/app/api/admin/agents/sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/**
 * POST /api/admin/agents/sync — RECONCILE (limpieza), no clonado.
 * ---------------------------------------------------------
 * Versiones previas clonaban cada agente GLOBAL a cada tenant/superhub/hub/org.
 * Eso es redundante (resolveAgent ya hace fallback a global) y ensuciaba la
 * lista (p.ej. un agente global-only acababa con una copia por entidad).
 *
 * Ahora "Sincronizar" LIMPIA esos clones redundantes:
 *  - Canónicos que se conservan: agentes GLOBAL + agentes con scope que llevan
 *    `culturePrompt` (los sembrados con cultura Six Seconds, customizados).
 *  - Se eliminan: agentes con scope SIN `culturePrompt` cuyo slug existe como
 *    agente global (clones puros creados por el sync antiguo).
 */
export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const globals = await prisma.agentConfig.findMany({
      where: { tenantId: null, superHubId: null, hubId: null, organizationId: null },
      select: { slug: true },
    });
    const globalSlugs = [...new Set(globals.map((g) => g.slug))];

    if (globalSlugs.length === 0) {
      return NextResponse.json({
        ok: false,
        message: "⚠️ No hay agentes globales base.",
      });
    }

    // Borra clones redundantes: con scope, sin culturePrompt, y con un global
    // del mismo slug que los cubre vía fallback.
    const removed = await prisma.agentConfig.deleteMany({
      where: {
        slug: { in: globalSlugs },
        culturePrompt: null,
        OR: [
          { tenantId: { not: null } },
          { superHubId: { not: null } },
          { hubId: { not: null } },
          { organizationId: { not: null } },
        ],
      },
    });

    const remaining = await prisma.agentConfig.count();

    console.log(`🧹 Sync/reconcile: ${removed.count} clones eliminados, ${remaining} agentes restantes.`);

    return NextResponse.json({
      ok: true,
      message: `🧹 Limpieza completada: ${removed.count} clones redundantes eliminados.`,
      cleaned: removed.count,
      remaining,
      globals: globalSlugs.length,
    });
  } catch (error: any) {
    console.error("❌ Error en /api/admin/agents/sync:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
