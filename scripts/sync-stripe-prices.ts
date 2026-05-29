/**
 * 🔄 Sincroniza los planes de la DB con Stripe (productos + precios) y rellena
 * stripeProductId / stripePriceIdMonthly / stripePriceIdYearly.
 *
 * Pensado para correr en el BUILD de Vercel (que tiene STRIPE_SECRET_KEY y
 * DATABASE_URL en su entorno), encadenado con `|| true` para no romper el
 * deploy si Stripe no está configurado o falla. Idempotente: solo crea lo que
 * falta (no recrea productos/precios ya enlazados).
 *
 * Espejo de la lógica de POST /api/admin/stripe/sync-products, pero sin auth
 * (corre server-side en build, no expuesto). El plan "sei" usa precio largo
 * SEMESTRAL (interval month × 6); el resto, anual.
 *
 * Run:  pnpm tsx scripts/sync-stripe-prices.ts
 */

import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.log("⏭️  STRIPE_SECRET_KEY no configurada — se omite la sync a Stripe.");
    return;
  }
  const stripe = new Stripe(key, { apiVersion: "2025-05-28.basil" as never });

  const plans = await prisma.plan.findMany({
    where: { isActive: true, priceCents: { gt: 0 } },
  });

  console.log(`🔄 Sincronizando ${plans.length} plan(es) pagado(s) con Stripe...`);

  for (const plan of plans) {
    try {
      let stripeProductId = plan.stripeProductId;
      let stripePriceIdMonthly = plan.stripePriceIdMonthly;
      let stripePriceIdYearly = plan.stripePriceIdYearly;

      // 1. Producto
      if (!stripeProductId) {
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description || `Plan ${plan.name} de Rowi`,
          metadata: { planId: plan.id, planSlug: plan.slug || "" },
        });
        stripeProductId = product.id;
        console.log(`  ✅ Producto: ${plan.name} -> ${product.id}`);
      }

      // 2. Precio mensual
      if (!stripePriceIdMonthly && plan.priceCents > 0) {
        const priceMonthly = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: plan.priceCents,
          currency: "usd",
          recurring: { interval: "month" },
          metadata: { planId: plan.id, billingPeriod: "monthly" },
        });
        stripePriceIdMonthly = priceMonthly.id;
        console.log(`  ✅ Mensual: $${plan.priceCents / 100} -> ${priceMonthly.id}`);
      }

      // 3. Precio largo: SEI = semestral (month×6); resto = anual.
      const isSeiSemestral = plan.slug === "sei";
      const longPriceCents = plan.priceYearlyCents || Math.round(plan.priceCents * 10);
      if (!stripePriceIdYearly && longPriceCents > 0) {
        const recurring: { interval: "year" | "month"; interval_count?: number } =
          isSeiSemestral ? { interval: "month", interval_count: 6 } : { interval: "year" };
        const priceLong = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: longPriceCents,
          currency: "usd",
          recurring,
          metadata: {
            planId: plan.id,
            billingPeriod: isSeiSemestral ? "semiannual" : "yearly",
          },
        });
        stripePriceIdYearly = priceLong.id;
        console.log(
          `  ✅ Largo (${isSeiSemestral ? "6m" : "año"}): $${longPriceCents / 100} -> ${priceLong.id}`,
        );
      }

      // 4. Backfill en la DB
      await prisma.plan.update({
        where: { id: plan.id },
        data: { stripeProductId, stripePriceIdMonthly, stripePriceIdYearly },
      });
    } catch (e) {
      console.error(`  ❌ Error en plan ${plan.name}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log("✅ Sync de precios completado.");
}

main()
  .catch((e) => {
    console.error("❌ sync-stripe-prices falló:", e);
    process.exitCode = 0; // no romper el build
  })
  .finally(() => prisma.$disconnect());
