"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Zap,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   📊 Upload Benchmark — Chunked Upload para archivos grandes

   Flujo:
   1. Usuario selecciona archivo CSV/Excel
   2. Frontend parsea el archivo en chunks de 50,000 filas
   3. Cada chunk se envía al backend por separado
   4. Se muestra progreso en tiempo real
   5. Al final se calculan estadísticas
========================================================= */

interface UploadState {
  phase: "idle" | "parsing" | "uploading" | "finalizing" | "completed" | "error";
  progress: number;
  currentChunk: number;
  totalChunks: number;
  processedRows: number;
  totalRows: number;
  message: string;
  error?: string;
}

const CHUNK_SIZE = 1000; // Filas por chunk (1k para no exceder el límite de 4.5MB de Vercel)

const BENCHMARK_TYPES = [
  { value: "ROWIVERSE", labelKey: "admin.benchmarks.types.rowiverse" },
  { value: "EXTERNAL", labelKey: "admin.benchmarks.types.external" },
  { value: "INTERNAL", labelKey: "admin.benchmarks.types.internal" },
];

const BENCHMARK_SCOPES = [
  { value: "GLOBAL", labelKey: "admin.benchmarks.scopes.global" },
  { value: "REGION", labelKey: "admin.benchmarks.scopes.region" },
  { value: "COUNTRY", labelKey: "admin.benchmarks.scopes.country" },
  { value: "SECTOR", labelKey: "admin.benchmarks.scopes.sector" },
  { value: "TENANT", labelKey: "admin.benchmarks.scopes.tenant" },
  { value: "HUB", labelKey: "admin.benchmarks.scopes.hub" },
];

// Mapeo de columnas SOH (simplificado)
const SOH_COLUMN_MAPPING: Record<string, string> = {
  "Country": "country",
  "Region": "region",
  "Job_Function": "jobFunction",
  "Job_Role": "jobRole",
  "Sector": "sector",
  "Age_Range": "ageRange",
  "Gender": "gender",
  "Education": "education",
  "Year": "year",
  "K": "K",
  "C": "C",
  "G": "G",
  "EQ": "eqTotal",
  "EL": "EL",
  "RP": "RP",
  "ACT": "ACT",
  "NE": "NE",
  "IM": "IM",
  "OP": "OP",
  "EMP": "EMP",
  "NG": "NG",
  "Effectiveness": "effectiveness",
  "Relationships": "relationships",
  "Quality_of_Life": "qualityOfLife",
  "Wellbeing": "wellbeing",
  "Influence": "influence",
  "Decision_Making": "decisionMaking",
  "Community": "community",
  "Network": "network",
  "Achievement": "achievement",
  "Satisfaction": "satisfaction",
  "Balance": "balance",
  "Health": "health",
};

