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

/**
 * Cached resolved values from SystemConfig (DB) + env. The cache lives
 * for the lifetime of the serverless function instance; admin changes
 * propagate on next cold start (or you can hit /api/admin/settings to
 * refresh nodes serving that route). This avoids a DB hit per
 * captureException — which would be a perf disaster.
 */
let configCache: {
  provider: TelemetryProvider;
  sentryDsn?: string;
  axiomToken?: string;
  axiomDataset: string;
  loadedAt: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async function loadConfig(): Promise<typeof configCache> {
  if (configCache && Date.now() - configCache.loadedAt < CACHE_TTL_MS) {
    return configCache;
  }
  // Dynamic import to avoid pulling prisma into bundles that never call
  // telemetry (and to avoid a circular import — telemetry is called
  // from prisma's own middleware).
  let providerRaw = "";
  let sentryDsn = "";
  let axiomToken = "";
  let axiomDataset = "";
  try {
    const { getSystemConfigs } = await import("@/lib/config/systemConfig");
    const cfg = await getSystemConfigs([
      "TELEMETRY_PROVIDER",
      "SENTRY_DSN",
      "AXIOM_TOKEN",
      "AXIOM_DATASET",
    ]);
    providerRaw = (cfg.TELEMETRY_PROVIDER || "").toLowerCase();
    sentryDsn = cfg.SENTRY_DSN || "";
    axiomToken = cfg.AXIOM_TOKEN || "";
    axiomDataset = cfg.AXIOM_DATASET || "rowi_errors";
  } catch {
    // DB unreachable (e.g. during build, in tests) — fall back to env.
    providerRaw = (process.env.TELEMETRY_PROVIDER || "").toLowerCase();
    sentryDsn = process.env.SENTRY_DSN || "";
    axiomToken = process.env.AXIOM_TOKEN || "";
    axiomDataset = process.env.AXIOM_DATASET || "rowi_errors";
  }

  let provider: TelemetryProvider = "log_only";
  if (providerRaw === "sentry" && sentryDsn) provider = "sentry";
  else if (providerRaw === "axiom" && axiomToken) provider = "axiom";

  configCache = {
    provider,
    sentryDsn,
    axiomToken,
    axiomDataset,
    loadedAt: Date.now(),
  };
  return configCache;
}

/**
 * Synchronous best-effort provider hint. Used by isEnabled() callers
 * that don't want to await. Falls back to env only.
 */
function getProviderSync(): TelemetryProvider {
  const env = (process.env.TELEMETRY_PROVIDER || "").toLowerCase();
  if (env === "sentry" && process.env.SENTRY_DSN) return "sentry";
  if (env === "axiom" && process.env.AXIOM_TOKEN) return "axiom";
  return configCache?.provider || "log_only";
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
 * Send to whatever backend is configured. Lazy imports so the SDK
 * isn't pulled into bundles unless the provider actually flips.
 *
 * Provider + credentials come from `loadConfig()` — which reads
 * SystemConfig (DB) first and falls back to env. This means an admin
 * can flip the DSN in /hub/admin/settings without redeploying.
 */
async function forwardToBackend(
  kind: "exception" | "message",
  payload: TelemetryContext,
): Promise<void> {
  const cfg = await loadConfig();
  if (!cfg || cfg.provider === "log_only") return;

  if (cfg.provider === "sentry" && cfg.sentryDsn) {
    const Sentry = await import("@sentry/nextjs");
    if (kind === "exception") {
      Sentry.captureException(payload.error, { extra: payload });
    } else {
      Sentry.captureMessage(String(payload.message), { extra: payload });
    }
    return;
  }

  if (cfg.provider === "axiom" && cfg.axiomToken) {
    const { Axiom } = await import("@axiomhq/js");
    const client = new Axiom({ token: cfg.axiomToken });
    client.ingest(cfg.axiomDataset, [
      {
        ...payload,
        _kind: kind,
        // Stringify the Error so JSON serialization doesn't drop it.
        ...(payload.error instanceof Error
          ? {
              error: {
                name: payload.error.name,
                message: payload.error.message,
                stack: payload.error.stack,
              },
            }
          : {}),
      },
    ]);
    // Fire and forget — ingest returns a promise but we don't await
    // because telemetry must not block the request.
    return;
  }
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
        provider: getProviderSync(),
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
   * Sync — uses last cache + env. Best-effort.
   */
  isEnabled(): boolean {
    return getProviderSync() !== "log_only";
  },

  /**
   * Force a refresh of the resolved provider config. Useful right
   * after an admin saves a new DSN via /hub/admin/settings — call
   * this from the settings POST route so the change takes effect
   * immediately on that node without waiting for the 5min TTL.
   */
  refreshConfig() {
    configCache = null;
  },
};
