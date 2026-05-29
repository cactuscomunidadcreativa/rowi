/**
 * 🎟️ Sincronización de cupones locales → Stripe.
 *
 * Un Coupon en nuestra DB no aplica en el checkout hasta que existe como
 * Coupon de Stripe (referenciado por `Coupon.stripeCouponId`). Este helper
 * crea el Coupon de Stripe (descuento) y un Promotion Code (el código legible
 * que el cliente escribe, con su límite de usos) y devuelve el id del coupon
 * para guardarlo localmente.
 *
 * Tipos soportados hoy: PERCENTAGE y FIXED_AMOUNT. FREE_TRIAL_DAYS /
 * FREE_ACCESS se manejan en otra capa (trial del plan) y se omiten aquí.
 */

import { getStripeClient } from "./client";

export type LocalCouponForStripe = {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_TRIAL_DAYS" | "FREE_ACCESS";
  discountValue: number;
  /** null = ilimitado */
  maxUses?: number | null;
  expiresAt?: Date | null;
  /**
   * Duración del descuento en suscripciones: "once" (un cobro), "forever"
   * (todos), o "repeating" N meses. Default "once" (típico de lanzamiento).
   */
  duration?: "once" | "forever" | "repeating";
  durationInMonths?: number | null;
};

/**
 * Crea el Coupon + Promotion Code en Stripe. Devuelve el id del Coupon de
 * Stripe (para Coupon.stripeCouponId) y el id del promotion code.
 * Lanza si Stripe no está configurado o si el tipo no es descontable.
 */
export async function createStripeCoupon(
  c: LocalCouponForStripe,
): Promise<{ stripeCouponId: string; promotionCodeId: string }> {
  const stripe = await getStripeClient();
  if (!stripe) {
    throw new Error("Stripe no está configurado (falta STRIPE_SECRET_KEY).");
  }

  if (c.discountType !== "PERCENTAGE" && c.discountType !== "FIXED_AMOUNT") {
    throw new Error(
      `El tipo de cupón ${c.discountType} no se sincroniza como descuento de Stripe.`,
    );
  }

  const duration = c.duration ?? "once";

  const couponParams: Record<string, unknown> = {
    duration,
    metadata: { localCode: c.code },
  };
  if (duration === "repeating") {
    couponParams.duration_in_months = Math.max(1, c.durationInMonths ?? 1);
  }
  if (c.discountType === "PERCENTAGE") {
    // Stripe percent_off: 0–100.
    couponParams.percent_off = Math.min(100, Math.max(0, c.discountValue));
  } else {
    // FIXED_AMOUNT: discountValue está en dólares → centavos.
    couponParams.amount_off = Math.round(c.discountValue * 100);
    couponParams.currency = "usd";
  }

  const stripeCoupon = await stripe.coupons.create(couponParams as never);

  // Promotion Code = el código legible que el cliente escribe.
  const promoParams: Record<string, unknown> = {
    coupon: stripeCoupon.id,
    code: c.code.toUpperCase(),
  };
  if (c.maxUses && c.maxUses > 0) promoParams.max_redemptions = c.maxUses;
  if (c.expiresAt) promoParams.expires_at = Math.floor(c.expiresAt.getTime() / 1000);

  const promo = await stripe.promotionCodes.create(promoParams as never);

  return { stripeCouponId: stripeCoupon.id, promotionCodeId: promo.id };
}

/**
 * Archiva (desactiva) un Promotion Code en Stripe. No borra el Coupon
 * subyacente para preservar el historial de redenciones.
 */
export async function deactivateStripePromotionCode(promotionCodeId: string): Promise<void> {
  const stripe = await getStripeClient();
  if (!stripe) return;
  try {
    await stripe.promotionCodes.update(promotionCodeId, { active: false });
  } catch {
    /* best-effort */
  }
}
