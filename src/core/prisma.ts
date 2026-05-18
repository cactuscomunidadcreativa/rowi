import { PrismaClient } from "@prisma/client";
import { secureLog } from "@/lib/logging";
import { telemetry } from "@/lib/telemetry";

/* =========================================================
   🔥 PrismaClient — Optimizado para Neon + Vercel Serverless
   ---------------------------------------------------------
   - Evita instancias duplicadas
   - Optimizado para connection pooling de Neon (5 conexiones)
   - Funciona en App Router + Route Handlers
   - Slow-query observability via $use middleware
========================================================= */

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Threshold (ms) above which a single query is considered "slow" and
 * gets a structured log entry. Default 500ms — anything slower than a
 * common p95 for our typical queries (most are <100ms via Neon pooled).
 * Override per-deploy with PRISMA_SLOW_QUERY_MS in env.
 */
const SLOW_QUERY_MS = Number(process.env.PRISMA_SLOW_QUERY_MS || "500");

function buildClient() {
  const base = new PrismaClient({
    // Solo logs de errores en producción para reducir overhead
    log: process.env.NODE_ENV === "production"
      ? ["error"]
      : ["query", "info", "warn", "error"],
  });

  // Slow-query observability via $extends. Wraps every Prisma operation
  // so it catches the new bits we added this session (rowi_chat history
  // in /api/rowi, recipient.preferredLang lookups in email notifications,
  // scope-aware admin queries that join across tenants).
  //
  // Prisma 6 deprecated $use middleware — $extends({query}) is the
  // replacement. Slightly more verbose, but type-safe and forward-
  // compatible.
  return base.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const started = Date.now();
        try {
          const result = await query(args);
          const elapsed = Date.now() - started;
          if (elapsed >= SLOW_QUERY_MS) {
            secureLog.warn("prisma.slow_query", {
              model: model || "raw",
              action: operation,
              durationMs: elapsed,
              thresholdMs: SLOW_QUERY_MS,
            });
          }
          return result;
        } catch (err) {
          const elapsed = Date.now() - started;
          secureLog.error("prisma.query_failed", err, {
            model: model || "raw",
            action: operation,
            durationMs: elapsed,
          });
          // Also fan out to the configured telemetry backend (no-op
          // until SENTRY_DSN / AXIOM_TOKEN are set).
          telemetry.captureException(err, {
            kind: "prisma.query_failed",
            model: model || "raw",
            action: operation,
            durationMs: elapsed,
          });
          throw err;
        }
      },
    },
  }) as unknown as PrismaClient;
}

// 🔹 Instancia única con configuración optimizada para serverless
export const prisma = globalThis.prismaGlobal ?? buildClient();

// 🔥 Conexión lazy - no forzar $connect() en serverless
// Prisma se conectará automáticamente en la primera query
if (process.env.NODE_ENV !== "production") {
  // Solo en desarrollo conectamos eagerly
  prisma.$connect().catch((err) => {
    console.error("❌ Prisma failed to connect:", err);
  });
}

// 🔹 Guardar instancia en desarrollo (HMR seguro)
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}