// src/app/api/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { listUserWorkspaces, PROFESSIONAL_ROLES } from "@/lib/workspace/permissions";
import { getTemplate } from "@/lib/workspace/templates";

export const runtime = "nodejs";

/* =========================================================
   GET /api/workspaces
   Lista los workspaces del usuario (filtrables por type).
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const includeArchived = searchParams.get("includeArchived") === "1";

    const workspaces = await listUserWorkspaces(token.sub, {
      workspaceType: type,
      includeArchived,
    });

    return NextResponse.json({ workspaces });
  } catch (err: any) {
    console.error("GET /api/workspaces error:", err);
    return NextResponse.json(
      { error: err?.message || "Error listing workspaces" },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST /api/workspaces
   Crea un workspace nuevo (RowiCommunity con workspaceType).
   Body: { templateKey, name, description?, clientOrgId?, targetRole?,
           projectStartDate?, projectEndDate? }
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      templateKey,
      name,
      description,
      clientOrgId,
      targetRole,
      projectStartDate,
      projectEndDate,
    } = body || {};

    if (!templateKey || !name?.trim()) {
      return NextResponse.json(
        { error: "templateKey and name are required" },
        { status: 400 }
      );
    }

    const template = getTemplate(templateKey);
    if (!template) {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }

    // Slug unico
    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    let slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Obtener primaryTenantId del usuario
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { primaryTenantId: true },
    });

    const workspace = await prisma.rowiCommunity.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        type: "workspace",
        visibility: "private",
        workspaceType: template.type,
        teamType: "coaching",
        clientOrgId: clientOrgId || null,
        targetRole: targetRole?.trim() || null,
        projectStartDate: projectStartDate ? new Date(projectStartDate) : null,
        projectEndDate: projectEndDate ? new Date(projectEndDate) : null,
        projectStatus: template.defaultProjectStatus,
        createdById: token.sub,
        tenantId: user?.primaryTenantId || null,
        members: {
          create: {
            userId: token.sub,
            role: "owner",
            status: "active",
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        workspaceType: true,
        projectStatus: true,
      },
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/workspaces error:", err);
    return NextResponse.json(
      { error: err?.message || "Error creating workspace" },
      { status: 500 }
    );
  }
}
