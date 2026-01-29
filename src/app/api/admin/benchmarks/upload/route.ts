/**
 * 📊 API: Upload Benchmark Data
 * POST /api/admin/benchmarks/upload - Subir y procesar Excel o CSV
 *
 * Formatos soportados:
 * - .xlsx (Excel)
 * - .xls (Excel legacy)
 * - .csv (recomendado para archivos grandes >100MB)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import {
  SOH_COLUMN_MAPPING,
  NUMERIC_COLUMNS,
  EQ_COMPETENCIES,
  OUTCOMES,
  normalizeAgeRange,
  detectGeneration,
} from "@/lib/benchmarks";

// =========================================================
// POST - Subir archivo Excel y crear job de procesamiento
// =========================================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const type = formData.get("type") as string | null;
    const scope = formData.get("scope") as string | null;
    const tenantId = formData.get("tenantId") as string | null;
    const hubId = formData.get("hubId") as string | null;
    const isLearning = formData.get("isLearning") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (Excel o CSV)
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ];
    const isCSV = file.name.endsWith(".csv") || file.type.includes("csv");
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (!isCSV && !isExcel) {
      return NextResponse.json(
        { error: "Formato de archivo no válido. Use .xlsx, .xls o .csv" },
        { status: 400 }
      );
    }

    // Guardar archivo temporalmente
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `benchmark_${Date.now()}_${file.name}`;
    const uploadPath = join(process.cwd(), "uploads", filename);

    // Crear directorio si no existe
    const { mkdir } = await import("fs/promises");
    await mkdir(join(process.cwd(), "uploads"), { recursive: true });
    await writeFile(uploadPath, buffer);

    // Crear benchmark en estado PROCESSING
    const benchmark = await prisma.benchmark.create({
      data: {
        name,
        type: (type as any) || "ROWIVERSE",
        scope: (scope as any) || "GLOBAL",
        status: "PROCESSING",
        sourceFile: filename,
        tenantId,
        hubId,
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
        currentPhase: "parsing",
      },
    });

    // Iniciar procesamiento en background
    // En producción, esto sería una cola de trabajo (Bull, etc.)
    if (isCSV) {
      processCSVInBackground(benchmark.id, job.id, uploadPath).catch((err) => {
        console.error("❌ Error processing CSV benchmark:", err);
      });
    } else {
      processExcelInBackground(benchmark.id, job.id, uploadPath).catch((err) => {
        console.error("❌ Error processing Excel benchmark:", err);
      });
    }

    return NextResponse.json({
      ok: true,
      benchmark,
      jobId: job.id,
      message: "Archivo subido, procesamiento iniciado",
    });
  } catch (error) {
    console.error("❌ Error uploading benchmark:", error);
    return NextResponse.json(
      { error: "Error al subir benchmark" },
      { status: 500 }
    );
  }
}

// =========================================================
// 🔄 PROCESAMIENTO CSV EN BACKGROUND (optimizado para archivos muy grandes)
// =========================================================
async function processCSVInBackground(
  benchmarkId: string,
  jobId: string,
  filePath: string
) {
  try {
    await updateJobStatus(jobId, "processing", 5, "parsing");

    const fs = await import("fs");
    const readline = await import("readline");

    const fileStream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 }); // 64KB chunks
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let headers: string[] = [];
    let isFirstRow = true;
    let rowCount = 0;
    let validRowCount = 0;
    let batch: any[] = [];
    const BATCH_SIZE = 1000; // Insertar cada 1000 filas válidas

    for await (const line of rl) {
      if (isFirstRow) {
        headers = parseCSVLine(line);
        console.log(`📋 Headers encontrados: ${headers.length} columnas`);
        isFirstRow = false;
        continue;
      }

      const values = parseCSVLine(line);
      const rowData: Record<string, any> = {};

      // Mapear solo las columnas que necesitamos
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (!header) continue;

        const mappedKey = SOH_COLUMN_MAPPING[header];
        if (mappedKey) {
          let value = values[i];

          if (NUMERIC_COLUMNS.includes(mappedKey)) {
            const num = parseFloat(String(value));
            value = isNaN(num) ? null : num;
          }

          rowData[mappedKey] = value ?? null;
        }
      }

      rowCount++;

      // Solo agregar si tiene al menos un valor de EQ
      const hasEQData = EQ_COMPETENCIES.some((c) => rowData[c] !== null && rowData[c] !== undefined);

      if (hasEQData) {
        batch.push(rowData);
        validRowCount++;

        // Insertar batch inmediatamente cuando alcanza el tamaño
        if (batch.length >= BATCH_SIZE) {
          await insertBatchDataPointsDirect(benchmarkId, batch);
          batch = []; // Limpiar para liberar memoria

          // Actualizar progreso cada cierto número de inserciones
          if (validRowCount % 10000 === 0) {
            const progress = Math.min(70, 10 + Math.round((validRowCount / 250000) * 60));
            await updateJobStatus(jobId, "processing", progress, "importing", validRowCount);
            console.log(`📊 Procesadas: ${rowCount} filas, insertadas: ${validRowCount}`);
          }
        }
      }
    }

    // Insertar filas restantes del último batch
    if (batch.length > 0) {
      await insertBatchDataPointsDirect(benchmarkId, batch);
      batch = [];
    }

    console.log(`📊 CSV completado: ${rowCount} filas procesadas, ${validRowCount} insertadas`);

    // Contar total insertado
    const totalInserted = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId },
    });

    console.log(`📊 CSV: Total filas procesadas: ${rowCount}, insertadas: ${totalInserted}`);

    // Calcular estadísticas, correlaciones, top performers
    await updateJobStatus(jobId, "processing", 75, "statistics");
    await calculateAndSaveStatistics(benchmarkId);

    await updateJobStatus(jobId, "processing", 85, "correlations");
    await calculateAndSaveCorrelations(benchmarkId);

    await updateJobStatus(jobId, "processing", 92, "topPerformers");
    await calculateAndSaveTopPerformers(benchmarkId);

    // Actualizar benchmark
    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: {
        status: "COMPLETED",
        totalRows: totalInserted,
        processedRows: totalInserted,
        processedAt: new Date(),
      },
    });

    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        progress: 100,
        currentPhase: null,
        processedRows: totalInserted,
        totalRows: totalInserted,
        completedAt: new Date(),
      },
    });

    console.log(`✅ CSV Benchmark ${benchmarkId} procesado: ${totalInserted} filas`);
  } catch (error) {
    console.error("❌ Error processing CSV benchmark:", error);

    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: { status: "FAILED" },
    });

    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Error desconocido",
        completedAt: new Date(),
      },
    });
  }
}

// Helper para parsear líneas CSV (maneja comillas)
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

// =========================================================
// 🔄 PROCESAMIENTO EXCEL EN BACKGROUND (streaming)
// =========================================================
async function processExcelInBackground(
  benchmarkId: string,
  jobId: string,
  filePath: string
) {
  try {
    // Actualizar estado
    await updateJobStatus(jobId, "processing", 5, "parsing");

    // Importar ExcelJS para streaming
    const ExcelJS = await import("exceljs");
    const fs = await import("fs");

    const rows: any[] = [];
    let headers: string[] = [];
    let rowCount = 0;
    let isFirstRow = true;

    // Usar streaming para archivos grandes
    const workbookReader = new ExcelJS.default.stream.xlsx.WorkbookReader(filePath, {
      worksheets: "emit",
      sharedStrings: "cache",
      hyperlinks: "ignore",
      styles: "ignore",
      entries: "emit",
    });

    for await (const worksheetReader of workbookReader) {
      // Solo procesar la primera hoja
      if (worksheetReader.id !== 1) continue;

      for await (const row of worksheetReader) {
        if (isFirstRow) {
          // Primera fila = headers
          headers = row.values as string[];
          isFirstRow = false;
          continue;
        }

        const values = row.values as any[];
        const rowData: Record<string, any> = {};

        // Mapear columnas del Excel a nuestro schema
        headers.forEach((header, index) => {
          if (!header) return;
          const mappedKey = SOH_COLUMN_MAPPING[header];
          if (mappedKey) {
            let value = values[index];

            // Convertir a número si es columna numérica
            if (NUMERIC_COLUMNS.includes(mappedKey)) {
              const num = parseFloat(String(value));
              value = isNaN(num) ? null : num;
            }

            rowData[mappedKey] = value ?? null;
          }
        });

        // Solo agregar si tiene al menos un valor de EQ
        if (
          EQ_COMPETENCIES.some(
            (c) => rowData[c] !== null && rowData[c] !== undefined
          )
        ) {
          rows.push(rowData);
        }

        rowCount++;

        // Actualizar progreso cada 10000 filas y hacer batch insert
        if (rowCount % 10000 === 0) {
          await updateJobStatus(jobId, "processing", 10, "parsing", rowCount);

          // Insertar batch intermedio para liberar memoria
          if (rows.length >= 5000) {
            await insertBatchDataPoints(benchmarkId, rows.splice(0, 5000));
          }
        }
      }
    }

    // Insertar filas restantes que quedaron en el buffer
    await updateJobStatus(jobId, "processing", 30, "importing", rowCount);

    if (rows.length > 0) {
      await insertBatchDataPoints(benchmarkId, rows);
    }

    // Contar total insertado
    const totalInserted = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId },
    });

    console.log(`📊 Total filas procesadas: ${rowCount}, insertadas: ${totalInserted}`);

    // Calcular estadísticas
    await updateJobStatus(jobId, "processing", 75, "statistics");
    await calculateAndSaveStatistics(benchmarkId);

    // Calcular correlaciones
    await updateJobStatus(jobId, "processing", 85, "correlations");
    await calculateAndSaveCorrelations(benchmarkId);

    // Calcular top performers
    await updateJobStatus(jobId, "processing", 92, "topPerformers");
    await calculateAndSaveTopPerformers(benchmarkId);

    // Actualizar benchmark con totales
    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: {
        status: "COMPLETED",
        totalRows: totalInserted,
        processedRows: totalInserted,
        processedAt: new Date(),
      },
    });

    // Finalizar job
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        progress: 100,
        currentPhase: null,
        processedRows: totalInserted,
        totalRows: totalInserted,
        completedAt: new Date(),
      },
    });

    console.log(`✅ Benchmark ${benchmarkId} procesado: ${totalInserted} filas`);
  } catch (error) {
    console.error("❌ Error processing benchmark:", error);

    // Marcar como fallido
    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: { status: "FAILED" },
    });

    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Error desconocido",
        completedAt: new Date(),
      },
    });
  }
}

// =========================================================
// 📊 CÁLCULO DE ESTADÍSTICAS (optimizado para datasets grandes)
// =========================================================
async function calculateAndSaveStatistics(benchmarkId: string) {
  const { calculateStats } = await import("@/lib/benchmarks");

  const metricsToCalculate = [
    "K", "C", "G", "eqTotal",
    "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
    "effectiveness", "relationships", "qualityOfLife", "wellbeing",
    "influence", "decisionMaking", "community", "network",
    "achievement", "satisfaction", "balance", "health",
  ];

  const statsToCreate = [];

  // Para cada métrica, obtener solo los valores de esa columna (no todo el registro)
  for (const metric of metricsToCalculate) {
    // Usar agregaciones de Prisma para estadísticas básicas
    const aggregations = await prisma.benchmarkDataPoint.aggregate({
      where: {
        benchmarkId,
        [metric]: { not: null },
      },
      _count: { [metric]: true },
      _avg: { [metric]: true },
      _min: { [metric]: true },
      _max: { [metric]: true },
    });

    const count = (aggregations._count as any)[metric] || 0;

    if (count >= 30) {
      // Para percentiles, necesitamos los valores ordenados (usar sampling si hay muchos)
      const sampleSize = Math.min(count, 50000); // Limitar a 50k para percentiles

      const rawValues = await prisma.benchmarkDataPoint.findMany({
        where: {
          benchmarkId,
          [metric]: { not: null },
        },
        select: { [metric]: true },
        take: sampleSize,
        orderBy: { [metric]: "asc" },
      });

      const values = rawValues.map((r: any) => r[metric] as number).filter((v: number) => v !== null);

      if (values.length >= 30) {
        const stats = calculateStats(values);
        statsToCreate.push({
          benchmarkId,
          metricKey: metric,
          n: count, // Usar el count real, no el del sample
          mean: (aggregations._avg as any)[metric],
          median: stats.median,
          stdDev: stats.stdDev,
          min: (aggregations._min as any)[metric],
          max: (aggregations._max as any)[metric],
          p10: stats.p10,
          p25: stats.p25,
          p50: stats.p50,
          p75: stats.p75,
          p90: stats.p90,
          p95: stats.p95,
        });
      }
    }
  }

  if (statsToCreate.length > 0) {
    await prisma.benchmarkStatistic.createMany({
      data: statsToCreate,
    });
  }

  console.log(`📊 Estadísticas calculadas: ${statsToCreate.length} métricas`);
}

// =========================================================
// 🔗 CÁLCULO DE CORRELACIONES (en chunks - TODOS los datos)
// =========================================================
async function calculateAndSaveCorrelations(benchmarkId: string) {
  const { EQ_COMPETENCIES, OUTCOMES } = await import("@/lib/benchmarks");

  console.log("🔗 Iniciando cálculo de correlaciones en chunks...");

  const CHUNK_SIZE = 10000;
  let offset = 0;
  let hasMore = true;

  // Acumuladores para Pearson: r = (n∑xy - ∑x∑y) / √[(n∑x² - (∑x)²)(n∑y² - (∑y)²)]
  // Para cada par competencia-outcome, necesitamos:
  // n, sumX, sumY, sumXY, sumX2, sumY2
  type PairStats = {
    n: number;
    sumX: number;
    sumY: number;
    sumXY: number;
    sumX2: number;
    sumY2: number;
  };

  const pairAccumulators: Record<string, PairStats> = {};

  // Inicializar acumuladores para cada par competencia-outcome
  for (const comp of EQ_COMPETENCIES) {
    for (const out of OUTCOMES) {
      pairAccumulators[`${comp}_${out}`] = {
        n: 0,
        sumX: 0,
        sumY: 0,
        sumXY: 0,
        sumX2: 0,
        sumY2: 0,
      };
    }
  }

  // Procesar en chunks
  while (hasMore) {
    const chunk = await prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId },
      select: {
        K: true, C: true, G: true,
        EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
        effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
        influence: true, decisionMaking: true, community: true, network: true,
        achievement: true, satisfaction: true, balance: true, health: true,
      },
      skip: offset,
      take: CHUNK_SIZE,
    });

    if (chunk.length === 0) {
      hasMore = false;
      break;
    }

    // Acumular estadísticas para cada par
    for (const dp of chunk) {
      for (const comp of EQ_COMPETENCIES) {
        const compVal = (dp as any)[comp];
        if (compVal === null || compVal === undefined) continue;

        for (const out of OUTCOMES) {
          const outVal = (dp as any)[out];
          if (outVal === null || outVal === undefined) continue;

          const key = `${comp}_${out}`;
          const acc = pairAccumulators[key];
          acc.n++;
          acc.sumX += compVal;
          acc.sumY += outVal;
          acc.sumXY += compVal * outVal;
          acc.sumX2 += compVal * compVal;
          acc.sumY2 += outVal * outVal;
        }
      }
    }

    offset += chunk.length;

    if (offset % 50000 === 0) {
      console.log(`🔗 Correlaciones: procesados ${offset} registros...`);
    }

    if (chunk.length < CHUNK_SIZE) {
      hasMore = false;
    }
  }

  console.log(`🔗 Correlaciones: procesados ${offset} registros totales`);

  // Calcular correlaciones finales
  const correlationsToCreate = [];

  for (const comp of EQ_COMPETENCIES) {
    for (const out of OUTCOMES) {
      const key = `${comp}_${out}`;
      const acc = pairAccumulators[key];

      if (acc.n >= 30) {
        // Pearson correlation
        const numerator = acc.n * acc.sumXY - acc.sumX * acc.sumY;
        const denomX = acc.n * acc.sumX2 - acc.sumX * acc.sumX;
        const denomY = acc.n * acc.sumY2 - acc.sumY * acc.sumY;
        const denominator = Math.sqrt(denomX * denomY);

        if (denominator > 0) {
          const correlation = numerator / denominator;

          // Calcular t-statistic y p-value aproximado
          const tStat = correlation * Math.sqrt((acc.n - 2) / (1 - correlation * correlation));
          // Aproximación de p-value (usando distribución normal para n grande)
          const pValue = acc.n > 100
            ? 2 * (1 - normalCDF(Math.abs(tStat)))
            : 0.001; // Placeholder para muestras pequeñas

          // Determinar fuerza y dirección
          const absR = Math.abs(correlation);
          let strength: string;
          if (absR < 0.1) strength = "none";
          else if (absR < 0.3) strength = "weak";
          else if (absR < 0.5) strength = "moderate";
          else if (absR < 0.7) strength = "strong";
          else strength = "very_strong";

          const direction = correlation > 0 ? "positive" : "negative";

          correlationsToCreate.push({
            benchmarkId,
            competencyKey: comp,
            outcomeKey: out,
            correlation,
            pValue,
            n: acc.n,
            strength,
            direction,
          });
        }
      }
    }
  }

  if (correlationsToCreate.length > 0) {
    await prisma.benchmarkCorrelation.createMany({
      data: correlationsToCreate,
    });
  }

  console.log(`🔗 Correlaciones calculadas: ${correlationsToCreate.length} (usando ${offset} registros)`);
}

// Helper: Aproximación de CDF normal estándar
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

// =========================================================
// 🏆 CÁLCULO DE TOP PERFORMERS (en chunks - TODOS los datos)
// =========================================================
async function calculateAndSaveTopPerformers(benchmarkId: string) {
  const { OUTCOMES, EQ_COMPETENCIES, BRAIN_TALENTS } = await import("@/lib/benchmarks");

  console.log("🏆 Iniciando cálculo de top performers en chunks...");

  const CHUNK_SIZE = 10000;
  const PERCENTILE_THRESHOLD = 90;
  const topPerformersToCreate = [];

  // PASO 1: Calcular umbrales de percentil 90 para cada outcome
  // Usar Prisma para obtener los valores ordenados y calcular percentiles
  const outcomeThresholds: Record<string, number> = {};
  const outcomeCounts: Record<string, number> = {};

  for (const outcome of OUTCOMES) {
    // Contar registros con valores válidos
    const count = await prisma.benchmarkDataPoint.count({
      where: {
        benchmarkId,
        [outcome]: { not: null },
      },
    });

    if (count < 30) continue;

    outcomeCounts[outcome] = count;

    // Calcular índice del percentil 90
    const p90Index = Math.floor(count * 0.9);

    // Obtener el valor en ese índice (ordenado ascendente)
    const threshold = await prisma.benchmarkDataPoint.findFirst({
      where: {
        benchmarkId,
        [outcome]: { not: null },
      },
      orderBy: { [outcome]: "asc" },
      skip: p90Index,
      select: { [outcome]: true },
    });

    if (threshold && (threshold as any)[outcome] !== null) {
      outcomeThresholds[outcome] = (threshold as any)[outcome];
      console.log(`🏆 Umbral P90 para ${outcome}: ${outcomeThresholds[outcome]} (n=${count})`);
    }
  }

  // PASO 2: Para cada outcome, procesar top performers en chunks
  for (const outcome of OUTCOMES) {
    if (outcomeThresholds[outcome] === undefined) continue;

    const threshold = outcomeThresholds[outcome];

    // Acumuladores para promedios de competencias
    type CompAccumulator = { sum: number; count: number };
    const compAccumulators: Record<string, CompAccumulator> = {};
    const talentAccumulators: Record<string, CompAccumulator> = {};

    // Inicializar acumuladores
    for (const comp of [...EQ_COMPETENCIES, "K", "C", "G"]) {
      compAccumulators[comp] = { sum: 0, count: 0 };
    }
    for (const talent of BRAIN_TALENTS) {
      talentAccumulators[talent] = { sum: 0, count: 0 };
    }

    // Acumuladores para patrones (top 3 competencias de cada persona)
    const pairCounts: Record<string, { count: number; outcomeSum: number }> = {};

    let topPerformerCount = 0;
    let offset = 0;
    let hasMore = true;

    // Procesar en chunks solo los top performers (donde outcome >= threshold)
    while (hasMore) {
      const chunk = await prisma.benchmarkDataPoint.findMany({
        where: {
          benchmarkId,
          [outcome]: { gte: threshold },
        },
        select: {
          K: true, C: true, G: true,
          EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true,
          effectiveness: true, relationships: true, qualityOfLife: true, wellbeing: true,
          influence: true, decisionMaking: true, community: true, network: true,
          achievement: true, satisfaction: true, balance: true, health: true,
          // Brain Talents (18)
          dataMining: true, modeling: true, prioritizing: true, connection: true,
          emotionalInsight: true, collaboration: true, reflecting: true, adaptability: true,
          criticalThinking: true, resilience: true, riskTolerance: true,
          imagination: true, proactivity: true, commitment: true, problemSolving: true,
          vision: true, designing: true, entrepreneurship: true,
        },
        skip: offset,
        take: CHUNK_SIZE,
      });

      if (chunk.length === 0) {
        hasMore = false;
        break;
      }

      for (const dp of chunk) {
        topPerformerCount++;

        // Acumular competencias (K, C, G y las 8)
        for (const comp of ["K", "C", "G", ...EQ_COMPETENCIES]) {
          const val = (dp as any)[comp];
          if (val !== null && val !== undefined) {
            compAccumulators[comp].sum += val;
            compAccumulators[comp].count++;
          }
        }

        // Acumular talentos (18)
        for (const talent of BRAIN_TALENTS) {
          const val = (dp as any)[talent];
          if (val !== null && val !== undefined) {
            talentAccumulators[talent].sum += val;
            talentAccumulators[talent].count++;
          }
        }

        // Detectar top 3 competencias de esta persona para patrones
        const compScores: { key: string; score: number }[] = [];
        for (const comp of EQ_COMPETENCIES) {
          const score = (dp as any)[comp];
          if (score !== null && score !== undefined) {
            compScores.push({ key: comp, score });
          }
        }
        compScores.sort((a, b) => b.score - a.score);
        const top3 = compScores.slice(0, 3).map((c) => c.key);
        const outcomeValue = (dp as any)[outcome] || 0;

        // Generar pares de competencias
        for (let j = 0; j < top3.length; j++) {
          for (let k = j + 1; k < top3.length; k++) {
            const pair = [top3[j], top3[k]].sort().join("+");
            if (!pairCounts[pair]) {
              pairCounts[pair] = { count: 0, outcomeSum: 0 };
            }
            pairCounts[pair].count++;
            pairCounts[pair].outcomeSum += outcomeValue;
          }
        }
      }

      offset += chunk.length;

      if (chunk.length < CHUNK_SIZE) {
        hasMore = false;
      }
    }

    console.log(`🏆 ${outcome}: ${topPerformerCount} top performers (umbral: ${threshold.toFixed(2)})`);

    if (topPerformerCount < 30) continue;

    // Calcular promedios finales
    const getAvg = (acc: CompAccumulator) =>
      acc.count > 0 ? acc.sum / acc.count : null;

    // Calcular ranking de competencias
    const topCompetencies = EQ_COMPETENCIES.map((comp) => {
      const avg = getAvg(compAccumulators[comp]);
      return {
        key: comp,
        avgScore: avg || 0,
        importance: avg ? Math.min(100, avg) : 0,
        diffFromAvg: 0, // Se calcularía con el promedio global, pero lo simplificamos
      };
    })
      .filter((c) => c.avgScore > 0)
      .sort((a, b) => b.avgScore - a.avgScore);

    // Calcular ranking de talentos
    const topTalents = BRAIN_TALENTS.map((talent) => {
      const avg = getAvg(talentAccumulators[talent]);
      return {
        key: talent,
        avgScore: avg || 0,
        importance: avg ? Math.min(100, avg) : 0,
      };
    })
      .filter((t) => t.avgScore > 0)
      .sort((a, b) => b.importance - a.importance);

    // Calcular patrones comunes (frecuencia >= 20%)
    const commonPatterns = Object.entries(pairCounts)
      .map(([pair, data]) => ({
        competencies: pair.split("+"),
        frequency: Math.round((data.count / topPerformerCount) * 100),
        avgOutcome: data.count > 0 ? data.outcomeSum / data.count : 0,
      }))
      .filter((p) => p.frequency >= 20)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    topPerformersToCreate.push({
      benchmarkId,
      outcomeKey: outcome,
      percentileThreshold: PERCENTILE_THRESHOLD,
      sampleSize: topPerformerCount,
      avgK: getAvg(compAccumulators["K"]),
      avgC: getAvg(compAccumulators["C"]),
      avgG: getAvg(compAccumulators["G"]),
      avgEL: getAvg(compAccumulators["EL"]),
      avgRP: getAvg(compAccumulators["RP"]),
      avgACT: getAvg(compAccumulators["ACT"]),
      avgNE: getAvg(compAccumulators["NE"]),
      avgIM: getAvg(compAccumulators["IM"]),
      avgOP: getAvg(compAccumulators["OP"]),
      avgEMP: getAvg(compAccumulators["EMP"]),
      avgNG: getAvg(compAccumulators["NG"]),
      topCompetencies,
      topTalents,
      commonPatterns,
    });
  }

  if (topPerformersToCreate.length > 0) {
    await prisma.benchmarkTopPerformer.createMany({
      data: topPerformersToCreate,
    });
  }

  console.log(`🏆 Top performers calculados: ${topPerformersToCreate.length} outcomes (usando todos los datos)`);
}

// =========================================================
// 🔄 HELPER: ACTUALIZAR ESTADO DEL JOB
// =========================================================
async function updateJobStatus(
  jobId: string,
  status: string,
  progress: number,
  phase?: string,
  processedRows?: number
) {
  await prisma.benchmarkUploadJob.update({
    where: { id: jobId },
    data: {
      status,
      progress,
      currentPhase: phase,
      ...(processedRows !== undefined && { processedRows }),
      ...(status === "processing" && !processedRows && { startedAt: new Date() }),
    },
  });
}

// =========================================================
// 📦 HELPER: INSERTAR BATCH DE DATA POINTS
// =========================================================
async function insertBatchDataPoints(benchmarkId: string, rows: any[]) {
  const BATCH_SIZE = 1000;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    await prisma.benchmarkDataPoint.createMany({
      data: batch.map((row) => ({
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
        generation: detectGeneration(normalizeAgeRange(row.ageRange)),
        K: row.K,
        C: row.C,
        G: row.G,
        eqTotal: row.eqTotal,
        EL: row.EL,
        RP: row.RP,
        ACT: row.ACT,
        NE: row.NE,
        IM: row.IM,
        OP: row.OP,
        EMP: row.EMP,
        NG: row.NG,
        effectiveness: row.effectiveness,
        relationships: row.relationships,
        qualityOfLife: row.qualityOfLife,
        wellbeing: row.wellbeing,
        influence: row.influence,
        decisionMaking: row.decisionMaking,
        community: row.community,
        network: row.network,
        achievement: row.achievement,
        satisfaction: row.satisfaction,
        balance: row.balance,
        health: row.health,
        // Brain Talents (18)
        dataMining: row.dataMining,
        modeling: row.modeling,
        prioritizing: row.prioritizing,
        connection: row.connection,
        emotionalInsight: row.emotionalInsight,
        collaboration: row.collaboration,
        reflecting: row.reflecting,
        adaptability: row.adaptability,
        criticalThinking: row.criticalThinking,
        resilience: row.resilience,
        riskTolerance: row.riskTolerance,
        imagination: row.imagination,
        proactivity: row.proactivity,
        commitment: row.commitment,
        problemSolving: row.problemSolving,
        vision: row.vision,
        designing: row.designing,
        entrepreneurship: row.entrepreneurship,
        brainStyle: row.brainStyle,
        profile: row.profile,
        reliabilityIndex: row.reliabilityIndex,
      })),
    });
  }
}

// =========================================================
// 📦 HELPER: INSERTAR BATCH DIRECTO (sin subdividir)
// =========================================================
async function insertBatchDataPointsDirect(benchmarkId: string, rows: any[]) {
  if (rows.length === 0) return;

  await prisma.benchmarkDataPoint.createMany({
    data: rows.map((row) => ({
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
      K: row.K,
      C: row.C,
      G: row.G,
      eqTotal: row.eqTotal,
      EL: row.EL,
      RP: row.RP,
      ACT: row.ACT,
      NE: row.NE,
      IM: row.IM,
      OP: row.OP,
      EMP: row.EMP,
      NG: row.NG,
      effectiveness: row.effectiveness,
      relationships: row.relationships,
      qualityOfLife: row.qualityOfLife,
      wellbeing: row.wellbeing,
      influence: row.influence,
      decisionMaking: row.decisionMaking,
      community: row.community,
      network: row.network,
      achievement: row.achievement,
      satisfaction: row.satisfaction,
      balance: row.balance,
      health: row.health,
      // Brain Talents (18)
      dataMining: row.dataMining,
      modeling: row.modeling,
      prioritizing: row.prioritizing,
      connection: row.connection,
      emotionalInsight: row.emotionalInsight,
      collaboration: row.collaboration,
      reflecting: row.reflecting,
      adaptability: row.adaptability,
      criticalThinking: row.criticalThinking,
      resilience: row.resilience,
      riskTolerance: row.riskTolerance,
      imagination: row.imagination,
      proactivity: row.proactivity,
      commitment: row.commitment,
      problemSolving: row.problemSolving,
      vision: row.vision,
      designing: row.designing,
      entrepreneurship: row.entrepreneurship,
      brainStyle: row.brainStyle,
      profile: row.profile,
      reliabilityIndex: row.reliabilityIndex,
    })),
    skipDuplicates: true,
  });
}
