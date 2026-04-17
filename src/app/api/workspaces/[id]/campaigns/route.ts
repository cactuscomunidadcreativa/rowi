// src/app/api/workspaces/[id]/campaigns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canManageWorkspace } from "@/lib/workspace/permissions";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const canManage = await canManageWorkspace(token.sub, id);
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const campaigns = await prisma.assessmentCampaign.findMany({
    where: { communityId: id },
    orderBy: { scheduledAt: "desc" },
  });
  return NextResponse.json({ campaigns });
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
    const { name, description, assessmentType = "SEI", targetMemberIds = [], scheduledAt, dueAt, cycleId } = body;
    if (!name?.trim() || !scheduledAt) {
      return NextResponse.json({ error: "name and scheduledAt required" }, { status: 400 });
    }

    const campaign = await prisma.assessmentCampaign.create({
      data: {
        communityId: id,
        name: name.trim(),
        description: description?.trim() || null,
        assessmentType,
        targetMemberIds,
        scheduledAt: new Date(scheduledAt),
        dueAt: dueAt ? new Date(dueAt) : null,
        cycleId: cycleId || null,
        status: "scheduled",
        createdById: token.sub,
      },
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
