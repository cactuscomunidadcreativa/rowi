/**
 * 💳 API: Stripe Webhook
 * POST /api/stripe/webhook - Recibir eventos de Stripe
 *
 * 🔐 SEGURIDAD:
 * - Verifica firma de Stripe
 * - Implementa idempotency para evitar procesamiento duplicado
 * - Rate limiting aplicado por middleware
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/client";
import { handleStripeWebhook } from "@/lib/stripe/subscription-service";
import type Stripe from "stripe";

// =========================================================
// Idempotency Store
// ---------------------------------------------------------
// En producción, esto debería usar Redis o una tabla en BD
// para persistir entre reinicios y múltiples instancias.
// =========================================================

interface ProcessedEvent {
  eventId: string;
  eventType: string;
  processedAt: number;
  success: boolean;
}

const processedEvents = new Map<string, ProcessedEvent>();
const MAX_EVENTS = 1000; // Máximo de eventos en memoria
const EVENT_TTL = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Limpia eventos expirados del store
 */
function cleanupProcessedEvents(): void {
  const now = Date.now();
  const entries = Array.from(processedEvents.entries());

  for (const [eventId, event] of entries) {
    if (now - event.processedAt > EVENT_TTL) {
      processedEvents.delete(eventId);
    }
  }

  // Si aún hay demasiados, eliminar los más antiguos
  if (processedEvents.size > MAX_EVENTS) {
    const sorted = entries.sort((a, b) => a[1].processedAt - b[1].processedAt);
    const toRemove = sorted.slice(0, processedEvents.size - MAX_EVENTS + 100);
    for (const [eventId] of toRemove) {
      processedEvents.delete(eventId);
    }
  }
}

/**
 * Verifica si un evento ya fue procesado
 */
function isEventProcessed(eventId: string): ProcessedEvent | null {
  const event = processedEvents.get(eventId);
  if (!event) return null;

  // Verificar si expiró
  if (Date.now() - event.processedAt > EVENT_TTL) {
    processedEvents.delete(eventId);
    return null;
  }

  return event;
}

/**
 * Marca un evento como procesado
 */
function markEventProcessed(
  eventId: string,
  eventType: string,
  success: boolean
): void {
  processedEvents.set(eventId, {
    eventId,
    eventType,
    processedAt: Date.now(),
    success,
  });

  // Limpiar periódicamente (cada 100 eventos)
  if (processedEvents.size % 100 === 0) {
    cleanupProcessedEvents();
  }
}

// =========================================================
// Webhook Handler
// =========================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.warn("⚠️ Stripe webhook: Missing signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verificar firma
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
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
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Webhook signature verification failed:", message);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // 🔐 Idempotency check - evitar procesar eventos duplicados
    const existingEvent = isEventProcessed(event.id);
    if (existingEvent) {
      console.log(
        `⏭️ Stripe webhook: Event ${event.id} already processed at ${new Date(existingEvent.processedAt).toISOString()}`
      );
      return NextResponse.json({
        received: true,
        idempotent: true,
        message: "Event already processed",
        originalSuccess: existingEvent.success,
      });
    }

    console.log(`📨 Stripe webhook received: ${event.type} (${event.id})`);

    // Procesar el evento
    let result: { success: boolean; message?: string };
    try {
      result = await handleStripeWebhook(event);
    } catch (handlerError) {
      const message = handlerError instanceof Error ? handlerError.message : "Handler error";
      console.error(`❌ Webhook handler exception for ${event.id}:`, message);
      result = { success: false, message };
    }

    // Marcar como procesado
    markEventProcessed(event.id, event.type, result.success);

    if (!result.success) {
      console.error(`❌ Webhook handler error for ${event.id}: ${result.message}`);
      // Retornar 200 para evitar reintentos de Stripe (el evento ya se registró)
    } else {
      console.log(`✅ Webhook processed successfully: ${event.type} (${event.id})`);
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

    // Retornar 500 para que Stripe reintente
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Note: Body parsing is automatically disabled in App Router when using req.text()
