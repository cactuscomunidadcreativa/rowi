// src/app/api/admin/sales/coupons/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   🎲 Generador de Códigos Promocionales

   POST: Genera códigos únicos basados en parámetros
========================================================= */

// Caracteres para códigos (sin caracteres confusos: 0, O, I, 1, l)
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(prefix: string = "", length: number = 8): string {
  let code = prefix ? prefix.toUpperCase() + "-" : "";
  for (let i = 0; i < length; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();
    const {
      // Configuración de generación
      count = 1,           // Cantidad de códigos a generar
      prefix = "",         // Prefijo (ej: "PROMO", "VIP", "GIFT")
      length = 8,          // Longitud del código sin prefijo

      // Configuración del cupón (se aplica a todos los generados)
      name,
      discountType = "PERCENTAGE",
      discountValue,
      category = "PROMOTIONAL",
      maxUses = 1,
      maxUsesPerUser = 1,
      minAmountCents,
      validPlanIds = [],
      startsAt,
      expiresAt,
      isGamificationReward = false,
      achievementId,
      notes,
      createdBy,

      // Para códigos personalizados
      targetEmails = [],   // Array de emails para códigos personalizados
    } = body;

    // Validaciones
    if (count < 1 || count > 1000) {
      return NextResponse.json(
        { ok: false, error: "Cantidad debe estar entre 1 y 1000" },
        { status: 400 }
      );
    }

    if (discountValue === undefined) {
      return NextResponse.json(
        { ok: false, error: "El valor del descuento es obligatorio" },
        { status: 400 }
      );
    }

    const generatedCoupons = [];
    const errors = [];

    // Si hay emails específicos, generar un código por email
    if (targetEmails.length > 0) {
      for (const email of targetEmails) {
        let code: string;
        let attempts = 0;
        const maxAttempts = 10;

        // Generar código único
        do {
          code = generateCode(prefix, length);
          attempts++;
        } while (
          (await prisma.coupon.findUnique({ where: { code } })) &&
          attempts < maxAttempts
        );

        if (attempts >= maxAttempts) {
          errors.push({ email, error: "No se pudo generar código único" });
          continue;
        }

        try {
          const coupon = await prisma.coupon.create({
            data: {
              code,
              name: name || `Código para ${email}`,
              discountType,
              discountValue,
              category: "PERSONAL",
              maxUses: 1,
              maxUsesPerUser: 1,
              minAmountCents,
              validPlanIds,
              startsAt: startsAt ? new Date(startsAt) : new Date(),
              expiresAt: expiresAt ? new Date(expiresAt) : null,
              targetEmail: email,
              isGamificationReward,
              achievementId,
              notes,
              createdBy,
              active: true,
            },
          });
          generatedCoupons.push(coupon);
        } catch (err: any) {
          errors.push({ email, error: err.message });
        }
      }
    } else {
      // Generar cantidad especificada de códigos
      for (let i = 0; i < count; i++) {
        let code: string;
        let attempts = 0;
        const maxAttempts = 10;

        // Generar código único
        do {
          code = generateCode(prefix, length);
          attempts++;
        } while (
          (await prisma.coupon.findUnique({ where: { code } })) &&
          attempts < maxAttempts
        );

        if (attempts >= maxAttempts) {
          errors.push({ index: i, error: "No se pudo generar código único" });
          continue;
        }

        try {
          const coupon = await prisma.coupon.create({
            data: {
              code,
              name: name || `${prefix || "PROMO"} #${i + 1}`,
              discountType,
              discountValue,
              category,
              maxUses,
              maxUsesPerUser,
              minAmountCents,
              validPlanIds,
              startsAt: startsAt ? new Date(startsAt) : new Date(),
              expiresAt: expiresAt ? new Date(expiresAt) : null,
              isGamificationReward,
              achievementId,
              notes,
              createdBy,
              active: true,
            },
          });
          generatedCoupons.push(coupon);
        } catch (err: any) {
          errors.push({ index: i, error: err.message });
        }
      }
    }

    console.log(
      `🎲 Generados ${generatedCoupons.length} códigos promocionales`
    );

    return NextResponse.json({
      ok: errors.length === 0,
      generated: generatedCoupons.length,
      coupons: generatedCoupons,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("❌ Error generando códigos:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al generar códigos" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
