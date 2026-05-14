import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

/**
 * Smart landing page for authenticated users.
 * Decides where to send them based on role:
 *   - SuperAdmin → /hub/admin/inventory
 *   - Has admin scope OR a primary tenant → /org
 *   - Consultants (own CONSULTING workspaces, no tenant) → /workspace?type=CONSULTING
 *   - Coaches/mentors (own COACHING workspaces, no tenant) → /workspace?type=COACHING
 *   - Anyone with workspaces → /workspace
 *   - Otherwise → /dashboard
 *
 * Pure server-side redirect — used as default post-signin destination.
 */
export default async function StartPage() {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/signin");
  }

  if (user.isSuperAdmin) {
    redirect("/hub/admin/inventory");
  }

  const permissions = (user.permissions as Array<{ scopeType?: string; role?: string }>) || [];
  const hasAdminScope = permissions.some((p) =>
    ["superhub", "tenant", "hub"].includes(p.scopeType || ""),
  );

  if (hasAdminScope || user.primaryTenant) {
    redirect("/org");
  }

  // No tenant, no admin scope — check if they own/manage any workspaces.
  const ownedWorkspaces = await prisma.rowiCommunityUser.findMany({
    where: {
      userId: user.id,
      role: { in: ["owner", "admin", "coach", "consultant", "hr_manager", "team_leader", "mentor"] },
    },
    select: { community: { select: { workspaceType: true } } },
  });

  if (ownedWorkspaces.length === 0) {
    redirect("/dashboard");
  }

  const types: string[] = [];
  for (const w of ownedWorkspaces) {
    const t = w.community?.workspaceType;
    if (typeof t === "string" && t.length > 0) types.push(t);
  }

  // Pick the most specific consultant/coach view if the user has only one kind.
  if (types.every((t) => t === "CONSULTING")) {
    redirect("/workspace?type=CONSULTING");
  }
  if (types.every((t) => t === "COACHING")) {
    redirect("/workspace?type=COACHING");
  }
  if (types.every((t) => t === "MENTORING")) {
    redirect("/workspace?type=MENTORING");
  }

  redirect("/workspace");
}
