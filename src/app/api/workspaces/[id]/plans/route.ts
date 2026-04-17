// src/app/api/workspaces/[id]/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canManageWorkspace } from "@/lib/workspace/permissions";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canManage = await canManageWorkspace(token.sub, id);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const plans = await prisma.developmentPlan.findMany({
      where: { communityId: id },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true, email: true } } },
    });
    return NextResponse.json({ plans });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canManage = await canManageWorkspace(token.sub, id);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { memberId, memberType = "community_member", title, description, goals, strengths, gaps, targetDate, aiGenerated = false } = body;

    if (!memberId || !title?.trim()) {
      return NextResponse.json({ error: "memberId and title required" }, { status: 400 });
    }

    const plan = await prisma.developmentPlan.create({
      data: {
        communityId: id,
        memberId,
        memberType,
        createdById: token.sub,
        title: title.trim(),
        description: description?.trim() || null,
        goals: Array.isArray(goals) ? goals : [],
        strengths: Array.isArray(strengths) ? strengths : [],
        gaps: Array.isArray(gaps) ? gaps : [],
        targetDate: targetDate ? new Date(targetDate) : null,
        aiGenerated,
        status: "active",
      },
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

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
    const planId = searchParams.get("planId");
    if (!planId) return NextResponse.json({ error: "planId required" }, { status: 400 });

    await prisma.developmentPlan.delete({ where: { id: planId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
