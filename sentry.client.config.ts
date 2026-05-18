// sentry.client.config.ts
// =====================================================================
// Browser-side Sentry initialization. No-op when SENTRY_DSN is missing,
// so this file is safe to land in main without an active account.
//
// To activate: set NEXT_PUBLIC_SENTRY_DSN in Vercel env + redeploy.
// (NEXT_PUBLIC_ prefix is required for the value to reach the browser.)
// =====================================================================

import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  process.env.SENTRY_DSN ||
  "";

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Sample 10% of normal traces in prod, all in dev.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Replay sessions get sampled only when an error occurs.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    // Strip known noise.
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed",
      "Network request failed",
    ],
  });
}
