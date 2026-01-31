/**
 * =========================================================
 * 🔐 Authorization Helpers — Protección de endpoints
 * =========================================================
 *
 * Helpers centralizados para verificar autenticación y permisos
 * en API routes. Usar estos helpers en lugar de verificaciones
 * manuales para mantener consistencia y seguridad.
 *
 * USO:
 * ```ts
 * import { requireAuth, requireAdmin, requireSuperAdmin } from "@/lib/auth/requireAuth";
 *
 * export async function GET(req: NextRequest) {
 *   const auth = await requireAuth();
 *   if (auth.error) return auth.error;
 *   // auth.user contiene el usuario autenticado
 * }
 * ```
 */

import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";

// Tipo del usuario autenticado (inferido de getServerAuthUser)
export type AuthUser = NonNullable<Awaited<ReturnType<typeof getServerAuthUser>>>;

// Tipo de respuesta de los helpers
export type AuthResult =
  | { success: true; user: AuthUser; error?: never }
  | { success: false; user?: never; error: NextResponse };

// Tipo de scope de permisos
export type PermissionScope = "rowiverse" | "superhub" | "tenant" | "hub";

/**
 * Verifica que el usuario esté autenticado
 * @returns Usuario autenticado o respuesta de error 401
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const user = await getServerAuthUser();

    if (!user) {
      return {
        success: false,
        error: NextResponse.json(
          { ok: false, error: "No autorizado. Inicia sesión para continuar." },
          { status: 401 }
        ),
      };
    }

    return { success: true, user };
  } catch (err) {
    console.error("❌ Error en requireAuth:", err);
    return {
      success: false,
      error: NextResponse.json(
        { ok: false, error: "Error de autenticación" },
        { status: 401 }
      ),
    };
  }
}

/**
 * Verifica que el usuario sea SuperAdmin
 * @returns Usuario SuperAdmin o respuesta de error 403
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  if (!authResult.user.isSuperAdmin) {
    return {
      success: false,
      error: NextResponse.json(
        { ok: false, error: "Acceso denegado. Se requieren permisos de SuperAdmin." },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Verifica que el usuario tenga permisos de administrador
 * (SuperAdmin o admin de algún scope: superhub, tenant, hub)
 * @returns Usuario admin o respuesta de error 403
 */
