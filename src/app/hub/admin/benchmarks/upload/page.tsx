"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   📊 Upload Benchmark — Subir Excel
========================================================= */

interface UploadJob {
  id: string;
  status: string;
  progress: number;
  currentPhase: string | null;
  totalRows: number;
  processedRows: number;
  errorMessage: string | null;
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

export default function UploadBenchmarkPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("ROWIVERSE");
  const [scope, setScope] = useState("GLOBAL");
  const [isLearning, setIsLearning] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<UploadJob | null>(null);
  const [dragActive, setDragActive] = useState(false);

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
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validar por extensión del archivo (más confiable que MIME type)
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      toast.error(t("admin.benchmarks.errors.invalidFormat"));
      return;
    }

    // 500MB limit
    if (selectedFile.size > 500 * 1024 * 1024) {
      toast.error(t("admin.benchmarks.errors.fileTooLarge"));
      return;
    }

    setFile(selectedFile);
    // Auto-fill name from filename
    if (!name) {
      const baseName = selectedFile.name.replace(/\.(xlsx|xls|csv)$/i, "");
      setName(baseName);
    }
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) {
      toast.error(t("admin.benchmarks.errors.noData"));
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name.trim());
      formData.append("type", type);
      formData.append("scope", scope);
      formData.append("isLearning", String(isLearning));

      const res = await fetch("/api/admin/benchmarks/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.ok) {
        toast.success(t("admin.benchmarks.upload.processing"));
        // Start polling for job status
        pollJobStatus(data.jobId);
      } else {
        toast.error(data.error || t("admin.benchmarks.errors.uploadFailed"));
        setUploading(false);
      }
    } catch (error) {
      toast.error(t("admin.benchmarks.errors.uploadFailed"));
      setUploading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/benchmarks/job/${jobId}`);
        const data = await res.json();

        if (data.ok) {
          setJob(data.job);

          if (data.job.status === "completed") {
            toast.success(t("admin.benchmarks.upload.completed"));
            setTimeout(() => {
              router.push(`/hub/admin/benchmarks/${data.job.benchmarkId}`);
            }, 1500);
          } else if (data.job.status === "failed") {
            toast.error(data.job.errorMessage || t("admin.benchmarks.upload.failed"));
            setUploading(false);
          } else {
            // Continue polling
            setTimeout(poll, 2000);
          }
        }
      } catch {
        setTimeout(poll, 3000);
      }
    };

    poll();
  };

  const getPhaseLabel = (phase: string | null) => {
    if (!phase) return "";
    return t(`admin.benchmarks.upload.phase.${phase}`);
  };

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
              disabled={uploading}
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto text-[var(--rowi-muted)] mb-4" />
                <p className="text-[var(--rowi-foreground)] font-medium mb-1">
                  {t("admin.benchmarks.upload.dropzone")}
                </p>
                <p className="text-sm text-[var(--rowi-muted)]">
                  {t("admin.benchmarks.upload.supportedFormats")} • {t("admin.benchmarks.upload.maxSize")}
                </p>
              </>
            )}
          </div>
        </AdminCard>

        {/* Form */}
        <AdminCard>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-1">
                {t("admin.benchmarks.upload.benchmarkName")} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
                placeholder="SOH 2018-2024 Global"
                disabled={uploading}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-1">
                {t("admin.benchmarks.upload.benchmarkType")}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
                disabled={uploading}
              >
                {BENCHMARK_TYPES.map((t_) => (
                  <option key={t_.value} value={t_.value}>
                    {t(t_.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Scope */}
            <div>
              <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-1">
                {t("admin.benchmarks.upload.benchmarkScope")}
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
                disabled={uploading}
              >
                {BENCHMARK_SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(s.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Learning */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isLearning"
                checked={isLearning}
                onChange={(e) => setIsLearning(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[var(--rowi-primary)] focus:ring-[var(--rowi-primary)]"
                disabled={uploading}
              />
              <div>
                <label htmlFor="isLearning" className="text-sm font-medium text-[var(--rowi-foreground)]">
                  {t("admin.benchmarks.upload.enableLearning")}
                </label>
                <p className="text-xs text-[var(--rowi-muted)]">
                  {t("admin.benchmarks.upload.enableLearningHint")}
                </p>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Progress */}
        {job && (
          <AdminCard>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                  {getPhaseLabel(job.currentPhase)}
                </span>
                <span className="text-sm text-[var(--rowi-muted)]">
                  {job.progress}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] transition-all duration-500"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              {job.processedRows > 0 && (
                <p className="text-xs text-[var(--rowi-muted)] text-center">
                  {job.processedRows.toLocaleString()} {t("admin.benchmarks.upload.rowsProcessed")}
                </p>
              )}
              {job.status === "completed" && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>{t("admin.benchmarks.upload.completed")}</span>
                </div>
              )}
              {job.status === "failed" && (
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>{job.errorMessage || t("admin.benchmarks.upload.failed")}</span>
                </div>
              )}
            </div>
          </AdminCard>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <AdminButton
            variant="secondary"
            onClick={() => router.push("/hub/admin/benchmarks")}
            disabled={uploading}
          >
            {t("common.cancel")}
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={uploading ? Loader2 : Upload}
            onClick={handleUpload}
            disabled={!file || !name.trim() || uploading}
            className={uploading ? "animate-pulse" : ""}
          >
            {uploading ? t("admin.benchmarks.upload.processing") : t("admin.benchmarks.upload.startUpload")}
          </AdminButton>
        </div>
      </div>
    </AdminPage>
  );
}
