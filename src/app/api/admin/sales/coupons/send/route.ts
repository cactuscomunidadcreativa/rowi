// src/app/api/admin/sales/coupons/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   📧 Enviar Códigos Promocionales por Email

   POST: Envía un cupón existente a un email específico
========================================================= */

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { couponId, code, email, customMessage } = body;

    if (!couponId && !code) {
      return NextResponse.json(
        { ok: false, error: "Se requiere couponId o code" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "El email del destinatario es obligatorio" },
        { status: 400 }
      );
    }

    // Buscar el cupón
    const coupon = await prisma.coupon.findFirst({
      where: couponId ? { id: couponId } : { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { ok: false, error: "Cupón no encontrado" },
        { status: 404 }
      );
    }

    if (!coupon.active) {
      return NextResponse.json(
        { ok: false, error: "El cupón no está activo" },
        { status: 400 }
      );
    }

    // TODO: Integrar con servicio de email (Resend, SendGrid, etc.)
    // Por ahora solo actualizamos el registro
    const updatedCoupon = await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        targetEmail: email,
        sentAt: new Date(),
      },
    });

    console.log(`📧 Cupón ${coupon.code} enviado a ${email}`);

    // Aquí iría la lógica de envío de email
    // await sendCouponEmail({ to: email, coupon, customMessage });

    return NextResponse.json({
      ok: true,
      message: `Cupón enviado a ${email}`,
      coupon: updatedCoupon,
      // En producción, esto dependería del resultado del envío de email
      emailSent: false, // Cambiar a true cuando se integre el servicio de email
      note: "Integrar con servicio de email para envío real",
    });
  } catch (error: any) {
    console.error("❌ Error enviando cupón:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al enviar cupón" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
