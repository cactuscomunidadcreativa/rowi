// src/core/auth/hasAccess.ts

import { isSuperAdmin } from "./policies/policy.super";
import { isAdmin } from "./policies/policy.admin";
import { hasScope } from "./policies/policy.scope";

/**
 * canAccess(userId, scopeType, scopeId)
 *
 * scopeType debe ser uno de:
 * - "rowiverse"
 * - "superhub"
 * - "tenant"
 * - "hub"
 * - "organization"
 * - "community"
 *
 * scopeId es el ID específico del contexto
 */
export async function canAccess(
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

  // 1️⃣ SUPERADMIN = acceso total
  if (await isSuperAdmin(userId)) return true;

  // 2️⃣ Rol administrativo sobre ese scope.
  // isAdmin only knows rowiverse/superhub/tenant/hub. For
  // organization/community we skip to the scope check below.
  if (
    scopeType === "rowiverse" ||
    scopeType === "superhub" ||
    scopeType === "tenant" ||
    scopeType === "hub"
  ) {
    if (await isAdmin(userId, scopeType, scopeId)) return true;
  }

  // 3️⃣ Permiso simple sobre ese scope
  if (await hasScope(userId, scopeType, scopeId)) return true;

  return false;
}