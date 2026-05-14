/**
 * Account-type taxonomy for Rowi.
 *
 * The data model already lets us distinguish four tiers via the existing
 * UserPermission, RowiCommunityUser and isSuperAdmin signals — we just
 * never surfaced it as one thing. This helper centralises the derivation
 * so every page renders the same badge for the same user.
 *
 * Levels (highest wins):
 *
 *   superadmin → Eduardo and any rowiverse-scoped superadmin. Full platform.
 *   admin      → Holds a tenant / hub / superhub admin permission. Manages
 *                an organization.
 *   pro        → Owns or manages at least one workspace as
 *                owner/admin/coach/consultant/hr_manager/team_leader/mentor.
 *                Coaches, consultants, HR managers, team leads.
 *   free       → Authenticated user with none of the above. Personal EQ
 *                journey, coachee, community member.
 */

export type AccountType = "free" | "pro" | "admin" | "superadmin";

export interface AccountTypeSignals {
  isSuperAdmin?: boolean;
  permissions?: Array<{
    scopeType?: string | null;
    role?: string | null;
  }>;
  /**
   * Roles the user holds in workspaces they participate in
   * (RowiCommunityUser.role). Only the FIRST occurrence per workspace.
   */
  workspaceRoles?: Array<string | null | undefined>;
}

const PRO_WORKSPACE_ROLES = new Set([
  "owner",
  "admin",
  "coach",
  "consultant",
  "hr_manager",
  "team_leader",
  "mentor",
]);

const ADMIN_SCOPE_TYPES = new Set(["superhub", "tenant", "hub"]);

export function deriveAccountType(signals: AccountTypeSignals): AccountType {
  if (signals.isSuperAdmin) return "superadmin";

  const perms = signals.permissions || [];
  const hasAdminScope = perms.some(
    (p) =>
      ADMIN_SCOPE_TYPES.has(p.scopeType || "") &&
      ["admin", "owner", "tenant-admin", "hub-admin", "superhub-admin"].includes(
        (p.role || "").toLowerCase(),
      ),
  );
  if (hasAdminScope) return "admin";

  // Less strict admin signal: any scope at superhub/tenant/hub is still
  // organizational-level, so treat as admin too.
  const hasOrgScope = perms.some((p) => ADMIN_SCOPE_TYPES.has(p.scopeType || ""));
  if (hasOrgScope) return "admin";

  const roles = signals.workspaceRoles || [];
  const isPro = roles.some(
    (r) => !!r && PRO_WORKSPACE_ROLES.has(r.toLowerCase()),
  );
  if (isPro) return "pro";

  return "free";
}

export interface AccountTypeMeta {
  type: AccountType;
  /** i18n key for the label */
  labelKey: string;
  /** Fallback label (English) */
  fallback: string;
  /** Tailwind gradient class fragment */
  gradient: string;
  /** Where this account type lands by default after sign-in */
  home: string;
}

export const ACCOUNT_TYPE_META: Record<AccountType, AccountTypeMeta> = {
  free: {
    type: "free",
    labelKey: "account.type.free",
    fallback: "Free",
    gradient: "from-slate-400 to-slate-500",
    home: "/dashboard",
  },
  pro: {
    type: "pro",
    labelKey: "account.type.pro",
    fallback: "Pro",
    gradient: "from-emerald-500 to-green-600",
    home: "/workspace",
  },
  admin: {
    type: "admin",
    labelKey: "account.type.admin",
    fallback: "Admin",
    gradient: "from-indigo-500 to-blue-600",
    home: "/org",
  },
  superadmin: {
    type: "superadmin",
    labelKey: "account.type.superadmin",
    fallback: "SuperAdmin",
    gradient: "from-violet-500 to-fuchsia-500",
    home: "/hub/admin/inventory",
  },
};
