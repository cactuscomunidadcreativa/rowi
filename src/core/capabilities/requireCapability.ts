/**
 * Gate de capability para route handlers y páginas server.
 *
 * Combina los dos ejes contra la DB:
 *   - scope: de requireAdminWithScope (rol/ámbito del usuario)
 *   - plan: la suscripción del TENANT del scope (la paga el tenant), con
 *           fallback al plan del usuario para scope personal.
 *
 * Uso en un route handler:
 *   const gate = await requireCapability("tp.people");
 *   if (gate.error) return gate.error;
 *   // gate.scope / gate.caps disponibles
 */
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { resolveCapabilities, type PlanFlags } from "./resolve";
import type { Capability } from "./catalog";

/** Lee los flags de suscripción relevantes desde un Plan (o defaults en false). */
function planToFlags(plan: Record<string, unknown> | null | undefined): PlanFlags {
  if (!plan) return {};
  return {
    benchmarkAccess: !!plan.benchmarkAccess,
    apiAccess: !!plan.apiAccess,
    weekflowAccess: !!plan.weekflowAccess,
    rowiECOAccess: !!plan.rowiECOAccess,
    rowiAffinityAccess: !!plan.rowiAffinityAccess,
    rowiEQAccess: !!plan.rowiEQAccess,
    rowiTrainerAccess: !!plan.rowiTrainerAccess,
    rowiSalesAccess: !!plan.rowiSalesAccess,
    superRowiAccess: !!plan.superRowiAccess,
  };
}

const PLAN_SELECT = {
  benchmarkAccess: true, apiAccess: true, weekflowAccess: true,
  rowiECOAccess: true, rowiAffinityAccess: true, rowiEQAccess: true,
  rowiTrainerAccess: true, rowiSalesAccess: true, superRowiAccess: true,
} as const;

type ScopedAdmin = Awaited<ReturnType<typeof requireAdminWithScope>>;
type CapabilityGate =
  | {
      ok: true;
      error: null;
      scope: NonNullable<ScopedAdmin["scope"]>;
      user: NonNullable<ScopedAdmin["user"]>;
      caps: Set<Capability>;
    }
  | { ok: false; error: NextResponse; scope: null; user: null; caps: null };

export async function requireCapability(capability: Capability): Promise<CapabilityGate> {
  const admin = await requireAdminWithScope();
  if (admin.error) return { ok: false, error: admin.error, scope: null, user: null, caps: null };

  // Cargar el Plan del tenant del scope; fallback al plan del usuario.
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

  if (!caps.has(capability)) {
    return {
      ok: false,
      error: NextResponse.json(
        { ok: false, error: "capability_denied", capability },
        { status: 403 },
      ),
      scope: null,
      user: null,
      caps: null,
    };
  }

  return { ok: true, error: null, scope: admin.scope, user: admin.user, caps };
}
