// instrumentation.ts
// =====================================================================
// Next.js calls register() once per worker boot. We use it to initialize
// Sentry on the server + edge runtimes. No-op when SENTRY_DSN is missing.
//
// Reference: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
// =====================================================================

export async function register() {
  const dsn = process.env.SENTRY_DSN || "";
  if (!dsn) return;

  // Use dynamic imports so the package isn't bundled into the edge
  // runtime when not needed. Sentry's Next.js SDK auto-detects runtime
  // via process.env.NEXT_RUNTIME.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  }
}

/**
 * Captura errores de render del servidor (App Router) en Sentry: Server
 * Components, route handlers y middleware. No-op si Sentry no está configurado.
 */
export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs")["captureRequestError"]>
) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
