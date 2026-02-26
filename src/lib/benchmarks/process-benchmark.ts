/**
 * 📊 Shared benchmark processing logic.
 *
 * Called directly from start-processing via waitUntil (no HTTP).
 * Also callable from the process-blob API endpoint for manual retries.
 */

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

// 📏 Limits
const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 120000; // 2 min

const BATCH_SIZE = 500;
const PROGRESS_UPDATE_INTERVAL = 500;

// 🔐 SSRF protection
const ALLOWED_BLOB_DOMAINS = [
  "blob.vercel-storage.com",
  "public.blob.vercel-storage.com",
  "*.blob.vercel-storage.com",
];

function isAllowedBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_BLOB_DOMAINS.some((domain) => {
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

  const hasEQData = EQ_COMPETENCIES.some((c) => typeof row[c] === "number");
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
    dataMining: row.dataMining ?? null,
    modeling: row.modeling ?? null,
    prioritizing: row.prioritizing ?? null,
    connection: row.connection ?? null,
    emotionalInsight: row.emotionalInsight ?? null,
    collaboration: row.collaboration ?? null,
    reflecting: row.reflecting ?? null,
    adaptability: row.adaptability ?? null,
    criticalThinking: row.criticalThinking ?? null,
    resilience: row.resilience ?? null,
    riskTolerance: row.riskTolerance ?? null,
    imagination: row.imagination ?? null,
    proactivity: row.proactivity ?? null,
    commitment: row.commitment ?? null,
    problemSolving: row.problemSolving ?? null,
    vision: row.vision ?? null,
    designing: row.designing ?? null,
    entrepreneurship: row.entrepreneurship ?? null,
    brainAgility: row.brainAgility ?? null,
    brainStyle: row.profile || row.brainStyle || null,
    profile: row.profile || null,
    reliabilityIndex: row.reliabilityIndex ?? null,
  };
}

/* =========================================================
   Main processing function — called directly, no HTTP
========================================================= */

export interface ProcessBenchmarkParams {
  benchmarkId: string;
  jobId: string;
  blobUrl: string;
}

export async function processBenchmark({
  benchmarkId,
  jobId,
  blobUrl,
}: ProcessBenchmarkParams): Promise<void> {
  try {
    console.log(`📊 [processBenchmark] Starting: benchmark=${benchmarkId}, job=${jobId}`);
    console.log(`📊 [processBenchmark] Blob URL: ${blobUrl}`);

    // 🛡️ SSRF protection
    if (!isAllowedBlobUrl(blobUrl)) {
      throw new Error(`Invalid blob URL domain: ${blobUrl}`);
    }

    /* ─── Phase 1: Download ──────────────────────────────── */
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: { status: "processing", currentPhase: "downloading", progress: 5, startedAt: new Date() },
    });

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

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File too large: ${(size / 1024 / 1024).toFixed(0)}MB > ${MAX_FILE_SIZE_MB}MB`);
      }
      console.log(`📥 Content-Length: ${(size / 1024 / 1024).toFixed(1)}MB`);
    }

    /* ─── Phase 2: Parse + Import ────────────────────────── */
    await prisma.benchmarkUploadJob.update({
      where: { id: jobId },
      data: { currentPhase: "parsing", progress: 10 },
    });

    let processedRows = 0;
    let validRows = 0;
    let dataPoints: any[] = [];
    let lastProgressUpdate = 0;
    let totalDataRows = 0;

    async function flushBatch() {
      if (dataPoints.length === 0) return;
      await prisma.benchmarkDataPoint.createMany({
        data: dataPoints,
        skipDuplicates: true,
      });
      dataPoints = [];
    }

    async function updateProgress(force = false) {
      if (!force && processedRows - lastProgressUpdate < PROGRESS_UPDATE_INTERVAL) return;
      const pct = totalDataRows > 0
        ? Math.min(15 + Math.round((processedRows / totalDataRows) * 80), 95)
        : 15;
      await prisma.benchmarkUploadJob.update({
        where: { id: jobId },
        data: { processedRows: validRows, currentRow: processedRows, currentPhase: "importing", progress: pct },
      });
      lastProgressUpdate = processedRows;
      if (processedRows % 5000 === 0 || force) {
        console.log(`📊 Progress: ${processedRows}/${totalDataRows} (${validRows} valid)`);
      }
    }

    if (isExcelFile) {
      /* ─── Excel ──────────────────────────────────────────── */
      const fileBuffer = await response.arrayBuffer();
      console.log(`📥 Downloaded Excel in ${Date.now() - startDownload}ms (${(fileBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)`);

      const buffer = Buffer.from(fileBuffer);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

      if (rows.length === 0) throw new Error("Excel vacío o sin datos");

      const rawHeaders = Object.keys(rows[0]);
      totalDataRows = rows.length;
      console.log(`📊 Excel: ${totalDataRows} rows, ${rawHeaders.length} columns`);

      await prisma.benchmarkUploadJob.update({
        where: { id: jobId },
        data: { totalRows: totalDataRows, currentPhase: "importing", progress: 20 },
      });

      for (const rawRow of rows) {
        const dp = buildDataPoint(rawRow, rawHeaders, benchmarkId);
        if (dp) {
          dataPoints.push(dp);
          validRows++;
          if (dataPoints.length >= BATCH_SIZE) await flushBatch();
        }
        processedRows++;
        await updateProgress();
      }
    } else {
      /* ─── CSV: streaming ─────────────────────────────────── */
      const text = await response.text();
      console.log(`📥 Downloaded CSV in ${Date.now() - startDownload}ms (${(text.length / 1024 / 1024).toFixed(1)}MB)`);

      const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
      const lines = cleanText.split(/\r?\n/);

      let headerIdx = 0;
      while (headerIdx < lines.length && !lines[headerIdx].trim()) headerIdx++;
      if (headerIdx >= lines.length - 1) throw new Error("CSV vacío o sin datos");

      const rawHeaders = parseCSVLine(lines[headerIdx]);

      // Count data rows
      for (let i = headerIdx + 1; i < lines.length; i++) {
        if (lines[i].trim()) totalDataRows++;
      }

      console.log(`📊 CSV: ~${totalDataRows} rows, ${rawHeaders.length} columns`);
      console.log(`📊 Headers: ${rawHeaders.slice(0, 15).join(", ")}`);

      await prisma.benchmarkUploadJob.update({
        where: { id: jobId },
        data: { totalRows: totalDataRows, currentPhase: "importing", progress: 15 },
      });

      // Process line by line
      for (let i = headerIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = parseCSVLine(line);
        const rawRow: Record<string, any> = {};
        for (let c = 0; c < rawHeaders.length; c++) {
          rawRow[rawHeaders[c]] = values[c] || null;
        }

        // Free memory
        lines[i] = "" as any;

        const dp = buildDataPoint(rawRow, rawHeaders, benchmarkId);
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

  } catch (error) {
    console.error(`❌ [processBenchmark] Error:`, error);

    try {
      await prisma.benchmarkUploadJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      });
      await prisma.benchmark.update({
        where: { id: benchmarkId },
        data: { status: "FAILED" },
      });
    } catch (dbErr) {
      console.error("❌ Failed to update error status:", dbErr);
    }

    // Re-throw so callers can handle
    throw error;
  }
}
