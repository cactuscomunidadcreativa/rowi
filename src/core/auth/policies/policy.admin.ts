// src/core/auth/policies/policy.admin.ts

import { prisma } from "../../prisma";
import { hasScope } from "./policy.scope";
import { isSuperAdmin } from "./policy.super";

/**
 * isAdmin(userId, level, contextId)
 *
 * level:
 *  - "rowiverse"
 *  - "superhub"
 *  - "tenant"
 *  - "hub"
 */
export async function isAdmin(
  userId: string,
  level: "rowiverse" | "superhub" | "tenant" | "hub",
  contextId: string | null
) {
  if (!userId) return false;

  // 1️⃣ SUPERADMIN GLOBAL → admin total
  if (await isSuperAdmin(userId)) return true;

  // 2️⃣ Roles administrativos por scope
  const adminRoles = {
    rowiverse: ["superadmin"], // global
    superhub: ["superhub-admin"],
    tenant: ["tenant-admin"],
    hub: ["hub-admin"],
  };

  const validRoles = adminRoles[level] ?? [];

  /* =========================================================
     🔥 RULE 1: rowiverse-level admins no dependen de scopeId
  ========================================================== */
  if (level === "rowiverse") {
    const rowiAdmin = await prisma.userPermission.findFirst({
      where: {
        userId,
        scopeType: "rowiverse",
        role: { in: validRoles },
      },
    });
    if (rowiAdmin) return true;
  }

  /* =========================================================
     🔥 RULE 2: superhub-admin puede administrar TODO su SuperHub
     - se ignora scopeId porque opera todo el superHub
  ========================================================== */
  if (level === "superhub") {
    const shAdmin = await prisma.userPermission.findFirst({
      where: {
        userId,
        scopeType: "superhub",
        role: { in: validRoles },
      },
    });
    if (shAdmin) return true;
  }

  /* =========================================================
     🔥 RULE 3: tenant-admin puede administrar SU tenant
     - aquí sí se usa scopeId (tenant específico)
  ========================================================== */
  if (level === "tenant" && contextId) {
    const tAdmin = await prisma.userPermission.findFirst({
      where: {
        userId,
        scopeType: "tenant",
        scopeId: contextId,
        role: { in: validRoles },
      },
    });
    if (tAdmin) return true;
  }

  /* =========================================================
     🔥 RULE 4: hub-admin puede administrar SU hub
  ========================================================== */
  if (level === "hub" && contextId) {
    const hAdmin = await prisma.userPermission.findFirst({
      where: {
        userId,
        scopeType: "hub",
        scopeId: contextId,
        role: { in: validRoles },
      },
    });
    if (hAdmin) return true;
  }

  /* =========================================================
     Final fallback — cualquier scope básico válido
  ========================================================== */
  return await hasScope(userId, level, contextId);
}