export async function requireAdmin(): Promise<AuthResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { user } = authResult;

  // SuperAdmin siempre tiene acceso
  if (user.isSuperAdmin) {
    return authResult;
  }

  // Verificar si tiene permisos de admin en algún scope
  const hasAdminPermission = user.permissions?.some((p) => {
    const role = p.role?.toLowerCase();
    return (
      role === "admin" ||
      role === "superadmin" ||
      role === "super_admin" ||
      role === "owner"
    );
  });

  // Verificar si tiene rol de admin en organizationRole
  const orgRole = user.organizationRole?.toUpperCase();
  const hasOrgAdmin = orgRole === "ADMIN" || orgRole === "SUPERADMIN" || orgRole === "SUPER_ADMIN";

  if (!hasAdminPermission && !hasOrgAdmin) {
    return {
      success: false,
      error: NextResponse.json(
        { ok: false, error: "Acceso denegado. Se requieren permisos de administrador." },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Verifica que el usuario tenga acceso a un Hub específico
 * @param hubId - ID del hub a verificar
 * @returns Usuario con acceso o respuesta de error 403
 */
export async function requireHubAccess(hubId: string): Promise<AuthResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { user } = authResult;

  // SuperAdmin siempre tiene acceso
  if (user.isSuperAdmin) {
    return authResult;
  }

  // Verificar si es miembro del hub
  const hasHubAccess = user.hubs?.some((h) => h.id === hubId);

  // Verificar si tiene permiso específico para el hub
  const hasHubPermission = user.permissions?.some(
    (p) => p.scopeType === "hub" && p.scopeId === hubId
  );

  if (!hasHubAccess && !hasHubPermission) {
    return {
      success: false,
      error: NextResponse.json(
        { ok: false, error: "Acceso denegado. No tienes permisos para este Hub." },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Verifica que el usuario tenga acceso a un Tenant específico
 * @param tenantId - ID del tenant a verificar
 * @returns Usuario con acceso o respuesta de error 403
 */
export async function requireTenantAccess(tenantId: string): Promise<AuthResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { user } = authResult;

  // SuperAdmin siempre tiene acceso
  if (user.isSuperAdmin) {
    return authResult;
  }

  // Verificar si es el tenant primario del usuario
  const isPrimaryTenant = user.primaryTenantId === tenantId;

  // Verificar membresías
  const hasMembership = user.memberships?.some((m) => m.tenantId === tenantId);

  // Verificar permisos específicos
  const hasTenantPermission = user.permissions?.some(
    (p) => p.scopeType === "tenant" && p.scopeId === tenantId
  );

  if (!isPrimaryTenant && !hasMembership && !hasTenantPermission) {
    return {
      success: false,
      error: NextResponse.json(
        { ok: false, error: "Acceso denegado. No tienes permisos para este Tenant." },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Verifica que el usuario tenga un rol específico en un scope
 * @param scope - Tipo de scope (rowiverse, superhub, tenant, hub)
 * @param scopeId - ID del scope (opcional para rowiverse)
 * @param allowedRoles - Roles permitidos
 * @returns Usuario con rol o respuesta de error 403
 */
export async function requireRole(
  scope: PermissionScope,
  scopeId: string | null,
  allowedRoles: string[]
): Promise<AuthResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { user } = authResult;

  // SuperAdmin siempre tiene acceso
  if (user.isSuperAdmin) {
    return authResult;
  }

  // Normalizar roles permitidos a minúsculas
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

  // Buscar permiso que coincida
  const hasRole = user.permissions?.some((p) => {
    const matchesScope = p.scopeType === scope;
    const matchesScopeId = scopeId ? p.scopeId === scopeId : true;
    const matchesRole = normalizedAllowedRoles.includes(p.role?.toLowerCase() || "");

    return matchesScope && matchesScopeId && matchesRole;
  });

  if (!hasRole) {
    return {
      success: false,
      error: NextResponse.json(
        {
          ok: false,
          error: `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(", ")}`,
        },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Verifica que el usuario sea admin de un Hub específico
 * @param hubId - ID del hub a verificar
 * @returns Usuario admin del hub o respuesta de error 403
 */
export async function requireHubAdmin(hubId: string): Promise<AuthResult> {
  return requireRole("hub", hubId, ["admin", "owner", "superadmin"]);
}

/**
 * Verifica que el usuario sea admin de un Tenant específico
 * @param tenantId - ID del tenant a verificar
 * @returns Usuario admin del tenant o respuesta de error 403
 */
export async function requireTenantAdmin(tenantId: string): Promise<AuthResult> {
  return requireRole("tenant", tenantId, ["admin", "owner", "superadmin"]);
}

/**
 * Helper para verificar si el usuario puede modificar a otro usuario
 * (Previene que usuarios modifiquen usuarios con más privilegios)
 * @param targetUserId - ID del usuario objetivo
 * @returns true si puede modificar, false si no
 */
export function canModifyUser(authUser: AuthUser, targetUserId: string): boolean {
  // Un usuario siempre puede modificar su propio perfil
  if (authUser.id === targetUserId) {
    return true;
  }

  // Solo SuperAdmin puede modificar a otros usuarios
  return authUser.isSuperAdmin;
}

/**
 * Helper para verificar si el usuario puede eliminar a otro usuario
 * @param targetUserId - ID del usuario objetivo
 * @returns true si puede eliminar, false si no
 */
export function canDeleteUser(authUser: AuthUser, targetUserId: string): boolean {
  // Nadie puede eliminarse a sí mismo
  if (authUser.id === targetUserId) {
    return false;
  }

  // Solo SuperAdmin puede eliminar usuarios
  return authUser.isSuperAdmin;
}
