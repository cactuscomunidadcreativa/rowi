/**
 * 📊 API: Process Benchmark from Vercel Blob
 * POST /api/admin/benchmarks/process-blob
 *
 * Procesa el archivo en chunks para evitar timeouts.
 * Se llama múltiples veces hasta completar todo el archivo.
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
  startRow?: number; // Fila desde donde empezar (para procesamiento en chunks)
}

const ROWS_PER_CALL = 50000; // Procesar 50k filas por llamada
const BATCH_SIZE = 500; // Insertar en batches de 500

export async function POST(req: NextRequest) {
  let benchmarkId: string | undefined;
  let jobId: string | undefined;

  try {
    const body: ProcessBlobBody = await req.json();
    benchmarkId = body.benchmarkId;
    jobId = body.jobId;
    const { blobUrl, startRow = 0 } = body;

    if (!benchmarkId || !jobId || !blobUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const isFirstCall = startRow === 0;

    // Solo actualizar fase en la primera llamada
    if (isFirstCall) {
      await prisma.benchmarkUploadJob.update({
        where: { id: jobId },
        data: {
          status: "processing",
          currentPhase: "downloading",
          progress: 5,
        },
      });
    }

    // Descargar archivo desde Blob
    console.log(`📥 Downloading from blob: ${blobUrl} (startRow: ${startRow})`);
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const isCSV = blobUrl.toLowerCase().includes(".csv");

    if (isFirstCall) {
      await prisma.benchmarkUploadJob.update({
        where: { id: jobId },
        data: {
          currentPhase: "parsing",
          progress: 10,
        },
      });
    }

    // Parsear archivo
    console.log(`📊 Parsing ${isCSV ? "CSV" : "Excel"} file...`);
    let allRows: Record<string, any>[];

    if (isCSV) {
      allRows = await parseCSV(buffer);
    } else {
      allRows = await parseExcel(buffer);
    }

    const totalRows = allRows.length;
    console.log(`📊 Total rows in file: ${totalRows}, starting from: ${startRow}`);

    // Obtener solo las filas para esta llamada
    const endRow = Math.min(startRow + ROWS_PER_CALL, totalRows);
    const rows = allRows.slice(startRow, endRow);
    const isLastChunk = endRow >= totalRows;

    if (isFirstCall) {
      await prisma.benchmarkUploadJob.update({
        where: { id: jobId },
        data: {
          totalRows,
          currentPhase: "importing",
          progress: 15,
        },
      });
    }

    // Procesar e insertar filas en batches
    let processedInThisCall = 0;
    let validRowsInThisCall = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const dataPoints = [];

      for (const row of batch) {
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
          validRowsInThisCall++;
        }
      }

      if (dataPoints.length > 0) {
        await prisma.benchmarkDataPoint.createMany({
          data: dataPoints,
          skipDuplicates: true,
        });
      }

      processedInThisCall += batch.length;
    }

    // Calcular progreso total
    const totalProcessed = startRow + processedInThisCall;
    const progress = Math.min(15 + Math.round((totalProcessed / totalRows) * 75), 90);

    // Contar filas válidas totales en la base de datos
    const currentValidRows = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId },
    });

    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        processedRows: currentValidRows,
        progress,
      },
    });

    console.log(`📊 Chunk completed: ${startRow}-${endRow} of ${totalRows} (${currentValidRows} valid total)`);

    // Si no es el último chunk, programar la siguiente llamada
    if (!isLastChunk) {
      const nextCallUrl = new URL("/api/admin/benchmarks/process-blob", req.url);

      // Llamar al siguiente chunk en background
      fetch(nextCallUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benchmarkId,
          jobId,
          blobUrl,
          startRow: endRow,
        }),
      }).catch((err) => {
        console.error("Error calling next chunk:", err);
      });

      return NextResponse.json({
        ok: true,
        status: "processing",
        processedRows: totalProcessed,
        totalRows,
        nextStartRow: endRow,
        message: `Processed rows ${startRow}-${endRow}, continuing...`,
      });
    }

    // ===== ÚLTIMO CHUNK - FINALIZAR =====

    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        currentPhase: "statistics",
        progress: 95,
      },
    });

    // Contar registros finales
    const finalCount = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId },
    });

    // Actualizar benchmark a completado
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

    // Marcar como fallido
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

async function parseCSV(buffer: Buffer): Promise<Record<string, any>[]> {
  const text = buffer.toString("utf-8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV vacío o sin datos");
  }

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim()) {
      const values = parseCSVLine(line);
      const row: Record<string, any> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? null;
      });
      rows.push(row);
    }
  }

  return rows;
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

async function parseExcel(buffer: Buffer): Promise<Record<string, any>[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}
