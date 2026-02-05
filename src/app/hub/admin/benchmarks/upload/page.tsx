"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Zap,
  Cloud,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   📊 Upload Benchmark — Con Vercel Blob para archivos grandes

   Flujo:
   1. Cliente sube archivo directo a Vercel Blob (hasta 500MB)
   2. Backend recibe URL del blob y procesa en background
   3. Frontend hace polling del estado del job
========================================================= */

type UploadPhase = "idle" | "uploading" | "processing" | "completed" | "error";

interface UploadState {
  phase: UploadPhase;
  progress: number;
  message: string;
  error?: string;
  processedRows?: number;
  totalRows?: number;
}

interface UploadJob {
  id: string;
  status: string;
  progress: number;
  currentPhase: string | null;
  totalRows: number;
  processedRows: number;
  errorMessage: string | null;
  benchmarkId?: string;
}

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

const PHASE_MESSAGES = {
  es: {
    uploading: "Subiendo archivo a la nube...",
    processing: "Procesando datos...",
    downloading: "Descargando archivo...",
    parsing: "Analizando archivo...",
    importing: "Importando filas...",
    statistics: "Calculando estadísticas...",
    completed: "¡Completado!",
    error: "Error en el proceso",
  },
  en: {
    uploading: "Uploading file to cloud...",
    processing: "Processing data...",
    downloading: "Downloading file...",
    parsing: "Analyzing file...",
    importing: "Importing rows...",
    statistics: "Calculating statistics...",
    completed: "Completed!",
    error: "Process error",
  },
};

