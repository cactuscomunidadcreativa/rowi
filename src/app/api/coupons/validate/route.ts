// src/app/api/coupons/validate/route.ts
// ============================================================
// Valida un código de cupón ANTES del checkout, para que la UI muestre el
// descuento ("Cupón válido: -30%") sin tener que ir a Stripe. NO redime nada
// — la redención la registra el webhook tras el pago exitoso.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toUpperCase();
    const planId: string | undefined = typeof body.planId === "string" ? body.planId : undefined;

    if (!code) {
      return NextResponse.json({ ok: false, valid: false, reason: "Código vacío" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) {
      return NextResponse.json({ ok: true, valid: false, reason: "Cupón no encontrado" });
    }

    const now = new Date();
    if (!coupon.active) {
      return NextResponse.json({ ok: true, valid: false, reason: "Cupón inactivo" });
    }
    if (coupon.startsAt && coupon.startsAt > now) {
      return NextResponse.json({ ok: true, valid: false, reason: "El cupón aún no está vigente" });
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return NextResponse.json({ ok: true, valid: false, reason: "El cupón venció" });
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ ok: true, valid: false, reason: "El cupón alcanzó su límite de usos" });
    }
    if (!coupon.stripeCouponId) {
      return NextResponse.json({
        ok: true,
        valid: false,
        reason: "El cupón no está sincronizado con la pasarela de pago",
      });
    }
    // Restricción por plan.
    if (planId && coupon.validPlanIds.length > 0 && !coupon.validPlanIds.includes(planId)) {
      return NextResponse.json({ ok: true, valid: false, reason: "El cupón no aplica a este plan" });
    }
    // Límite por usuario.
    const myRedemptions = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId: auth.id },
    });
    if (myRedemptions >= coupon.maxUsesPerUser) {
      return NextResponse.json({ ok: true, valid: false, reason: "Ya usaste este cupón" });
    }

    return NextResponse.json({
      ok: true,
      valid: true,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      name: coupon.name,
    });
  } catch (error) {
    console.error("[coupons/validate]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
