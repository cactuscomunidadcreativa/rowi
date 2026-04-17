import { prisma } from "@/core/prisma";

/**
 * 🔐 Workspace Permissions
 * Helpers para verificar acceso a workspaces (RowiCommunity con workspaceType).
 */

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "coach"
  | "consultant"
  | "hr_manager"
  | "team_leader"
  | "mentor"
  | "member"
  | "client";

export const PROFESSIONAL_ROLES: WorkspaceRole[] = [
  "owner",
  "admin",
  "coach",
  "consultant",
  "hr_manager",
  "team_leader",
  "mentor",
];

export const VIEWER_ROLES: WorkspaceRole[] = ["member", "client"];

/**
 * Obtiene el rol del usuario en un workspace.
 * Retorna null si no es miembro.
 */
export async function getWorkspaceRole(
  userId: string,
  communityId: string
): Promise<WorkspaceRole | null> {
  const membership = await prisma.rowiCommunityUser.findFirst({
    where: { userId, communityId },
    select: { role: true },
  });
  if (!membership?.role) return null;
  return membership.role as WorkspaceRole;
}

/**
 * Verifica si el usuario puede acceder al workspace.
 * Owner, admin y roles profesionales tienen acceso full.
 * Members/clients solo pueden ver portal cliente o sus propios datos.
 */
export async function canAccessWorkspace(
  userId: string,
  communityId: string
): Promise<{ allowed: boolean; role: WorkspaceRole | null }> {
  const role = await getWorkspaceRole(userId, communityId);
  return {
    allowed: role !== null,
    role,
  };
}

/**
 * Verifica si el usuario tiene rol profesional (puede gestionar el workspace).
 */
export async function canManageWorkspace(
  userId: string,
  communityId: string
): Promise<boolean> {
  const role = await getWorkspaceRole(userId, communityId);
  if (!role) return false;
  return PROFESSIONAL_ROLES.includes(role);
}

/**
 * Lista los workspaces del usuario filtrando por rol si se especifica.
 */
export async function listUserWorkspaces(
  userId: string,
  opts?: {
    roles?: WorkspaceRole[];
    workspaceType?: string;
    includeArchived?: boolean;
  }
) {
  const memberships = await prisma.rowiCommunityUser.findMany({
    where: {
      userId,
      ...(opts?.roles && opts.roles.length > 0 ? { role: { in: opts.roles } } : {}),
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          workspaceType: true,
          clientOrgId: true,
          targetRole: true,
          projectStatus: true,
          projectStartDate: true,
          projectEndDate: true,
          bannerUrl: true,
          coverUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              members: true,
              communityMembers: true,
            },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });

  // Filtrar solo los que son workspaces (tienen workspaceType)
  return memberships
    .filter((m) => {
      if (!m.community) return false;
      if (!m.community.workspaceType) return false;
      if (opts?.workspaceType && m.community.workspaceType !== opts.workspaceType)
        return false;
      if (!opts?.includeArchived && m.community.projectStatus === "archived")
        return false;
      return true;
    })
    .map((m) => ({
      ...m.community!,
      role: m.role as WorkspaceRole,
    }));
}
