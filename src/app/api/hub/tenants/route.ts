// src/app/api/hub/tenants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import { canAccess } from "@/core/auth/hasAccess";

const tenantInclude = {
  plan: true,
  superHub: true,
  organizationLinks: {
    include: {
      organization: true,
    },
  },
};

/* =========================================================
   GET — Lista de Tenants según permisos
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    const userId = auth?.id ?? null;

    // 1️⃣ Sin sesión → modo público (solo dev)
    if (!userId) {
      const tenants = await prisma.tenant.findMany({
        include: tenantInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ ok: true, tenants });
    }

    // 2️⃣ SUPERADMIN ROWIVERSE → ver todos
    if (auth?.isSuperAdmin) {
      const tenants = await prisma.tenant.findMany({
        include: tenantInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ ok: true, tenants });
    }

    // 3️⃣ SUPERHUB ADMIN → ver tenants bajo su superhub (usando superHubIds)
    const superHubIds = auth?.superHubIds || [];
    if (superHubIds.length > 0 && await canAccess(userId, "superhub", superHubIds[0])) {
      const tenants = await prisma.tenant.findMany({
        where: { superHubId: { in: superHubIds } },
        include: tenantInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ ok: true, tenants });
    }

    // 4️⃣ TENANT ADMIN / USER → ver solo su tenant primario
    if (auth?.primaryTenantId && await canAccess(userId, "tenant", auth.primaryTenantId)) {
      const tenants = await prisma.tenant.findMany({
        where: { id: auth.primaryTenantId },
        include: tenantInclude,
      });
      return NextResponse.json({ ok: true, tenants });
    }

    // 5️⃣ Otros usuarios → nada
    return NextResponse.json({ ok: true, tenants: [] });
  } catch (err: any) {
    console.error("❌ Error GET /api/hub/tenants:", err);
    return NextResponse.json(
      { ok: false, error: "Error cargando tenants" },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST — Crear Tenant (solo SuperAdmin)
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.isSuperAdmin)
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 403 }
      );

    const { name, slug, planId, billingEmail, superHubId } = await req.json();
    if (!name || !slug)
      return NextResponse.json({ ok: false, error: "Elegir nombre/slug" });

    const exists = await prisma.tenant.findUnique({ where: { slug } });
    if (exists)
      return NextResponse.json({ ok: false, error: "Slug ya existe" });

    const created = await prisma.tenant.create({
      data: {
        name: name.trim(),
        slug,
        billingEmail: billingEmail?.trim() || null,
        planId: planId || null,
        superHubId: superHubId || null,
      },
      include: tenantInclude,
    });

    return NextResponse.json({ ok: true, tenant: created }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error POST /api/hub/tenants:", err);
    return NextResponse.json(
      { ok: false, error: "Error creando tenant" },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE — Eliminar Tenant (solo SuperAdmin)
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.isSuperAdmin)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });

    const { id } = await req.json();
    if (!id)
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      );

    await prisma.tenant.delete({ where: { id } });

    return NextResponse.json({ ok: true, message: "Tenant eliminado" });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/hub/tenants:", err);
    return NextResponse.json(
      { ok: false, error: "Error eliminando tenant" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";