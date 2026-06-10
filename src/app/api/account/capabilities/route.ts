/**
 * GET /api/account/capabilities
 * ---------------------------------------------------------
 * Devuelve el set de capabilities del usuario actual (rol + suscripción
 * resueltos en el server). La nav del admin lo usa para mostrar exactamente
 * los módulos que el usuario puede ver — ni más (no le filtra lo de plataforma
 * al cliente) ni menos (HR ve su Manage Hub si su plan lo activa).
 *
 * No es un gate (no devuelve 403): lista lo concedido. Cada ruta sigue
 * protegida por requireCapability; esto es solo para pintar el menú.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { resolveCapabilities, type PlanFlags } from "@/core/capabilities/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_SELECT = {
  benchmarkAccess: true, apiAccess: true, weekflowAccess: true,
  rowiECOAccess: true, rowiAffinityAccess: true, rowiEQAccess: true,
  rowiTrainerAccess: true, rowiSalesAccess: true, superRowiAccess: true,
} as const;

function planToFlags(plan: Record<string, unknown> | null | undefined): PlanFlags {
  if (!plan) return {};
  return {
    benchmarkAccess: !!plan.benchmarkAccess,
    rowiECOAccess: !!plan.rowiECOAccess,
    rowiAffinityAccess: !!plan.rowiAffinityAccess,
    rowiEQAccess: !!plan.rowiEQAccess,
    rowiTrainerAccess: !!plan.rowiTrainerAccess,
    rowiSalesAccess: !!plan.rowiSalesAccess,
    superRowiAccess: !!plan.superRowiAccess,
    apiAccess: !!plan.apiAccess,
    weekflowAccess: !!plan.weekflowAccess,
  };
}

export async function GET() {
  const admin = await requireAdminWithScope();
  if (admin.error) {
    // No es admin de nada → sin capabilities de admin. 200 con lista vacía.
    return NextResponse.json({ ok: true, capabilities: [], scope: null });
  }

  let plan: Record<string, unknown> | null = null;
  if (admin.scope.type !== "rowiverse" && admin.scope.id) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: admin.scope.id },
      select: { plan: { select: PLAN_SELECT } },
    });
    plan = tenant?.plan ?? null;
  }
  if (!plan && admin.scope.type !== "rowiverse") {
    const user = await prisma.user.findUnique({
      where: { id: admin.user.id },
      select: { plan: { select: PLAN_SELECT } },
    });
    plan = user?.plan ?? null;
  }

  const caps = resolveCapabilities(admin.scope.type, planToFlags(plan));
  return NextResponse.json({
    ok: true,
    capabilities: Array.from(caps),
    scope: admin.scope.type,
  });
}
