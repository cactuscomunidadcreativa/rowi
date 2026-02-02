/**
 * GET /api/hubs/my - Get hubs for the current user
 */

import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

export async function GET() {
  try {
    const user = await getServerAuthUser();

    if (!user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's hub memberships with hub details
    const memberships = await prisma.hubMembership.findMany({
      where: { userId: user.id },
      include: {
        hub: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            visibility: true,
            superHubId: true,
            superHub: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                memberships: true,
              },
            },
          },
        },
        role: true, // HubRoleDynamic
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const hubs = memberships.map((m) => ({
      ...m.hub,
      role: m.role?.name || m.access || "MEMBER",
      joinedAt: m.joinedAt,
      memberCount: m.hub._count.memberships,
    }));

    return NextResponse.json({
      ok: true,
      hubs,
    });
  } catch (error) {
    console.error("[API] GET /api/hubs/my error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
