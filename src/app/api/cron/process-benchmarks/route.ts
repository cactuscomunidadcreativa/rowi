/**
 * 🕐 CRON: Process Pending Benchmark Chunks
 * GET /api/cron/process-benchmarks
 *
 * Corre cada minuto para procesar chunks de benchmarks pendientes.
 * Cada ejecución procesa un chunk de ~25k filas.
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
export const dynamic = "force-dynamic";

const ROWS_PER_CHUNK = 25000;
const BATCH_SIZE = 1000;

export async function GET(req: NextRequest) {
  // Verificar que es una llamada de Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // En desarrollo permitir sin auth
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Buscar un job pendiente o en proceso
    const job = await prisma.benchmarkUploadJob.findFirst({
      where: {
        status: { in: ["pending", "processing"] },
        blobUrl: { not: null },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!job || !job.blobUrl || !job.benchmarkId) {
      return NextResponse.json({
        ok: true,
        message: "No pending jobs",
      });
    }

    console.log(`📊 Processing job ${job.id}, chunk starting at row ${job.currentRow}`);

    // Marcar como procesando
    await prisma.benchmarkUploadJob.update({
      where: { id: job.id },
      data: {
        status: "processing",
        startedAt: job.startedAt || new Date(),
      },
    });

    // Descargar archivo desde Blob
    const response = await fetch(job.blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const isCSV = job.blobUrl.toLowerCase().includes(".csv");

    // Parsear archivo
    let allRows: Record<string, any>[];
    if (isCSV) {
      allRows = parseCSV(buffer);
    } else {
      allRows = await parseExcel(buffer);
    }

    const totalRows = allRows.length;
    const startRow = job.currentRow || 0;
    const endRow = Math.min(startRow + ROWS_PER_CHUNK, totalRows);
    const rows = allRows.slice(startRow, endRow);
    const isLastChunk = endRow >= totalRows;

    // Actualizar totalRows si es el primer chunk
    if (startRow === 0) {
      await prisma.benchmarkUploadJob.update({
        where: { id: job.id },
        data: {
          totalRows,
          currentPhase: "importing",
        },
      });
    }

    // Procesar filas en batches
    let validRowsInThisChunk = 0;

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
            benchmarkId: job.benchmarkId,
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
          validRowsInThisChunk++;
        }
      }

      if (dataPoints.length > 0) {
        await prisma.benchmarkDataPoint.createMany({
          data: dataPoints,
          skipDuplicates: true,
        });
      }
    }

    // Contar total de filas válidas procesadas
    const totalValidRows = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId: job.benchmarkId },
    });

    // Calcular progreso
    const progress = Math.min(Math.round((endRow / totalRows) * 100), 100);

    if (isLastChunk) {
      // ===== COMPLETADO =====
      await prisma.benchmarkUploadJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          progress: 100,
          currentPhase: "completed",
          currentRow: endRow,
          processedRows: totalValidRows,
          completedAt: new Date(),
        },
      });

      await prisma.benchmark.update({
        where: { id: job.benchmarkId },
        data: {
          status: "COMPLETED",
          totalRows: totalValidRows,
        },
      });

      console.log(`✅ Job ${job.id} completed with ${totalValidRows} rows`);

      return NextResponse.json({
        ok: true,
        status: "completed",
        jobId: job.id,
        totalRows: totalValidRows,
      });
    } else {
      // ===== CONTINUAR EN SIGUIENTE CRON =====
      await prisma.benchmarkUploadJob.update({
        where: { id: job.id },
        data: {
          progress,
          currentRow: endRow,
          processedRows: totalValidRows,
          currentPhase: "importing",
        },
      });

      console.log(`📊 Job ${job.id}: processed rows ${startRow}-${endRow} of ${totalRows} (${progress}%)`);

      return NextResponse.json({
        ok: true,
        status: "processing",
        jobId: job.id,
        progress,
        processedRows: totalValidRows,
        nextRow: endRow,
        totalRows,
      });
    }
  } catch (error) {
    console.error("❌ Cron error:", error);

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

function parseFloatOrNull(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(String(value));
  return isNaN(num) ? null : num;
}

function parseCSV(buffer: Buffer): Record<string, any>[] {
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
