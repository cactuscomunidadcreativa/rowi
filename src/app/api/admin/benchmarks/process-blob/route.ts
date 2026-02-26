/**
 * 📊 API: Process Benchmark from Vercel Blob
 * POST /api/admin/benchmarks/process-blob
 *
 * HTTP endpoint for MANUAL RETRIES of stuck/failed jobs.
 * Normal flow uses start-processing which calls processBenchmark directly.
 *
 * Auth: service token OR admin session.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { processBenchmark } from "@/lib/benchmarks/process-benchmark";

export const maxDuration = 300; // 5 minutes

/** Derive a service token from NEXTAUTH_SECRET (always available) */
function getExpectedServiceToken(): string {
  return process.env.BENCHMARK_SERVICE_TOKEN
    || `rowi-service-${(process.env.NEXTAUTH_SECRET || "").slice(0, 16)}`;
}

async function isSystemAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const hubAdmins = process.env.HUB_ADMINS || "";
  const adminEmails = hubAdmins.split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

interface ProcessBlobBody {
  benchmarkId: string;
  jobId: string;
  blobUrl: string;
}

export async function POST(req: NextRequest) {
  try {
    // 🔐 Auth: service token or admin session
    const serviceToken = req.headers.get("x-service-token");
    const expectedToken = getExpectedServiceToken();
    const hasValidServiceToken = serviceToken && serviceToken === expectedToken;

    if (!hasValidServiceToken) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      if (!(await isSystemAdmin(session.user.email))) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    const body: ProcessBlobBody = await req.json();
    const { benchmarkId, jobId, blobUrl } = body;

    if (!benchmarkId || !jobId || !blobUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Run processing (same shared logic as start-processing)
    await processBenchmark({ benchmarkId, jobId, blobUrl });

    return NextResponse.json({
      ok: true,
      status: "completed",
      benchmarkId,
      message: "Processing completed",
    });
  } catch (error) {
    console.error("❌ process-blob error:", error);
    return NextResponse.json(
      { error: "Processing failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
