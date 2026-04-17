// src/app/api/workspaces/[id]/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canManageWorkspace } from "@/lib/workspace/permissions";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * POST /api/workspaces/[id]/invite
 * Invita a una persona a un workspace por email.
 * Body: { email, name?, role? (member|client|coach|mentor) }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canManage = await canManageWorkspace(token.sub, communityId);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { email, name, role = "member" } = body || {};

    if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const workspace = await prisma.rowiCommunity.findUnique({
      where: { id: communityId },
      select: { id: true, name: true, slug: true },
    });
    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, name: true, email: true },
    });

    if (existingUser) {
      // Check if already a member
      const existingMembership = await prisma.rowiCommunityUser.findFirst({
        where: { userId: existingUser.id, communityId },
      });
      if (existingMembership) {
        return NextResponse.json({ error: "Already a member" }, { status: 409 });
      }
      // Add as active member
      await prisma.rowiCommunityUser.create({
        data: {
          userId: existingUser.id,
          communityId,
          role,
          status: "active",
          email: existingUser.email,
          name: existingUser.name,
        },
      });
      return NextResponse.json({ success: true, existing: true, userId: existingUser.id });
    }

    // User does not exist - create invite token
    const tokenStr = crypto.randomBytes(16).toString("hex");
    const invite = await prisma.inviteToken.create({
      data: {
        email: email.trim().toLowerCase(),
        token: tokenStr,
        userId: token.sub,
        role: `WORKSPACE:${communityId}:${role}`,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // Also create a placeholder RowiCommunityUser
    await prisma.rowiCommunityUser.create({
      data: {
        communityId,
        role,
        status: "invited",
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
      },
    });

    const inviteUrl = `${req.nextUrl.origin}/invite/${tokenStr}`;

    return NextResponse.json({
      success: true,
      existing: false,
      inviteId: invite.id,
      inviteUrl,
    });
  } catch (err: any) {
    console.error("POST /api/workspaces/[id]/invite error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
