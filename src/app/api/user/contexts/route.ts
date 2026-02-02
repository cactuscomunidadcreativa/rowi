import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

/* =========================================================
   📡 GET /api/user/contexts
   Obtiene todos los contextos (membresías) del usuario actual
   para el sistema multi-rol
========================================================= */

interface ContextItem {
  id: string;
  type: "superhub" | "hub" | "tenant" | "organization" | "community";
  name: string;
  slug?: string;
  role: string;
  roleLabel: string;
  icon?: string;
  color?: string;
  parentId?: string;
  parentName?: string;
  memberCount?: number;
}

interface ContextGroup {
  type: string;
  label: string;
  labelEN: string;
  icon: string;
  contexts: ContextItem[];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener usuario con todas sus membresías
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        // Membresías en Hubs
        hubMemberships: {
          include: {
            hub: {
              include: {
                superHub: true,
                tenant: true,
                _count: { select: { memberships: true } },
              },
            },
            role: true, // HubRoleDynamic
          },
        },
        // Membresías en Organizations
        orgMemberships: {
          include: {
            organization: {
              include: {
                _count: { select: { members: true } },
              },
            },
          },
        },
        // Membresías en Communities (CommunityMember)
        communityMemberships: {
          where: { status: "ACTIVE" },
          include: {
            hub: true,
            tenant: true,
          },
        },
        // Membresías en Tenants
        memberships: {
          include: {
            tenant: true,
          },
        },
        // Permisos específicos
        permissions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Construir grupos de contextos
    const groups: ContextGroup[] = [];

    // 1. Grupo de SuperHubs (si tiene acceso a alguno vía hub)
    const superHubsMap = new Map<string, ContextItem>();
    for (const hm of user.hubMemberships) {
      if (hm.hub.superHub && !superHubsMap.has(hm.hub.superHub.id)) {
        superHubsMap.set(hm.hub.superHub.id, {
          id: hm.hub.superHub.id,
          type: "superhub",
          name: hm.hub.superHub.name,
          slug: hm.hub.superHub.slug,
          role: "VIEWER",
          roleLabel: "Visor",
          icon: "building-2",
          color: "#8b5cf6",
        });
      }
    }
    if (superHubsMap.size > 0) {
      groups.push({
        type: "superhub",
        label: "Corporaciones",
        labelEN: "Corporations",
        icon: "building-2",
        contexts: Array.from(superHubsMap.values()),
      });
    }

    // 2. Grupo de Hubs
    const hubContexts: ContextItem[] = user.hubMemberships.map((hm) => ({
      id: hm.hub.id,
      type: "hub" as const,
      name: hm.hub.name,
      slug: hm.hub.slug,
      role: hm.role?.name || hm.access || "MEMBER",
      roleLabel: getRoleLabel(hm.role?.name || hm.access || "MEMBER"),
      icon: "globe",
      color: hm.role?.color || "#10b981",
      parentId: hm.hub.superHubId || hm.hub.tenantId || undefined,
      parentName: hm.hub.superHub?.name || hm.hub.tenant?.name,
      memberCount: hm.hub._count?.memberships || 0,
    }));
    if (hubContexts.length > 0) {
      groups.push({
        type: "hub",
        label: "Divisiones/Regiones",
        labelEN: "Divisions/Regions",
        icon: "globe",
        contexts: hubContexts,
      });
    }

    // 3. Grupo de Tenants (empresas)
    const tenantContexts: ContextItem[] = user.memberships.map((m) => ({
      id: m.tenant.id,
      type: "tenant" as const,
      name: m.tenant.name,
      slug: m.tenant.slug,
      role: m.role || "VIEWER",
      roleLabel: getRoleLabel(m.role || "VIEWER"),
      icon: "briefcase",
      color: "#f59e0b",
    }));

