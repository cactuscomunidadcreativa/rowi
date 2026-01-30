/**
 * 📊 API: Initialize Benchmark Upload
 * POST /api/admin/benchmarks/init-upload
 *
 * Crea el benchmark y job antes de empezar a subir chunks.
 * Retorna benchmarkId y jobId para usar en los chunks.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface InitUploadBody {
  name: string;
  type?: string;
  scope?: string;
  tenantId?: string;
  hubId?: string;
  isLearning?: boolean;
  totalRows?: number;
  totalChunks?: number;
  filename?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: InitUploadBody = await req.json();
    const {
      name,
      type = "ROWIVERSE",
      scope = "GLOBAL",
      tenantId,
      hubId,
      isLearning = true,
      totalRows = 0,
      totalChunks = 1,
      filename = "benchmark.csv",
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Crear benchmark en estado PROCESSING
    const benchmark = await prisma.benchmark.create({
      data: {
        name,
        type: type as any,
        scope: scope as any,
        status: "PROCESSING",
        sourceFile: filename,
        tenantId: tenantId || null,
        hubId: hubId || null,
        isLearning,
        uploadedBy: session.user.email,
        totalRows,
      },
    });

    // Crear job de procesamiento
    const job = await prisma.benchmarkUploadJob.create({
      data: {
        benchmarkId: benchmark.id,
        status: "processing",
        progress: 0,
        currentPhase: "initializing",
        totalRows,
        processedRows: 0,
      },
    });

    console.log(`📊 Initialized benchmark upload: ${benchmark.id}, expecting ${totalChunks} chunks`);

    return NextResponse.json({
      ok: true,
      benchmarkId: benchmark.id,
      jobId: job.id,
      message: "Upload initialized, ready for chunks",
    });
  } catch (error) {
    console.error("❌ Error initializing upload:", error);
    return NextResponse.json(
      {
        error: "Error initializing upload",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