export default function UploadBenchmarkPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { data: session } = useSession();
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
    message: "",
  });

  const messages = PHASE_MESSAGES[lang as keyof typeof PHASE_MESSAGES] || PHASE_MESSAGES.es;

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
      toast.error(t("admin.benchmarks.errors.invalidFormat") || "Formato no válido");
      return;
    }

    if (selectedFile.size > 500 * 1024 * 1024) {
      toast.error(t("admin.benchmarks.errors.fileTooLarge") || "Archivo muy grande (máx 500MB)");
      return;
    }

    setFile(selectedFile);
    if (!name) {
      const baseName = selectedFile.name.replace(/\.(xlsx|xls|csv)$/i, "");
      setName(baseName);
    }
  };

  // =========================================================
  // 🚀 UPLOAD CON VERCEL BLOB (client-side)
  // =========================================================
  const handleUpload = async () => {
    if (!file || !name.trim()) {
      toast.error(t("admin.benchmarks.errors.noData") || "Selecciona archivo y nombre");
      return;
    }

    abortControllerRef.current = new AbortController();

    try {
      setUploadState({
        phase: "uploading",
        progress: 0,
        message: messages.uploading,
      });

      // 1. Subir archivo directamente a Vercel Blob
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/benchmarks/blob-token",
        headers: {
          "x-user-email": session?.user?.email || "",
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 40);
          setUploadState({
            phase: "uploading",
            progress: percent,
            message: `${messages.uploading} ${Math.round(progressEvent.loaded / 1024 / 1024)}MB / ${Math.round(progressEvent.total / 1024 / 1024)}MB`,
          });
        },
      });

      setUploadState({
        phase: "uploading",
        progress: 45,
        message: "Iniciando procesamiento...",
      });

      // 2. Notificar al backend para procesar el archivo
      const response = await fetch("/api/admin/benchmarks/start-processing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          name: name.trim(),
          type,
          scope,
          isLearning,
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Error iniciando procesamiento");
      }

      setUploadState({
        phase: "processing",
        progress: 50,
        message: messages.processing,
      });

      // 3. Polling del estado del job
      pollJobStatus(data.jobId, data.benchmarkId);

    } catch (error: any) {
      if (error.name === "AbortError") {
        setUploadState({
          phase: "idle",
          progress: 0,
          message: "",
        });
        toast.info("Upload cancelado");
      } else {
        setUploadState({
          phase: "error",
          progress: 0,
          message: messages.error,
          error: error.message || "Error desconocido",
        });
        toast.error(error.message || "Error en upload");
      }
    }
  };

  // =========================================================
  // 📊 POLLING del estado del job
  // =========================================================
  const pollJobStatus = async (jobId: string, benchmarkId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/benchmarks/job/${jobId}`);
        const data = await res.json();

        if (data.ok) {
          const job: UploadJob = data.job;

          // Mapear progreso: 50-100% para procesamiento
          const processingProgress = 50 + Math.round(job.progress * 0.5);

          // Determinar mensaje según fase
          let phaseMessage = messages.processing;
          if (job.currentPhase === "downloading") phaseMessage = messages.downloading;
          else if (job.currentPhase === "parsing") phaseMessage = messages.parsing;
          else if (job.currentPhase === "importing") phaseMessage = messages.importing;
          else if (job.currentPhase === "statistics") phaseMessage = messages.statistics;

          if (job.status === "completed") {
            setUploadState({
              phase: "completed",
              progress: 100,
              message: messages.completed,
              processedRows: job.processedRows,
              totalRows: job.totalRows,
            });
            toast.success(t("admin.benchmarks.upload.completed") || "¡Benchmark procesado!");
            setTimeout(() => {
              router.push(`/hub/admin/benchmarks/${benchmarkId}`);
            }, 2000);
          } else if (job.status === "failed") {
            setUploadState({
              phase: "error",
              progress: processingProgress,
              message: messages.error,
              error: job.errorMessage || "Error en procesamiento",
            });
            toast.error(job.errorMessage || "Error procesando benchmark");
          } else {
            setUploadState({
              phase: "processing",
              progress: processingProgress,
              message: phaseMessage,
              processedRows: job.processedRows,
              totalRows: job.totalRows,
            });
            setTimeout(poll, 1500);
          }
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        setTimeout(poll, 3000);
      }
    };

    poll();
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setUploadState({
      phase: "idle",
      progress: 0,
      message: "",
    });
    toast.info("Upload cancelado");
  };

  const isUploading = uploadState.phase === "uploading" || uploadState.phase === "processing";

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
                <Cloud className="w-12 h-12 mx-auto text-[var(--rowi-muted)] mb-4" />
                <p className="text-[var(--rowi-foreground)] font-medium mb-1">
                  {t("admin.benchmarks.upload.dropzone") || "Arrastra tu archivo o haz clic"}
                </p>
                <p className="text-sm text-[var(--rowi-muted)]">
                  CSV, Excel (.xlsx, .xls) • Hasta 500MB
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
                {t("admin.benchmarks.upload.benchmarkName") || "Nombre"} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)]"
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
                className="w-4 h-4 rounded"
                disabled={isUploading}
              />
              <label htmlFor="isLearning" className="text-sm text-[var(--rowi-foreground)]">
                {t("admin.benchmarks.upload.enableLearning") || "Usar para entrenamiento de IA"}
              </label>
            </div>
          </div>
        </AdminCard>

        {/* =========================================================
            📊 BARRA DE PROGRESO
        ========================================================= */}
        {uploadState.phase !== "idle" && (
          <AdminCard>
            <div className="space-y-4">
              {/* Header */}
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
                    {uploadState.phase === "uploading" && "Subiendo archivo"}
                    {uploadState.phase === "processing" && "Procesando datos"}
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
              {uploadState.processedRows !== undefined && uploadState.processedRows > 0 && (
                <div className="flex justify-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-[var(--rowi-muted)]">Filas procesadas</p>
                    <p className="font-bold text-lg">{uploadState.processedRows.toLocaleString()}</p>
                  </div>
                  {uploadState.totalRows && uploadState.totalRows > 0 && (
                    <div className="text-center">
                      <p className="text-[var(--rowi-muted)]">Total</p>
                      <p className="font-bold text-lg">{uploadState.totalRows.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {uploadState.phase === "error" && uploadState.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    <strong>Error:</strong> {uploadState.error}
                  </p>
                </div>
              )}

              {/* Success */}
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

        {/* Buttons */}
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
                icon={Cloud}
                onClick={handleUpload}
                disabled={!file || !name.trim() || uploadState.phase === "completed"}
              >
                {t("admin.benchmarks.upload.startUpload") || "Subir a la Nube"}
              </AdminButton>
            </>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
