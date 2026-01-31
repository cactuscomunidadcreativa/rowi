/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Public endpoint for monitoring and uptime checks.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export async function GET() {
  const start = Date.now();

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
      checks: {
        database: {
          status: "ok",
          latency: `${dbLatency}ms`,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
