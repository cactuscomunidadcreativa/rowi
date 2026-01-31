/**
 * 📊 API: Process Benchmark from Vercel Blob
 * POST /api/admin/benchmarks/process-blob
 *
 * Procesa el archivo completo en una sola llamada de hasta 5 minutos.
 * Usa batches pequeños para inserts y actualiza progreso frecuentemente.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import {
  EQ_COMPETENCIES,
  normalizeAgeRange,
  detectGeneration,
  extractDateInfo,
} from "@/lib/benchmarks";

export const maxDuration = 300; // 5 minutos

interface ProcessBlobBody {
  benchmarkId: string;
  jobId: string;
  blobUrl: string;
}

const BATCH_SIZE = 500; // Batches pequeños para inserts rápidos
const PROGRESS_UPDATE_INTERVAL = 5000; // Actualizar progreso cada 5k filas

export async function POST(req: NextRequest) {
  let benchmarkId: string | undefined;
  let jobId: string | undefined;

  try {
    const body: ProcessBlobBody = await req.json();
    benchmarkId = body.benchmarkId;
    jobId = body.jobId;
    const { blobUrl } = body;

    if (!benchmarkId || !jobId || !blobUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fase 1: Descarga
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "processing",
        currentPhase: "downloading",
        progress: 5,
      },
    });

    console.log(`📥 Downloading from blob: ${blobUrl}`);
    const startDownload = Date.now();

    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.status}`);
    }

    const text = await response.text();
    console.log(`📥 Download completed in ${Date.now() - startDownload}ms (${(text.length / 1024 / 1024).toFixed(1)}MB)`);

    // Fase 2: Parsing
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        currentPhase: "parsing",
        progress: 15,
      },
    });

    console.log(`📊 Parsing CSV...`);
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error("CSV vacío o sin datos");
    }

    const headers = parseCSVLine(lines[0]);
    const totalDataRows = lines.length - 1;

    console.log(`📊 Total rows to process: ${totalDataRows}`);

    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        totalRows: totalDataRows,
        currentPhase: "importing",
        progress: 20,
      },
    });

    // Fase 3: Importar en batches
    let processedRows = 0;
    let validRows = 0;
    let dataPoints: any[] = [];
    let lastProgressUpdate = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line);
      const row: Record<string, any> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? null;
      });

      const hasEQData = EQ_COMPETENCIES.some(
        (c) => row[c] !== null && row[c] !== undefined && !isNaN(parseFloat(row[c]))
      );

      if (hasEQData) {
        const dateInfo = extractDateInfo(row.year || row.Year || row.sourceDate);

        dataPoints.push({
          benchmarkId,
          sourceType: "soh",
          country: row.country || row.Country || null,
          region: row.region || row.Region || null,
          jobFunction: row.jobFunction || row.Job_Function || null,
          jobRole: row.jobRole || row.Job_Role || null,
          sector: row.sector || row.Sector || null,
          ageRange: normalizeAgeRange(row.ageRange || row.Age_Range),
          gender: row.gender || row.Gender || null,
          education: row.education || row.Education || null,
          generation: row.generation || detectGeneration(normalizeAgeRange(row.ageRange || row.Age_Range)),
          year: dateInfo.year,
          month: dateInfo.month,
          quarter: dateInfo.quarter,
          K: parseFloatOrNull(row.K),
          C: parseFloatOrNull(row.C),
          G: parseFloatOrNull(row.G),
          eqTotal: parseFloatOrNull(row.eqTotal || row.EQ),
          EL: parseFloatOrNull(row.EL),
          RP: parseFloatOrNull(row.RP),
          ACT: parseFloatOrNull(row.ACT),
          NE: parseFloatOrNull(row.NE),
          IM: parseFloatOrNull(row.IM),
          OP: parseFloatOrNull(row.OP),
          EMP: parseFloatOrNull(row.EMP),
          NG: parseFloatOrNull(row.NG),
          effectiveness: parseFloatOrNull(row.effectiveness || row.Effectiveness),
          relationships: parseFloatOrNull(row.relationships || row.Relationships),
          qualityOfLife: parseFloatOrNull(row.qualityOfLife || row.Quality_of_Life),
          wellbeing: parseFloatOrNull(row.wellbeing || row.Wellbeing),
        });
        validRows++;

        // Insertar en batches
        if (dataPoints.length >= BATCH_SIZE) {
          await prisma.benchmarkDataPoint.createMany({
            data: dataPoints,
            skipDuplicates: true,
          });
          dataPoints = [];
        }
      }

      processedRows++;

      // Actualizar progreso periódicamente
      if (processedRows - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL) {
        const progress = Math.min(20 + Math.round((processedRows / totalDataRows) * 70), 90);
        await prisma.benchmarkUploadJob.update({
          where: { id: jobId },
          data: {
            processedRows: validRows,
            currentRow: processedRows,
            progress,
          },
        });
        console.log(`📊 Progress: ${processedRows}/${totalDataRows} (${validRows} valid)`);
        lastProgressUpdate = processedRows;
      }
    }

    // Insertar remaining
    if (dataPoints.length > 0) {
      await prisma.benchmarkDataPoint.createMany({
        data: dataPoints,
        skipDuplicates: true,
      });
    }

    console.log(`📊 Import completed: ${validRows} valid rows from ${processedRows} total`);

    // Fase 4: Finalizar
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        currentPhase: "statistics",
        progress: 95,
      },
    });

    const finalCount = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId },
    });

    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: {
        status: "COMPLETED",
        totalRows: finalCount,
      },
    });

    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        progress: 100,
        processedRows: finalCount,
        totalRows: finalCount,
        currentPhase: "completed",
        completedAt: new Date(),
      },
    });

    console.log(`✅ Benchmark ${benchmarkId} completed with ${finalCount} rows`);

    await prisma.$disconnect();

    return NextResponse.json({
      ok: true,
      status: "completed",
      benchmarkId,
      totalRows: finalCount,
      message: "Processing completed",
    });
  } catch (error) {
    console.error("❌ Error processing blob:", error);

    try {
      if (jobId) {
        await prisma.benchmarkUploadJob.update({
          where: { id: jobId },
          data: {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          },
        });
      }
      if (benchmarkId) {
        await prisma.benchmark.update({
          where: { id: benchmarkId },
          data: { status: "FAILED" },
        });
      }
    } catch {}

    await prisma.$disconnect();

    return NextResponse.json(
      { error: "Processing failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

function parseFloatOrNull(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(String(value));
  return isNaN(num) ? null : num;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
