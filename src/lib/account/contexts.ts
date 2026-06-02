/**
 * Active contexts for a user.
 *
 * A "context" is a hat the user can wear while using Rowi. The same person
 * may be (a) themself, (b) an employee of Acme reporting to a manager,
 * (c) a manager of three reports, (d) a partner declaring family ties,
 * (e) a coach providing services to two other tenants, and (f) a coachee
 * receiving services from another provider — all at once.
 *
 * This helper centralises how we read those hats out of the data model
 * so /api/account/contexts, the future context switcher in the NavBar,
 * /team, /settings/family and /org filters all see the same shape.
 *
 * Bloque A only — surfaces contexts derivable from the three new tables
 * (EmployeeProfile.managerId, FamilyRelation, ServiceEngagement) plus
 * the basics already in the model (personal, primary tenant, workspaces
 * the user owns or co-runs). Future blocks can extend the union.
 */

import { prisma } from "@/core/prisma";

export type ContextKind =
  | "personal"
  | "employee"
  | "manager"
  | "family"
  | "service_provider"
  | "service_client"
  | "tenant_primary"
  | "workspace_pro";

export interface AccountContext {
  /** Stable identifier — `${kind}:${scopeRef}` so the UI can use it as a key */
  id: string;
  kind: ContextKind;
  /** i18n key for the badge / option label */
  labelKey: string;
  /** Fallback label (ES, since ES is the default locale) */
  fallback: string;
  /** Free-text detail shown under the label */
  detail?: string;
  /** The entity this context binds to, when applicable */
  scopeRef?: {
    type:
      | "user"
      | "tenant"
      | "community"
      | "organization"
      | "employee_profile"
      | "family_relation"
      | "service_engagement";
    id: string;
  };
  /** Where the context switcher would route to when this hat is picked */
  home: string;
  /** Sort weight, lower = higher priority */
  weight: number;
}

const RELATIONSHIP_FALLBACK_ES: Record<string, string> = {
  partner: "Pareja",
  spouse: "Esposo/a",
  child: "Hijo/a",
  parent: "Padre/Madre",
  sibling: "Hermano/a",
  other: "Familiar",
};

const SERVICE_ROLE_FALLBACK_ES: Record<string, string> = {
  coach: "Coach",
  consultant: "Consultor",
  mentor: "Mentor",
  facilitator: "Facilitador",
  trainer: "Formador",
  advisor: "Asesor",
};

