/**
 * 📊 API: Upload Benchmark Chunk
 * POST /api/admin/benchmarks/upload-chunk
 *
 * Recibe chunks de datos de benchmark para procesamiento incremental.
 * Diseñado para archivos grandes (500MB+) en Vercel serverless.
 *
 * Flujo:
 * 1. Frontend divide CSV en chunks de ~50,000 filas
 * 2. Envía cada chunk a este endpoint
 * 3. Backend procesa e inserta cada chunk
 * 4. Frontend llama a /finalize cuando termina
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import {
  SOH_COLUMN_MAPPING,
  NUMERIC_COLUMNS,
  EQ_COMPETENCIES,
  normalizeAgeRange,
  detectGeneration,
  extractDateInfo,
} from "@/lib/benchmarks";

interface ChunkUploadBody {
  benchmarkId: string;
  jobId: string;
  chunkIndex: number;
  totalChunks: number;
  rows: Record<string, any>[];
  isLastChunk: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ChunkUploadBody = await req.json();
    const { benchmarkId, jobId, chunkIndex, totalChunks, rows, isLastChunk } = body;

    if (!benchmarkId || !jobId || chunkIndex === undefined || !rows) {
      return NextResponse.json(
        { error: "Missing required fields: benchmarkId, jobId, chunkIndex, rows" },
        { status: 400 }
      );
    }

    // Verificar que el benchmark existe y está en estado PROCESSING
    const benchmark = await prisma.benchmark.findUnique({
      where: { id: benchmarkId },
    });

    if (!benchmark) {
      return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
    }

    if (benchmark.status !== "PROCESSING") {
      return NextResponse.json(
        { error: `Benchmark is not in PROCESSING state (current: ${benchmark.status})` },
        { status: 400 }
      );
    }

    // Procesar y validar las filas
    const validRows: any[] = [];
    let skippedRows = 0;

    for (const row of rows) {
      // Solo agregar si tiene al menos un valor de EQ
      const hasEQData = EQ_COMPETENCIES.some(
        (c) => row[c] !== null && row[c] !== undefined && !isNaN(parseFloat(row[c]))
      );

      if (hasEQData) {
        // Extraer fecha
        const dateInfoFromYear = extractDateInfo(row.year);
        const dateInfoFromDate = extractDateInfo(row.sourceDate);
        const dateInfo = dateInfoFromYear.year ? dateInfoFromYear : dateInfoFromDate;

        validRows.push({
          benchmarkId,
          sourceType: "soh",
          country: row.country || null,
          region: row.region || null,
          jobFunction: row.jobFunction || null,
          jobRole: row.jobRole || null,
          sector: row.sector || null,
          ageRange: normalizeAgeRange(row.ageRange),
          gender: row.gender || null,
          education: row.education || null,
          generation: row.generation || detectGeneration(normalizeAgeRange(row.ageRange)),
          year: dateInfo.year,
          month: dateInfo.month,
          quarter: dateInfo.quarter,
          K: parseFloatOrNull(row.K),
          C: parseFloatOrNull(row.C),
          G: parseFloatOrNull(row.G),
          eqTotal: parseFloatOrNull(row.eqTotal),
          EL: parseFloatOrNull(row.EL),
          RP: parseFloatOrNull(row.RP),
          ACT: parseFloatOrNull(row.ACT),
          NE: parseFloatOrNull(row.NE),
          IM: parseFloatOrNull(row.IM),
          OP: parseFloatOrNull(row.OP),
          EMP: parseFloatOrNull(row.EMP),
          NG: parseFloatOrNull(row.NG),
          effectiveness: parseFloatOrNull(row.effectiveness),
          relationships: parseFloatOrNull(row.relationships),
          qualityOfLife: parseFloatOrNull(row.qualityOfLife),
          wellbeing: parseFloatOrNull(row.wellbeing),
          influence: parseFloatOrNull(row.influence),
          decisionMaking: parseFloatOrNull(row.decisionMaking),
          community: parseFloatOrNull(row.community),
          network: parseFloatOrNull(row.network),
          achievement: parseFloatOrNull(row.achievement),
          satisfaction: parseFloatOrNull(row.satisfaction),
          balance: parseFloatOrNull(row.balance),
          health: parseFloatOrNull(row.health),
          // Brain Talents
          dataMining: parseFloatOrNull(row.dataMining),
          modeling: parseFloatOrNull(row.modeling),
          prioritizing: parseFloatOrNull(row.prioritizing),
          connection: parseFloatOrNull(row.connection),
          emotionalInsight: parseFloatOrNull(row.emotionalInsight),
          collaboration: parseFloatOrNull(row.collaboration),
          reflecting: parseFloatOrNull(row.reflecting),
          adaptability: parseFloatOrNull(row.adaptability),
          criticalThinking: parseFloatOrNull(row.criticalThinking),
          resilience: parseFloatOrNull(row.resilience),
          riskTolerance: parseFloatOrNull(row.riskTolerance),
          imagination: parseFloatOrNull(row.imagination),
          proactivity: parseFloatOrNull(row.proactivity),
          commitment: parseFloatOrNull(row.commitment),
          problemSolving: parseFloatOrNull(row.problemSolving),
          vision: parseFloatOrNull(row.vision),
          designing: parseFloatOrNull(row.designing),
          entrepreneurship: parseFloatOrNull(row.entrepreneurship),
          brainStyle: row.brainStyle || null,
          profile: row.profile || null,
          reliabilityIndex: parseFloatOrNull(row.reliabilityIndex),
        });
      } else {
        skippedRows++;
      }
    }

    // Insertar filas válidas en batches de 1000
    const BATCH_SIZE = 1000;
    let insertedCount = 0;

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);
      await prisma.benchmarkDataPoint.createMany({
        data: batch,
        skipDuplicates: true,
      });
      insertedCount += batch.length;
    }

    // Calcular progreso
    const progress = Math.round(((chunkIndex + 1) / totalChunks) * 70); // 70% para upload, 30% para estadísticas

    // Actualizar job con progreso
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "processing",
        progress,
        currentPhase: "importing",
        processedRows: { increment: insertedCount },
      },
    });

    console.log(`📊 Chunk ${chunkIndex + 1}/${totalChunks}: ${insertedCount} rows inserted, ${skippedRows} skipped`);

    return NextResponse.json({
      ok: true,
      chunkIndex,
      insertedRows: insertedCount,
      skippedRows,
      progress,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} processed`,
    });
  } catch (error) {
    console.error("❌ Error processing chunk:", error);
    return NextResponse.json(
      {
        error: "Error processing chunk",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

function parseFloatOrNull(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = parseFloat(String(value));
  return isNaN(num) ? null : num;
}
