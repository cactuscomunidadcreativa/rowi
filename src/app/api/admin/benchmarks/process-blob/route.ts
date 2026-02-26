/**
 * 📊 API: Process Benchmark from Vercel Blob
 * POST /api/admin/benchmarks/process-blob
 *
 * Procesa archivos CSV/Excel de hasta 500MB.
 * CSV: streaming line-by-line (memory efficient for large files).
 * Excel: buffer-based (requires full file in memory).
 *
 * ⚠️ SEGURIDAD:
 * - Requiere autenticación de admin o token de servicio
 * - Solo acepta URLs de dominios permitidos (Vercel Blob)
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
  normalizeAgeRange,
  detectGeneration,
  extractDateInfo,
} from "@/lib/benchmarks";

export const maxDuration = 300; // 5 minutos

// 🔐 Dominios permitidos para blobUrl (prevenir SSRF)
const ALLOWED_BLOB_DOMAINS = [
  "blob.vercel-storage.com",
  "public.blob.vercel-storage.com",
  "*.blob.vercel-storage.com",
];

// 📏 Límites — matched to client-side upload limit (500MB)
const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 120000; // 2 minutos para archivos grandes

const BATCH_SIZE = 500;
const PROGRESS_UPDATE_INTERVAL = 500; // Update every 500 rows (less DB writes)

/* =========================================================
   Helpers
========================================================= */

async function isSystemAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const hubAdmins = process.env.HUB_ADMINS || "";
  const adminEmails = hubAdmins.split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

function isAllowedBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_BLOB_DOMAINS.some(domain => {
      if (domain.startsWith("*.")) {
        const baseDomain = domain.slice(2);
        return hostname.endsWith(baseDomain) || hostname === baseDomain.slice(1);
      }
      return hostname === domain;
    });
  } catch {
    return false;
  }
}

