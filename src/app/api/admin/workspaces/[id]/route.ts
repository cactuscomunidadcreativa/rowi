/**
 * PATCH /api/admin/workspaces/[id]
 *
 * Actualiza un workspace (RowiCommunity con workspaceType). Permite
 * editar name, slug, description, projectStatus, targetRole y fechas.
 * Scope-aware: el admin caller debe poder gestionar el tenant dueño.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

interface UpdateBody {
  name?: string;
  slug?: string;
  description?: string | null;
  projectStatus?: string | null;
  targetRole?: string | null;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAdminWithScope();
    if (auth.error || !auth.scope) {
      return auth.error ?? NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const allowedTenantIds = await tenantIdsForScope(auth.scope);

    const existing = await prisma.rowiCommunity.findUnique({
      where: { id },
      select: { id: true, tenantId: true, workspaceType: true, slug: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
    }
    if (!existing.workspaceType) {
      return NextResponse.json(
        { ok: false, error: "Not a workspace (workspaceType is null)" },
        { status: 400 },
      );
    }
    if (allowedTenantIds !== null && (!existing.tenantId || !allowedTenantIds.includes(existing.tenantId))) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as UpdateBody;
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.slug === "string" && body.slug.trim()) {
      const s = body.slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (s && s !== existing.slug) {
        const dup = await prisma.rowiCommunity.findFirst({
          where: { slug: s, id: { not: id } },
          select: { id: true },
        });
        if (dup) {
          return NextResponse.json(
            { ok: false, error: "Ya existe un workspace con ese slug" },
            { status: 409 },
          );
        }
        data.slug = s;
      }
    }
    if (body.description !== undefined) data.description = body.description ?? null;
    if (body.projectStatus !== undefined) data.projectStatus = body.projectStatus ?? null;
    if (body.targetRole !== undefined) data.targetRole = body.targetRole ?? null;
    if (body.projectStartDate !== undefined) {
      data.projectStartDate = body.projectStartDate ? new Date(body.projectStartDate) : null;
    }
    if (body.projectEndDate !== undefined) {
      data.projectEndDate = body.projectEndDate ? new Date(body.projectEndDate) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.rowiCommunity.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        workspaceType: true,
        projectStatus: true,
        targetRole: true,
        projectStartDate: true,
        projectEndDate: true,
      },
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (e: unknown) {
    console.error("/api/admin/workspaces/[id] PATCH error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
