/**
 * 📊 API: Upload Benchmark to Vercel Blob
 * POST /api/admin/benchmarks/blob-upload
 *
 * Usa Vercel Blob Storage para archivos grandes (hasta 500MB)
 * El cliente sube directamente al blob, luego procesamos desde ahí.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { put } from "@vercel/blob";
import { prisma } from "@/core/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const type = formData.get("type") as string || "ROWIVERSE";
    const scope = formData.get("scope") as string || "GLOBAL";
    const isLearning = formData.get("isLearning") === "true";

    if (!file || !name) {
      return NextResponse.json(
        { error: "File and name are required" },
        { status: 400 }
      );
    }

    // Subir archivo a Vercel Blob
    const filename = `benchmarks/${Date.now()}_${file.name}`;
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Crear benchmark en estado PROCESSING
    const benchmark = await prisma.benchmark.create({
      data: {
        name,
        type: type as any,
        scope: scope as any,
        status: "PROCESSING",
        sourceFile: blob.url,
        isLearning,
        uploadedBy: session.user.email,
      },
    });

    // Crear job de procesamiento
    const job = await prisma.benchmarkUploadJob.create({
      data: {
        benchmarkId: benchmark.id,
        status: "pending",
        progress: 0,
        currentPhase: "uploaded",
      },
    });

    // Disparar procesamiento en background (via fetch interno)
    // El procesamiento real se hace en otro endpoint
    fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/benchmarks/process-blob`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        benchmarkId: benchmark.id,
        jobId: job.id,
        blobUrl: blob.url,
      }),
    }).catch(console.error);

    return NextResponse.json({
      ok: true,
      benchmarkId: benchmark.id,
      jobId: job.id,
      blobUrl: blob.url,
      message: "Archivo subido, procesamiento iniciado",
    });
  } catch (error) {
    console.error("❌ Error uploading to blob:", error);
    return NextResponse.json(
      { error: "Error uploading file", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
