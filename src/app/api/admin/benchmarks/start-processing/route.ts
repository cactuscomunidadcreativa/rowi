/**
 * 📊 API: Start Benchmark Processing
 * POST /api/admin/benchmarks/start-processing
 *
 * Después de que el cliente sube el archivo a Vercel Blob,
 * este endpoint crea el benchmark y job, luego inicia el procesamiento.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface StartProcessingBody {
  blobUrl: string;
  name: string;
  type: "GLOBAL" | "TENANT" | "HUB" | "SUPERHUB";
  scope: string;
  isLearning: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: StartProcessingBody = await req.json();
    const { blobUrl, name, type, scope, isLearning } = body;

    if (!blobUrl || !name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: blobUrl, name, type" },
        { status: 400 }
      );
    }

    // Crear el benchmark
    const benchmark = await prisma.benchmark.create({
      data: {
        name: name.trim(),
        type,
        scope: scope || null,
        isLearning: isLearning || false,
        status: "PROCESSING",
        totalRows: 0,
      },
    });

    // Crear el job de upload
    const job = await prisma.benchmarkUploadJob.create({
      data: {
        benchmarkId: benchmark.id,
        status: "pending",
        progress: 0,
        totalRows: 0,
        processedRows: 0,
        currentPhase: "starting",
      },
    });

    // Iniciar procesamiento en background (no await)
    const processUrl = new URL("/api/admin/benchmarks/process-blob", req.url);

    fetch(processUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        benchmarkId: benchmark.id,
        jobId: job.id,
        blobUrl,
      }),
    }).catch((err) => {
      console.error("Error starting background processing:", err);
    });

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
