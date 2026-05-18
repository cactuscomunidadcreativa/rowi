/**
 * 💳 Stripe Client Configuration
 */

import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn("⚠️ STRIPE_SECRET_KEY not configured - payments will not work");
}

// Only initialize Stripe if we have a valid key
export const stripe: Stripe | null = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      // Stripe types are pinned to one apiVersion per SDK major; cast
      // so we can keep using the version Eduardo's account expects.
      apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
      typescript: true,
    })
  : null;

// Public key for client-side
export const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

// Webhook secret
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Helper to check if Stripe is configured
export const isStripeConfigured = (): boolean => !!stripe;
