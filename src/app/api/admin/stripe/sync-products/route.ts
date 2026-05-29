/**
 * 🔄 API: Sincronizar productos de Stripe
 * POST /api/admin/stripe/sync-products
 *
 * Crea los productos y precios en Stripe basándose en los planes de la BD
 * y actualiza los planes con los IDs de Stripe
 *
 * ⚠️ PROTEGIDO: Solo accesible para administradores del sistema
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { getStripeClient } from "@/lib/stripe/client";
import { logStripeSync } from "@/lib/audit/auditLog";

export const dynamic = "force-dynamic";

// Stripe se resuelve dentro de cada handler vía getStripeClient(), que lee la
// secret key desde SystemConfig (UI admin) PRIMERO y env como fallback. Antes
// este endpoint leía solo process.env.STRIPE_SECRET_KEY, por eso reportaba
// stripeConfigured:false aunque la clave estuviera puesta en el UI admin.

/**
 * Verifica si el usuario es administrador del sistema
 */
async function isSystemAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const hubAdmins = process.env.HUB_ADMINS || "";
  const adminEmails = hubAdmins.split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function POST(req: NextRequest) {
  try {
    // 🔐 Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
    if (!(await isSystemAdmin(session.user.email))) {
      return NextResponse.json({ ok: false, error: "Acceso denegado" }, { status: 403 });
    }

    const stripe = await getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { ok: false, error: "Stripe no está configurado (ni en Ajustes → Integraciones ni en env)." },
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

        // 3. Crear el precio de "periodo largo" si no existe.
        //    - Por defecto es ANUAL (interval year), con descuento ~17% si no
        //      se definió priceYearlyCents explícito.
        //    - EXCEPCIÓN plan "sei": su pago largo es SEMESTRAL (cada 6 meses,
        //      $49) e incluye el re-test SEI. Se modela como interval=month,
        //      interval_count=6. Vive en el mismo campo stripePriceIdYearly,
        //      que el checkout usa cuando billingPeriod="yearly".
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
            `✅ Precio largo creado (${isSeiSemestral ? "6 meses" : "año"}): $${longPriceCents / 100} -> ${priceLong.id}`,
          );
        }
        const yearlyPriceCents = longPriceCents;

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

    // 📝 Log de auditoría
    const syncedCount = results.filter(r => r.status === "synced").length;
    const errorCount = results.filter(r => r.status === "error").length;
    await logStripeSync(
      session.user.id || null,
      "products",
      { created: syncedCount, updated: 0, errors: errorCount },
      req
    );

    return NextResponse.json({
      ok: true,
      message: `Sincronización completada. ${syncedCount} planes sincronizados.`,
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
    // 🔐 Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
    if (!(await isSystemAdmin(session.user.email))) {
      return NextResponse.json({ ok: false, error: "Acceso denegado" }, { status: 403 });
    }

    const stripe = await getStripeClient();

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
