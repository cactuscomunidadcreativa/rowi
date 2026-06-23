"use client";

/* =========================================================
   🎯 Hiring / Selección — UI del consultor
   ---------------------------------------------------------
   Sube un CSV SEI, elige al manager (líder del proceso) entre las
   personas del propio CSV (match exacto garantizado), y analiza:
   afinidad por 6 contextos · benchmark mundial · hipótesis LVS.

   El caso queda ARCHIVADO (HiringCase) y reabrible — NO crea comunidad
   ni relaciones (ver docs/entregables/HIRING_PROCESO_Y_ROWIVERSE.md).

   Acceso: capability "consultant.hiring" (gate real en el endpoint).
========================================================= */

import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  Upload,
  Loader2,
  Lock,
  Trash2,
  FileText,
  BookOpen,
  Sparkles,
  Info,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAdminUser } from "../components/AdminUserContext";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

type Lang = "es" | "pt" | "en";

const CTX_ORDER = [
  "leadership",
  "execution",
  "innovation",
  "decision",
  "conversation",
  "relationship",
] as const;

// ── Forma del reportData que devuelve el motor (HiringReportData) ──
interface ReportCandidate {
  name: string;
  role: string;
  eq: number;
  brain: string;
  changeStyle: string;
  influence: string;
  affinityAvg: number;
  affinityByContext: Record<string, number>;
  affinityBands: Record<string, "hot" | "warm" | "cold">;
  eqPercentile: number;
  lvs: { score: number; band: "low" | "mid" | "high" };
}
interface HiringReport {
  process: string;
  meta: string;
  leaderName: string;
  leaderMeta: string;
  candidates: ReportCandidate[];
  benchmark: { nTotal: number; nTop: number };
}
interface CaseListItem {
  id: string;
  process: string;
  managerName: string;
  lang: string;
  candidateCount: number;
  contributedToRowiverse: number;
  createdAt: string;
}

const BAND_STYLE: Record<string, string> = {
  hot: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warm: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  cold: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
};

