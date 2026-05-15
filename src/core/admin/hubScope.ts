// src/core/admin/hubScope.ts
import { prisma } from "@/core/prisma";
import type { AdminScope } from "@/core/auth/requireAdmin";

/**
 * Returns true if the given admin scope can administer the given hubId.
 *
 *   rowiverse     → always true.
 *   superhub:<id> → true if the hub belongs to that superhub.
 *   hub:<id>      → true only if scope.id === hubId.
 *   tenant:<id>   → true if the hub's tenantId === scope.id.
 *
 * Used by /api/admin/hubs/[hubId]/* so any admin level can touch their
 * slice without escalating to SuperAdmin.
 */
export async function scopeCanAdminHub(
  scope: AdminScope,
  hubId: string,
): Promise<boolean> {
  if (scope.type === "rowiverse") return true;
  if (scope.type === "hub") return scope.id === hubId;

  const hub = await prisma.hub.findUnique({
    where: { id: hubId },
    select: { tenantId: true, superHubId: true },
  });
  if (!hub) return false;

  if (scope.type === "tenant") return hub.tenantId === scope.id;
  if (scope.type === "superhub") return hub.superHubId === scope.id;
  return false;
}
