/**
 * 📊 API: Start Benchmark Processing
 * POST /api/admin/benchmarks/start-processing
 *
 * After the client uploads to Vercel Blob, this endpoint creates the
 * benchmark + job and kicks off processing DIRECTLY via waitUntil.
 *
 * NO HTTP fetch to process-blob — we call the shared function directly.
 * This eliminates auth, CSRF, URL, cold-start, and timeout issues.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { waitUntil } from "@vercel/functions";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { processBenchmark } from "@/lib/benchmarks/process-benchmark";

export const maxDuration = 300; // 5 minutes — processing runs in waitUntil

interface StartProcessingBody {
  blobUrl: string;
  name: string;
  type: "ROWIVERSE" | "EXTERNAL" | "INTERNAL";
  scope: "GLOBAL" | "REGION" | "COUNTRY" | "SECTOR" | "TENANT" | "HUB" | "TEAM" | "COMMUNITY" | "COHORT";
  isLearning: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const userEmail = req.headers.get("x-user-email") || "admin@rowiia.com";

    const body: StartProcessingBody = await req.json();
    const { blobUrl, name, type, scope, isLearning } = body;

    if (!blobUrl || !name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: blobUrl, name, type" },
        { status: 400 }
      );
    }

    // Create benchmark
    const benchmark = await prisma.benchmark.create({
      data: {
        name: name.trim(),
        type,
        scope: scope || null,
        isLearning: isLearning || false,
        status: "PROCESSING",
        totalRows: 0,
        uploadedBy: userEmail,
      },
    });

    // Create upload job
    const job = await prisma.benchmarkUploadJob.create({
      data: {
        benchmarkId: benchmark.id,
        status: "pending",
        progress: 0,
        totalRows: 0,
        processedRows: 0,
        currentRow: 0,
        currentPhase: "queued",
        blobUrl,
      },
    });

    console.log(`📊 Job ${job.id} created for benchmark ${benchmark.id}`);

    // 🚀 Process directly via waitUntil — no HTTP, no auth issues
    waitUntil(
      processBenchmark({
        benchmarkId: benchmark.id,
        jobId: job.id,
        blobUrl,
      }).catch((err) => {
        // Error handling is done inside processBenchmark (updates DB status)
        // This catch prevents unhandled rejection warnings
        console.error(`❌ processBenchmark failed:`, err?.message || err);
      })
    );

    console.log(`🚀 Processing kicked off for benchmark ${benchmark.id}`);

    return NextResponse.json({
      ok: true,
      benchmarkId: benchmark.id,
      jobId: job.id,
      message: "Processing started",
    });
  } catch (error) {
    console.error("❌ Error starting processing:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error starting processing" },
      { status: 500 }
    );
  }
}
