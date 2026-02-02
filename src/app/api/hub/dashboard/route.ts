/**
 * 🏠 API: Hub Dashboard
 * GET /api/hub/dashboard - Obtener datos del dashboard del usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;

    // Obtener usuario con sus datos
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        level: true, // UserLevel relation
        memberships: {
          include: {
            tenant: true,
          },
        },
        communityMemberships: {
          where: { status: "ACTIVE" },
          include: {
            hub: true,
            tenant: true,
          },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verificar permisos de admin usando UserPermission
    const adminRoles = ["SUPERADMIN", "ADMIN", "OWNER"];
    const permissions = await prisma.userPermission.findMany({
      where: { userId: user.id },
    });

    const isAdmin = permissions.some((p) => adminRoles.includes(p.role));
    const isSuperAdmin = permissions.some((p) => p.role === "SUPERADMIN");

    // Obtener agentes disponibles para el usuario
    const agents = await prisma.agentConfig.findMany({
      where: {
        isActive: true,
        OR: [
          { tenantId: null }, // Agentes globales
          { tenantId: user.primaryTenantId || undefined }, // Agentes del tenant
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
      },
      take: 6,
    });

    // Formatear comunidades desde CommunityMember
    interface CommunityMemberWithRelations {
      id: string;
      name: string | null;
      email: string | null;
      hub: { name: string } | null;
      tenant: { name: string };
    }
    const communities = user.communityMemberships.map((cm: CommunityMemberWithRelations) => ({
      id: cm.id,
      name: cm.name || cm.email || "Comunidad",
      hubName: cm.hub?.name,
      tenantName: cm.tenant?.name,
    }));

    // Respuesta
    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        level: user.level?.level || 1,
        xp: user.level?.totalPoints || 0,
        streak: 0, // TODO: Implementar streaks
        isAdmin,
        isSuperAdmin,
      },
      eq: {
        total: null, // TODO: Obtener de EQ snapshot más reciente
        hasData: false,
      },
      communities,
      agents: agents.map((a) => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        description: a.description,
      })),
    });
  } catch (error) {
    console.error("❌ Error loading dashboard:", error);
    return NextResponse.json(
      { error: "Error loading dashboard" },
      { status: 500 }
    );
  }
}
