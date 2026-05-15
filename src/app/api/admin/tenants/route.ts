// src/app/api/admin/tenants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { cloneAgentsForContext } from "@/core/startup/cloneAgents";
import { requireAdminWithScope, requireSuperAdmin } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

/* =========================================================
   🔍 GET — Listar Tenants (scope-aware)
   ---------------------------------------------------------
   - rowiverse/SuperAdmin: ve todos los tenants
   - tenant admin: ve solo su tenant
   - hub admin: ve el tenant del hub
   - superhub admin: ve todos los tenants del superhub
========================================================= */
export async function GET() {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const allowed = await tenantIdsForScope(auth.scope);
    const where = allowed === null ? {} : { id: { in: allowed } };

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        plan: { select: { id: true, name: true, priceUsd: true } },
        superHub: { select: { id: true, name: true } },
        hubs: { select: { id: true, name: true } },
        members: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tenants);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener tenants";
    console.error("❌ Error GET /api/admin/tenants:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* =========================================================
   ➕ POST — Crear Tenant (con clonación de agentes)
   ---------------------------------------------------------
   🔐 SEGURIDAD: Solo SuperAdmin puede crear tenants
========================================================= */
export async function POST(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const data = await req.json();

    // Validación básica
    if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nombre del tenant es requerido (mínimo 2 caracteres)" },
        { status: 400 }
      );
    }

    if (!data.slug || typeof data.slug !== "string") {
      return NextResponse.json(
        { error: "Slug del tenant es requerido" },
        { status: 400 }
      );
    }

    // 🧱 Crear Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: data.name.trim(),
        slug: data.slug.toLowerCase().trim(),
        ...(data.planId && { planId: data.planId }),
        ...(data.superHubId && { superHubId: data.superHubId }),
      },
    });

    // 🤖 Clonar agentes globales automáticamente
    try {
      await cloneAgentsForContext({ tenantId: tenant.id });
      console.log(`✅ Agentes IA clonados para Tenant: ${tenant.name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      console.warn(`⚠️ No se pudieron clonar los agentes para ${tenant.name}:`, msg);
    }

    return NextResponse.json(tenant);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear tenant";
    console.error("❌ Error POST /api/admin/tenants:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* =========================================================
   ✏️ PUT — Actualizar Tenant
   ---------------------------------------------------------
   🔐 SEGURIDAD: Solo SuperAdmin puede actualizar tenants
========================================================= */
export async function PUT(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id, planId, ...data } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID del tenant es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el tenant existe
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 }
      );
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...data,
        planId: planId ?? null,
      },
    });

    return NextResponse.json(tenant);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar tenant";
    console.error("❌ Error PUT /api/admin/tenants:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar Tenant
   ---------------------------------------------------------
   🔐 SEGURIDAD: Solo SuperAdmin puede eliminar tenants
========================================================= */
export async function DELETE(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID del tenant es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el tenant existe
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 }
      );
    }

    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar tenant";
    console.error("❌ Error DELETE /api/admin/tenants:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
