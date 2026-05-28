/**
 * 💳 API: Stripe Checkout
 * POST /api/stripe/checkout - Crear sesión de checkout
 *
 * ⚠️ Rate Limited: 5 intentos por minuto por IP
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createCheckoutSession } from "@/lib/stripe/subscription-service";
import { rateLimiters, getClientIdentifier } from "@/lib/security/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // 🛡️ Rate limiting: 5 intentos por minuto
    const clientIp = getClientIdentifier(req);
    const { success, remaining, resetAt } = await rateLimiters.checkout(clientIp);

    if (!success) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(resetAt),
          },
        }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    // quantity + tenantId son opcionales (B2B por asientos). Si no vienen,
    // el checkout se comporta igual que antes (retro-compat B2C).
    const { planId, couponCode, locale, quantity, tenantId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Normaliza quantity → entero ≥ 1 si vino. undefined si no.
    const seatQuantity =
      quantity != null && Number.isFinite(Number(quantity))
        ? Math.max(1, Math.floor(Number(quantity)))
        : undefined;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkout = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      planId,
      successUrl: `${baseUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing?cancelled=true`,
      couponCode,
      locale: locale || "es",
      quantity: seatQuantity,
      tenantId: typeof tenantId === "string" && tenantId ? tenantId : undefined,
    });

    return NextResponse.json({
      ok: true,
      sessionId: checkout.sessionId,
      url: checkout.url,
    });
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error creating checkout",
      },
      { status: 500 }
    );
  }
}
