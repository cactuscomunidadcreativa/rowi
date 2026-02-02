// src/app/api/admin/sales/coupons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/* =========================================================
   🎟️ API de Gestión de Cupones/Códigos Promocionales

   Endpoints:
   - GET: Listar cupones con filtros
   - POST: Crear nuevo cupón
   - PUT: Actualizar cupón existente
   - DELETE: Eliminar cupón
========================================================= */

/* =========================================================
   🔍 GET — Listar cupones
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const active = searchParams.get("active");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Construir filtro
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (active !== null && active !== "") {
      where.active = active === "true";
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { targetEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    // Obtener cupones con paginación
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          redemptions: {
            select: {
              id: true,
              userId: true,
              redeemedAt: true,
              discountApplied: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    // Estadísticas generales
    const stats = await prisma.coupon.aggregate({
      _count: { id: true },
      _sum: { usedCount: true },
    });

    const activeCount = await prisma.coupon.count({ where: { active: true } });
    const expiredCount = await prisma.coupon.count({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    // Estadísticas por categoría
    const byCategory = await prisma.coupon.groupBy({
      by: ["category"],
      _count: { id: true },
    });

    return NextResponse.json({
      ok: true,
      coupons,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        total: stats._count.id,
        active: activeCount,
        expired: expiredCount,
        totalRedemptions: stats._sum.usedCount || 0,
        byCategory: byCategory.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
      },
    });
  } catch (error: any) {
    console.error("❌ Error GET coupons:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al obtener cupones" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear nuevo cupón
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      name,
      discountType = "PERCENTAGE",
      discountValue,
      category = "GENERAL",
      maxUses,
      maxUsesPerUser = 1,
      minAmountCents,
      validPlanIds = [],
      startsAt,
      expiresAt,
      targetUserId,
      targetEmail,
      achievementId,
      isGamificationReward = false,
      notes,
      createdBy,
    } = body;

    // Validaciones
    if (!code) {
      return NextResponse.json(
        { ok: false, error: "El código es obligatorio" },
        { status: 400 }
      );
    }

    if (discountValue === undefined || discountValue === null) {
      return NextResponse.json(
        { ok: false, error: "El valor del descuento es obligatorio" },
        { status: 400 }
      );
    }

    // Verificar código único
    const exists = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (exists) {
      return NextResponse.json(
        { ok: false, error: "Ya existe un cupón con ese código" },
        { status: 409 }
      );
    }

    // Crear cupón
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        name,
        discountType,
        discountValue,
        category,
        maxUses,
        maxUsesPerUser,
        minAmountCents,
        validPlanIds,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        targetUserId,
        targetEmail,
        achievementId,
        isGamificationReward,
        notes,
        createdBy,
        active: true,
      },
    });

    console.log(`🎟️ Cupón creado: ${coupon.code}`);
    return NextResponse.json({ ok: true, coupon }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error POST coupon:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al crear cupón" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PUT — Actualizar cupón
========================================================= */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, code, ...data } = body;

    if (!id && !code) {
      return NextResponse.json(
        { ok: false, error: "Se requiere id o código del cupón" },
        { status: 400 }
      );
    }

    // Preparar datos para actualización
    const updateData: any = { ...data };

    if (data.startsAt) {
      updateData.startsAt = new Date(data.startsAt);
    }
    if (data.expiresAt) {
      updateData.expiresAt = new Date(data.expiresAt);
    }
    if (data.code) {
      updateData.code = data.code.toUpperCase();
    }

    const coupon = await prisma.coupon.update({
      where: id ? { id } : { code: code.toUpperCase() },
      data: updateData,
    });

    console.log(`✏️ Cupón actualizado: ${coupon.code}`);
    return NextResponse.json({ ok: true, coupon });
  } catch (error: any) {
    console.error("❌ Error PUT coupon:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al actualizar cupón" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar cupón
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const { id, code } = await req.json();

    if (!id && !code) {
      return NextResponse.json(
        { ok: false, error: "Se requiere id o código del cupón" },
        { status: 400 }
      );
    }

    // Verificar si tiene redenciones
    const coupon = await prisma.coupon.findFirst({
      where: id ? { id } : { code: code.toUpperCase() },
      include: { _count: { select: { redemptions: true } } },
    });

    if (!coupon) {
      return NextResponse.json(
        { ok: false, error: "Cupón no encontrado" },
        { status: 404 }
      );
    }

    // Si tiene redenciones, solo desactivar
    if (coupon._count.redemptions > 0) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { active: false },
      });
      return NextResponse.json({
        ok: true,
        message: "Cupón desactivado (tiene redenciones)",
        deactivated: true,
      });
    }

    // Si no tiene redenciones, eliminar
    await prisma.coupon.delete({
      where: { id: coupon.id },
    });

    console.log(`🗑️ Cupón eliminado: ${coupon.code}`);
    return NextResponse.json({
      ok: true,
      message: "Cupón eliminado correctamente",
    });
  } catch (error: any) {
    console.error("❌ Error DELETE coupon:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al eliminar cupón" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
