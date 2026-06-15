"use client";

/**
 * 🔬 Módulo Consultor — Vital Signs
 * =========================================================
 * Página única, por pasos, para que un consultor:
 *   1. Suba un CSV SEI (vía el import de BENCHMARK existente — Vercel Blob +
 *      job polling, reutilizado de /hub/admin/benchmarks/upload).
 *   2. Dispare la inferencia VS (POST /api/consultant/inference/[id]).
 *   3. Marque líderes por EMAIL (el backend lo hashea y verifica contra los
 *      data points anónimos — GET /people + POST /leaders).
 *   4. Lea los hallazgos: espejo líder↔equipo, correlaciones, deriva temporal,
 *      fortalezas/brechas por equipo (GET /findings).
 *
 * NO duplica el upload ni el motor de análisis: solo orquesta los endpoints
 * existentes. Estados vacíos honestos en todas partes — nunca inventa métricas.
 */

import { useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { upload } from "@vercel/blob/client";
import {
  Microscope,
  Cloud,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  Users,
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Target,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { SEI_COMPETENCIES } from "@/lib/vital-signs/catalog";

/* ───────────────────────── Tipos de los endpoints ───────────────────────── */

interface UploadJob {
  status: string;
  progress: number;
  currentPhase: string | null;
  totalRows: number;
  processedRows: number;
  errorMessage: string | null;
}

interface TeamPerson {
  personHash: string;
  eqTotal: number | null;
  hasRetest: boolean;
  searchMatch: boolean;
}

interface PeopleTeam {
  projectCohort: string;
  count: number;
  searchMatch: boolean;
  people: TeamPerson[];
}

interface MetricDelta {
  key: string;
  value: number;
  vsNorm: number;
}

interface CorrelationFinding {
  competencyKey: string;
  outcomeKey: string;
  r: number;
  n: number;
  strength: string;
}

interface LeaderMirror {
  present: boolean;
  aboveTeam: MetricDelta[];
  belowTeam: MetricDelta[];
}

interface TemporalDrift {
  present: boolean;
  peopleWithRetest: number;
  improved: MetricDelta[];
  declined: MetricDelta[];
}

interface TeamAnalysis {
  projectCohort: string;
  n: number;
  eqAverage: number | null;
  strengths: MetricDelta[];
  gaps: MetricDelta[];
}

interface LeaderFinding {
  personHash: string;
  label: string | null;
  projectCohort: string | null;
  mirror: LeaderMirror;
}

interface Findings {
  benchmarkId: string;
  totalDataPoints: number;
  teams: TeamAnalysis[];
  topCorrelations: CorrelationFinding[];
  temporalDrift: TemporalDrift;
  leaders: LeaderFinding[];
}

type UploadPhase =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

interface PendingLeader {
  email: string;
  cohort: string;
  label: string;
}

/* ───────────────────────────── Helpers locales ───────────────────────────── */

const COMP_ES: Record<string, string> = Object.fromEntries(
  SEI_COMPETENCIES.map((c) => [c.key, c.esName]),
);
const COMP_EN: Record<string, string> = Object.fromEntries(
  SEI_COMPETENCIES.map((c) => [c.key, c.enName]),
);

/** Etiqueta de competencia: usa el nombre del catálogo según el idioma. */
function compLabel(key: string, lang: string): string {
  if (lang === "en") return COMP_EN[key] ?? key;
  return COMP_ES[key] ?? key;
}

function shortHash(hash: string): string {
  // "sha256:abcdef..." → "abcdef…"
  const hex = hash.startsWith("sha256:") ? hash.slice(7) : hash;
  return hex.slice(0, 10) + "…";
}

function fmtDelta(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(1);
}

/* ──────────────────────────────── Página ─────────────────────────────────── */

export default function ConsultantVitalSignsPage() {
  const { t, lang } = useI18n();
  const { data: session } = useSession();
  const abortRef = useRef<AbortController | null>(null);

  // Estado global del flujo.
  const [benchmarkId, setBenchmarkId] = useState<string | null>(null);

  // ── Paso 1: upload ──
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Paso 2: inferencia ──
  const [inferring, setInferring] = useState(false);
  const [inferred, setInferred] = useState<number | null>(null);
  const [inferError, setInferError] = useState<string | null>(null);

  // ── Paso 3: líderes ──
  const [teams, setTeams] = useState<PeopleTeam[] | null>(null);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [pendingLeaders, setPendingLeaders] = useState<PendingLeader[]>([]);
  const [leaderEmail, setLeaderEmail] = useState("");
  const [leaderCohort, setLeaderCohort] = useState("");
  const [leaderLabel, setLeaderLabel] = useState("");
  const [savingLeaders, setSavingLeaders] = useState(false);
  const [leaderResult, setLeaderResult] = useState<{
    assigned: number;
    notFound: string[];
  } | null>(null);

  // ── Paso 4: hallazgos ──
  const [findings, setFindings] = useState<Findings | null>(null);
  const [loadingFindings, setLoadingFindings] = useState(false);
  const [findingsError, setFindingsError] = useState<string | null>(null);

  /* ───────────────── Paso 1: subida (Vercel Blob + polling) ───────────────── */

  const validateAndSetFile = (f: File) => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    if (![".csv", ".xlsx", ".xls"].includes(ext)) {
      setUploadError(
        t(
          "admin.consultant.upload.invalidFormat",
          "Formato no válido. Usa .csv o .xlsx",
        ),
      );
      return;
    }
    setUploadError(null);
    setFile(f);
    if (!name) setName(f.name.replace(/\.(xlsx|xls|csv)$/i, ""));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollJob = (jobId: string, bId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/benchmarks/job/${jobId}`);
        const data = await res.json();
        if (data.ok) {
          const job: UploadJob = data.job;
          const pct = 50 + Math.round((job.progress || 0) * 0.5);
          if (job.status === "completed") {
            setUploadPhase("completed");
            setUploadProgress(100);
            setUploadMsg(
              t(
                "admin.consultant.upload.completed",
                "Importación completada",
              ),
            );
            setBenchmarkId(bId);
            return;
          }
          if (job.status === "failed") {
            setUploadPhase("error");
            setUploadError(
              job.errorMessage ||
                t("admin.consultant.upload.failed", "La importación falló"),
            );
            return;
          }
          setUploadProgress(pct);
          setUploadMsg(
            t("admin.consultant.upload.processing", "Procesando datos…") +
              (job.processedRows
                ? ` (${job.processedRows.toLocaleString()})`
                : ""),
          );
          setTimeout(poll, 1500);
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        setTimeout(poll, 3000);
      }
    };
    poll();
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) return;
    abortRef.current = new AbortController();
    setUploadError(null);
    try {
      setUploadPhase("uploading");
      setUploadProgress(0);
      setUploadMsg(t("admin.consultant.upload.uploading", "Subiendo archivo…"));

      // 1) Subida directa a Vercel Blob (mismo mecanismo que benchmarks/upload).
      const blob = await upload(file.name, file, {
        access: "public",
        multipart: true,
        handleUploadUrl: "/api/admin/benchmarks/blob-token",
        headers: { "x-user-email": session?.user?.email || "" },
        onUploadProgress: (p) => {
          setUploadProgress(Math.round((p.loaded / p.total) * 40));
        },
      });

      setUploadProgress(45);
      setUploadMsg(
        t(
          "admin.consultant.upload.startingProcessing",
          "Iniciando procesamiento…",
        ),
      );

      // 2) Disparar el procesamiento en background (import del benchmark).
      const res = await fetch("/api/admin/benchmarks/start-processing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": session?.user?.email || "",
        },
        body: JSON.stringify({
          blobUrl: blob.url,
          name: name.trim(),
          type: "EXTERNAL",
          scope: "TENANT",
          isLearning: true,
        }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(
          data.error ||
            t("admin.consultant.upload.failed", "La importación falló"),
        );
      }

      setUploadPhase("processing");
      setUploadProgress(50);
      setUploadMsg(t("admin.consultant.upload.processing", "Procesando datos…"));

      // 3) Polling hasta completar; al terminar guardamos el benchmarkId.
      pollJob(data.jobId, data.benchmarkId);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setUploadPhase("idle");
        setUploadProgress(0);
        return;
      }
      setUploadPhase("error");
      setUploadError(
        err instanceof Error
          ? err.message
          : t("admin.consultant.upload.failed", "La importación falló"),
      );
    }
  };

  /* ────────────────────── Paso 2: inferencia VS ────────────────────── */

  const runInference = async () => {
    if (!benchmarkId) return;
    setInferring(true);
    setInferError(null);
    try {
      const res = await fetch(`/api/consultant/inference/${benchmarkId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error");
      setInferred(typeof data.inferred === "number" ? data.inferred : 0);
      // Cargar los equipos para el paso 3 una vez inferido.
      loadPeople();
    } catch (err) {
      setInferError(
        err instanceof Error
          ? err.message
          : t("admin.consultant.infer.failed", "La inferencia falló"),
      );
    } finally {
      setInferring(false);
    }
  };

  /* ────────────────────── Paso 3: líderes ────────────────────── */

  const loadPeople = async (q?: string) => {
    if (!benchmarkId) return;
    const isSearch = q !== undefined;
    if (isSearch) setSearching(true);
    else setLoadingPeople(true);
    try {
      const url = new URL(
        `/api/consultant/people/${benchmarkId}`,
        window.location.origin,
      );
      if (q) url.searchParams.set("search", q);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.ok) setTeams(data.teams as PeopleTeam[]);
    } finally {
      if (isSearch) setSearching(false);
      else setLoadingPeople(false);
    }
  };

  const addPendingLeader = () => {
    const email = leaderEmail.trim();
    if (!email) return;
    if (
      pendingLeaders.some(
        (l) => l.email.toLowerCase() === email.toLowerCase(),
      )
    ) {
      return;
    }
    setPendingLeaders((prev) => [
      ...prev,
      { email, cohort: leaderCohort.trim(), label: leaderLabel.trim() },
    ]);
    setLeaderEmail("");
    setLeaderCohort("");
    setLeaderLabel("");
  };

  const removePendingLeader = (email: string) => {
    setPendingLeaders((prev) => prev.filter((l) => l.email !== email));
  };

  const saveLeaders = async () => {
    if (!benchmarkId || pendingLeaders.length === 0) return;
    setSavingLeaders(true);
    setLeaderResult(null);
    try {
      const res = await fetch(`/api/consultant/leaders/${benchmarkId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaders: pendingLeaders.map((l) => ({
            email: l.email,
            cohort: l.cohort || undefined,
            label: l.label || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setLeaderResult({
          assigned: data.assigned,
          notFound: data.notFound ?? [],
        });
        // Quitar de la lista pendiente los que sí matchearon.
        const notFoundLower = (data.notFound ?? []).map((e: string) =>
          e.toLowerCase(),
        );
        setPendingLeaders((prev) =>
          prev.filter((l) => notFoundLower.includes(l.email.toLowerCase())),
        );
      }
    } finally {
      setSavingLeaders(false);
    }
  };

  /* ────────────────────── Paso 4: hallazgos ────────────────────── */

  const loadFindings = async () => {
    if (!benchmarkId) return;
    setLoadingFindings(true);
    setFindingsError(null);
    try {
      const res = await fetch(`/api/consultant/findings/${benchmarkId}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error");
      setFindings(data.findings as Findings);
    } catch (err) {
      setFindingsError(
        err instanceof Error
          ? err.message
          : t("admin.consultant.findings.failed", "Error al generar hallazgos"),
      );
    } finally {
      setLoadingFindings(false);
    }
  };

  const isUploading =
    uploadPhase === "uploading" || uploadPhase === "processing";

  /* ──────────────────────────────── Render ─────────────────────────────────── */

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md">
          <Microscope className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
            {t("admin.consultant.title", "Módulo Consultor — Vital Signs")}
          </h1>
          <p className="text-xs text-[var(--rowi-muted)]">
            {t(
              "admin.consultant.subtitle",
              "Sube datos SEI, marca líderes por equipo y genera el espejo líder↔equipo más los hallazgos (correlaciones y deriva temporal).",
            )}
          </p>
        </div>
      </div>

      {/* ───────── PASO 1: Upload ───────── */}
      <Step
        n={1}
        title={t("admin.consultant.step1.title", "Sube el CSV SEI")}
        done={!!benchmarkId}
      >
        {benchmarkId ? (
          <p className="text-xs text-emerald-600 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            {t(
              "admin.consultant.step1.imported",
              "Benchmark importado",
            )}{" "}
            <span className="font-mono text-[var(--rowi-muted)]">
              {benchmarkId}
            </span>
          </p>
        ) : (
          <div className="space-y-4">
            {/* Dropzone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive
                  ? "border-[var(--rowi-primary)] bg-[var(--rowi-primary)]/5"
                  : "border-[var(--rowi-border)]"
              } ${file ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500" : ""} ${
                isUploading ? "pointer-events-none opacity-60" : ""
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) validateAndSetFile(f);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-[var(--rowi-foreground)]">
                      {file.name}
                    </p>
                    <p className="text-xs text-[var(--rowi-muted)]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="p-1 hover:bg-black/5 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <Cloud className="w-8 h-8 mx-auto text-[var(--rowi-muted)] mb-2" />
                  <p className="text-sm text-[var(--rowi-foreground)] font-medium">
                    {t(
                      "admin.consultant.upload.dropzone",
                      "Arrastra el CSV SEI aquí o haz clic para seleccionar",
                    )}
                  </p>
                  <p className="text-xs text-[var(--rowi-muted)] mt-1">
                    {t(
                      "admin.consultant.upload.fileFormats",
                      "Formatos: .csv · .xlsx",
                    )}
                  </p>
                </>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-foreground)] mb-1">
                {t("admin.consultant.upload.name", "Nombre del dataset")} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isUploading}
                placeholder={t(
                  "admin.consultant.upload.namePlaceholder",
                  "Ej. SEI Bancolombia 2026",
                )}
                className="w-full bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-primary)] transition-all"
              />
            </div>

            {/* Barra de progreso */}
            {uploadPhase !== "idle" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  {uploadPhase === "error" ? (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  ) : uploadPhase === "completed" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--rowi-primary)]" />
                  )}
                  <span className="flex-1 text-[var(--rowi-muted)]">
                    {uploadMsg}
                  </span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      uploadPhase === "error"
                        ? "bg-rose-500"
                        : "bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)]"
                    }`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-rose-600">{uploadError}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || !name.trim() || isUploading}
              className="rowi-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
              {t("admin.consultant.upload.start", "Subir e importar")}
            </button>
          </div>
        )}
      </Step>

      {/* ───────── PASO 2: Inferencia ───────── */}
      <Step
        n={2}
        title={t("admin.consultant.step2.title", "Genera la inferencia VS")}
        disabled={!benchmarkId}
        done={inferred !== null}
      >
        {!benchmarkId ? (
          <p className="text-xs text-[var(--rowi-muted)] italic">
            {t(
              "admin.consultant.step2.locked",
              "Importa un dataset primero.",
            )}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[var(--rowi-muted)]">
              {t(
                "admin.consultant.step2.help",
                "Calcula los 15 pulse points de Vital Signs por persona a partir del SEI importado. Re-correr reemplaza la inferencia previa.",
              )}
            </p>
            {inferred !== null && (
              <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                {inferred.toLocaleString()}{" "}
                {t(
                  "admin.consultant.step2.inferred",
                  "inferencias de pulse point generadas",
                )}
              </p>
            )}
            {inferError && (
              <p className="text-xs text-rose-600">{inferError}</p>
            )}
            <button
              onClick={runInference}
              disabled={inferring}
              className="rowi-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {inferring ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              {inferred === null
                ? t("admin.consultant.step2.run", "Generar inferencia")
                : t("admin.consultant.step2.rerun", "Re-generar")}
            </button>
          </div>
        )}
      </Step>

      {/* ───────── PASO 3: Marcar líderes ───────── */}
      <Step
        n={3}
        title={t("admin.consultant.step3.title", "Marca a los líderes")}
        disabled={inferred === null}
        done={!!leaderResult && leaderResult.assigned > 0}
      >
        {inferred === null ? (
          <p className="text-xs text-[var(--rowi-muted)] italic">
            {t(
              "admin.consultant.step3.locked",
              "Genera la inferencia primero.",
            )}
          </p>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-[var(--rowi-muted)]">
              {t(
                "admin.consultant.step3.help",
                "Los datos son anónimos: el líder se identifica escribiendo su EMAIL, que el sistema hashea y verifica contra el dataset. Puedes marcar varios líderes, cada uno opcionalmente atado a un equipo.",
              )}
            </p>

            {/* Buscador de equipos por email (verifica presencia por hash) */}
            <div className="rounded-lg border border-[var(--rowi-border)] p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--rowi-muted)]" />
                <h3 className="text-xs font-semibold text-[var(--rowi-foreground)]">
                  {t("admin.consultant.teams.title", "Equipos del dataset")}
                </h3>
                {teams && (
                  <span className="text-xs text-[var(--rowi-muted)]">
                    ({teams.length})
                  </span>
                )}
              </div>

              {/* Search box */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--rowi-muted)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadPeople(search.trim());
                    }}
                    placeholder={t(
                      "admin.consultant.search.placeholder",
                      "Busca por email exacto (se hashea, nunca se guarda en claro)",
                    )}
                    className="w-full bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
                  />
                </div>
                <button
                  onClick={() => loadPeople(search.trim())}
                  disabled={searching}
                  className="rowi-btn flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  {searching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {t("admin.consultant.search.button", "Buscar")}
                </button>
              </div>

              {/* Lista de equipos */}
              {loadingPeople ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--rowi-muted)]" />
              ) : !teams || teams.length === 0 ? (
                <p className="text-xs text-[var(--rowi-muted)] italic">
                  {t(
                    "admin.consultant.teams.empty",
                    "Aún no se cargaron equipos.",
                  )}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {teams.map((team) => {
                    const retests = team.people.filter(
                      (p) => p.hasRetest,
                    ).length;
                    return (
                      <div
                        key={team.projectCohort}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                          team.searchMatch
                            ? "bg-[var(--rowi-primary)]/10 ring-1 ring-[var(--rowi-primary)]"
                            : "bg-black/[0.03]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--rowi-foreground)]">
                            {team.projectCohort}
                          </span>
                          {team.searchMatch && (
                            <span className="text-[10px] uppercase tracking-wide text-[var(--rowi-primary)] font-semibold">
                              {t(
                                "admin.consultant.search.match",
                                "coincidencia",
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[var(--rowi-muted)]">
                          <span>
                            {team.count}{" "}
                            {t("admin.consultant.teams.people", "personas")}
                          </span>
                          {retests > 0 && (
                            <span>
                              {retests}{" "}
                              {t(
                                "admin.consultant.teams.retest",
                                "con re-medición",
                              )}
                            </span>
                          )}
                          <button
                            onClick={() =>
                              setLeaderCohort(team.projectCohort)
                            }
                            className="text-[var(--rowi-primary)] hover:underline"
                          >
                            {t(
                              "admin.consultant.teams.useCohort",
                              "usar como equipo",
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Añadir líderes por email */}
            <div className="rounded-lg border border-[var(--rowi-border)] p-3 space-y-3">
              <h3 className="text-xs font-semibold text-[var(--rowi-foreground)]">
                {t("admin.consultant.leaders.add", "Añadir líderes")}
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addPendingLeader();
                  }}
                  placeholder={t(
                    "admin.consultant.leaders.emailPlaceholder",
                    "Email del líder",
                  )}
                  className="flex-1 bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
                />
                <input
                  type="text"
                  value={leaderLabel}
                  onChange={(e) => setLeaderLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addPendingLeader();
                  }}
                  placeholder={t(
                    "admin.consultant.leaders.labelPlaceholder",
                    "Nombre visible (opcional)",
                  )}
                  className="sm:w-48 bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
                />
                <input
                  type="text"
                  value={leaderCohort}
                  onChange={(e) => setLeaderCohort(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addPendingLeader();
                  }}
                  placeholder={t(
                    "admin.consultant.leaders.cohortPlaceholder",
                    "Equipo (opcional)",
                  )}
                  className="sm:w-48 bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
                />
                <button
                  onClick={addPendingLeader}
                  disabled={!leaderEmail.trim()}
                  className="rowi-btn flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t("admin.consultant.leaders.addButton", "Añadir")}
                </button>
              </div>

              {/* Lista de líderes pendientes */}
              {pendingLeaders.length > 0 && (
                <ul className="space-y-1.5">
                  {pendingLeaders.map((l) => (
                    <li
                      key={l.email}
                      className="flex items-center justify-between text-xs bg-black/[0.03] rounded-lg px-3 py-1.5"
                    >
                      <span>
                        <span className="font-medium">{l.label || l.email}</span>
                        {l.label && (
                          <span className="text-[var(--rowi-muted)]"> ({l.email})</span>
                        )}
                        {l.cohort && (
                          <span className="text-[var(--rowi-muted)]">
                            {" "}
                            → {l.cohort}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => removePendingLeader(l.email)}
                        className="text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={saveLeaders}
                disabled={savingLeaders || pendingLeaders.length === 0}
                className="rowi-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {savingLeaders ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {t("admin.consultant.leaders.save", "Guardar líderes")}
              </button>

              {/* Resultado: matcheados / no encontrados */}
              {leaderResult && (
                <div className="text-xs space-y-1">
                  {leaderResult.assigned > 0 && (
                    <p className="text-emerald-600">
                      {leaderResult.assigned}{" "}
                      {t(
                        "admin.consultant.leaders.assigned",
                        "líder(es) verificado(s) y guardado(s)",
                      )}
                    </p>
                  )}
                  {leaderResult.notFound.length > 0 && (
                    <p className="text-amber-600">
                      {t(
                        "admin.consultant.leaders.notFound",
                        "No coinciden con el dataset",
                      )}
                      : {leaderResult.notFound.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Step>

      {/* ───────── PASO 4: Hallazgos ───────── */}
      <Step
        n={4}
        title={t("admin.consultant.step4.title", "Hallazgos")}
        disabled={inferred === null}
      >
        {inferred === null ? (
          <p className="text-xs text-[var(--rowi-muted)] italic">
            {t(
              "admin.consultant.step4.locked",
              "Completa los pasos anteriores.",
            )}
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button
                onClick={loadFindings}
                disabled={loadingFindings}
                className="rowi-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {loadingFindings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Microscope className="w-4 h-4" />
                )}
                {findings
                  ? t("admin.consultant.findings.refresh", "Recalcular")
                  : t("admin.consultant.findings.load", "Generar hallazgos")}
              </button>
              {findings && (
                <span className="text-xs text-[var(--rowi-muted)]">
                  {findings.totalDataPoints.toLocaleString()}{" "}
                  {t("admin.consultant.findings.dataPoints", "data points")}
                </span>
              )}
            </div>

            {findingsError && (
              <p className="text-xs text-rose-600">{findingsError}</p>
            )}

            {findings && (
              <FindingsView findings={findings} t={t} lang={lang} />
            )}
          </div>
        )}
      </Step>
    </div>
  );
}

/* ───────────────────────────── Subcomponentes ───────────────────────────── */

function Step({
  n,
  title,
  children,
  disabled,
  done,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  done?: boolean;
}) {
  return (
    <section
      className={`rowi-card space-y-3 ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
            done
              ? "bg-emerald-500 text-white"
              : "bg-[var(--rowi-primary)]/15 text-[var(--rowi-primary)]"
          }`}
        >
          {done ? <CheckCircle className="w-4 h-4" /> : n}
        </div>
        <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">
          {title}
        </h2>
      </div>
      <div className="pl-8">{children}</div>
    </section>
  );
}

function FindingsView({
  findings,
  t,
  lang,
}: {
  findings: Findings;
  t: (k: string, fb?: string) => string;
  lang: string;
}) {
  const { leaders, topCorrelations, temporalDrift, teams } = findings;

  return (
    <div className="space-y-6">
      {/* ── Espejo líder↔equipo ── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--rowi-muted)] mb-2">
          {t("admin.consultant.mirror.title", "Espejo líder ↔ equipo")}
        </h3>
        {leaders.length === 0 ? (
          <p className="text-xs text-[var(--rowi-muted)] italic">
            {t(
              "admin.consultant.mirror.empty",
              "No hay líderes marcados. Vuelve al paso 3 y marca al menos un líder para ver su espejo respecto al equipo.",
            )}
          </p>
        ) : (
          <div className="space-y-3">
            {leaders.map((leader) => (
              <div
                key={leader.personHash}
                className="rounded-lg border border-[var(--rowi-border)] p-3"
              >
                <div className="flex items-center gap-2 mb-2 text-xs">
                  {leader.label ? (
                    <span className="text-[var(--rowi-foreground)] font-semibold">
                      {leader.label}
                    </span>
                  ) : (
                    <span className="font-mono text-[var(--rowi-muted)]">
                      {shortHash(leader.personHash)}
                    </span>
                  )}
                  {leader.projectCohort && (
                    <span className="text-[var(--rowi-foreground)] font-medium">
                      · {leader.projectCohort}
                    </span>
                  )}
                </div>
                {!leader.mirror.present ? (
                  <p className="text-xs text-[var(--rowi-muted)] italic">
                    {t(
                      "admin.consultant.mirror.noData",
                      "Sin datos suficientes del equipo para comparar a este líder.",
                    )}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Por encima */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-emerald-600 font-semibold mb-1">
                        {t(
                          "admin.consultant.mirror.above",
                          "Por encima del equipo",
                        )}
                      </p>
                      {leader.mirror.aboveTeam.length === 0 ? (
                        <p className="text-xs text-[var(--rowi-muted)] italic">
                          —
                        </p>
                      ) : (
                        <ul className="space-y-0.5">
                          {leader.mirror.aboveTeam.map((d) => (
                            <li
                              key={d.key}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="flex items-center gap-1">
                                <ArrowUp className="w-3 h-3 text-emerald-600" />
                                {compLabel(d.key, lang)}
                              </span>
                              <span className="font-mono text-emerald-600">
                                {fmtDelta(d.vsNorm)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {/* Por debajo */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-rose-600 font-semibold mb-1">
                        {t(
                          "admin.consultant.mirror.below",
                          "Por debajo del equipo",
                        )}
                      </p>
                      {leader.mirror.belowTeam.length === 0 ? (
                        <p className="text-xs text-[var(--rowi-muted)] italic">
                          —
                        </p>
                      ) : (
                        <ul className="space-y-0.5">
                          {leader.mirror.belowTeam.map((d) => (
                            <li
                              key={d.key}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="flex items-center gap-1">
                                <ArrowDown className="w-3 h-3 text-rose-600" />
                                {compLabel(d.key, lang)}
                              </span>
                              <span className="font-mono text-rose-600">
                                {fmtDelta(d.vsNorm)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Correlaciones top ── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--rowi-muted)] mb-2">
          {t(
            "admin.consultant.corr.title",
            "Correlaciones EQ → resultado (Pearson r)",
          )}
        </h3>
        {topCorrelations.length === 0 ? (
          <p className="text-xs text-[var(--rowi-muted)] italic">
            {t(
              "admin.consultant.corr.empty",
              "Sin correlaciones significativas (muestra insuficiente o sin resultados en el dataset).",
            )}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[var(--rowi-muted)] uppercase tracking-wide">
                <tr className="border-b border-[var(--rowi-border)]">
                  <th className="text-left py-1.5 px-2">
                    {t("admin.consultant.corr.competency", "Competencia")}
                  </th>
                  <th className="text-left py-1.5 px-2">
                    {t("admin.consultant.corr.outcome", "Resultado")}
                  </th>
                  <th className="text-right py-1.5 px-2">r</th>
                  <th className="text-right py-1.5 px-2">n</th>
                </tr>
              </thead>
              <tbody>
                {topCorrelations.map((c, i) => (
                  <tr
                    key={`${c.competencyKey}-${c.outcomeKey}-${i}`}
                    className="border-b border-[var(--rowi-border)]/40"
                  >
                    <td className="py-1.5 px-2 font-medium">
                      {compLabel(c.competencyKey, lang)}
                    </td>
                    <td className="py-1.5 px-2">
                      {t(
                        `admin.consultant.outcome.${c.outcomeKey}`,
                        c.outcomeKey,
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono">
                      <span
                        className={
                          c.r >= 0.5
                            ? "text-emerald-600"
                            : c.r <= -0.5
                              ? "text-rose-600"
                              : ""
                        }
                      >
                        {c.r >= 0 ? "+" : ""}
                        {c.r.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right text-[var(--rowi-muted)]">
                      {c.n}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Deriva temporal ── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--rowi-muted)] mb-2">
          {t("admin.consultant.drift.title", "Deriva temporal (re-medición)")}
        </h3>
        {!temporalDrift.present ? (
          <p className="text-xs text-[var(--rowi-muted)] italic">
            {t(
              "admin.consultant.drift.empty",
              "Sin datos de re-medición: nadie tiene dos tomas en este dataset, así que no hay deriva que mostrar.",
            )}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[var(--rowi-muted)]">
              {temporalDrift.peopleWithRetest}{" "}
              {t(
                "admin.consultant.drift.people",
                "personas con re-medición",
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-emerald-600 font-semibold mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {t("admin.consultant.drift.improved", "Mejoró")}
                </p>
                {temporalDrift.improved.length === 0 ? (
                  <p className="text-xs text-[var(--rowi-muted)] italic">—</p>
                ) : (
                  <ul className="space-y-0.5">
                    {temporalDrift.improved.map((d) => (
                      <li
                        key={d.key}
                        className="flex items-center justify-between text-xs"
                      >
                        <span>{compLabel(d.key, lang)}</span>
                        <span className="font-mono text-emerald-600">
                          {fmtDelta(d.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-rose-600 font-semibold mb-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  {t("admin.consultant.drift.declined", "Bajó")}
                </p>
                {temporalDrift.declined.length === 0 ? (
                  <p className="text-xs text-[var(--rowi-muted)] italic">—</p>
                ) : (
                  <ul className="space-y-0.5">
                    {temporalDrift.declined.map((d) => (
                      <li
                        key={d.key}
                        className="flex items-center justify-between text-xs"
                      >
                        <span>{compLabel(d.key, lang)}</span>
                        <span className="font-mono text-rose-600">
                          {fmtDelta(d.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Fortalezas / brechas por equipo ── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--rowi-muted)] mb-2">
          {t(
            "admin.consultant.team.title",
            "Fortalezas y brechas por equipo (vs norma 100)",
          )}
        </h3>
        {teams.length === 0 ? (
          <p className="text-xs text-[var(--rowi-muted)] italic">
            {t("admin.consultant.team.empty", "Sin equipos en el dataset.")}
          </p>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.projectCohort}
                className="rounded-lg border border-[var(--rowi-border)] p-3"
              >
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <Target className="w-3.5 h-3.5 text-[var(--rowi-muted)]" />
                  <span className="font-medium text-[var(--rowi-foreground)]">
                    {team.projectCohort}
                  </span>
                  <span className="text-[var(--rowi-muted)]">
                    · n={team.n}
                    {team.eqAverage !== null &&
                      ` · EQ ${team.eqAverage.toFixed(1)}`}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-emerald-600 font-semibold mb-1">
                      {t("admin.consultant.team.strengths", "Fortalezas")}
                    </p>
                    <ul className="space-y-0.5">
                      {team.strengths.map((d) => (
                        <li
                          key={d.key}
                          className="flex items-center justify-between text-xs"
                        >
                          <span>{compLabel(d.key, lang)}</span>
                          <span className="font-mono text-emerald-600">
                            {fmtDelta(d.vsNorm)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-rose-600 font-semibold mb-1">
                      {t("admin.consultant.team.gaps", "Brechas")}
                    </p>
                    <ul className="space-y-0.5">
                      {team.gaps.map((d) => (
                        <li
                          key={d.key}
                          className="flex items-center justify-between text-xs"
                        >
                          <span>{compLabel(d.key, lang)}</span>
                          <span className="font-mono text-rose-600">
                            {fmtDelta(d.vsNorm)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Descargar entregables (PPTX con la línea gráfica de Rowi) ── */}
      <HallazgosDownload findings={findings} t={t} />
    </div>
  );
}

/** Botón de descarga del deck de Hallazgos preliminares (PPTX) desde findings. */
function HallazgosDownload({
  findings,
  t,
}: {
  findings: Findings;
  t: (k: string, fb?: string) => string;
}) {
  const [dlLang, setDlLang] = useState<"es" | "en" | "pt">("es");
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/consultant/deliverable/hallazgos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findings, lang: dlLang, client: findings.benchmarkId }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const fname = cd.match(/filename="([^"]+)"/)?.[1] || `hallazgos-${dlLang}.pptx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-5 flex items-center justify-between flex-wrap gap-3">
      <div>
        <h3 className="font-semibold text-[var(--rowi-fg)]">
          {t("consultant.deliverables.title", "Descargar entregables")}
        </h3>
        <p className="text-xs text-[var(--rowi-muted)]">
          {t("admin.consultant.deliverables.hallazgosHint", "Deck de hallazgos preliminares (lectura cruzada TVS+SEI) para la conversación interna.")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={dlLang}
          onChange={(e) => setDlLang(e.target.value as "es" | "en" | "pt")}
          className="rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-2 py-1 text-sm text-[var(--rowi-fg)]"
        >
          <option value="es">ES</option>
          <option value="en">EN</option>
          <option value="pt">PT</option>
        </select>
        <button
          onClick={download}
          disabled={busy}
          className="text-sm rounded-lg border border-[var(--rowi-card-border)] px-3 py-1.5 text-[var(--rowi-fg)] disabled:opacity-50"
        >
          {busy ? t("consultant.deliverables.generating", "Generando…") : `⬇ ${t("consultant.deliverables.hallazgos", "Hallazgos preliminares (PPTX)")}`}
        </button>
      </div>
    </div>
  );
}
