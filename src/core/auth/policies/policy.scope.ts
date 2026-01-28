// src/core/auth/policies/policy.scope.ts

import { prisma } from "../../prisma";
import { isSuperAdmin } from "./policy.super";

/**
 * Verifica si el usuario tiene acceso al scope solicitado.
 *
 * scopeType:
 * - rowiverse
 * - superhub
 * - tenant
 * - hub
 * - organization
 * - community
 */
export async function hasScope(
  userId: string,
  scopeType:
    | "rowiverse"
    | "superhub"
    | "tenant"
    | "hub"
    | "organization"
    | "community",
  scopeId: string | null
) {
  if (!userId) return false;

  /* =========================================================
     1) SUPERADMIN GLOBAL → acceso total
  ========================================================== */
  if (await isSuperAdmin(userId)) return true;

  /* =========================================================
     2) Permiso directo userPermission
  ========================================================== */
  const direct = await prisma.userPermission.findFirst({
    where: {
      userId,
      scopeType,
      scopeId: scopeId ?? undefined,
    },
  });

  if (direct) return true;

  /* =========================================================
     3) Herencia de SCOPES por membresía
       - tenant → membership.tenants
       - hub → membership.hubs
       - organization → membership.orgs
       - community → membership.communities
  ========================================================== */
  if (scopeType === "tenant" && scopeId) {
    const hasTenantMembership = await prisma.membership.findFirst({
      where: { userId, tenantId: scopeId },
    });
    if (hasTenantMembership) return true;
  }

  if (scopeType === "hub" && scopeId) {
    const hasHubMembership = await prisma.hubMembership.findFirst({
      where: { userId, hubId: scopeId },
    });
    if (hasHubMembership) return true;
  }

  if (scopeType === "organization" && scopeId) {
    const hasOrgMembership = await prisma.orgMembership.findFirst({
      where: { userId, organizationId: scopeId },
    });
    if (hasOrgMembership) return true;
  }

  if (scopeType === "community" && scopeId) {
    const hasCommunityMembership = await prisma.communityMember.findFirst({
      where: { userId, communityId: scopeId },
    });
    if (hasCommunityMembership) return true;
  }

  /* =========================================================
     4) SCOPES sin scopeId (nivel de "grupo")
        Ejemplo: un superhub-admin tiene acceso a TODO su superhub
  ========================================================== */
  if (!scopeId) {
    const broad = await prisma.userPermission.findFirst({
      where: { userId, scopeType },
    });
    if (broad) return true;
  }

  return false;
}