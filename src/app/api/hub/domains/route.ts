// src/app/api/hub/domains/route.ts
// NOTA: El modelo Tenant no tiene campo 'domain'.
// Se almacena el dominio en el campo JSON 'meta' del Tenant.
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

export async function POST(req: NextRequest) {
  // 🔐 Asignar un dominio a un tenant es sensible (phishing de marca):
  // solo admins, y solo sobre tenants en su scope.
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  try {
    const { tenantId, domain } = await req.json();
    if (!tenantId || !domain) {
      return NextResponse.json(
        { error: "tenantId y domain son requeridos" },
        { status: 400 }
      );
    }

    const allowedTenantIds = await tenantIdsForScope(auth.scope);
    if (allowedTenantIds !== null && !allowedTenantIds.includes(tenantId)) {
      return NextResponse.json({ error: "No autorizado para este tenant" }, { status: 403 });
    }

    // Leer meta actual del tenant para preservar otros campos
    const existing = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { meta: true },
    });

    const currentMeta =
      existing?.meta && typeof existing.meta === "object"
        ? (existing.meta as Record<string, unknown>)
        : {};

    // Almacenar el dominio dentro del campo JSON 'meta'
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        meta: { ...currentMeta, domain },
      },
    });

    const updatedMeta = tenant.meta as Record<string, unknown> | null;

    return NextResponse.json(
      { ok: true, tenantId: tenant.id, domain: updatedMeta?.domain ?? null },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error POST /hub/domains:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar dominio" },
      { status: 500 }
    );
  }
}
