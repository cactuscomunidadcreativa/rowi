/**
 * 🔄 API: Sincronizar productos de Stripe
 * POST /api/admin/stripe/sync-products
 *
 * Crea los productos y precios en Stripe basándose en los planes de la BD
 * y actualiza los planes con los IDs de Stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Inicializar Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-05-28.basil" as any })
  : null;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { ok: false, error: "Stripe no está configurado. Falta STRIPE_SECRET_KEY." },
        { status: 500 }
      );
    }

    // Obtener todos los planes que necesitan sincronización
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
        priceCents: { gt: 0 }, // Solo planes pagados
      },
    });

    const results: any[] = [];

    for (const plan of plans) {
      try {
        let stripeProductId = plan.stripeProductId;
        let stripePriceIdMonthly = plan.stripePriceIdMonthly;
        let stripePriceIdYearly = plan.stripePriceIdYearly;

        // 1. Crear o actualizar producto en Stripe
        if (!stripeProductId) {
          // Crear nuevo producto
          const product = await stripe.products.create({
            name: plan.name,
            description: plan.description || `Plan ${plan.name} de Rowi`,
            metadata: {
              planId: plan.id,
              planSlug: plan.slug || "",
            },
          });
          stripeProductId = product.id;
          console.log(`✅ Producto creado: ${plan.name} -> ${product.id}`);
        } else {
          // Actualizar producto existente
          await stripe.products.update(stripeProductId, {
            name: plan.name,
            description: plan.description || `Plan ${plan.name} de Rowi`,
          });
          console.log(`🔄 Producto actualizado: ${plan.name}`);
        }

        // 2. Crear precio mensual si no existe
        if (!stripePriceIdMonthly && plan.priceCents > 0) {
          const priceMonthly = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: plan.priceCents,
            currency: "usd",
            recurring: {
              interval: "month",
            },
            metadata: {
              planId: plan.id,
              billingPeriod: "monthly",
            },
          });
          stripePriceIdMonthly = priceMonthly.id;
          console.log(`✅ Precio mensual creado: $${plan.priceCents / 100}/mes -> ${priceMonthly.id}`);
        }

        // 3. Crear precio anual si no existe (con descuento ~17%)
        const yearlyPriceCents = plan.priceYearlyCents || Math.round(plan.priceCents * 10); // 10 meses = ~17% descuento
        if (!stripePriceIdYearly && yearlyPriceCents > 0) {
          const priceYearly = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: yearlyPriceCents,
            currency: "usd",
            recurring: {
              interval: "year",
            },
            metadata: {
              planId: plan.id,
              billingPeriod: "yearly",
            },
          });
          stripePriceIdYearly = priceYearly.id;
          console.log(`✅ Precio anual creado: $${yearlyPriceCents / 100}/año -> ${priceYearly.id}`);
        }

        // 4. Actualizar plan en la BD con los IDs de Stripe
        await prisma.plan.update({
          where: { id: plan.id },
          data: {
            stripeProductId,
            stripePriceIdMonthly,
            stripePriceIdYearly,
          },
        });

        results.push({
          plan: plan.name,
          slug: plan.slug,
          stripeProductId,
          stripePriceIdMonthly,
          stripePriceIdYearly,
          priceMonthly: `$${plan.priceCents / 100}/mes`,
          priceYearly: `$${yearlyPriceCents / 100}/año`,
          status: "synced",
        });

      } catch (planError: any) {
        console.error(`❌ Error sincronizando plan ${plan.name}:`, planError);
        results.push({
          plan: plan.name,
          slug: plan.slug,
          status: "error",
          error: planError.message,
        });
      }
    }

    // Planes gratuitos (solo info)
    const freePlans = await prisma.plan.findMany({
      where: {
        isActive: true,
        priceCents: 0,
      },
    });

    for (const plan of freePlans) {
      results.push({
        plan: plan.name,
        slug: plan.slug,
        status: "skipped",
        reason: "Plan gratuito, no requiere Stripe",
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Sincronización completada. ${results.filter(r => r.status === "synced").length} planes sincronizados.`,
      results,
    });

  } catch (err: any) {
    console.error("❌ Error en sync-products:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error sincronizando productos" },
      { status: 500 }
    );
  }
}

// GET - Ver estado actual de sincronización
export async function GET(req: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        priceCents: true,
        priceYearlyCents: true,
        stripeProductId: true,
        stripePriceIdMonthly: true,
        stripePriceIdYearly: true,
        isActive: true,
      },
    });

    const status = plans.map(plan => ({
      name: plan.name,
      slug: plan.slug,
      priceMonthly: plan.priceCents > 0 ? `$${plan.priceCents / 100}/mes` : "Gratis",
      priceYearly: plan.priceYearlyCents ? `$${plan.priceYearlyCents / 100}/año` : "N/A",
      stripeProductId: plan.stripeProductId || "❌ No configurado",
      stripePriceIdMonthly: plan.stripePriceIdMonthly || "❌ No configurado",
      stripePriceIdYearly: plan.stripePriceIdYearly || "❌ No configurado",
      needsSync: plan.priceCents > 0 && (!plan.stripeProductId || !plan.stripePriceIdMonthly),
    }));

    const needsSync = status.filter(s => s.needsSync).length;

    return NextResponse.json({
      ok: true,
      stripeConfigured: !!stripe,
      totalPlans: plans.length,
      needsSync,
      message: needsSync > 0
        ? `${needsSync} planes necesitan sincronización. Usa POST para sincronizar.`
        : "Todos los planes están sincronizados con Stripe.",
      plans: status,
    });

  } catch (err: any) {
    console.error("❌ Error obteniendo estado:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
