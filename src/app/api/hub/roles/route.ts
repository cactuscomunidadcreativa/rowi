// src/app/api/hub/roles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

/**
 * 🧠 GET → Roles del Hub actual del usuario autenticado
 * ------------------------------------------------------
 * - Detecta el tenant y hub asociado automáticamente
 * - Si no existen roles, devuelve []
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { primaryTenantId: true },
    });

    if (!user?.primaryTenantId)
      return NextResponse.json({ ok: false, error: "Usuario sin tenant principal" });

    // Buscar el hub asociado al tenant
    const hub = await prisma.hub.findFirst({
      where: { tenantId: user.primaryTenantId },
      select: { id: true, name: true },
    });

    if (!hub)
      return NextResponse.json({
        ok: false,
        error: "No se encontró hub asociado a este tenant",
      });

    // Buscar los roles del hub
    const roles = await prisma.hubRoleDynamic.findMany({
      where: { hubId: hub.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        permissions: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      hub,
      total: roles.length,
      roles,
    });
  } catch (e: any) {
    console.error("❌ Error GET /api/hub/roles:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ Configuración runtime
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";