export default function UploadBenchmarkPage() {
  const { t } = useI18n();
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("ROWIVERSE");
  const [scope, setScope] = useState("GLOBAL");
  const [isLearning, setIsLearning] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const [uploadState, setUploadState] = useState<UploadState>({
    phase: "idle",
    progress: 0,
    currentChunk: 0,
    totalChunks: 0,
    processedRows: 0,
    totalRows: 0,
    message: "",
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      toast.error(t("admin.benchmarks.errors.invalidFormat") || "Formato no válido. Use .xlsx, .xls o .csv");
      return;
    }

    if (selectedFile.size > 600 * 1024 * 1024) {
      toast.error(t("admin.benchmarks.errors.fileTooLarge") || "Archivo muy grande (máx 600MB)");
      return;
    }

    setFile(selectedFile);
    if (!name) {
      const baseName = selectedFile.name.replace(/\.(xlsx|xls|csv)$/i, "");
      setName(baseName);
    }
  };

  // =========================================================
  // 🚀 PROCESO DE UPLOAD CHUNKED
  // =========================================================
  const handleUpload = async () => {
    if (!file || !name.trim()) {
      toast.error(t("admin.benchmarks.errors.noData") || "Selecciona un archivo y nombre");
      return;
    }

    abortControllerRef.current = new AbortController();

    try {
      // Fase 1: Parsear archivo
      setUploadState({
        phase: "parsing",
        progress: 0,
        currentChunk: 0,
        totalChunks: 0,
        processedRows: 0,
        totalRows: 0,
        message: "Leyendo archivo...",
      });

      const { headers, rows } = await parseFile(file);
      const totalRows = rows.length;
      const totalChunks = Math.ceil(totalRows / CHUNK_SIZE);

      setUploadState((prev) => ({
        ...prev,
        totalRows,
        totalChunks,
        message: `Archivo parseado: ${totalRows.toLocaleString()} filas`,
      }));

      // Fase 2: Inicializar upload
      setUploadState((prev) => ({
        ...prev,
        phase: "uploading",
        progress: 5,
        message: "Inicializando upload...",
      }));

      const initRes = await fetch("/api/admin/benchmarks/init-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          scope,
          isLearning,
          totalRows,
          totalChunks,
          filename: file.name,
        }),
        signal: abortControllerRef.current.signal,
      });

      const initData = await initRes.json();

      if (!initData.ok) {
        throw new Error(initData.error || "Error inicializando upload");
      }

      const { benchmarkId, jobId } = initData;

      // Fase 3: Subir chunks
      let processedRows = 0;

      for (let i = 0; i < totalChunks; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Upload cancelado");
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalRows);
        const chunkRows = rows.slice(start, end);

        // Mapear filas a objetos (solo incluir valores no vacíos para reducir payload)
        const mappedRows = chunkRows.map((row) => {
          const obj: Record<string, any> = {};
          headers.forEach((header, idx) => {
            const value = row[idx];
            // Solo incluir si tiene valor (reduce tamaño del JSON significativamente)
            if (value !== null && value !== undefined && value !== "") {
              const mappedKey = SOH_COLUMN_MAPPING[header] || header.toLowerCase().replace(/\s+/g, "_");
              obj[mappedKey] = value;
            }
          });
          return obj;
        });

        setUploadState((prev) => ({
          ...prev,
          currentChunk: i + 1,
          progress: 5 + Math.round(((i + 1) / totalChunks) * 65),
          message: `Subiendo chunk ${i + 1}/${totalChunks}...`,
        }));

        const chunkRes = await fetch("/api/admin/benchmarks/upload-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            benchmarkId,
            jobId,
            chunkIndex: i,
            totalChunks,
            rows: mappedRows,
            isLastChunk: i === totalChunks - 1,
          }),
          signal: abortControllerRef.current.signal,
        });

        // Manejar errores HTTP antes de parsear JSON
        if (!chunkRes.ok) {
          const errorText = await chunkRes.text();
          throw new Error(`Error HTTP ${chunkRes.status}: ${errorText.slice(0, 200)}`);
        }

        const chunkData = await chunkRes.json();

        if (!chunkData.ok) {
          throw new Error(chunkData.error || `Error en chunk ${i + 1}`);
        }

        processedRows += chunkData.insertedRows;

        setUploadState((prev) => ({
          ...prev,
          processedRows,
          message: `Chunk ${i + 1}/${totalChunks} completado (${processedRows.toLocaleString()} filas)`,
        }));
      }

      // Fase 4: Finalizar y calcular estadísticas
      setUploadState((prev) => ({
        ...prev,
        phase: "finalizing",
        progress: 75,
        message: "Calculando estadísticas...",
      }));

      const finalizeRes = await fetch("/api/admin/benchmarks/finalize-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benchmarkId, jobId }),
        signal: abortControllerRef.current.signal,
      });

      const finalizeData = await finalizeRes.json();

      if (!finalizeData.ok) {
        throw new Error(finalizeData.error || "Error finalizando benchmark");
      }

      // Completado!
      setUploadState((prev) => ({
        ...prev,
        phase: "completed",
        progress: 100,
        processedRows: finalizeData.totalRows,
        message: `¡Completado! ${finalizeData.totalRows.toLocaleString()} filas procesadas`,
      }));

      toast.success("Benchmark procesado exitosamente");

      setTimeout(() => {
        router.push(`/hub/admin/benchmarks/${benchmarkId}`);
      }, 2000);
    } catch (error: any) {
      console.error("Upload error:", error);

      if (error.name === "AbortError" || error.message === "Upload cancelado") {
        setUploadState((prev) => ({
          ...prev,
          phase: "idle",
          progress: 0,
          message: "",
        }));
        toast.info("Upload cancelado");
      } else {
        setUploadState((prev) => ({
          ...prev,
          phase: "error",
          error: error.message || "Error desconocido",
          message: "Error en el upload",
        }));
        toast.error(error.message || "Error procesando archivo");
      }
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setUploadState({
      phase: "idle",
      progress: 0,
      currentChunk: 0,
      totalChunks: 0,
      processedRows: 0,
      totalRows: 0,
      message: "",
    });
  };

  const isUploading = ["parsing", "uploading", "finalizing"].includes(uploadState.phase);

  return (
    <AdminPage
      titleKey="admin.benchmarks.upload.title"
      descriptionKey="admin.benchmarks.upload.description"
      icon={Upload}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Dropzone */}
        <AdminCard>
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${dragActive ? "border-[var(--rowi-primary)] bg-[var(--rowi-primary)]/5" : "border-[var(--rowi-card-border)]"}
              ${file ? "bg-green-50 dark:bg-green-900/10 border-green-500" : ""}
              ${isUploading ? "pointer-events-none opacity-60" : ""}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />

            {file ? (
              <div className="flex items-center justify-center gap-4">
                <FileSpreadsheet className="w-12 h-12 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-[var(--rowi-foreground)]">{file.name}</p>
                  <p className="text-sm text-[var(--rowi-muted)]">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto text-[var(--rowi-muted)] mb-4" />
                <p className="text-[var(--rowi-foreground)] font-medium mb-1">
                  {t("admin.benchmarks.upload.dropzone") || "Arrastra tu archivo aquí o haz clic para seleccionar"}
                </p>
                <p className="text-sm text-[var(--rowi-muted)]">
                  CSV, Excel (.xlsx, .xls) • Hasta 600MB
                </p>
              </>
            )}
          </div>
        </AdminCard>

        {/* Form */}
        <AdminCard>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-1">
                {t("admin.benchmarks.upload.benchmarkName") || "Nombre del Benchmark"} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
                placeholder="SOH 2018-2024 Global"
                disabled={isUploading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-1">
                  {t("admin.benchmarks.upload.benchmarkType") || "Tipo"}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)]"
                  disabled={isUploading}
                >
                  {BENCHMARK_TYPES.map((t_) => (
                    <option key={t_.value} value={t_.value}>
                      {t(t_.labelKey) || t_.value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-1">
                  {t("admin.benchmarks.upload.benchmarkScope") || "Alcance"}
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)]"
                  disabled={isUploading}
                >
                  {BENCHMARK_SCOPES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {t(s.labelKey) || s.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isLearning"
                checked={isLearning}
                onChange={(e) => setIsLearning(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[var(--rowi-primary)]"
                disabled={isUploading}
              />
              <label htmlFor="isLearning" className="text-sm text-[var(--rowi-foreground)]">
                {t("admin.benchmarks.upload.enableLearning") || "Usar para entrenamiento de IA"}
              </label>
            </div>
          </div>
        </AdminCard>

        {/* Progress */}
        {uploadState.phase !== "idle" && (
          <AdminCard>
            <div className="space-y-4">
              {/* Phase indicator */}
              <div className="flex items-center gap-3">
                {uploadState.phase === "completed" ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : uploadState.phase === "error" ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-primary)]" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-[var(--rowi-foreground)]">
                    {uploadState.phase === "parsing" && "Parseando archivo..."}
                    {uploadState.phase === "uploading" && `Subiendo datos (${uploadState.currentChunk}/${uploadState.totalChunks})`}
                    {uploadState.phase === "finalizing" && "Calculando estadísticas..."}
                    {uploadState.phase === "completed" && "¡Completado!"}
                    {uploadState.phase === "error" && "Error"}
                  </p>
                  <p className="text-sm text-[var(--rowi-muted)]">{uploadState.message}</p>
                </div>
                <span className="text-lg font-bold text-[var(--rowi-primary)]">
                  {uploadState.progress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    uploadState.phase === "error"
                      ? "bg-red-500"
                      : uploadState.phase === "completed"
                      ? "bg-green-500"
                      : "bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)]"
                  }`}
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>

              {/* Stats */}
              {uploadState.totalRows > 0 && (
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-[var(--rowi-muted)]">Total filas</p>
                    <p className="font-bold text-lg">{uploadState.totalRows.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[var(--rowi-muted)]">Procesadas</p>
                    <p className="font-bold text-lg text-green-600">{uploadState.processedRows.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[var(--rowi-muted)]">Chunks</p>
                    <p className="font-bold text-lg">{uploadState.currentChunk}/{uploadState.totalChunks}</p>
                  </div>
                </div>
              )}

              {/* Error message */}
              {uploadState.phase === "error" && uploadState.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    <strong>Error:</strong> {uploadState.error}
                  </p>
                </div>
              )}

              {/* Success message */}
              {uploadState.phase === "completed" && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Benchmark listo. Redirigiendo al detalle...
                  </p>
                </div>
              )}
            </div>
          </AdminCard>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {isUploading ? (
            <AdminButton variant="secondary" onClick={handleCancel}>
              Cancelar
            </AdminButton>
          ) : (
            <>
              <AdminButton
                variant="secondary"
                onClick={() => router.push("/hub/admin/benchmarks")}
              >
                {t("common.cancel") || "Cancelar"}
              </AdminButton>
              <AdminButton
                variant="primary"
                icon={Upload}
                onClick={handleUpload}
                disabled={!file || !name.trim() || uploadState.phase === "completed"}
              >
                {t("admin.benchmarks.upload.startUpload") || "Iniciar Upload"}
              </AdminButton>
            </>
          )}
        </div>
      </div>
    </AdminPage>
  );
}

// =========================================================
// 📄 PARSEAR ARCHIVO CSV/EXCEL
// =========================================================
async function parseFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const isCSV = file.name.toLowerCase().endsWith(".csv");

  if (isCSV) {
    return parseCSV(file);
  } else {
    return parseExcel(file);
  }
}

async function parseCSV(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV vacío o sin datos");
  }

  const headers = parseCSVLine(lines[0]);
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim()) {
      rows.push(parseCSVLine(line));
    }
  }

  return { headers, rows };
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

async function parseExcel(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  // Importar XLSX dinámicamente
  const XLSX = await import("xlsx");

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error("Excel vacío o sin datos");
  }

  const headers = data[0] as string[];
  const rows = data.slice(1) as string[][];

  return { headers, rows };
}