export async function getActiveContexts(
  userId: string,
): Promise<AccountContext[]> {
  // Family + service hats are each fetched in ONE query (OR over both
  // sides of the relation) instead of two, then split in memory below.
  // Cuts the per-call query count from 8 → 6 (less pool pressure under
  // concurrency). All unbounded list reads get a defensive `take`.
  const [
    user,
    employeeProfiles,
    reportsCount,
    familyRows,
    serviceRows,
    workspaceMemberships,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        primaryTenantId: true,
        primaryTenant: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.employeeProfile.findMany({
      where: { userId, status: "ACTIVE" },
      select: {
        id: true,
        position: true,
        department: true,
        managerId: true,
        tenantId: true,
        tenant: { select: { id: true, name: true } },
      },
      take: 100,
    }),
    prisma.employeeProfile.count({
      where: { manager: { userId }, status: "ACTIVE" },
    }),
    // Family relations on EITHER side: owner sees all; the related user
    // only sees accepted ones (split applied in JS after the fetch).
    prisma.familyRelation.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { relatedUserId: userId, consentStatus: "accepted" },
        ],
      },
      select: {
        id: true,
        ownerId: true,
        relatedUserId: true,
        relationship: true,
        relatedName: true,
        relatedEmail: true,
        consentStatus: true,
        relatedUser: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
      take: 200,
    }),
    // Service engagements where the user is provider OR client.
    prisma.serviceEngagement.findMany({
      where: {
        OR: [
          { providerId: userId, status: { in: ["active", "proposed"] } },
          { clientUserId: userId, status: "active" },
        ],
      },
      select: {
        id: true,
        providerId: true,
        clientUserId: true,
        serviceRole: true,
        status: true,
        clientTenant: { select: { id: true, name: true } },
        clientCommunity: { select: { id: true, name: true } },
        clientOrganization: { select: { id: true, name: true } },
        clientUser: { select: { id: true, name: true, email: true } },
        provider: { select: { id: true, name: true, email: true } },
      },
      take: 200,
    }),
    prisma.rowiCommunityUser.findMany({
      where: {
        userId,
        role: { in: ["owner", "admin", "coach", "consultant", "mentor"] },
      },
      select: {
        id: true,
        role: true,
        community: { select: { id: true, name: true, workspaceType: true } },
      },
      take: 200,
    }),
  ]);

  if (!user) return [];

  // Split the merged family/service rows back into the four logical sets
  // the builders below expect.
  const familyOwned = familyRows.filter((fr) => fr.ownerId === userId);
  const familyRelatedTo = familyRows.filter(
    (fr) => fr.relatedUserId === userId && fr.consentStatus === "accepted",
  );
  const servicesProvided = serviceRows.filter(
    (se) =>
      se.providerId === userId &&
      (se.status === "active" || se.status === "proposed"),
  );
  const servicesReceived = serviceRows.filter(
    (se) => se.clientUserId === userId && se.status === "active",
  );

  const contexts: AccountContext[] = [];

  // Always-on personal context.
  contexts.push({
    id: `personal:${user.id}`,
    kind: "personal",
    labelKey: "account.context.personal",
    fallback: "Personal",
    detail: user.name || undefined,
    scopeRef: { type: "user", id: user.id },
    home: "/dashboard",
    weight: 0,
  });

  // Primary tenant — surfaced separately from employee/admin contexts
  // because a user can have a primary tenant without being an employee
  // (e.g. founder, individual on a free workspace).
  if (user.primaryTenant) {
    contexts.push({
      id: `tenant_primary:${user.primaryTenant.id}`,
      kind: "tenant_primary",
      labelKey: "account.context.tenant_primary",
      fallback: "Mi organización",
      detail: user.primaryTenant.name,
      scopeRef: { type: "tenant", id: user.primaryTenant.id },
      home: "/org",
      weight: 10,
    });
  }

  // Employee contexts (one per EmployeeProfile).
  for (const ep of employeeProfiles) {
    const detailParts = [ep.position, ep.tenant?.name].filter(Boolean);
    contexts.push({
      id: `employee:${ep.id}`,
      kind: "employee",
      labelKey: "account.context.employee",
      fallback: "Empleado",
      detail: detailParts.join(" · ") || undefined,
      scopeRef: { type: "employee_profile", id: ep.id },
      home: ep.tenantId ? "/hr" : "/dashboard",
      weight: 20,
    });
  }

  // Manager context — if the user has at least one direct report.
  if (reportsCount > 0) {
    contexts.push({
      id: `manager:${user.id}`,
      kind: "manager",
      labelKey: "account.context.manager",
      fallback: "Manager",
      detail:
        reportsCount === 1
          ? "1 reporte directo"
          : `${reportsCount} reportes directos`,
      scopeRef: { type: "user", id: user.id },
      home: "/team",
      weight: 30,
    });
  }

  // Family — declared by user (always visible to owner regardless of consent).
  for (const fr of familyOwned) {
    const personName =
      fr.relatedUser?.name ||
      fr.relatedName ||
      fr.relatedUser?.email ||
      fr.relatedEmail ||
      "Sin nombre";
    contexts.push({
      id: `family:${fr.id}`,
      kind: "family",
      labelKey: `account.context.family.${fr.relationship}`,
      fallback: RELATIONSHIP_FALLBACK_ES[fr.relationship] || "Familiar",
      detail:
        fr.consentStatus === "pending"
          ? `${personName} · pendiente`
          : personName,
      scopeRef: { type: "family_relation", id: fr.id },
      home: "/settings/family",
      weight: 40,
    });
  }

  // Family — relations declared BY others where this user accepted.
  // We surface them so the user knows others have linked them, but only
  // when consent was accepted (declined/pending hides from the other side).
  for (const fr of familyRelatedTo) {
    contexts.push({
      id: `family_inbound:${fr.id}`,
      kind: "family",
      labelKey: `account.context.family.${fr.relationship}`,
      fallback: RELATIONSHIP_FALLBACK_ES[fr.relationship] || "Familiar",
      detail: fr.owner?.name || fr.owner?.email || undefined,
      scopeRef: { type: "family_relation", id: fr.id },
      home: "/settings/family",
      weight: 45,
    });
  }

  // Service provider — one entry per active engagement.
  for (const se of servicesProvided) {
    const clientName =
      se.clientTenant?.name ||
      se.clientCommunity?.name ||
      se.clientOrganization?.name ||
      se.clientUser?.name ||
      se.clientUser?.email ||
      "Cliente";
    const detail =
      se.status === "proposed"
        ? `${clientName} · propuesto`
        : clientName;
    contexts.push({
      id: `service_provider:${se.id}`,
      kind: "service_provider",
      labelKey: `account.context.service.${se.serviceRole}`,
      fallback: SERVICE_ROLE_FALLBACK_ES[se.serviceRole] || "Servicio",
      detail,
      scopeRef: { type: "service_engagement", id: se.id },
      home: se.clientCommunity?.id
        ? `/workspace/${se.clientCommunity.id}`
        : "/workspace",
      weight: 50,
    });
  }

  // Service client — when this user receives 1:1 coaching/consulting.
  for (const se of servicesReceived) {
    contexts.push({
      id: `service_client:${se.id}`,
      kind: "service_client",
      labelKey: "account.context.service_client",
      fallback: "Coachee",
      detail: se.provider?.name || se.provider?.email || undefined,
      scopeRef: { type: "service_engagement", id: se.id },
      home: "/dashboard",
      weight: 60,
    });
  }

  // Workspace pro roles (owner/admin/coach/consultant/mentor inside a
  // RowiCommunity). These overlap with primary tenant but are surfaced
  // per-workspace so a consultant who runs three workspaces sees three
  // contexts — useful for the future switcher.
  for (const wm of workspaceMemberships) {
    if (!wm.community) continue;
    contexts.push({
      id: `workspace_pro:${wm.community.id}`,
      kind: "workspace_pro",
      labelKey: `account.context.workspace_role.${wm.role || "member"}`,
      fallback: wm.role || "Miembro",
      detail: wm.community.name,
      scopeRef: { type: "community", id: wm.community.id },
      home: `/workspace/${wm.community.id}`,
      weight: 25,
    });
  }

  contexts.sort((a, b) => a.weight - b.weight);
  return contexts;
}

