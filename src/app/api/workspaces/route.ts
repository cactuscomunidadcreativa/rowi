// src/app/api/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/core/prisma";
import { telemetry } from "@/lib/telemetry";
import { getToken } from "next-auth/jwt";
import { listUserWorkspaces, PROFESSIONAL_ROLES } from "@/lib/workspace/permissions";
import { getTemplate, isValidTemplate } from "@/lib/workspace/templates";
import {
  ACTIVE_CONTEXT_COOKIE,
  resolveContextTenantId,
} from "@/lib/account/contexts";

export const runtime = "nodejs";

/* =========================================================
   GET /api/workspaces
   Lista los workspaces del usuario (filtrables por type).
   Respeta la cookie de contexto activo: si apunta a un tenant,
   filtra los workspaces a sólo los de ese tenant.
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

    let workspaces = await listUserWorkspaces(token.sub, {
      workspaceType: type,
      includeArchived,
    });

    // Narrow by active context if the cookie resolves to a tenant.
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(ACTIVE_CONTEXT_COOKIE)?.value;
    let activeContextFilter: { tenantId: string } | null = null;
    if (cookieValue) {
      const tenantId = await resolveContextTenantId(cookieValue);
      if (tenantId) {
        const before = workspaces.length;
        workspaces = workspaces.filter(
          (w: any) => w.tenantId === tenantId,
        );
        // Only flag the filter when it actually changed the result —
        // hides the badge on personal/family contexts that don't narrow.
        if (workspaces.length !== before) {
          activeContextFilter = { tenantId };
        }
      }
    }

    return NextResponse.json({ workspaces, activeContextFilter });
  } catch (err: any) {
    telemetry.captureException(err, { route: "/api/workspaces", op: "GET" });
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
        { ok: false, error: "templateKey and name are required" },
        { status: 400 }
      );
    }

    // Type-guarded validation: rechaza cualquier key fuera de la lista
    // canónica (WORKSPACE_TEMPLATE_KEYS). El cliente recibe un error
    // estable que puede mapear a i18n sin parsear texto.
    if (!isValidTemplate(templateKey)) {
      return NextResponse.json(
        { ok: false, error: "invalid_template" },
        { status: 400 },
      );
    }

    const template = getTemplate(templateKey);
    if (!template) {
      // Defensa en profundidad — no debería ocurrir tras isValidTemplate.
      return NextResponse.json(
        { ok: false, error: "invalid_template" },
        { status: 400 },
      );
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
    telemetry.captureException(err, { route: "/api/workspaces", op: "POST" });
    return NextResponse.json(
      { error: err?.message || "Error creating workspace" },
      { status: 500 }
    );
  }
}
