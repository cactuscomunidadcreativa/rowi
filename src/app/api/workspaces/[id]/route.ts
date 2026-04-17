// src/app/api/workspaces/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canAccessWorkspace, canManageWorkspace } from "@/lib/workspace/permissions";

export const runtime = "nodejs";

/* =========================================================
   GET /api/workspaces/[id]
   Detalle del workspace (requiere acceso).
========================================================= */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed, role } = await canAccessWorkspace(token.sub, id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const workspace = await prisma.rowiCommunity.findUnique({
      where: { id },
      include: {
        clientOrg: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: {
            members: true,
            communityMembers: true,
            benchmarks: true,
            coachNotes: true,
            developmentPlans: true,
            campaigns: true,
            workspaceAlerts: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ workspace, role });
  } catch (err: any) {
    console.error("GET /api/workspaces/[id] error:", err);
    return NextResponse.json(
      { error: err?.message || "Error" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH /api/workspaces/[id]
   Actualiza workspace (solo owner/admin/coach).
========================================================= */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await canManageWorkspace(token.sub, id);
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      clientOrgId,
      targetRole,
      projectStartDate,
      projectEndDate,
      projectStatus,
      bannerUrl,
      coverUrl,
    } = body || {};

    const updated = await prisma.rowiCommunity.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(clientOrgId !== undefined ? { clientOrgId: clientOrgId || null } : {}),
        ...(targetRole !== undefined ? { targetRole: targetRole?.trim() || null } : {}),
        ...(projectStartDate !== undefined
          ? { projectStartDate: projectStartDate ? new Date(projectStartDate) : null }
          : {}),
        ...(projectEndDate !== undefined
          ? { projectEndDate: projectEndDate ? new Date(projectEndDate) : null }
          : {}),
        ...(projectStatus !== undefined ? { projectStatus } : {}),
        ...(bannerUrl !== undefined ? { bannerUrl } : {}),
        ...(coverUrl !== undefined ? { coverUrl } : {}),
      },
    });

    return NextResponse.json({ workspace: updated });
  } catch (err: any) {
    console.error("PATCH /api/workspaces/[id] error:", err);
    return NextResponse.json(
      { error: err?.message || "Error" },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE /api/workspaces/[id]
   Archiva el workspace (soft delete, solo owner).
========================================================= */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.rowiCommunityUser.findFirst({
      where: { userId: token.sub, communityId: id },
      select: { role: true },
    });

    if (!membership || membership.role !== "owner") {
      return NextResponse.json({ error: "Only owner can archive" }, { status: 403 });
    }

    await prisma.rowiCommunity.update({
      where: { id },
      data: { projectStatus: "archived" },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/workspaces/[id] error:", err);
    return NextResponse.json(
      { error: err?.message || "Error" },
      { status: 500 }
    );
  }
}
