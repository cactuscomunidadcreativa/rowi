/**
 * 📊 API: Process Benchmark from Vercel Blob
 * POST /api/admin/benchmarks/process-blob
 *
 * Descarga el archivo desde Blob y lo procesa.
 * Diseñado para correr en background después del upload.
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

export async function POST(req: NextRequest) {
  try {
    const body: ProcessBlobBody = await req.json();
    const { benchmarkId, jobId, blobUrl } = body;

    if (!benchmarkId || !jobId || !blobUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Actualizar job a procesando
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "processing",
        currentPhase: "downloading",
        progress: 5,
      },
    });

    // Descargar archivo desde Blob
    console.log(`📥 Downloading from blob: ${blobUrl}`);
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const isCSV = blobUrl.toLowerCase().includes(".csv");

    // Actualizar progreso
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        currentPhase: "parsing",
        progress: 15,
      },
    });

    // Parsear archivo
    console.log(`📊 Parsing ${isCSV ? "CSV" : "Excel"} file...`);
    let rows: Record<string, any>[];

    if (isCSV) {
      rows = await parseCSV(buffer);
    } else {
      rows = await parseExcel(buffer);
    }

    const totalRows = rows.length;
    console.log(`📊 Found ${totalRows} rows to process`);

    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        totalRows,
        currentPhase: "importing",
        progress: 25,
      },
    });

    // Procesar e insertar filas en batches más pequeños para evitar timeout
    const BATCH_SIZE = 500; // Reducido para evitar problemas de conexión
    const PROGRESS_UPDATE_INTERVAL = 5000; // Actualizar progreso cada 5000 filas
    let processedRows = 0;
    let validRows = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const dataPoints = [];

      for (const row of batch) {
        // Validar que tenga datos de EQ
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
        }
      }

      if (dataPoints.length > 0) {
        await prisma.benchmarkDataPoint.createMany({
          data: dataPoints,
          skipDuplicates: true,
        });
      }

      processedRows += batch.length;

      // Actualizar progreso menos frecuentemente para no saturar conexiones
      if (processedRows % PROGRESS_UPDATE_INTERVAL === 0 || processedRows >= totalRows) {
        const progress = 25 + Math.round((processedRows / totalRows) * 60);
        await prisma.benchmarkUploadJob.update({
          where: { id: jobId },
          data: {
            processedRows: validRows,
            progress,
          },
        });
        console.log(`📊 Processed ${processedRows}/${totalRows} rows (${validRows} valid)`);
      }
    }

    // Calcular estadísticas
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        currentPhase: "statistics",
        progress: 90,
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

    // Desconectar Prisma para liberar conexiones
    await prisma.$disconnect();

    return NextResponse.json({
      ok: true,
      benchmarkId,
      totalRows: finalCount,
      message: "Processing completed",
    });
  } catch (error) {
    console.error("❌ Error processing blob:", error);

    // Marcar como fallido si tenemos los IDs
    try {
      const body = await req.clone().json();
      if (body.jobId) {
        await prisma.benchmarkUploadJob.update({
          where: { id: body.jobId },
          data: {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          },
        });
      }
      if (body.benchmarkId) {
        await prisma.benchmark.update({
          where: { id: body.benchmarkId },
          data: { status: "FAILED" },
        });
      }
    } catch {}

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
