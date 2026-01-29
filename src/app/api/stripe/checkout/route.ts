/**
 * 💳 API: Stripe Checkout
 * POST /api/stripe/checkout - Crear sesión de checkout
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createCheckoutSession } from "@/lib/stripe/subscription-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, couponCode, locale } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkout = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      planId,
      successUrl: `${baseUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing?cancelled=true`,
      couponCode,
      locale: locale || "es",
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
