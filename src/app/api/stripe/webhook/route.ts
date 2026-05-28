/**
 * 💳 API: Stripe Webhook
 * POST /api/stripe/webhook
 *
 * 🔐 Seguridad:
 * - Verifica firma de Stripe (constructEvent)
 * - Idempotency persistente en `StripeWebhookEvent` (tabla DB).
 *   Stripe retransmite hasta 3 días si no recibe 2xx; el Map<>
 *   en memoria se perdía cross cold-start de Vercel y permitía
 *   reprocesar pagos duplicados.
 * - Rate limiting aplicado por middleware.
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/client";
import { handleStripeWebhook } from "@/lib/stripe/subscription-service";
import { prisma } from "@/core/prisma";
import { secureLog } from "@/lib/logging";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.warn("⚠️ Stripe webhook: missing signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 },
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Webhook signature verification failed:", message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 🔐 Idempotency persistente — single source of truth en DB.
    // Si el evento ya tiene fila, Stripe lo está reintentando; respondemos
    // 200 con el resultado original para que pare de reintentar.
    const existing = await prisma.stripeWebhookEvent.findUnique({
      where: { id: event.id },
      select: { type: true, processedAt: true, success: true, error: true },
    });
    if (existing) {
      secureLog.info(
        `[stripe-webhook] dup event=${event.id} type=${event.type} original_success=${existing.success}`,
      );
      return NextResponse.json({
        received: true,
        idempotent: true,
        message: "Event already processed",
        originalSuccess: existing.success,
      });
    }

    secureLog.info(`[stripe-webhook] received event=${event.id} type=${event.type}`);

    // Procesar
    let result: { success: boolean; message?: string };
    try {
      result = await handleStripeWebhook(event);
    } catch (handlerError) {
      const message =
        handlerError instanceof Error ? handlerError.message : "Handler error";
      console.error(
        `❌ Stripe webhook handler exception event=${event.id}:`,
        message,
      );
      result = { success: false, message };
    }

    // Registrar el procesamiento. Usamos create (no upsert) porque ya
    // chequeamos arriba que la fila no existe; si por race otra instancia
    // insertó primero, el unique constraint nos protege con P2002 y
    // tratamos eso como dup.
    try {
      await prisma.stripeWebhookEvent.create({
        data: {
          id: event.id,
          type: event.type,
          success: result.success,
          error: result.success ? null : (result.message ?? "Unknown error"),
          apiVersion: event.api_version ?? null,
        },
      });
    } catch (writeErr: any) {
      if (writeErr?.code === "P2002") {
        // Race condition con otra instancia — ya procesado.
        secureLog.info(
          `[stripe-webhook] race-condition dup event=${event.id}, treating as processed`,
        );
      } else {
        // Si no podemos persistir el ledger, devolvemos 500 para que
        // Stripe reintente. Sin ledger no podemos garantizar idempotency.
        console.error(
          `❌ Stripe webhook: failed to persist ledger event=${event.id}`,
          writeErr,
        );
        return NextResponse.json(
          { error: "Failed to persist webhook event" },
          { status: 500 },
        );
      }
    }

    if (result.success) {
      secureLog.info(
        `[stripe-webhook] processed event=${event.id} type=${event.type}`,
      );
    } else {
      console.error(
        `❌ Stripe webhook handler error event=${event.id}: ${result.message}`,
      );
      // 200 igual: el evento queda como FAILED en ledger; reintentar no
      // ayuda si el error es determinístico. Re-procesamiento manual
      // posible vía /hub/admin si fuera necesario.
    }

    return NextResponse.json({
      received: true,
      eventId: event.id,
      eventType: event.type,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error processing Stripe webhook:", message);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
