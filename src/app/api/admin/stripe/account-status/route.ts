/**
 * 💳 GET /api/admin/stripe/account-status
 * ============================================================
 * Diagnóstico de salud de la cuenta Stripe. SuperAdmin-only.
 *
 * Consulta la API de Stripe (accounts.retrieve) para responder:
 * - ¿Puede cobrar en vivo? (charges_enabled)
 * - ¿Puede recibir payouts? (payouts_enabled)
 * - ¿Completó el onboarding? (details_submitted)
 * - ¿Qué requisitos están pendientes / vencidos?
 * - Estado de cada capability de pago.
 *
 * Pensado para verificar de un vistazo si la cuenta está lista
 * para producción sin tener que navegar el dashboard de Stripe.
 * ============================================================
 */

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { getStripeClient } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const stripe = await getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      {
        ok: false,
        error: "stripe_not_configured",
        message:
          "No hay STRIPE_SECRET_KEY configurada (ni en SystemConfig ni en env).",
      },
      { status: 500 },
    );
  }

  try {
    const acct = await stripe.accounts.retrieve();
    const req = acct.requirements;

    // Resumen legible de capabilities (solo las que no están "active").
    const capabilities = acct.capabilities || {};
    const capabilityIssues = Object.entries(capabilities)
      .filter(([, status]) => status !== "active")
      .map(([name, status]) => ({ name, status }));

    const chargesEnabled = acct.charges_enabled === true;
    const payoutsEnabled = acct.payouts_enabled === true;
    const detailsSubmitted = acct.details_submitted === true;

    // Veredicto simple para el launch.
    const readyForLivePayments = chargesEnabled && detailsSubmitted;

    return NextResponse.json({
      ok: true,
      verdict: readyForLivePayments
        ? "✅ La cuenta puede cobrar en vivo."
        : "⚠️ La cuenta NO puede cobrar en vivo todavía — hay requisitos pendientes.",
      account: {
        id: acct.id,
        country: acct.country,
        defaultCurrency: acct.default_currency,
        chargesEnabled,
        payoutsEnabled,
        detailsSubmitted,
      },
      requirements: {
        // Campos que Stripe necesita YA (bloquean si past_due).
        currentlyDue: req?.currently_due ?? [],
        pastDue: req?.past_due ?? [],
        eventuallyDue: req?.eventually_due ?? [],
        // Si la cuenta está deshabilitada, esto dice por qué.
        disabledReason: req?.disabled_reason ?? null,
        currentDeadline: req?.current_deadline
          ? new Date(req.current_deadline * 1000).toISOString()
          : null,
      },
      capabilityIssues,
      readyForLivePayments,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "stripe_api_error",
        message: err?.message || "Error consultando la cuenta de Stripe.",
        // Si el key es de test pero el modo es live (o viceversa), Stripe
        // tira un error de auth — lo exponemos para diagnóstico.
        type: err?.type ?? null,
      },
      { status: 502 },
    );
  }
}
