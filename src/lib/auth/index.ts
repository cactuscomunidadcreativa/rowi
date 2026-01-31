/**
 * =========================================================
 * 🔐 Auth Module — Exports centralizados
 * =========================================================
 */

export {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  requireHubAccess,
  requireTenantAccess,
  requireHubAdmin,
  requireTenantAdmin,
  requireRole,
  canModifyUser,
  canDeleteUser,
  type AuthUser,
  type AuthResult,
  type PermissionScope,
} from "./requireAuth";
