// src/core/auth/index.ts
// ============================================================
// Re-exports only. The canonical getServerAuthUser() lives in
// src/core/auth.ts (which imports authOptions from the NextAuth route).
// Do NOT add a duplicate getServerAuthUser() here.
// ============================================================

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
