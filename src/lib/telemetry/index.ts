/**
 * Telemetry adapter — lightweight, no third-party SDK required.
 *
 * Why an adapter and not @sentry/nextjs directly:
 *   - @sentry/nextjs ships ~3MB of runtime + a webpack plugin that we'd
 *     need to wire into next.config.ts. Until the team commits to a
 *     paid plan, an adapter keeps the call sites stable and the
 *     dependency footprint zero.
 *   - When TELEMETRY_PROVIDER=sentry + SENTRY_DSN are set, we'll swap
 *     the implementation in `forwardToBackend` to call into Sentry's
 *     `captureException` / `captureMessage`. The rest of the codebase
 *     doesn't change.
 *
 * Always-on behavior (regardless of backend):
 *   - Mirrors every event into secureLog so it shows up in Vercel logs.
 *   - Tags every event with the env, deploy URL when available, and a
 *     simple stack-trace hash so duplicate alerts are easier to group
 *     even without a SaaS UI.
 *
 * Usage:
 *   import { telemetry } from "@/lib/telemetry";
 *   telemetry.captureException(err, { route: "/api/foo", userId });
 *   telemetry.captureMessage("payment.refund_failed", { orderId });
 */

import { secureLog } from "@/lib/logging";

type TelemetryContext = Record<string, unknown>;

type TelemetryProvider = "log_only" | "sentry" | "axiom";

function getProvider(): TelemetryProvider {
  const env = (process.env.TELEMETRY_PROVIDER || "").toLowerCase();
  if (env === "sentry" && process.env.SENTRY_DSN) return "sentry";
  if (env === "axiom" && process.env.AXIOM_TOKEN) return "axiom";
  return "log_only";
}

function envContext(): TelemetryContext {
  return {
    env: process.env.NODE_ENV,
    deploy:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
      process.env.npm_package_version ||
      "local",
    region: process.env.VERCEL_REGION || undefined,
  };
}

function hashSignature(err: unknown): string {
  if (!(err instanceof Error)) return "";
  // Cheap stack signature: first non-internal frame's filename + line.
  // Good enough to group identical exceptions without a real grouping
  // algorithm.
  const firstFrame = (err.stack || "")
    .split("\n")
    .find((l) => l.includes("src/") || l.includes("/app/"));
  return firstFrame?.trim() || err.name || "unknown";
}

/**
 * Send to whatever backend is configured. Right now log_only just
 * returns — the secureLog mirror in the caller has already handled it.
 * Replace these branches with the real Sentry / Axiom client calls
 * when the team is ready.
 */
async function forwardToBackend(
  kind: "exception" | "message",
  payload: TelemetryContext,
): Promise<void> {
  const provider = getProvider();
  if (provider === "log_only") return;

  // Placeholder branches — intentionally lazy so we don't pay the
  // require cost until the env var flips. When you wire Sentry:
  //
  //   if (provider === "sentry") {
  //     const Sentry = await import("@sentry/nextjs");
  //     if (kind === "exception") Sentry.captureException(payload.error, { extra: payload });
  //     else Sentry.captureMessage(String(payload.message), { extra: payload });
  //     return;
  //   }
  //
  // Same shape for Axiom:
  //
  //   if (provider === "axiom") {
  //     const { Axiom } = await import("@axiomhq/js");
  //     const client = new Axiom({ token: process.env.AXIOM_TOKEN! });
  //     await client.ingest("rowi_errors", [payload]);
  //   }
  void kind;
  void payload;
}

export const telemetry = {
  /**
   * Capture a thrown error with optional context (route, userId, etc.).
   * Safe to call from anywhere; never throws.
   */
  captureException(err: unknown, context: TelemetryContext = {}) {
    const payload = {
      ...envContext(),
      ...context,
      error: err,
      signature: hashSignature(err),
    };
    // Always mirror to secureLog so we have a trail without the backend.
    secureLog.error("telemetry.exception", err, payload);
    // Fire-and-forget — telemetry must never block the request path.
    forwardToBackend("exception", payload).catch((forwardErr) => {
      // Don't recurse — log once and move on.
      secureLog.warn("telemetry.forward_failed", {
        provider: getProvider(),
        forwardErr: String(forwardErr),
      });
    });
  },

  /**
   * Capture a notable non-exception event (e.g. "payment refunded",
   * "cycle detected in manager assignment"). Use sparingly — log,
   * not metrics.
   */
  captureMessage(message: string, context: TelemetryContext = {}) {
    const payload = {
      ...envContext(),
      ...context,
      message,
    };
    secureLog.info("telemetry.message", payload);
    forwardToBackend("message", payload).catch(() => {});
  },

  /**
   * Lightweight "is anything configured?" check so call sites can
   * branch on whether to add expensive context that's only useful
   * when shipping to a backend (e.g. attach a heavy request payload).
   */
  isEnabled(): boolean {
    return getProvider() !== "log_only";
  },
};
