/**
 * 📊 API: Direct Upload Benchmark
 * POST /api/admin/benchmarks/upload-direct
 *
 * Recibe el archivo directamente via FormData, lo sube a Vercel Blob
 * desde el servidor, y luego inicia el procesamiento.
 *
 * Esto evita los problemas del cliente de Vercel Blob.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { put } from "@vercel/blob";
import { prisma } from "@/core/prisma";
import { waitUntil } from "@vercel/functions";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    // Auth via header or JWT
    let userEmail = req.headers.get("x-user-email");

    if (!userEmail || userEmail === "") {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      userEmail = token?.email as string;
    }

    if (!userEmail || userEmail === "") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string;
    const type = (formData.get("type") as string) || "ROWIVERSE";
    const scope = (formData.get("scope") as string) || "GLOBAL";
    const isLearning = formData.get("isLearning") === "true";

    if (!file || !name) {
      return NextResponse.json(
        { error: "Missing required fields: file, name" },
        { status: 400 }
      );
    }

    console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Upload to Vercel Blob from server
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    console.log(`✅ File uploaded to Vercel Blob: ${blob.url}`);

    // Create benchmark
    const benchmark = await prisma.benchmark.create({
      data: {
        name: name.trim(),
        type: type as any,
        scope: scope || null,
        isLearning,
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
        blobUrl: blob.url,
      },
    });

    console.log(`📊 Job ${job.id} created for benchmark ${benchmark.id}`);

    // Start processing
    const baseUrl = process.env.NEXTAUTH_URL || "https://www.rowiia.com";
    const processUrl = `${baseUrl}/api/admin/benchmarks/process-blob`;

    waitUntil(
      fetch(processUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benchmarkId: benchmark.id,
          jobId: job.id,
          blobUrl: blob.url,
        }),
      })
        .then((res) => {
          console.log(`✅ Process-blob responded with status: ${res.status}`);
        })
        .catch((err) => {
          console.error("❌ Error initiating processing:", err);
        })
    );

    return NextResponse.json({
      ok: true,
      benchmarkId: benchmark.id,
      jobId: job.id,
      blobUrl: blob.url,
      message: "Upload complete, processing started",
    });
  } catch (error) {
    console.error("❌ Error in direct upload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error uploading file" },
      { status: 500 }
    );
  }
}
