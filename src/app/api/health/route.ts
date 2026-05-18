/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Public endpoint for monitoring/uptime checks (UptimeRobot,
 * BetterStack, Axiom alerts). No auth, but only reveals coarse
 * status — no secrets or internals.
 *
 * Returns 200 when the app can serve traffic, 503 when the DB
 * (only hard dependency) is unreachable.
 *
 * Optional integrations (OpenAI, Resend, telemetry provider) are
 * reported as "configured: true/false" — not pinged on every health
 * check because that would cost money + rate limits.
 *
 * Sample response:
 *   {
 *     status: "healthy",
 *     timestamp: "2026-05-17T08:00:00.000Z",
 *     version: "a1b2c3d",
 *     uptimeSec: 184,
 *     region: "iad1",
 *     checks: {
 *       database:  { status: "ok",  latency: "12ms" },
 *       openai:    { status: "ok",  configured: true },
 *       resend:    { status: "ok",  configured: true },
 *       telemetry: { status: "ok",  provider: "sentry", enabled: true }
 *     }
 *   }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { telemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

const BOOT_TIME = Date.now();

async function checkConfiguredKey(
  envVar: "OPENAI_API_KEY" | "RESEND_API_KEY",
): Promise<{ status: "ok"; configured: boolean }> {
  try {
    const { getSystemConfig } = await import("@/lib/config/systemConfig");
    const value = await getSystemConfig(envVar);
    return { status: "ok", configured: !!value };
  } catch {
    return { status: "ok", configured: !!process.env[envVar] };
  }
}

function checkTelemetry(): {
  status: "ok";
  provider: string;
  enabled: boolean;
} {
  const enabled = telemetry.isEnabled();
  const provider = (process.env.TELEMETRY_PROVIDER || "log_only").toLowerCase();
  return { status: "ok", provider, enabled };
}

export async function GET() {
  const start = Date.now();

  try {
    // Database is the only hard dependency. If it's down, everything
    // else is moot — we return 503 here.
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    // The optional checks can run in parallel since none are required
    // for the response to be "healthy".
    const [openai, resend] = await Promise.all([
      checkConfiguredKey("OPENAI_API_KEY"),
      checkConfiguredKey("RESEND_API_KEY"),
    ]);
    const telemetryStatus = checkTelemetry();

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
        uptimeSec: Math.floor((Date.now() - BOOT_TIME) / 1000),
        region: process.env.VERCEL_REGION || null,
        checks: {
          database: {
            status: "ok",
            latency: `${dbLatency}ms`,
          },
          openai,
          resend,
          telemetry: telemetryStatus,
        },
      },
      {
        headers: {
          "cache-control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
        uptimeSec: Math.floor((Date.now() - BOOT_TIME) / 1000),
        error: error instanceof Error ? error.message : "Unknown error",
        checks: {
          database: {
            status: "down",
            latency: `${Date.now() - start}ms`,
          },
        },
      },
      {
        status: 503,
        headers: {
          "cache-control": "no-store, max-age=0",
        },
      },
    );
  }
}
