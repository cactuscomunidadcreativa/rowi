/**
 * 📊 API: Process Benchmark from Vercel Blob
 * POST /api/admin/benchmarks/process-blob
 *
 * Procesa el archivo completo en una sola llamada de hasta 5 minutos.
 * Usa el SOH_COLUMN_MAPPING para mapear columnas del Excel a campos del modelo.
 *
 * ⚠️ SEGURIDAD:
 * - Requiere autenticación de admin o token de servicio
 * - Solo acepta URLs de dominios permitidos (Vercel Blob)
 * - Límite de tamaño de archivo
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import * as XLSX from "xlsx";
import {
  EQ_COMPETENCIES,
  SOH_COLUMN_MAPPING,
  NUMERIC_COLUMNS,
  OUTCOMES,
  BRAIN_TALENTS,
  normalizeAgeRange,
  detectGeneration,
  extractDateInfo,
  pearsonCorrelation,
} from "@/lib/benchmarks";

export const maxDuration = 300; // 5 minutos

// 🔐 Dominios permitidos para blobUrl (prevenir SSRF)
const ALLOWED_BLOB_DOMAINS = [
  "blob.vercel-storage.com",
  "public.blob.vercel-storage.com",
  "*.blob.vercel-storage.com",
];

// 📏 Límites de seguridad
const MAX_FILE_SIZE_MB = 100; // 100MB máximo
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 60000; // 60 segundos para descarga

/**
 * Verifica si el usuario es administrador del sistema
 */
async function isSystemAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const hubAdmins = process.env.HUB_ADMINS || "";
  const adminEmails = hubAdmins.split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Valida que la URL sea de un dominio permitido
 */
function isAllowedBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    return ALLOWED_BLOB_DOMAINS.some(domain => {
      if (domain.startsWith("*.")) {
        // Wildcard match
        const baseDomain = domain.slice(2);
        return hostname.endsWith(baseDomain) || hostname === baseDomain.slice(1);
      }
      return hostname === domain;
    });
  } catch {
    return false;
  }
}

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
    // 🔐 Verificar autenticación: sesión de admin, token de servicio, o llamada interna
    const serviceToken = req.headers.get("x-service-token");
    const expectedToken = process.env.BENCHMARK_SERVICE_TOKEN;
    const internalCall = req.headers.get("x-internal-call") === "true";

    // Si hay token de servicio válido o es llamada interna, permitir
    const hasValidServiceToken = serviceToken && expectedToken && serviceToken === expectedToken;

    if (!hasValidServiceToken && !internalCall) {
      // Verificar sesión de usuario admin
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: "Unauthorized - Authentication required" },
          { status: 401 }
        );
      }
      if (!(await isSystemAdmin(session.user.email))) {
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
    }

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

    // 🛡️ Validar que blobUrl sea de un dominio permitido (prevenir SSRF)
    if (!isAllowedBlobUrl(blobUrl)) {
      console.error(`⚠️ Blocked SSRF attempt: ${blobUrl}`);
      return NextResponse.json(
        { error: "Invalid blob URL - only Vercel Blob URLs are allowed" },
        { status: 400 }
      );
    }

    // 🔍 Verificar que el benchmark existe y pertenece al job
    const benchmark = await prisma.benchmark.findUnique({
      where: { id: benchmarkId },
    });
    if (!benchmark) {
      return NextResponse.json(
        { error: "Benchmark not found" },
        { status: 404 }
      );
    }

    const job = await prisma.benchmarkUploadJob.findUnique({
      where: { id: jobId },
    });
    if (!job || job.benchmarkId !== benchmarkId) {
      return NextResponse.json(
        { error: "Invalid job or job does not match benchmark" },
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

    // Detectar si es Excel basado en la URL
    const isExcelFile = blobUrl.toLowerCase().includes('.xlsx') ||
                        blobUrl.toLowerCase().includes('.xls');

    // 📏 Fetch con timeout y validación de tamaño
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(blobUrl, {
        signal: controller.signal,
        headers: isExcelFile
          ? { "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream" }
          : { "Accept": "text/csv, text/plain, application/csv" },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.status}`);
    }

    // Verificar Content-Length si está disponible
    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File too large: ${(size / 1024 / 1024).toFixed(1)}MB exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      }
    }

    // Para Excel, obtener como ArrayBuffer; para CSV, como texto
    let text: string;
    let fileBuffer: ArrayBuffer | null = null;

    if (isExcelFile) {
      fileBuffer = await response.arrayBuffer();
      text = Buffer.from(fileBuffer).toString('binary'); // Para compatibilidad con xlsx
      console.log(`📥 Download completed in ${Date.now() - startDownload}ms (${(fileBuffer.byteLength / 1024 / 1024).toFixed(2)}MB) [Excel]`);
    } else {
      text = await response.text();
      console.log(`📥 Download completed in ${Date.now() - startDownload}ms (${(text.length / 1024 / 1024).toFixed(2)}MB) [CSV]`);
    }

    // Verificar tamaño después de descargar (por si no había Content-Length)
    const downloadedSize = fileBuffer ? fileBuffer.byteLength : text.length;
    if (downloadedSize > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File too large: ${(downloadedSize / 1024 / 1024).toFixed(1)}MB exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    }

    // Fase 2: Parsing
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        currentPhase: "parsing",
        progress: 15,
      },
    });

    let rows: Record<string, any>[] = [];
    let rawHeaders: string[] = [];

    if (isExcelFile) {
      console.log(`📊 Parsing Excel file...`);
      // Parse Excel usando xlsx - usar el buffer directamente
      const buffer = fileBuffer ? Buffer.from(fileBuffer) : Buffer.from(text, 'binary');
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      console.log(`📊 Excel sheet: ${sheetName}, sheets available: ${workbook.SheetNames.join(", ")}`);

      // Obtener como JSON con headers
      rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

      if (rows.length === 0) {
        throw new Error("Excel vacío o sin datos");
      }

      // Extraer headers del primer objeto
      rawHeaders = Object.keys(rows[0]);
      console.log(`📊 Excel parsed: ${rows.length} rows, ${rawHeaders.length} columns`);
      console.log(`📊 Sample headers: ${rawHeaders.slice(0, 15).join(", ")}`);
    } else {
      console.log(`📊 Parsing CSV...`);
      const lines = text.split(/\r?\n/).filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error("CSV vacío o sin datos");
      }

      rawHeaders = parseCSVLine(lines[0]);

      // Convertir CSV a array de objetos
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const values = parseCSVLine(line);
        const rowObj: Record<string, any> = {};
        rawHeaders.forEach((header, idx) => {
          rowObj[header] = values[idx] || null;
        });
        rows.push(rowObj);
      }
    }

    console.log(`📊 Raw headers (first 10): ${rawHeaders.slice(0, 10).join(", ")}`);

    // Mapear headers usando SOH_COLUMN_MAPPING
    const mappedHeaders = rawHeaders.map(h => SOH_COLUMN_MAPPING[h] || h);
    console.log(`📊 Mapped headers (first 10): ${mappedHeaders.slice(0, 10).join(", ")}`);

    const totalDataRows = rows.length;
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

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];

      // Crear row con headers mapeados
      const row: Record<string, any> = {};
      rawHeaders.forEach((header) => {
        const mappedHeader = SOH_COLUMN_MAPPING[header] || header;
        const value = rawRow[header];
        // Convertir a número si es una columna numérica
        if (NUMERIC_COLUMNS.includes(mappedHeader)) {
          const num = parseFloat(value);
          row[mappedHeader] = isNaN(num) ? null : num;
        } else {
          row[mappedHeader] = value || null;
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
          // Brain Talents - FOCUS cluster
          dataMining: row.dataMining ?? null,
          modeling: row.modeling ?? null,
          prioritizing: row.prioritizing ?? null,
          connection: row.connection ?? null,
          emotionalInsight: row.emotionalInsight ?? null,
          collaboration: row.collaboration ?? null,
          // Brain Talents - DECISIONS cluster
          reflecting: row.reflecting ?? null,
          adaptability: row.adaptability ?? null,
          criticalThinking: row.criticalThinking ?? null,
          resilience: row.resilience ?? null,
          riskTolerance: row.riskTolerance ?? null,
          imagination: row.imagination ?? null,
          // Brain Talents - DRIVE cluster
          proactivity: row.proactivity ?? null,
          commitment: row.commitment ?? null,
          problemSolving: row.problemSolving ?? null,
          vision: row.vision ?? null,
          designing: row.designing ?? null,
          entrepreneurship: row.entrepreneurship ?? null,
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

    // Fase 4: Finalizar (correlaciones y top performers se calculan manualmente)
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: {
        currentPhase: "finalizing",
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
