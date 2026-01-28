// src/app/api/admin/fix/root/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * 🚨 FIX DEFINITIVO:
 * Restaura el usuario raíz como SUPERADMIN del Tenant Rowi Master.
 * 
 * Acceder vía:
 *    curl -X POST http://localhost:3000/api/admin/fix/root
 */
export async function POST() {
  try {
    // 1️⃣ Buscar usuario raíz
    const user = await prisma.user.findUnique({
      where: { email: "eduardo@cactuscomunidadcreativa.com" },
    });

    if (!user) {
      return NextResponse.json({
        ok: false,
        error: "Usuario raíz no encontrado",
      });
    }

    // 2️⃣ Buscar Tenant Master
    const tenant = await prisma.tenant.findFirst({
      where: { slug: "rowi-master" },
    });

    if (!tenant) {
      return NextResponse.json({
        ok: false,
        error: "Tenant Rowi Master no encontrado",
      });
    }

    // 3️⃣ Buscar plan Enterprise
    const plan = await prisma.plan.findFirst({
      where: { name: "Enterprise" },
    });

    if (!plan) {
      return NextResponse.json({
        ok: false,
        error: "Plan Enterprise no encontrado",
      });
    }

    // 4️⃣ Upsert de la membresía
    const membership = await prisma.membership.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id,
        },
      },
      update: {
        role: "SUPERADMIN",
        planId: plan.id,
      },
      create: {
        userId: user.id,
        tenantId: tenant.id,
        role: "SUPERADMIN",
        planId: plan.id,
        tokenQuota: 999999,
        tokenUsed: 0,
      },
    });

    // 5️⃣ Asegurar que allowAI y active están en true
    await prisma.user.update({
      where: { id: user.id },
      data: {
        allowAI: true,
        active: true,
        primaryTenantId: tenant.id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Rol SUPERADMIN restaurado en Rowi Master.",
      userId: user.id,
      membership,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message,
    });
  }
}