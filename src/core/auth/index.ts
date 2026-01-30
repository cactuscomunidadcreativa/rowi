// src/core/auth/index.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth/config";
import { prisma } from "../prisma";
import type { NextRequest } from "next/server";

// 🌲 Re-export funciones de jerarquía para uso externo
export {
  getAncestorOrgIds,
  getDescendantOrgIds,
  hasOrgAccessWithHierarchy,
  getAccessibleOrgIds,
  getEffectiveOrgRole,
  hasOrgRole,
  getOrgHierarchyTree,
} from "./policies/policy.hierarchy";

// 🔐 Re-export funciones de acceso
export { canAccess } from "./hasAccess";
export { isSuperAdmin } from "./policies/policy.super";
export { isAdmin } from "./policies/policy.admin";
export { hasScope } from "./policies/policy.scope";

export async function getServerAuthUser(req?: NextRequest) {
  try {
    // 1️⃣ Obtener sesión
    const session = req
      ? await getServerSession({ req }, authOptions as any)
      : await getServerSession(authOptions as any);

    if (!session?.user?.id) return null;

    const userId = session.user.id;

    // 2️⃣ Cargar usuario COMPLETO desde BD (incluye organizationRole)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: true,
        memberships: true,
        primaryTenant: true,
        plan: true,
      },
    });

    if (!user) return null;

    // 3️⃣ Cargar hubIds y superHubIds para resolución de agentes
    const hubMemberships = await prisma.hubMembership.findMany({
      where: { userId },
      select: { hubId: true, hub: { select: { superHubId: true } } },
    });

    const hubIds = hubMemberships.map((m) => m.hubId);
    const superHubIds = [...new Set(hubMemberships.map((m) => m.hub?.superHubId).filter(Boolean))] as string[];

    /* =========================================================
       🔥 SUPERADMIN DETECTION FINAL
       ---------------------------------------------------------
       A) Lee organizationRole de BD
       B) Lee permissions (sistema antiguo)
       TODO se normaliza y se combina
    ========================================================== */

    // A) SUPERADMIN via organizationRole
    const normalizedOrgRole = (user.organizationRole || "")
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    const hasOrgSuperAdmin = normalizedOrgRole === "SUPERADMIN";

    // B) SUPERADMIN via permissions (nuevo sistema con scopeType)
    const hasPermissionSuperAdmin = user.permissions?.some(
      (p) =>
        (p.role?.toLowerCase() === "superadmin" ||
          p.role?.toUpperCase() === "SUPER_ADMIN") &&
        (p.scopeType === "rowiverse" || // nuevo sistema
          p.scope?.toLowerCase() === "rowiverse" || // legacy
          p.scope?.toLowerCase() === "global")
    );

    const isSuperAdmin = hasOrgSuperAdmin || hasPermissionSuperAdmin;

    // Debug log para desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log("🔐 Auth Debug:", {
        userId: user.id,
        organizationRole: user.organizationRole,
        hasOrgSuperAdmin,
        hasPermissionSuperAdmin,
        isSuperAdmin,
      });
    }

    /* =========================================================
       🔚 Retornar info final
    ========================================================== */
    return {
      id: user.id,
      email: user.email,
      name: user.name || "",
      primaryTenantId: user.primaryTenantId,
      organizationRole: user.organizationRole, // 🔥 ahora sí sale
      isSuperAdmin,
      allowAI: user.allowAI,
      permissions: user.permissions,
      memberships: user.memberships,
      primaryTenant: user.primaryTenant,
      plan: user.plan,
      // Para resolución de agentes
      hubIds,
      superHubIds,
    };
  } catch (err) {
    console.warn("⚠️ getServerAuthUser error:", err);
    return null;
  }
}