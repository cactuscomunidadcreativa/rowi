// src/app/api/workspaces/[id]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canAccessWorkspace, canManageWorkspace } from "@/lib/workspace/permissions";

export const runtime = "nodejs";

/**
 * GET /api/workspaces/[id]/members
 * Lista los miembros del workspace (CommunityMember + RowiCommunityUser).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { allowed } = await canAccessWorkspace(token.sub, id);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Members via CommunityMember (uploaded by CSV or manual)
    const communityMembers = await prisma.communityMember.findMany({
      where: { communityId: id },
      orderBy: { joinedAt: "desc" },
      include: {
        snapshots: {
          orderBy: { at: "desc" },
          take: 1,
          select: {
            id: true,
            at: true,
            overall4: true,
            K: true,
            C: true,
            G: true,
            brainStyle: true,
            dataset: true,
          },
        },
      },
    });

    // Members via RowiCommunityUser (linked users with accounts)
    const rowiMembers = await prisma.rowiCommunityUser.findMany({
      where: { communityId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            country: true,
            eqSnapshots: {
              orderBy: { at: "desc" },
              take: 1,
              select: { id: true, at: true, overall4: true, K: true, C: true, G: true, brainStyle: true },
            },
          },
        },
      },
    });

    const shaped = [
      ...communityMembers.map((m) => ({
        id: m.id,
        type: "community_member" as const,
        name: m.name || [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email || "—",
        email: m.email,
        country: m.country,
        brainStyle: m.brainStyle,
        role: m.role,
        status: m.status,
        source: m.source,
        consentGiven: m.consentGiven,
        snapshot: m.snapshots[0] || null,
        createdAt: m.joinedAt,
      })),
      ...rowiMembers
        .filter((rm) => rm.user)
        .map((rm) => ({
          id: rm.id,
          type: "rowi_user" as const,
          userId: rm.user!.id,
          name: rm.user!.name || rm.name || rm.email || "—",
          email: rm.user!.email || rm.email,
          country: rm.user!.country,
          image: rm.user!.image,
          brainStyle: rm.user!.eqSnapshots[0]?.brainStyle,
          role: rm.role || "member",
          status: rm.status,
          snapshot: rm.user!.eqSnapshots[0] || null,
          createdAt: new Date(),
        })),
    ];

    return NextResponse.json({ members: shaped });
  } catch (err: any) {
    console.error("GET /api/workspaces/[id]/members error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/workspaces/[id]/members?memberId=xxx&type=community_member|rowi_user
 * Elimina un miembro del workspace.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canManage = await canManageWorkspace(token.sub, id);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const type = searchParams.get("type") || "community_member";

    if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

    if (type === "community_member") {
      await prisma.communityMember.update({
        where: { id: memberId },
        data: { communityId: null, status: "INACTIVE" },
      });
    } else {
      await prisma.rowiCommunityUser.delete({ where: { id: memberId } });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/workspaces/[id]/members error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
