import { ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { resolveCapabilities, type PlanFlags } from "@/core/capabilities/resolve";

/**
 * Hub de Gestión (antes "TP / Teleperformance Hub") — vistas operativas del
 * cliente: personas, equipos, alertas, ROI, ECO.
 *
 * Gate por CAPABILITIES (rol + suscripción), no por email hardcoded. El antiguo
 * gate solo dejaba pasar @6seconds/@cactus/SuperAdmin; ahora cualquier admin de
 * un tenant (HR) o hub (team-lead) cuyo plan tenga el módulo (benchmarkAccess)
 * entra y ve su slice. SuperAdmin (rowiverse) ve todo sin gate de plan.
 */
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

export default async function ManageHubLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminWithScope();

  let authorized = false;
  if (!admin.error) {
    let plan: Record<string, unknown> | null = null;
    if (admin.scope.type !== "rowiverse" && admin.scope.id) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: admin.scope.id },
        select: { plan: { select: PLAN_SELECT } },
      });
      plan = tenant?.plan ?? null;
    }
    const caps = resolveCapabilities(admin.scope.type, planToFlags(plan));
    // Entra quien pueda ver al menos el dashboard del hub.
    authorized = caps.has("tp.dashboard");
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Acceso restringido</h2>
          <p className="text-[var(--rowi-muted)] mb-6">
            El Hub de Gestión requiere un plan con el módulo activado y un rol de
            administración (RR.HH. o líder de equipo).
          </p>
          <Link
            href="/hub/admin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Volver a Admin
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
