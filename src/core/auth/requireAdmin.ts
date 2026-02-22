// src/core/auth/requireAdmin.ts
/**
 * =========================================================
 * Centralized admin authorization guard for API routes.
 * =========================================================
 *
 * Usage in any admin API route:
 *
 *   import { requireSuperAdmin } from "@/core/auth/requireAdmin";
 *
 *   export async function GET() {
 *     const auth = await requireSuperAdmin();
 *     if (auth.error) return auth.error;
 *     // auth.user is available here
 *   }
 */

import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { logUnauthorizedAccess } from "@/lib/audit/auditLog";

type AuthSuccess = {
  user: NonNullable<Awaited<ReturnType<typeof getServerAuthUser>>>;
  error: null;
};

type AuthFailure = {
  user: null;
  error: NextResponse;
};

type AuthResult = AuthSuccess | AuthFailure;

/**
 * Requires the caller to be an authenticated SuperAdmin.
 * Returns { user, error } — check `error` first.
 *
 * If the user is not authenticated, returns 401.
 * If the user is not a SuperAdmin, returns 403 and logs the attempt.
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const user = await getServerAuthUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      ),
    };
  }

  if (!user.isSuperAdmin) {
    // Log unauthorized access attempt
    logUnauthorizedAccess(user.id, "ADMIN_API", {
      email: user.email,
      reason: "Attempted admin API access without SuperAdmin role",
    }).catch(() => {}); // Non-blocking

    return {
      user: null,
      error: NextResponse.json(
        { error: "Acceso denegado. Se requieren permisos de SuperAdmin." },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Requires the caller to be authenticated (any role).
 * Returns { user, error } — check `error` first.
 */
export async function requireAuth(): Promise<AuthResult> {
  const user = await getServerAuthUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}

/* =========================================================
   Admin with scope — for org-scoped dashboards/APIs
========================================================= */

export interface AdminScope {
  type: "rowiverse" | "superhub" | "hub" | "tenant";
  id: string | null;
}

type ScopedAuthSuccess = {
  user: NonNullable<Awaited<ReturnType<typeof getServerAuthUser>>>;
  scope: AdminScope;
  error: null;
};

type ScopedAuthFailure = {
  user: null;
  scope: null;
  error: NextResponse;
};

type ScopedAuthResult = ScopedAuthSuccess | ScopedAuthFailure;

/**
 * Requires the caller to be an admin at any scope.
 * SuperAdmins get scope { type: "rowiverse", id: null }.
 * Org admins get their highest-level scope from UserPermission.
 */
export async function requireAdminWithScope(): Promise<ScopedAuthResult> {
  const user = await getServerAuthUser();

  if (!user) {
    return {
      user: null,
      scope: null,
      error: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  if (user.isSuperAdmin) {
    return { user, scope: { type: "rowiverse", id: null }, error: null };
  }

  // Check for scoped admin permissions (highest level first)
  const scopePriority: AdminScope["type"][] = ["superhub", "tenant", "hub"];
  const permissions = (user as any).permissions || [];

  for (const scopeType of scopePriority) {
    const perm = permissions.find(
      (p: any) =>
        p.scopeType === scopeType &&
        p.scopeId &&
        ["superadmin", "admin", "owner", "hub-admin", "tenant-admin", "superhub-admin"].includes(
          (p.role || "").toLowerCase()
        )
    );
    if (perm) {
      return {
        user,
        scope: { type: scopeType, id: perm.scopeId },
        error: null,
      };
    }
  }

  // Also check HUB_ADMINS env var
  const hubAdmins = (process.env.HUB_ADMINS || "").split(",").map((e) => e.trim().toLowerCase());
  if (hubAdmins.includes((user.email || "").toLowerCase())) {
    return { user, scope: { type: "rowiverse", id: null }, error: null };
  }

  logUnauthorizedAccess(user.id, "ADMIN_DASHBOARD", {
    email: user.email,
    reason: "No admin scope found",
  }).catch(() => {});

  return {
    user: null,
    scope: null,
    error: NextResponse.json(
      { error: "Acceso denegado. No tienes permisos de administrador." },
      { status: 403 }
    ),
  };
}
