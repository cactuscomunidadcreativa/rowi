// src/app/api/admin/tenants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { cloneAgentsForContext } from "@/core/startup/cloneAgents";

/* =========================================================
   🔍 GET — Listar Tenants (con relaciones)
========================================================= */
export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        plan: { select: { id: true, name: true, priceUsd: true } },
        superHub: { select: { id: true, name: true } },
        hubs: { select: { id: true, name: true } },
        members: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tenants);
  } catch (error: any) {
    console.error("❌ Error GET /api/admin/tenants:", error);
    return NextResponse.json({ error: "Error al obtener tenants" }, { status: 500 });
  }
}

/* =========================================================
   ➕ POST — Crear Tenant (con clonación de agentes)
========================================================= */
export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 🧱 Crear Tenant
    const tenant = await prisma.tenant.create({ data });

    // 🤖 Clonar agentes globales automáticamente
    try {
      await cloneAgentsForContext({ tenantId: tenant.id });
      console.log(`✅ Agentes IA clonados para Tenant: ${tenant.name}`);
    } catch (e: any) {
      console.warn(`⚠️ No se pudieron clonar los agentes para ${tenant.name}:`, e);
    }

    return NextResponse.json(tenant);
  } catch (error: any) {
    console.error("❌ Error POST /api/admin/tenants:", error);
    return NextResponse.json({ error: "Error al crear tenant" }, { status: 500 });
  }
}

/* =========================================================
   ✏️ PUT — Actualizar Tenant
========================================================= */
export async function PUT(req: Request) {
  try {
    const { id, planId, ...data } = await req.json();

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...data,
        planId: planId ?? null, // 👈 CLAVE: guardar planId
      },
    });

    return NextResponse.json(tenant);
  } catch (error: any) {
    console.error("❌ Error PUT /api/admin/tenants:", error);
    return NextResponse.json(
      { error: "Error al actualizar tenant" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar Tenant
========================================================= */
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Error DELETE /api/admin/tenants:", error);
    return NextResponse.json({ error: "Error al eliminar tenant" }, { status: 500 });
  }
}