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
   📊 Upload Benchmark — Con barra de progreso visible
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
    uploading: "Subiendo archivo...",
    processing: "Procesando datos...",
    parsing: "Analizando archivo...",
    importing: "Importando filas...",
    statistics: "Calculando estadísticas...",
    completed: "¡Completado!",
    error: "Error en el proceso",
  },
  en: {
    uploading: "Uploading file...",
    processing: "Processing data...",
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
  const xhrRef = useRef<XMLHttpRequest | null>(null);

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
  // 🚀 UPLOAD CON XMLHttpRequest para progreso real
  // =========================================================
  const handleUpload = () => {
    if (!file || !name.trim()) {
      toast.error(t("admin.benchmarks.errors.noData") || "Selecciona archivo y nombre");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name.trim());
    formData.append("type", type);
    formData.append("scope", scope);
    formData.append("isLearning", String(isLearning));

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    // Progreso del upload
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 50); // 0-50% para upload
        setUploadState({
          phase: "uploading",
          progress: percent,
          message: `${messages.uploading} ${Math.round((e.loaded / 1024 / 1024))}MB / ${Math.round((e.total / 1024 / 1024))}MB`,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.ok) {
            setUploadState({
              phase: "processing",
              progress: 55,
              message: messages.processing,
            });
            // Iniciar polling del job
            pollJobStatus(data.jobId);
          } else {
            setUploadState({
              phase: "error",
              progress: 0,
              message: messages.error,
              error: data.error || "Error desconocido",
            });
            toast.error(data.error || "Error al procesar");
          }
        } catch {
          setUploadState({
            phase: "error",
            progress: 0,
            message: messages.error,
            error: "Error parsing response",
          });
        }
      } else {
        setUploadState({
          phase: "error",
          progress: 0,
          message: messages.error,
          error: `HTTP ${xhr.status}: ${xhr.statusText}`,
        });
      }
    };

    xhr.onerror = () => {
      setUploadState({
        phase: "error",
        progress: 0,
        message: messages.error,
        error: "Error de conexión",
      });
    };

    // Iniciar upload
    setUploadState({
      phase: "uploading",
      progress: 0,
      message: messages.uploading,
    });

    xhr.open("POST", "/api/admin/benchmarks/upload");
    xhr.send(formData);
  };

  // =========================================================
  // 📊 POLLING del estado del job
  // =========================================================
  const pollJobStatus = async (jobId: string) => {
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
          if (job.currentPhase === "parsing") phaseMessage = messages.parsing;
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
              router.push(`/hub/admin/benchmarks/${job.benchmarkId}`);
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
            // Continuar polling
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
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
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
                <Upload className="w-12 h-12 mx-auto text-[var(--rowi-muted)] mb-4" />
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
            📊 BARRA DE PROGRESO SIEMPRE VISIBLE DURANTE UPLOAD
        ========================================================= */}
        {uploadState.phase !== "idle" && (
          <AdminCard>
            <div className="space-y-4">
              {/* Header con icono y estado */}
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

              {/* Barra de progreso */}
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

        {/* Botones */}
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
