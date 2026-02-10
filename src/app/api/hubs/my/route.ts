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

    // Also include RowiCommunity memberships as virtual hubs
    // This allows communities (like Be2Grow) to appear in WeekFlow
    const communityMemberships = await prisma.rowiCommunityUser.findMany({
      where: { userId: user.id },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            visibility: true,
            hubId: true,
            bannerUrl: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    // Add communities that don't already have a hub in the list
    const hubIds = new Set(hubs.map((h: { id: string }) => h.id));
    for (const cm of communityMemberships) {
      const c = cm.community;
      // Skip if this community's hub is already in the list
      if (c.hubId && hubIds.has(c.hubId)) continue;
      // Use community ID as hub ID for WeekFlow (sessions will handle it)
      if (!hubIds.has(c.id)) {
        hubs.push({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          visibility: c.visibility,
          superHubId: null,
          superHub: null,
          _count: { memberships: c._count.members },
          role: cm.role || "MEMBER",
          joinedAt: cm.joinedAt,
          memberCount: c._count.members,
          image: c.bannerUrl,
        } as any);
        hubIds.add(c.id);
      }
    }

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
