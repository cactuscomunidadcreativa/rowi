/**
 * 📊 API: Job Status
 * GET /api/admin/benchmarks/job/[jobId] - Estado del job de procesamiento
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    const job = await prisma.benchmarkUploadJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job no encontrado" },
        { status: 404 }
      );
    }

    // Si el job está completado, incluir info del benchmark
    let benchmark = null;
    if (job.benchmarkId && (job.status === "completed" || job.status === "failed")) {
      benchmark = await prisma.benchmark.findUnique({
        where: { id: job.benchmarkId },
        select: {
          id: true,
          name: true,
          status: true,
          totalRows: true,
          processedRows: true,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        benchmarkId: job.benchmarkId,
        status: job.status,
        progress: job.progress,
        currentPhase: job.currentPhase,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        failedRows: job.failedRows,
        errorMessage: job.errorMessage,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
      },
      benchmark,
    });
  } catch (error) {
    console.error("❌ Error fetching job:", error);
    return NextResponse.json(
      { error: "Error al obtener estado del job" },
      { status: 500 }
    );
  }
}
