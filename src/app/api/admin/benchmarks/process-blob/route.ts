/**
 * 📊 API: Process Benchmark from Vercel Blob
 * POST /api/admin/benchmarks/process-blob
 *
 * Procesa el archivo completo en una sola llamada de hasta 5 minutos.
 * Usa el SOH_COLUMN_MAPPING para mapear columnas del Excel a campos del modelo.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import {
  EQ_COMPETENCIES,
  SOH_COLUMN_MAPPING,
  NUMERIC_COLUMNS,
  OUTCOMES,
  normalizeAgeRange,
  detectGeneration,
  extractDateInfo,
  pearsonCorrelation,
} from "@/lib/benchmarks";

export const maxDuration = 300; // 5 minutos

interface ProcessBlobBody {
  benchmarkId: string;
  jobId: string;
  blobUrl: string;
}

const BATCH_SIZE = 500;
const PROGRESS_UPDATE_INTERVAL = 5000;

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

    const rawHeaders = parseCSVLine(lines[0]);
    console.log(`📊 Raw headers (first 10): ${rawHeaders.slice(0, 10).join(", ")}`);

    // Mapear headers usando SOH_COLUMN_MAPPING
    const mappedHeaders = rawHeaders.map(h => SOH_COLUMN_MAPPING[h] || h);
    console.log(`📊 Mapped headers (first 10): ${mappedHeaders.slice(0, 10).join(", ")}`);

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

      // Crear row con headers mapeados
      const row: Record<string, any> = {};
      mappedHeaders.forEach((header, idx) => {
        const value = values[idx];
        // Convertir a número si es una columna numérica
        if (NUMERIC_COLUMNS.includes(header)) {
          const num = parseFloat(value);
          row[header] = isNaN(num) ? null : num;
        } else {
          row[header] = value || null;
        }
      });

      // Verificar si tiene datos EQ (acepta 0 como valor válido)
      const hasEQData = EQ_COMPETENCIES.some(
        (c) => typeof row[c] === 'number' // 0 es válido, null/undefined/NaN no
      );

      if (hasEQData) {
        const dateInfo = extractDateInfo(row.year || row.sourceDate);
        const ageRange = normalizeAgeRange(row.ageRange);

        dataPoints.push({
          benchmarkId,
          sourceType: "soh",
          country: row.country || null,
          region: row.region || null,
          jobFunction: row.jobFunction || null,
          jobRole: row.jobRole || null,
          sector: row.sector || null,
          ageRange: ageRange,
          gender: row.gender || null,
          education: row.education || null,
          generation: row.generation || detectGeneration(ageRange),
          year: dateInfo.year,
          month: dateInfo.month,
          quarter: dateInfo.quarter,
          K: row.K ?? null,
          C: row.C ?? null,
          G: row.G ?? null,
          eqTotal: row.eqTotal ?? null,
          EL: row.EL ?? null,
          RP: row.RP ?? null,
          ACT: row.ACT ?? null,
          NE: row.NE ?? null,
          IM: row.IM ?? null,
          OP: row.OP ?? null,
          EMP: row.EMP ?? null,
          NG: row.NG ?? null,
          effectiveness: row.effectiveness ?? null,
          relationships: row.relationships ?? null,
          qualityOfLife: row.qualityOfLife ?? null,
          wellbeing: row.wellbeing ?? null,
          influence: row.influence ?? null,
          decisionMaking: row.decisionMaking ?? null,
          community: row.community ?? null,
          network: row.network ?? null,
          achievement: row.achievement ?? null,
          satisfaction: row.satisfaction ?? null,
          balance: row.balance ?? null,
          health: row.health ?? null,
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

    // Fase 4: Calcular correlaciones automáticamente
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        currentPhase: "correlations",
        progress: 90,
      },
    });

    console.log(`📊 Calculating correlations...`);

    // Obtener data points para calcular correlaciones
    const correlationDataPoints = await prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId },
      select: {
        K: true, C: true, G: true, EL: true, RP: true, ACT: true,
        NE: true, IM: true, OP: true, EMP: true, NG: true,
        effectiveness: true, relationships: true, qualityOfLife: true,
        wellbeing: true, influence: true, decisionMaking: true,
        community: true, network: true, achievement: true,
        satisfaction: true, balance: true, health: true,
      },
    });

    const correlations: any[] = [];

    if (correlationDataPoints.length >= 10) {
      for (const competency of EQ_COMPETENCIES) {
        for (const outcome of OUTCOMES) {
          const pairs: { comp: number; out: number }[] = [];
          for (const dp of correlationDataPoints) {
            const compVal = (dp as any)[competency];
            const outVal = (dp as any)[outcome];
            if (typeof compVal === "number" && typeof outVal === "number") {
              pairs.push({ comp: compVal, out: outVal });
            }
          }

          if (pairs.length >= 10) {
            const result = pearsonCorrelation(
              pairs.map((p) => p.comp),
              pairs.map((p) => p.out)
            );

            correlations.push({
              id: `${benchmarkId}_${competency}_${outcome}_all_all_all`,
              benchmarkId,
              country: null,
              region: null,
              sector: null,
              tenantId: null,
              competencyKey: competency,
              outcomeKey: outcome,
              correlation: result.correlation,
              pValue: result.pValue,
              n: result.n,
              strength: result.strength,
              direction: result.direction,
              calculatedAt: new Date(),
            });
          }
        }
      }

      if (correlations.length > 0) {
        await prisma.benchmarkCorrelation.createMany({
          data: correlations,
          skipDuplicates: true,
        });
      }
      console.log(`📊 Calculated ${correlations.length} correlations`);
    }

    // Fase 5: Finalizar
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
