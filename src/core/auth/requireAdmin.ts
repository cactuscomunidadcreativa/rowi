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