    // También buscar tenants donde es consultor
    try {
      const consultantClients = await prisma.$queryRaw<Array<{
        tenantId: string;
        tenantName: string;
        tenantSlug: string;
        role: string;
      }>>`
        SELECT t.id as "tenantId", t.name as "tenantName", t.slug as "tenantSlug", cc.role
        FROM consultant_client cc
        JOIN tenant t ON cc."tenantId" = t.id
        WHERE cc."consultantId" = ${user.id} AND cc."isActive" = true
      `;

      for (const cc of consultantClients) {
        if (!tenantContexts.find(t => t.id === cc.tenantId)) {
          tenantContexts.push({
            id: cc.tenantId,
            type: "tenant",
            name: cc.tenantName,
            slug: cc.tenantSlug,
            role: cc.role || "CONSULTANT",
            roleLabel: getRoleLabel(cc.role || "CONSULTANT"),
            icon: "briefcase",
            color: "#ec4899",
          });
        }
      }
    } catch {
      // La tabla consultant_client puede no existir
    }

    if (tenantContexts.length > 0) {
      groups.push({
        type: "tenant",
        label: "Empresas",
        labelEN: "Companies",
        icon: "briefcase",
        contexts: tenantContexts,
      });
    }

    // 4. Grupo de Organizations
    const orgContexts: ContextItem[] = user.orgMemberships.map((om) => ({
      id: om.organization.id,
      type: "organization" as const,
      name: om.organization.name,
      slug: om.organization.slug,
      role: om.role || "MEMBER",
      roleLabel: getRoleLabel(om.role || "MEMBER"),
      icon: "users",
      color: "#ec4899",
      memberCount: om.organization._count?.members || 0,
    }));
    if (orgContexts.length > 0) {
      groups.push({
        type: "organization",
        label: "Departamentos",
        labelEN: "Departments",
        icon: "users",
        contexts: orgContexts,
      });
    }

    // 5. Grupo de Communities (usando CommunityMember)
    const communityContexts: ContextItem[] = user.communityMemberships.map((cm) => ({
      id: cm.id,
      type: "community" as const,
      name: cm.name || cm.email || "Comunidad",
      slug: cm.id,
      role: cm.role || "MEMBER",
      roleLabel: getRoleLabel(cm.role || "MEMBER"),
      icon: "users-round",
      color: "#06b6d4",
      parentId: cm.hubId || cm.tenantId || undefined,
      parentName: cm.hub?.name || cm.tenant?.name,
    }));
    if (communityContexts.length > 0) {
      groups.push({
        type: "community",
        label: "Equipos/Comunidades",
        labelEN: "Teams/Communities",
        icon: "users-round",
        contexts: communityContexts,
      });
    }

    // Flags del usuario
    const isConsultant = tenantContexts.some(t => t.role === "CONSULTANT");
    const isCoach = communityContexts.some(c => c.role === "COACH" || c.role === "MENTOR");
    const isAdmin = user.organizationRole === "ADMIN" ||
                    hubContexts.some(h => h.role === "ADMIN" || h.role === "OWNER") ||
                    tenantContexts.some(t => t.role === "ADMIN" || t.role === "OWNER");

    // Permisos agregados
    const allPermissions = user.permissions.map(p => `${p.scope}:${p.role}`);

    return NextResponse.json({
      groups,
      flags: {
        isConsultant,
        isCoach,
        isAdmin,
        hasMultipleContexts: groups.reduce((acc, g) => acc + g.contexts.length, 0) > 1,
      },
      permissions: allPermissions,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        globalRole: user.organizationRole,
        primaryTenantId: user.primaryTenantId,
      },
    });
  } catch (error) {
    console.error("[API] Error fetching user contexts:", error);
    return NextResponse.json(
      { error: "Error al obtener contextos" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🏷️ Helper para obtener label del rol
========================================================= */
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPERADMIN: "Super Admin",
    ADMIN: "Administrador",
    OWNER: "Propietario",
    MANAGER: "Gerente",
    EDITOR: "Editor",
    VIEWER: "Visor",
    CONSULTANT: "Consultor",
    COACH: "Coach",
    MENTOR: "Mentor",
    MEMBER: "Miembro",
    HR: "Recursos Humanos",
    BILLING: "Facturación",
    USER: "Usuario",
  };
  return labels[role] || role;
}