/**
 * Cookie name where AccountContextChip stores the active context id.
 * Kept here so both the chip (client) and server routes use the same
 * literal — drift between them silently breaks the filter.
 */
export const ACTIVE_CONTEXT_COOKIE = "rowi_active_context";

/**
 * Given the cookie value (the context's `id`, e.g. "tenant_primary:abc"
 * or "employee:profileId"), resolve which Tenant — if any — should be
 * used to filter org-scoped reads.
 *
 * Returns null when the active context is not tenant-bound (personal,
 * family, service_client) or when the referenced entity cannot be
 * resolved. Callers should fall back to the broader access set in
 * that case rather than returning an empty result.
 *
 * IMPORTANT: this only RESOLVES the tenant id. It does NOT verify the
 * caller actually has access — that's the caller's job, since the
 * permission model is shared across the codebase.
 */
export async function resolveContextTenantId(
  cookieValue: string | null | undefined,
): Promise<string | null> {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const sepIdx = cookieValue.indexOf(":");
  if (sepIdx < 0) return null;
  const kind = cookieValue.slice(0, sepIdx);
  const ref = cookieValue.slice(sepIdx + 1);
  if (!ref) return null;

  switch (kind) {
    case "tenant_primary":
      // ref is the tenantId itself.
      return ref;

    case "employee": {
      const emp = await prisma.employeeProfile.findUnique({
        where: { id: ref },
        select: { tenantId: true },
      });
      return emp?.tenantId || null;
    }

    case "workspace_pro": {
      const com = await prisma.rowiCommunity.findUnique({
        where: { id: ref },
        select: { tenantId: true },
      });
      return com?.tenantId || null;
    }

    case "service_provider": {
      const eng = await prisma.serviceEngagement.findUnique({
        where: { id: ref },
        select: {
          clientTenantId: true,
          clientCommunity: { select: { tenantId: true } },
        },
      });
      return eng?.clientTenantId || eng?.clientCommunity?.tenantId || null;
    }

    case "manager":
    case "personal":
    case "family":
    case "family_inbound":
    case "service_client":
      // Not tenant-scoped.
      return null;

    default:
      return null;
  }
}

/**
 * Given the active-context cookie value, resolve which Organization — if any —
 * the caller is acting toward. Today the only context that binds to an org is
 * `service_provider`: a coach/consultant serving a ServiceEngagement whose
 * client is an organization. Returns null for every other context (the chip
 * has no standalone "organization" hat), so callers keep their existing
 * non-org behavior unchanged.
 *
 * Same contract as resolveContextTenantId: this only RESOLVES the id; it does
 * NOT grant access — the caller still owns the permission check.
 */
export async function resolveContextOrganizationId(
  cookieValue: string | null | undefined,
): Promise<string | null> {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const sepIdx = cookieValue.indexOf(":");
  if (sepIdx < 0) return null;
  const kind = cookieValue.slice(0, sepIdx);
  const ref = cookieValue.slice(sepIdx + 1);
  if (!ref) return null;

  if (kind !== "service_provider") return null;

  const eng = await prisma.serviceEngagement.findUnique({
    where: { id: ref },
    select: { clientOrganizationId: true },
  });
  return eng?.clientOrganizationId || null;
}
