/**
 * 💳 API: Stripe Webhook
 * POST /api/stripe/webhook - Recibir eventos de Stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/client";
import { handleStripeWebhook } from "@/lib/stripe/subscription-service";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`📨 Stripe webhook received: ${event.type}`);

    const result = await handleStripeWebhook(event);

    if (!result.success) {
      console.error(`❌ Webhook handler error: ${result.message}`);
      // Still return 200 to avoid Stripe retries
    }

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("❌ Error processing Stripe webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Note: Body parsing is automatically disabled in App Router when using req.text()
