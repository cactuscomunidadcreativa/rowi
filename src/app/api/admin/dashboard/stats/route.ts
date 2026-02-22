import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

export const preferredRegion = "iad1";

export async function GET() {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const { user, scope } = auth;

  try {
    if (scope.type === "rowiverse") {
      return NextResponse.json(await getGlobalStats());
    }
    return NextResponse.json(await getScopedStats(scope));
  } catch (e) {
    console.error("[dashboard/stats] Error:", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

// ─── Global stats (SuperAdmin) ──────────────────────────────

async function getGlobalStats() {
  const [users, tenants, hubs, superhubs, communities, agents, usage] =
    await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.hub.count(),
      prisma.superHub.count(),
      prisma.rowiCommunity.count(),
      prisma.agentConfig.count({ where: { isActive: true } }),
      prisma.usageDaily.aggregate({
        _sum: { tokensInput: true, tokensOutput: true },
      }),
    ]);

  const tokensIn = usage._sum.tokensInput || 0;
  const tokensOut = usage._sum.tokensOutput || 0;

  return {
    ok: true,
    isSuperAdmin: true,
    scope: { type: "rowiverse", id: null, label: "Global (SuperAdmin)" },
    stats: {
      users,
      tenants,
      hubs,
      superhubs,
      communities,
      agents,
      tokenUsage: tokensIn + tokensOut,
    },
  };
}

// ─── Scoped stats (org admin) ───────────────────────────────

async function getScopedStats(scope: { type: string; id: string | null }) {
  const ids = await resolveScope(scope);

  const [users, communities, agents, usage] = await Promise.all([
    countScopedUsers(ids),
    countScopedCommunities(ids),
    countScopedAgents(ids),
    aggregateScopedUsage(ids),
  ]);

  return {
    ok: true,
    isSuperAdmin: false,
    scope: { type: scope.type, id: scope.id, label: ids.label },
    stats: {
      users,
      tenants: ids.tenantIds.length,
      hubs: ids.hubIds.length,
      superhubs: ids.superHubIds.length,
      communities,
      agents,
      tokenUsage: usage,
    },
  };
}

// ─── Resolve scope to entity IDs ────────────────────────────

interface ScopeIds {
  label: string;
  superHubIds: string[];
  hubIds: string[];
  tenantIds: string[];
  orgIds: string[];
}

async function resolveScope(scope: { type: string; id: string | null }): Promise<ScopeIds> {
  if (!scope.id) {
    return { label: "—", superHubIds: [], hubIds: [], tenantIds: [], orgIds: [] };
  }

  if (scope.type === "superhub") {
    const sh = await prisma.superHub.findUnique({
      where: { id: scope.id },
      include: {
        tenants: { select: { id: true } },
        hubs: { select: { id: true } },
        organizations: { select: { id: true } },
      },
    });
    if (!sh) return { label: "—", superHubIds: [], hubIds: [], tenantIds: [], orgIds: [] };
    return {
      label: sh.name,
      superHubIds: [sh.id],
      hubIds: sh.hubs.map((h) => h.id),
      tenantIds: sh.tenants.map((t) => t.id),
      orgIds: sh.organizations.map((o) => o.id),
    };
  }

  if (scope.type === "hub") {
    const hub = await prisma.hub.findUnique({
      where: { id: scope.id },
      include: {
        organizations: { select: { id: true } },
        organizationLinks: { select: { organizationId: true } },
      },
    });
    if (!hub) return { label: "—", superHubIds: [], hubIds: [], tenantIds: [], orgIds: [] };
    const orgIds = [
      ...hub.organizations.map((o) => o.id),
      ...hub.organizationLinks.map((l) => l.organizationId),
    ];
    return {
      label: hub.name,
      superHubIds: hub.superHubId ? [hub.superHubId] : [],
      hubIds: [hub.id],
      tenantIds: [hub.tenantId],
      orgIds: [...new Set(orgIds)],
    };
  }

  if (scope.type === "tenant") {
    const tenant = await prisma.tenant.findUnique({
      where: { id: scope.id },
      include: {
        hubs: { select: { id: true } },
        organizationLinks: { select: { organizationId: true } },
      },
    });
    if (!tenant) return { label: "—", superHubIds: [], hubIds: [], tenantIds: [], orgIds: [] };
    return {
      label: tenant.name,
      superHubIds: tenant.superHubId ? [tenant.superHubId] : [],
      hubIds: tenant.hubs.map((h) => h.id),
      tenantIds: [tenant.id],
      orgIds: tenant.organizationLinks.map((l) => l.organizationId),
    };
  }

  return { label: "—", superHubIds: [], hubIds: [], tenantIds: [], orgIds: [] };
}

// ─── Scoped count helpers ───────────────────────────────────

async function countScopedUsers(ids: ScopeIds): Promise<number> {
  const orConditions: any[] = [];
  if (ids.tenantIds.length) orConditions.push({ primaryTenantId: { in: ids.tenantIds } });
  if (ids.tenantIds.length) orConditions.push({ memberships: { some: { tenantId: { in: ids.tenantIds } } } });
  if (ids.hubIds.length) orConditions.push({ hubMemberships: { some: { hubId: { in: ids.hubIds } } } });
  if (ids.orgIds.length) orConditions.push({ orgMemberships: { some: { organizationId: { in: ids.orgIds } } } });

  if (!orConditions.length) return 0;
  return prisma.user.count({ where: { OR: orConditions } });
}

async function countScopedCommunities(ids: ScopeIds): Promise<number> {
  const orConditions: any[] = [];
  if (ids.hubIds.length) orConditions.push({ hubId: { in: ids.hubIds } });
  if (ids.tenantIds.length) orConditions.push({ tenantId: { in: ids.tenantIds } });
  if (ids.superHubIds.length) orConditions.push({ superHubId: { in: ids.superHubIds } });
  if (ids.orgIds.length) orConditions.push({ organizationId: { in: ids.orgIds } });

  if (!orConditions.length) return 0;
  return prisma.rowiCommunity.count({ where: { OR: orConditions } });
}

async function countScopedAgents(ids: ScopeIds): Promise<number> {
  const orConditions: any[] = [];
  if (ids.hubIds.length) orConditions.push({ hubId: { in: ids.hubIds } });
  if (ids.tenantIds.length) orConditions.push({ tenantId: { in: ids.tenantIds } });
  if (ids.superHubIds.length) orConditions.push({ superHubId: { in: ids.superHubIds } });
  if (ids.orgIds.length) orConditions.push({ organizationId: { in: ids.orgIds } });

  if (!orConditions.length) return 0;
  return prisma.agentConfig.count({ where: { isActive: true, OR: orConditions } });
}

async function aggregateScopedUsage(ids: ScopeIds): Promise<number> {
  if (!ids.tenantIds.length) return 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const usage = await prisma.usageDaily.aggregate({
    _sum: { tokensInput: true, tokensOutput: true },
    where: {
      tenantId: { in: ids.tenantIds },
      day: { gte: thirtyDaysAgo },
    },
  });

  return (usage._sum.tokensInput || 0) + (usage._sum.tokensOutput || 0);
}
