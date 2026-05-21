"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Database,
  BarChart3,
} from "lucide-react";

interface Score {
  dimension: string;
  level: string;
  scoreMean: number;
  scoreSD: number | null;
  benchmarkDelta: number | null;
  cohesionBand: string | null;
  strengthBand: string | null;
  n: number;
}

interface Assessment {
  id: string;
  scope: string;
  subjectType: string;
  source: string;
  dataset: string | null;
  status: string;
  sampleSize: number;
  responseCount: number;
  createdAt: string;
  scores: Score[];
}

export default function AdminVitalSignsPage() {
  const { t, locale } = useI18n();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [scope, setScope] = useState<"OVS" | "TVS" | "LVS">("OVS");
  const [dataset, setDataset] = useState<"sample" | "production" | "test">("sample");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAssessments() {
    setLoading(true);
    try {
      const r = await fetch("/api/vital-signs/assessments");
      const j = await r.json();
      if (j.ok) setAssessments(j.assessments);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssessments();
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("scope", scope);
      form.append("dataset", dataset);
      const r = await fetch("/api/vital-signs/upload", { method: "POST", body: form });
      const j = await r.json();
      if (j.ok) {
        setUploadResult({
          ok: true,
          message: `${t("admin.vs.upload.success", "Cargado")}: ${j.sampleSize} ${t("admin.vs.upload.respondents", "respondentes")} · ${scope}`,
        });
        await loadAssessments();
      } else {
        const detail = j.details ? `\n${j.details.slice(0, 3).join(", ")}` : "";
        setUploadResult({ ok: false, message: `${j.error}${detail}` });
      }
    } catch (e) {
      setUploadResult({ ok: false, message: e instanceof Error ? e.message : "Upload failed" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md">
          <Database className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
            {t("admin.vs.title", "Ingesta de Vital Signs")}
          </h1>
          <p className="text-xs text-[var(--rowi-muted)]">
            {t("admin.vs.subtitle", "Carga reportes OVS / TVS / LVS de Six Seconds y consulta los assessments registrados.")}
          </p>
        </div>
      </div>

      {/* Upload form */}
      <section className="rowi-card space-y-4">
        <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] flex items-center gap-2">
          <Upload className="w-5 h-5 text-[var(--rowi-primary)]" />
          {t("admin.vs.upload.title", "Cargar reporte")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-2 uppercase tracking-wide">
              {t("admin.vs.upload.scope", "Tipo")}
            </label>
            <div className="flex gap-2 flex-wrap">
              {(["OVS", "TVS", "LVS"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={scope === s ? "rowi-btn-primary" : "rowi-btn"}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-2 uppercase tracking-wide">
              {t("admin.vs.upload.dataset", "Dataset")}
            </label>
            <div className="flex gap-2 flex-wrap">
              {(["sample", "production", "test"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDataset(d)}
                  className={dataset === d ? "rowi-btn-primary" : "rowi-btn"}
                >
                  {d}
                </button>
              ))}
            </div>
            {dataset === "production" && (
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-2">
                {t("admin.vs.upload.productionWarning", "Datos productivos contaminan calibración. Usar con cuidado.")}
              </p>
            )}
          </div>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
            className="block w-full text-sm text-[var(--rowi-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-[var(--rowi-primary)] file:to-[var(--rowi-secondary)] file:text-white hover:file:opacity-90 file:cursor-pointer cursor-pointer"
          />
          <p className="text-xs text-[var(--rowi-muted-weak)] mt-2">
            {t("admin.vs.upload.help", "OVS y TVS: .csv. LVS: .xlsx con hoja 'all' o 'only full (self)'.")}
          </p>
        </div>

        {uploading && (
          <div className="flex items-center gap-2 text-[var(--rowi-primary)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{t("admin.vs.upload.uploading", "Procesando archivo...")}</span>
          </div>
        )}

        {uploadResult && (
          <div
            className={
              uploadResult.ok
                ? "rowi-card bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                : "rowi-card bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
            }
          >
            <div className="flex items-start gap-2">
              {uploadResult.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-700 dark:text-rose-300 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm whitespace-pre-line ${
                  uploadResult.ok
                    ? "text-emerald-900 dark:text-emerald-100"
                    : "text-rose-900 dark:text-rose-100"
                }`}
              >
                {uploadResult.message}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Assessments list */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-[var(--rowi-primary)]" />
          {t("admin.vs.assessments.title", "Assessments registrados")}
        </h2>

        {loading ? (
          <div className="flex items-center gap-2 text-[var(--rowi-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{t("admin.vs.assessments.loading", "Cargando...")}</span>
          </div>
        ) : assessments.length === 0 ? (
          <div className="rowi-card text-center py-8">
            <FileSpreadsheet className="w-8 h-8 text-[var(--rowi-muted-weak)] mx-auto mb-2" />
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("admin.vs.assessments.empty", "Aún no hay assessments. Carga el primero arriba.")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => {
              const drivers = a.scores.filter((s) => s.level === "driver");
              const outcomes = a.scores.filter((s) => s.level === "outcome");
              return (
                <div key={a.id} className="rowi-card">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rowi-chip bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white border-transparent">
                        {a.scope}
                      </span>
                      <span
                        className={
                          a.dataset === "production"
                            ? "rowi-chip bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300"
                            : "rowi-chip"
                        }
                      >
                        {a.dataset}
                      </span>
                      <span className="text-xs text-[var(--rowi-muted-weak)]">
                        {new Date(a.createdAt).toLocaleString(locale)}
                      </span>
                    </div>
                    <span className="text-sm text-[var(--rowi-muted)]">
                      n={a.sampleSize} {t("admin.vs.assessments.respondents", "respondentes")}
                    </span>
                  </div>

                  {drivers.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                      {drivers.map((d) => (
                        <div
                          key={d.dimension}
                          className="rounded-lg p-2 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)]"
                        >
                          <div className="text-xs text-[var(--rowi-muted-weak)] truncate uppercase tracking-wide">
                            {d.dimension}
                          </div>
                          <div className="text-base font-bold text-[var(--rowi-foreground)]">
                            {d.scoreMean.toFixed(1)}
                          </div>
                          <div className="text-xs text-[var(--rowi-muted-weak)]">
                            SD={d.scoreSD?.toFixed(1) ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {outcomes.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {outcomes.map((o) => (
                        <div
                          key={o.dimension}
                          className="rounded-lg p-2 bg-[var(--rowi-card-elev)] border border-[var(--rowi-card-border)]"
                        >
                          <div className="text-xs text-[var(--rowi-muted-weak)] truncate uppercase tracking-wide">
                            {o.dimension}
                          </div>
                          <div className="text-base font-bold text-amber-600 dark:text-amber-300">
                            {o.scoreMean.toFixed(1)}
                          </div>
                          <div className="text-xs text-[var(--rowi-muted-weak)]">
                            SD={o.scoreSD?.toFixed(1) ?? "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
