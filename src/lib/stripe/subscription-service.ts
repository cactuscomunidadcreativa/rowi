/**
 * 💳 Stripe Subscription Service
 * Maneja suscripciones, checkouts y pagos
 */

import { stripe, isStripeConfigured } from "./client";
import { prisma } from "@/core/prisma";
import type Stripe from "stripe";

// Helper to ensure Stripe is configured
function requireStripe() {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
  }
  return stripe;
}

// =========================================================
// Tipos
// =========================================================

interface CreateCheckoutParams {
  userId: string;
  userEmail: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
  couponCode?: string;
  locale?: string;
}

interface CreateCustomerParams {
  userId: string;
  email: string;
  name?: string;
}

// =========================================================
// Crear o obtener cliente de Stripe
// =========================================================

export async function getOrCreateStripeCustomer(
  params: CreateCustomerParams
): Promise<string> {
  const { userId, email, name } = params;

  // Verificar si ya tiene un customer ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Crear nuevo customer en Stripe
  const stripeClient = requireStripe();
  const customer = await stripeClient.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  // Guardar en la base de datos
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// =========================================================
// Crear sesión de checkout
// =========================================================

export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<{ sessionId: string; url: string }> {
  const {
    userId,
    userEmail,
    planId,
    successUrl,
    cancelUrl,
    couponCode,
    locale = "es",
  } = params;

  // Obtener el plan
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  if (!plan.stripePriceId) {
    throw new Error("Plan not configured for Stripe payments");
  }

  // Obtener o crear el customer
  const customerId = await getOrCreateStripeCustomer({
    userId,
    email: userEmail,
  });

  // Configuración del checkout
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: locale === "es" ? "es" : locale === "pt" ? "pt-BR" : "en",
    metadata: {
      userId,
      planId,
    },
    subscription_data: {
      metadata: {
        userId,
        planId,
      },
      // Trial si el plan lo tiene
      ...(plan.trialDays > 0 && {
        trial_period_days: plan.trialDays,
      }),
    },
    // Permitir códigos promocionales
    allow_promotion_codes: true,
  };

  // Aplicar cupón si se proporcionó
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });

    if (coupon?.stripeCouponId) {
      sessionParams.discounts = [{ coupon: coupon.stripeCouponId }];
    }
  }

  const stripeClient = requireStripe();
  const session = await stripeClient.checkout.sessions.create(sessionParams);

  return {
    sessionId: session.id,
    url: session.url || "",
  };
}

// =========================================================
// Crear portal de cliente (para gestionar suscripción)
// =========================================================

export async function createCustomerPortalSession(
  userId: string,
  returnUrl: string
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new Error("User does not have a Stripe customer");
  }

  const stripeClient = requireStripe();
  const session = await stripeClient.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

// =========================================================
// Procesar webhook de Stripe
// =========================================================

export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<{ success: boolean; message: string }> {
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`⚠️ Unhandled Stripe event: ${event.type}`);
    }

    return { success: true, message: `Processed ${event.type}` };
  } catch (error) {
    console.error("❌ Error processing Stripe webhook:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =========================================================
// Handlers de eventos
// =========================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || !planId) {
    console.error("❌ Missing userId or planId in checkout session metadata");
    return;
  }

  // Actualizar usuario
  const plan = await prisma.plan.findUnique({ where: { id: planId } });

  await prisma.user.update({
    where: { id: userId },
    data: {
      planId,
      stripeSubscriptionId: session.subscription as string,
      onboardingStatus: "ONBOARDING",
      planExpiresAt: plan?.durationDays
        ? new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });

  // Registrar pago
  if (session.amount_total) {
    await prisma.payment.create({
      data: {
        userId,
        stripePaymentIntentId: session.payment_intent as string,
        amountCents: session.amount_total,
        currency: session.currency || "usd",
        status: "SUCCEEDED",
        paidAt: new Date(),
      },
    });
  }

  // Actualizar adquisición
  await prisma.userAcquisition.upsert({
    where: { userId },
    update: { convertedAt: new Date() },
    create: {
      userId,
      source: "ORGANIC",
      convertedAt: new Date(),
    },
  });

  console.log(`✅ Checkout completed for user ${userId}, plan ${planId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELLED",
    unpaid: "UNPAID",
    trialing: "TRIALING",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    paused: "PAUSED",
  };

  // Actualizar o crear suscripción
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      status: (statusMap[subscription.status] || "ACTIVE") as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
    create: {
      userId,
      planId: subscription.metadata?.planId || "",
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id || "",
      stripeCustomerId: subscription.customer as string,
      status: (statusMap[subscription.status] || "ACTIVE") as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
  });

  // Actualizar estado del usuario según suscripción
  let onboardingStatus: string | undefined;
  if (subscription.status === "active") {
    onboardingStatus = "ACTIVE";
  } else if (subscription.status === "trialing") {
    onboardingStatus = "ONBOARDING";
  } else if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid"
  ) {
    onboardingStatus = "CANCELLED";
  }

  if (onboardingStatus) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: onboardingStatus as any,
        planExpiresAt: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  console.log(`✅ Subscription ${subscription.id} updated: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingStatus: "CANCELLED",
      stripeSubscriptionId: null,
    },
  });

  console.log(`✅ Subscription ${subscription.id} deleted for user ${userId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Buscar usuario por customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Registrar pago
  await prisma.payment.create({
    data: {
      userId: user.id,
      stripeInvoiceId: invoice.id,
      amountCents: invoice.amount_paid,
      currency: invoice.currency,
      status: "SUCCEEDED",
      receiptUrl: invoice.hosted_invoice_url || undefined,
      invoiceUrl: invoice.invoice_pdf || undefined,
      paidAt: new Date(),
    },
  });

  // Actualizar LTV
  await prisma.userAcquisition.upsert({
    where: { userId: user.id },
    update: {
      lifetimeValueCents: { increment: invoice.amount_paid },
    },
    create: {
      userId: user.id,
      source: "ORGANIC",
      lifetimeValueCents: invoice.amount_paid,
    },
  });

  console.log(`✅ Invoice ${invoice.id} paid: $${invoice.amount_paid / 100}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Registrar intento fallido
  await prisma.payment.create({
    data: {
      userId: user.id,
      stripeInvoiceId: invoice.id,
      amountCents: invoice.amount_due,
      currency: invoice.currency,
      status: "FAILED",
    },
  });

  // Actualizar estado del usuario
  await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingStatus: "SUSPENDED",
    },
  });

  console.log(`⚠️ Invoice ${invoice.id} payment failed for user ${user.id}`);
}

// =========================================================
// Utilidades
// =========================================================

export async function cancelSubscription(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });

  if (!user?.stripeSubscriptionId) {
    throw new Error("No active subscription found");
  }

  const stripeClient = requireStripe();
  await stripeClient.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });

  if (!user?.stripeSubscriptionId) {
    throw new Error("No subscription found");
  }

  const stripeClient = requireStripe();
  await stripeClient.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function getSubscriptionStatus(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return subscription;
}