export default function HiringPage() {
  const { t, ready } = useI18n();
  const { can, loading: userLoading, isSuperAdmin } = useAdminUser();
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [fileName, setFileName] = useState<string>("");
  const [csvText, setCsvText] = useState<string>("");
  const [names, setNames] = useState<string[]>([]);
  const [managerName, setManagerName] = useState<string>("");
  const [processName, setProcessName] = useState<string>("");
  const [lang, setLang] = useState<Lang>("es");
  const [contribute, setContribute] = useState<boolean>(true);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string>("");
  const [report, setReport] = useState<HiringReport | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  // History
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [deleting, setDeleting] = useState<CaseListItem | null>(null);
  const [busyPdf, setBusyPdf] = useState<string>("");

  const allowed = isSuperAdmin || can("consultant.hiring");

  useEffect(() => {
    if (!userLoading && allowed) void loadCases();
  }, [userLoading, allowed]);

  async function loadCases() {
    try {
      const res = await fetch("/api/hiring/analyze");
      if (!res.ok) return;
      const j = await res.json();
      if (j.ok) setCases(j.cases ?? []);
    } catch {
      /* silencioso */
    }
  }

  // Parseo en cliente SOLO para extraer los nombres y poblar el dropdown del
  // manager. El cálculo lo hace el server. Los nombres se construyen igual que
  // el parser del backend ("Name Surname") para garantizar el match exacto.
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setReport(null);
    setActiveCaseId(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsvText(text);
      setFileName(file.name);
      const peopleNames = extractNames(text);
      setNames(peopleNames);
      setManagerName(peopleNames[0] ?? "");
      if (!processName) setProcessName(file.name.replace(/\.csv$/i, ""));
    };
    reader.readAsText(file);
  }

  function extractNames(text: string): string[] {
    const grid = (Papa.parse(text, { skipEmptyLines: true }).data as string[][]) ?? [];
    if (grid.length < 2) return [];
    const hdr = grid[0];
    const iName = hdr.indexOf("Test Taker Name");
    const iSur = hdr.indexOf("Test Taker Surname");
    if (iName < 0) return [];
    const out: string[] = [];
    for (let r = 1; r < grid.length; r++) {
      const row = grid[r];
      if (!row || !row[iName]) continue;
      const name = `${row[iName]} ${iSur >= 0 ? row[iSur] ?? "" : ""}`.trim();
      if (name) out.push(name);
    }
    return out;
  }

  async function analyze() {
    if (!csvText || !managerName || analyzing) return;
    setAnalyzing(true);
    setError("");
    setReport(null);
    setActiveCaseId(null);
    try {
      const res = await fetch("/api/hiring/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seiCsv: csvText,
          managerName,
          process: processName || undefined,
          lang,
          contributeToRowiverse: contribute,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        setError(errorLabel(j?.error));
        return;
      }
      setReport(j.report as HiringReport);
      setActiveCaseId(j.caseId ?? null);
      void loadCases();
    } catch {
      setError(t("hiring.error.internal", "No se pudo completar el análisis."));
    } finally {
      setAnalyzing(false);
    }
  }

  function errorLabel(code?: string): string {
    switch (code) {
      case "manager_not_found_in_csv":
        return t("hiring.error.managerNotFound", "El manager elegido no está en el CSV.");
      case "csv_needs_at_least_2_people":
      case "csv_empty_or_invalid":
        return t("hiring.error.csvInvalid", "El CSV necesita al menos 2 personas válidas.");
      case "no_candidates":
        return t("hiring.error.noCandidates", "No hay candidatos además del manager.");
      case "capability_denied":
        return t("hiring.error.denied", "No tienes acceso a este módulo.");
      default:
        return t("hiring.error.internal", "No se pudo completar el análisis.");
    }
  }

  // Descarga de PDF de un caso (reporte-full | guia-presentador), idioma elegido.
  async function downloadPdf(caseId: string, pdf: string, pdfLang: Lang) {
    const key = `${caseId}:${pdf}`;
    if (busyPdf) return;
    setBusyPdf(key);
    try {
      const res = await fetch(`/api/hiring/case/${caseId}?pdf=${pdf}&lang=${pdfLang}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const fname = cd.match(/filename="([^"]+)"/)?.[1] || `rowi-hiring-${pdf}-${pdfLang}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusyPdf("");
    }
  }

  async function reopenCase(caseId: string) {
    setError("");
    try {
      const res = await fetch(`/api/hiring/case/${caseId}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        setError(errorLabel(j?.error));
        return;
      }
      setReport(j.case.report as HiringReport);
      setActiveCaseId(caseId);
      setLang((j.case.lang as Lang) ?? "es");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("hiring.error.internal", "No se pudo abrir el caso."));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const id = deleting.id;
    try {
      const res = await fetch(`/api/hiring/case/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCases((prev) => prev.filter((c) => c.id !== id));
        if (activeCaseId === id) {
          setReport(null);
          setActiveCaseId(null);
        }
      }
    } finally {
      setDeleting(null);
    }
  }

  const ctxLabels: Record<string, string> = useMemo(
    () => ({
      leadership: t("hiring.ctx.leadership", "Liderazgo"),
      execution: t("hiring.ctx.execution", "Ejecución"),
      innovation: t("hiring.ctx.innovation", "Innovación"),
      decision: t("hiring.ctx.decision", "Decisión"),
      conversation: t("hiring.ctx.conversation", "Conversación"),
      relationship: t("hiring.ctx.relationship", "Relación"),
    }),
    [ready], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Gating de la UI (el endpoint es la frontera real) ──
  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--rowi-muted)]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-8 text-center">
        <Lock className="w-10 h-10 mx-auto mb-4 text-[var(--rowi-muted)]" />
        <h1 className="text-lg font-semibold text-[var(--rowi-fg)]">
          {t("hiring.denied.title", "Módulo de selección")}
        </h1>
        <p className="mt-2 text-sm text-[var(--rowi-muted)]">
          {t(
            "hiring.denied.body",
            "Este módulo está disponible para consultores con el plan adecuado. Contacta al equipo Rowi para activarlo.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Encabezado */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]">
          <Sparkles className="w-3.5 h-3.5" />
          {t("hiring.eyebrow", "Selección · lente de relación")}
        </div>
        <h1 className="text-2xl font-bold text-[var(--rowi-fg)]">
          {t("hiring.title", "Proceso de hiring")}
        </h1>
        <p className="text-sm text-[var(--rowi-muted)] max-w-2xl">
          {t(
            "hiring.subtitle",
            "Sube un CSV SEI, marca al manager del proceso y obtén afinidad por contexto, benchmark mundial e hipótesis LVS. Es una lente de relación y desarrollo, no un veredicto.",
          )}
        </p>
      </header>

      {/* Formulario de análisis */}
      <section className="rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Carga del CSV */}
          <div>
            <label className="block text-sm font-medium text-[var(--rowi-fg)] mb-2">
              {t("hiring.form.csv", "CSV SEI de candidatos")}
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-2 rounded-xl border border-dashed border-[var(--rowi-card-border)] px-4 py-3 text-sm text-[var(--rowi-muted)] hover:border-[var(--rowi-g2)] hover:text-[var(--rowi-fg)] transition-colors"
            >
              <Upload className="w-4 h-4" />
              {fileName || t("hiring.form.csvPlaceholder", "Selecciona un archivo .csv")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="hidden"
            />
            {names.length > 0 && (
              <p className="mt-1.5 text-xs text-[var(--rowi-muted)]">
                {t("hiring.form.peopleFound", "Personas detectadas")}: {names.length}
              </p>
            )}
          </div>

          {/* Nombre del proceso */}
          <div>
            <label className="block text-sm font-medium text-[var(--rowi-fg)] mb-2">
              {t("hiring.form.process", "Nombre del proceso")}
            </label>
            <input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              placeholder={t("hiring.form.processPlaceholder", "Ej. Recrutamento BDP")}
              className="w-full rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2.5 text-sm text-[var(--rowi-fg)]"
            />
          </div>

          {/* Dropdown del manager */}
          <div>
            <label className="block text-sm font-medium text-[var(--rowi-fg)] mb-2">
              {t("hiring.form.manager", "Manager (líder del proceso)")}
            </label>
            <select
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              disabled={names.length === 0}
              className="w-full rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2.5 text-sm text-[var(--rowi-fg)] disabled:opacity-50"
            >
              {names.length === 0 && (
                <option value="">{t("hiring.form.managerEmpty", "Sube un CSV primero")}</option>
              )}
              {names.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Idioma */}
          <div>
            <label className="block text-sm font-medium text-[var(--rowi-fg)] mb-2">
              {t("hiring.form.lang", "Idioma del reporte")}
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="w-full rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2.5 text-sm text-[var(--rowi-fg)]"
            >
              <option value="es">Español</option>
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--rowi-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={contribute}
            onChange={(e) => setContribute(e.target.checked)}
            className="rounded border-[var(--rowi-card-border)]"
          />
          {t(
            "hiring.form.contribute",
            "Contribuir la data SEI (anónima) al Rowiverse para mejorar el modelo",
          )}
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-[var(--rowi-muted)] inline-flex items-center gap-1.5 max-w-xl">
            <Info className="w-3.5 h-3.5 shrink-0" />
            {t(
              "hiring.form.note",
              "El caso se guarda archivado y reabrible. No crea comunidad ni relaciones.",
            )}
          </p>
          <button
            type="button"
            onClick={analyze}
            disabled={!csvText || !managerName || analyzing}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--rowi-g2)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyzing ? t("hiring.form.analyzing", "Analizando…") : t("hiring.form.analyze", "Analizar")}
          </button>
        </div>
      </section>

      {/* Resultado */}
      {report && (
        <ResultPanel
          report={report}
          caseId={activeCaseId}
          lang={lang}
          ctxLabels={ctxLabels}
          busyPdf={busyPdf}
          onDownload={downloadPdf}
          t={t}
        />
      )}

      {/* Mis casos */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--rowi-fg)]">
          {t("hiring.cases.title", "Mis casos")}
        </h2>
        {cases.length === 0 ? (
          <p className="text-sm text-[var(--rowi-muted)]">
            {t("hiring.cases.empty", "Aún no has analizado ningún proceso.")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--rowi-card-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--rowi-card-border)] text-left text-[var(--rowi-muted)]">
                  <th className="px-4 py-3 font-medium">{t("hiring.cases.process", "Proceso")}</th>
                  <th className="px-4 py-3 font-medium">{t("hiring.form.manager", "Manager")}</th>
                  <th className="px-4 py-3 font-medium text-center">{t("hiring.cases.candidates", "Candidatos")}</th>
                  <th className="px-4 py-3 font-medium">{t("hiring.cases.date", "Fecha")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("hiring.cases.actions", "Acciones")}</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--rowi-card-border)] last:border-0">
                    <td className="px-4 py-3 text-[var(--rowi-fg)] font-medium">{c.process}</td>
                    <td className="px-4 py-3 text-[var(--rowi-muted)]">{c.managerName}</td>
                    <td className="px-4 py-3 text-center text-[var(--rowi-muted)]">{c.candidateCount}</td>
                    <td className="px-4 py-3 text-[var(--rowi-muted)]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => reopenCase(c.id)}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg border border-[var(--rowi-card-border)] text-[var(--rowi-fg)] hover:bg-[var(--rowi-g2)]/10"
                        >
                          {t("hiring.cases.open", "Abrir")}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadPdf(c.id, "reporte-full", (c.lang as Lang) ?? "es")}
                          disabled={busyPdf === `${c.id}:reporte-full`}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-[var(--rowi-card-border)] text-[var(--rowi-fg)] hover:bg-[var(--rowi-g2)]/10 disabled:opacity-50"
                          title={t("hiring.result.reportFull", "Reporte full")}
                        >
                          {busyPdf === `${c.id}:reporte-full` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(c)}
                          className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10"
                          aria-label={t("hiring.cases.delete", "Borrar")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleting !== null}
        title={t("hiring.delete.title", "Borrar caso")}
        message={t(
          "hiring.delete.body",
          "Se elimina el análisis archivado. La data ya contribuida al Rowiverse no se ve afectada.",
        )}
        variant="danger"
        confirmLabel={t("hiring.cases.delete", "Borrar")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

/* =========================================================
   📊 Panel de resultado
========================================================= */
function ResultPanel({
  report,
  caseId,
  lang,
  ctxLabels,
  busyPdf,
  onDownload,
  t,
}: {
  report: HiringReport;
  caseId: string | null;
  lang: Lang;
  ctxLabels: Record<string, string>;
  busyPdf: string;
  onDownload: (caseId: string, pdf: string, lang: Lang) => void;
  t: (k: string, f?: string) => string;
}) {
  return (
    <section className="rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-6 space-y-6">
      {/* Cabecera del resultado */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--rowi-fg)]">{report.process}</h2>
          <p className="text-sm text-[var(--rowi-muted)] mt-1">
            {t("hiring.result.leader", "Líder")}: <span className="font-medium">{report.leaderName}</span>
          </p>
          <p className="text-xs text-[var(--rowi-muted)] mt-0.5">{report.leaderMeta}</p>
        </div>
        {caseId && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(caseId, "reporte-full", lang)}
              disabled={busyPdf === `${caseId}:reporte-full`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--rowi-card-border)] px-3 py-2 text-sm font-medium text-[var(--rowi-fg)] hover:bg-[var(--rowi-g2)]/10 disabled:opacity-50"
            >
              {busyPdf === `${caseId}:reporte-full` ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {t("hiring.result.reportFull", "Reporte full")}
            </button>
            <button
              type="button"
              onClick={() => onDownload(caseId, "guia-presentador", lang)}
              disabled={busyPdf === `${caseId}:guia-presentador`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--rowi-card-border)] px-3 py-2 text-sm font-medium text-[var(--rowi-fg)] hover:bg-[var(--rowi-g2)]/10 disabled:opacity-50"
            >
              {busyPdf === `${caseId}:guia-presentador` ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
              {t("hiring.result.guide", "Guía del presentador")}
            </button>
          </div>
        )}
      </div>

      {/* Aviso deuda visual: el PDF descargable es la versión condensada */}
      <p className="text-xs text-[var(--rowi-muted)] inline-flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        {t(
          "hiring.result.condensedNote",
          "El PDF descargable es la versión condensada. El reporte completo (12-14 págs) llegará en una mejora próxima.",
        )}
      </p>

      {/* Benchmark resumen */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-[var(--rowi-muted)]">
          {t("hiring.result.benchmark", "Benchmark")}:{" "}
          <span className="font-semibold text-[var(--rowi-fg)]">
            {report.benchmark.nTotal.toLocaleString()}
          </span>{" "}
          {t("hiring.result.benchmarkN", "SEI del mundo")}
        </span>
        <span className="text-[var(--rowi-muted)]">
          {report.benchmark.nTop.toLocaleString()} {t("hiring.result.topPerformers", "top performers")}
        </span>
      </div>

      {/* Ranking de candidatos */}
      <div className="overflow-x-auto rounded-xl border border-[var(--rowi-card-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--rowi-card-border)] text-left text-[var(--rowi-muted)]">
              <th className="px-4 py-3 font-medium">{t("hiring.result.person", "Persona")}</th>
              <th className="px-4 py-3 font-medium text-center">{t("hiring.result.affinity", "Afinidad")}</th>
              <th className="px-4 py-3 font-medium text-center">{t("hiring.result.eqPct", "Percentil EQ")}</th>
              <th className="px-4 py-3 font-medium text-center">{t("hiring.result.lvs", "LVS inferido")}</th>
              {CTX_ORDER.map((ctx) => (
                <th key={ctx} className="px-3 py-3 font-medium text-center whitespace-nowrap">
                  {ctxLabels[ctx]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.candidates.map((c) => (
              <tr key={c.name} className="border-b border-[var(--rowi-card-border)] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--rowi-fg)]">{c.name}</div>
                  <div className="text-xs text-[var(--rowi-muted)]">
                    {c.brain} · {c.influence}
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-[var(--rowi-fg)]">
                  {c.affinityAvg}
                </td>
                <td className="px-4 py-3 text-center text-[var(--rowi-muted)]">{c.eqPercentile}</td>
                <td className="px-4 py-3 text-center text-[var(--rowi-muted)]">{c.lvs.score}</td>
                {CTX_ORDER.map((ctx) => (
                  <td key={ctx} className="px-3 py-3 text-center">
                    <span
                      className={`inline-block min-w-[2.5rem] px-2 py-0.5 rounded-md text-xs font-medium ${
                        BAND_STYLE[c.affinityBands?.[ctx] ?? "cold"]
                      }`}
                    >
                      {c.affinityByContext?.[ctx] ?? "—"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--rowi-muted)]">
        {t(
          "hiring.result.bandsNote",
          "Bandas de afinidad: 108-135 alta sintonía · 92-107 media · <92 baja. Escala 0-135.",
        )}
      </p>
    </section>
  );
}
