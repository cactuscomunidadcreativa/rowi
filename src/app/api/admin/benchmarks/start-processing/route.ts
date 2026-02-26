/**
 * 📊 API: Start Benchmark Processing
 * POST /api/admin/benchmarks/start-processing
 *
 * Después de que el cliente sube el archivo a Vercel Blob,
 * este endpoint crea el benchmark y job, luego inicia el procesamiento.
 * Usa waitUntil para mantener el fetch vivo después de responder al cliente.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { waitUntil } from "@vercel/functions";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/** Derive a service token from NEXTAUTH_SECRET (always available) */
function getServiceToken(): string {
  return process.env.BENCHMARK_SERVICE_TOKEN
    || `rowi-service-${(process.env.NEXTAUTH_SECRET || "").slice(0, 16)}`;
}

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

    // Obtener email del header si está disponible
    const userEmail = req.headers.get("x-user-email") || "admin@rowiia.com";

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
        uploadedBy: userEmail,
      },
    });

    // Crear el job de upload con blobUrl para que el cron lo procese
    const job = await prisma.benchmarkUploadJob.create({
      data: {
        benchmarkId: benchmark.id,
        status: "pending",
        progress: 0,
        totalRows: 0,
        processedRows: 0,
        currentRow: 0,
        currentPhase: "queued",
        blobUrl, // El cron usará esta URL para descargar y procesar
      },
    });

    console.log(`📊 Job ${job.id} created for benchmark ${benchmark.id}`);

    // Iniciar procesamiento usando waitUntil para mantener el fetch vivo
    // después de que esta función responda al cliente
    // Prioridad: VERCEL_URL (siempre correcto en producción) > NEXTAUTH_URL > fallback
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || "https://www.rowiia.com";
    const processUrl = `${baseUrl}/api/admin/benchmarks/process-blob`;
    console.log(`🔗 Process URL: ${processUrl}`);

    // waitUntil permite que el fetch continúe ejecutándose después de responder
    waitUntil(
      fetch(processUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-service-token": getServiceToken(),
        },
        body: JSON.stringify({
          benchmarkId: benchmark.id,
          jobId: job.id,
          blobUrl,
        }),
      })
        .then((res) => {
          console.log(`✅ Process-blob responded with status: ${res.status}`);
        })
        .catch((err) => {
          console.error("❌ Error initiating processing:", err);
        })
    );

    console.log(`🚀 Processing initiated for benchmark ${benchmark.id}`);

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
