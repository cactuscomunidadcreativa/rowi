/**
 * 💳 API: Stripe Checkout Verify
 * GET /api/stripe/checkout/verify?session_id=cs_xxx
 *
 * Confirma una sesión de checkout ya completada y devuelve detalles del
 * plan comprado para pintar la página de éxito post-pago.
 *
 * Seguridad: requiere sesión autenticada y que el checkout pertenezca al
 * email del usuario logueado (anti-enumeración de sesiones de otros).
 *
 * ⚠️ Rate Limited: mismo limiter que checkout (5/min por IP).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getStripeClient } from "@/lib/stripe/client";
import { rateLimiters, getClientIdentifier } from "@/lib/security/rateLimit";

export async function GET(req: NextRequest) {
  try {
    // 🛡️ Rate limiting
    const clientIp = getClientIdentifier(req);
    const { success, resetAt } = await rateLimiters.checkout(clientIp);
    if (!success) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "session_id es requerido" },
        { status: 400 }
      );
    }

    const stripe = await getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { ok: false, error: "Stripe is not configured." },
        { status: 500 }
      );
    }

    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    // 🔐 El checkout debe pertenecer al usuario logueado. Comparamos contra
    // customer_details.email (lo que el usuario confirmó en Stripe) y el
    // customer_email del create. Case-insensitive.
    const userEmail = session.user.email.toLowerCase();
    const checkoutEmail =
      checkout.customer_details?.email?.toLowerCase() ||
      checkout.customer_email?.toLowerCase() ||
      null;

    if (!checkoutEmail || checkoutEmail !== userEmail) {
      return NextResponse.json(
        { ok: false, error: "Esta sesión de pago no corresponde a tu cuenta." },
        { status: 403 }
      );
    }

    const planName =
      checkout.line_items?.data?.[0]?.description ?? null;

    return NextResponse.json({
      ok: true,
      planName,
      amountTotal: checkout.amount_total,
      currency: checkout.currency,
      status: checkout.status,
    });
  } catch (error) {
    console.error("❌ Error verifying checkout session:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error verifying checkout",
      },
      { status: 500 }
    );
  }
}