/** Derive a service token from NEXTAUTH_SECRET (always available) */
function getExpectedServiceToken(): string {
  return process.env.BENCHMARK_SERVICE_TOKEN
    || `rowi-service-${(process.env.NEXTAUTH_SECRET || "").slice(0, 16)}`;
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

/**
 * Build a data point from a raw row using header mapping.
 * Returns null if the row has no valid EQ data.
 */
function buildDataPoint(
  rawRow: Record<string, any>,
  rawHeaders: string[],
  benchmarkId: string
): Record<string, any> | null {
  const row: Record<string, any> = {};
  for (const header of rawHeaders) {
    const mapped = SOH_COLUMN_MAPPING[header] || header;
    const value = rawRow[header];
    if (NUMERIC_COLUMNS.includes(mapped)) {
      const num = parseFloat(value);
      row[mapped] = isNaN(num) ? null : num;
    } else {
      row[mapped] = value || null;
    }
  }

  // Must have at least one EQ competency value
  const hasEQData = EQ_COMPETENCIES.some(c => typeof row[c] === "number");
  if (!hasEQData) return null;

  const dateInfo = extractDateInfo(row.year || row.sourceDate);
  const ageRange = normalizeAgeRange(row.ageRange);

  return {
    benchmarkId,
    sourceType: "soh",
    country: row.country || null,
    region: row.region || null,
    jobFunction: row.jobFunction || null,
    jobRole: row.jobRole || null,
    sector: row.sector || null,
    ageRange,
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
    // Brain Talents - FOCUS
    dataMining: row.dataMining ?? null,
    modeling: row.modeling ?? null,
    prioritizing: row.prioritizing ?? null,
    connection: row.connection ?? null,
    emotionalInsight: row.emotionalInsight ?? null,
    collaboration: row.collaboration ?? null,
    // Brain Talents - DECISIONS
    reflecting: row.reflecting ?? null,
    adaptability: row.adaptability ?? null,
    criticalThinking: row.criticalThinking ?? null,
    resilience: row.resilience ?? null,
    riskTolerance: row.riskTolerance ?? null,
    imagination: row.imagination ?? null,
    // Brain Talents - DRIVE
    proactivity: row.proactivity ?? null,
    commitment: row.commitment ?? null,
    problemSolving: row.problemSolving ?? null,
    vision: row.vision ?? null,
    designing: row.designing ?? null,
    entrepreneurship: row.entrepreneurship ?? null,
    // Brain Agility
    brainAgility: row.brainAgility ?? null,
    // Profile / Brain Style
    brainStyle: row.profile || row.brainStyle || null,
    profile: row.profile || null,
    // Quality
    reliabilityIndex: row.reliabilityIndex ?? null,
  };
}

/* =========================================================
   Main handler
========================================================= */

interface ProcessBlobBody {
  benchmarkId: string;
  jobId: string;
  blobUrl: string;
}

export async function POST(req: NextRequest) {
  let benchmarkId: string | undefined;
  let jobId: string | undefined;

  try {
    // 🔐 Auth: service token (internal) or admin session
    const serviceToken = req.headers.get("x-service-token");
    const expectedToken = getExpectedServiceToken();
    const hasValidServiceToken = serviceToken && serviceToken === expectedToken;

    if (!hasValidServiceToken) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        console.error("❌ process-blob: No valid service token and no session");
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
    } else {
      console.log("✅ process-blob: Authenticated via service token");
    }

    const body: ProcessBlobBody = await req.json();
    benchmarkId = body.benchmarkId;
    jobId = body.jobId;
    const { blobUrl } = body;

    if (!benchmarkId || !jobId || !blobUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 🛡️ SSRF protection
    if (!isAllowedBlobUrl(blobUrl)) {
      console.error(`⚠️ Blocked SSRF attempt: ${blobUrl}`);
      return NextResponse.json(
        { error: "Invalid blob URL - only Vercel Blob URLs are allowed" },
        { status: 400 }
      );
    }

    // Verify benchmark + job exist
    const [benchmark, job] = await Promise.all([
      prisma.benchmark.findUnique({ where: { id: benchmarkId } }),
      prisma.benchmarkUploadJob.findUnique({ where: { id: jobId } }),
    ]);

    if (!benchmark) {
      return NextResponse.json({ error: "Benchmark not found" }, { status: 404 });
    }
    if (!job || job.benchmarkId !== benchmarkId) {
      return NextResponse.json({ error: "Invalid job" }, { status: 400 });
    }

    /* ─── Phase 1: Download ──────────────────────────────── */
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: { status: "processing", currentPhase: "downloading", progress: 5, startedAt: new Date() },
    });

    console.log(`📥 Downloading: ${blobUrl}`);
    const startDownload = Date.now();

    const isExcelFile =
      blobUrl.toLowerCase().includes(".xlsx") ||
      blobUrl.toLowerCase().includes(".xls");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(blobUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Download failed: HTTP ${response.status}`);
    }

    // Check size via Content-Length header (before downloading full body)
    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File too large: ${(size / 1024 / 1024).toFixed(0)}MB exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      }
      console.log(`📥 Content-Length: ${(size / 1024 / 1024).toFixed(1)}MB`);
    }

    /* ─── Phase 2: Parse + Import (streaming for CSV) ────── */
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: { currentPhase: "parsing", progress: 10 },
    });

    let processedRows = 0;
    let validRows = 0;
    let dataPoints: any[] = [];
    let lastProgressUpdate = 0;
    let totalDataRows = 0;

    /** Flush current batch to DB */
    async function flushBatch() {
      if (dataPoints.length === 0) return;
      await prisma.benchmarkDataPoint.createMany({
        data: dataPoints,
        skipDuplicates: true,
      });
      dataPoints = [];
    }

    /** Update progress in DB (throttled) */
    async function updateProgress(force = false) {
      if (!force && processedRows - lastProgressUpdate < PROGRESS_UPDATE_INTERVAL) return;
      const pct = totalDataRows > 0
        ? Math.min(15 + Math.round((processedRows / totalDataRows) * 80), 95)
        : 15;
      await prisma.benchmarkUploadJob.update({
        where: { id: jobId! },
        data: {
          processedRows: validRows,
          currentRow: processedRows,
          currentPhase: "importing",
          progress: pct,
        },
      });
      lastProgressUpdate = processedRows;
      if (processedRows % 5000 === 0 || force) {
        console.log(`📊 Progress: ${processedRows}/${totalDataRows} (${validRows} valid)`);
      }
    }

    if (isExcelFile) {
      /* ─── Excel: buffer-based (must load full file) ──────── */
      const fileBuffer = await response.arrayBuffer();
      console.log(`📥 Downloaded Excel in ${Date.now() - startDownload}ms (${(fileBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)`);

      const buffer = Buffer.from(fileBuffer);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      console.log(`📊 Excel sheet: ${sheetName}`);
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

      if (rows.length === 0) throw new Error("Excel vacío o sin datos");

      const rawHeaders = Object.keys(rows[0]);
      totalDataRows = rows.length;
      console.log(`📊 Excel: ${totalDataRows} rows, ${rawHeaders.length} columns`);
      console.log(`📊 Headers: ${rawHeaders.slice(0, 15).join(", ")}`);

      await prisma.benchmarkUploadJob.update({
        where: { id: jobId },
        data: { totalRows: totalDataRows, currentPhase: "importing", progress: 20 },
      });

      for (const rawRow of rows) {
        const dp = buildDataPoint(rawRow, rawHeaders, benchmarkId!);
        if (dp) {
          dataPoints.push(dp);
          validRows++;
          if (dataPoints.length >= BATCH_SIZE) await flushBatch();
        }
        processedRows++;
        await updateProgress();
      }

    } else {
      /* ─── CSV: streaming line-by-line (memory efficient) ── */
      const text = await response.text();
      const downloadMs = Date.now() - startDownload;
      console.log(`📥 Downloaded CSV in ${downloadMs}ms (${(text.length / 1024 / 1024).toFixed(1)}MB)`);

      // Strip BOM
      const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;

      // Split into lines — we only keep the reference, not copies
      const lines = cleanText.split(/\r?\n/);
      const totalLines = lines.length;

      // Find header line
      let headerIdx = 0;
      while (headerIdx < totalLines && !lines[headerIdx].trim()) headerIdx++;
      if (headerIdx >= totalLines - 1) throw new Error("CSV vacío o sin datos");

      const rawHeaders = parseCSVLine(lines[headerIdx]);
      totalDataRows = 0;

      // Count non-empty data lines
      for (let i = headerIdx + 1; i < totalLines; i++) {
        if (lines[i].trim()) totalDataRows++;
      }

      console.log(`📊 CSV: ~${totalDataRows} rows, ${rawHeaders.length} columns`);
      console.log(`📊 Headers: ${rawHeaders.slice(0, 15).join(", ")}`);

      await prisma.benchmarkUploadJob.update({
        where: { id: jobId },
        data: { totalRows: totalDataRows, currentPhase: "importing", progress: 15 },
      });

      // Process line by line — no intermediate rows array
      for (let i = headerIdx + 1; i < totalLines; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Parse this single line into an object
        const values = parseCSVLine(line);
        const rawRow: Record<string, any> = {};
        for (let c = 0; c < rawHeaders.length; c++) {
          rawRow[rawHeaders[c]] = values[c] || null;
        }

        // Free the line from memory (allow GC)
        lines[i] = "" as any;

        const dp = buildDataPoint(rawRow, rawHeaders, benchmarkId!);
        if (dp) {
          dataPoints.push(dp);
          validRows++;
          if (dataPoints.length >= BATCH_SIZE) await flushBatch();
        }
        processedRows++;
        await updateProgress();
      }
    }

    // Flush remaining
    await flushBatch();
    await updateProgress(true);

    console.log(`📊 Import done: ${validRows} valid / ${processedRows} total`);

    /* ─── Phase 4: Finalize ──────────────────────────────── */
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: { currentPhase: "finalizing", progress: 95 },
    });

    const finalCount = await prisma.benchmarkDataPoint.count({
      where: { benchmarkId },
    });

    await prisma.benchmark.update({
      where: { id: benchmarkId },
      data: { status: "COMPLETED", totalRows: finalCount },
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

    console.log(`✅ Benchmark ${benchmarkId} completed: ${finalCount} rows`);

    return NextResponse.json({
      ok: true,
      status: "completed",
      benchmarkId,
      totalRows: finalCount,
      message: "Processing completed",
    });
  } catch (error) {
    console.error("❌ process-blob error:", error);

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
    } catch (dbErr) {
      console.error("❌ Failed to update error status:", dbErr);
    }

    return NextResponse.json(
      { error: "Processing failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
