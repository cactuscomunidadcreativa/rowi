// src/app/api/admin/fix/superadmin/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * ⚡ Restaurar superadmin root
 * Este endpoint te devuelve el acceso completo inmediatamente.
 */
export async function POST() {
  try {
    const email = "eduardo@cactuscomunidadcreativa.com";

    // 1️⃣ Asegurar usuario base
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        active: true,
        allowAI: true,
        organizationRole: "OWNER",
      },
      create: {
        email,
        name: "Eduardo González",
        active: true,
        allowAI: true,
        primaryTenantId: null,
        organizationRole: "OWNER",
      },
    });

    // 2️⃣ Buscar Rowi Master (bootstrap)
    const tenant = await prisma.tenant.findFirst({
      where: { slug: "rowi-master" },
    });

    // 3️⃣ Crear o actualizar membresía de SUPERADMIN
    if (tenant) {
      await prisma.membership.upsert({
        where: {
          userId_tenantId: { userId: user.id, tenantId: tenant.id },
        },
        update: {
          role: "SUPERADMIN",
        },
        create: {
          userId: user.id,
          tenantId: tenant.id,
          role: "SUPERADMIN",
          planId: null,
          tokenQuota: 999999,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Rol SUPERADMIN restaurado correctamente.",
      userId: user.id,
    });
  } catch (err: any) {
    console.error("❌ SUPERADMIN FIX ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}