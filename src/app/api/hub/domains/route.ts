// src/app/api/hub/domains/route.ts
// NOTA: El modelo Tenant no tiene campo 'domain'.
// Se almacena el dominio en el campo JSON 'meta' del Tenant.
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId, domain } = await req.json();
    if (!tenantId || !domain) {
      return NextResponse.json(
        { error: "tenantId y domain son requeridos" },
        { status: 400 }
      );
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
