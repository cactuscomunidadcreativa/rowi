import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

/**
 * Smart landing page for authenticated users.
 *
 * Decides where to send the caller based on the data we can actually link
 * them to. The previous version only checked `primaryTenantId`, which left
 * accounts whose tenant link lives in Membership / HubMembership /
 * RowiCommunityUser / CommunityMember-by-email stranded on /dashboard.
 *
 * Order:
 *   1. SuperAdmin → /hub/admin/inventory
 *   2. Anyone with an admin scope OR a tenant we can resolve → /org
 *   3. Consultants/coaches/mentors with workspaces but no tenant →
 *      /workspace?type=… filtered to their primary kind
 *   4. Anyone with any workspace at all → /workspace
 *   5. Otherwise → /dashboard
 */
export default async function StartPage() {
  const user = await getServerAuthUser();
  if (!user) redirect("/signin");

  if (user.isSuperAdmin) redirect("/hub/admin/inventory");

  const permissions = (user.permissions as Array<{ scopeType?: string; role?: string }>) || [];
  const hasAdminScope = permissions.some((p) =>
    ["superhub", "tenant", "hub"].includes(p.scopeType || ""),
  );

  // Resolve every tenant ID this user can reach. Mirrors /api/org/summary.
  const email = (user.email || "").toLowerCase();
  const [memberships, hubMemberships, communityUsers, communityMembers] =
    await Promise.all([
      prisma.membership.findMany({
        where: { userId: user.id },
        select: { tenantId: true },
      }),
      prisma.hubMembership.findMany({
        where: { userId: user.id },
        select: { hub: { select: { tenantId: true } } },
      }),
      prisma.rowiCommunityUser.findMany({
        where: { userId: user.id },
        select: {
          role: true,
          community: { select: { tenantId: true, workspaceType: true } },
        },
      }),
      email
        ? prisma.communityMember.findMany({
            where: { email },
            select: { community: { select: { tenantId: true } } },
          })
        : Promise.resolve([]),
    ]);

  const tenantIds = new Set<string>();
  if (user.primaryTenant?.id) tenantIds.add(user.primaryTenant.id);
  for (const m of memberships) if (m.tenantId) tenantIds.add(m.tenantId);
  for (const h of hubMemberships) {
    if (h.hub?.tenantId) tenantIds.add(h.hub.tenantId);
  }
  for (const c of communityUsers) {
    if (c.community?.tenantId) tenantIds.add(c.community.tenantId);
  }
  for (const c of communityMembers) {
    if (c.community?.tenantId) tenantIds.add(c.community.tenantId);
  }

  if (hasAdminScope || tenantIds.size > 0) redirect("/org");

  // No tenant — check if they own/manage any workspaces (consultant pattern).
  const managerRoles = ["owner", "admin", "coach", "consultant", "hr_manager", "team_leader", "mentor"];
  const managed = communityUsers.filter((w) => !!w.role && managerRoles.includes(w.role));

  if (managed.length === 0) redirect("/dashboard");

  const types: string[] = [];
  for (const w of managed) {
    const t = w.community?.workspaceType;
    if (typeof t === "string" && t.length > 0) types.push(t);
  }

  if (types.every((t) => t === "CONSULTING")) redirect("/workspace?type=CONSULTING");
  if (types.every((t) => t === "COACHING")) redirect("/workspace?type=COACHING");
  if (types.every((t) => t === "MENTORING")) redirect("/workspace?type=MENTORING");

  redirect("/workspace");
}
