/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Public endpoint for monitoring/uptime checks (UptimeRobot,
 * BetterStack, Axiom alerts). Returns 200 when the app can serve
 * traffic, 503 when the DB (only hard dependency) is unreachable.
 *
 * The PUBLIC response is deliberately minimal ({ status, timestamp }):
 * commit SHA, region, DB latency and which providers are configured
 * are reconnaissance data (auditoría jun-2026, COMP-4). The detailed
 * payload requires `Authorization: Bearer ${CRON_SECRET}` — the same
 * secret the crons already use, so monitors Eduardo controls can still
 * see everything.
 *
 * Detailed sample response (with auth):
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { telemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

const BOOT_TIME = Date.now();

const NO_STORE = { "cache-control": "no-store, max-age=0" };

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

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

export async function GET(req: NextRequest) {
  const start = Date.now();
  const detailed = isAuthorized(req);

  try {
    // Database is the only hard dependency. If it's down, everything
    // else is moot — we return 503 here.
    await prisma.$queryRaw`SELECT 1`;

    if (!detailed) {
      return NextResponse.json(
        { status: "healthy", timestamp: new Date().toISOString() },
        { headers: NO_STORE },
      );
    }

    const dbLatency = Date.now() - start;
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
      { headers: NO_STORE },
    );
  } catch (error) {
    // 503 sin detalles internos para anónimos; con auth, el error real.
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        ...(detailed
          ? {
              version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
              uptimeSec: Math.floor((Date.now() - BOOT_TIME) / 1000),
              error: error instanceof Error ? error.message : "Unknown error",
              checks: {
                database: {
                  status: "down",
                  latency: `${Date.now() - start}ms`,
                },
              },
            }
          : {}),
      },
      { status: 503, headers: NO_STORE },
    );
  }
}
