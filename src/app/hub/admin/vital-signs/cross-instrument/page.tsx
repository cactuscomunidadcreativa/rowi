"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { GitCompareArrows, Upload, RefreshCw, Loader2, Link2 } from "lucide-react";

interface Cohort {
  id: string;
  label: string;
  vsScope: string;
  source: string;
  country: string | null;
  sector: string | null;
  vsSampleSize: number;
  seiSampleSize: number;
  createdAt: string;
  _count: { metrics: number };
}

interface Correlation {
  vsScope: string;
  vsKey: string;
  seiKey: string;
  correlation: number;
  n: number;
}

export default function VsSeiCrossInstrumentPage() {
  const { t } = useI18n();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/vital-signs/cross-instrument");
      const j = await r.json();
      if (j.ok) {
        setCohorts(j.cohorts);
        setCorrelations(j.correlations);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadCohort(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setMsg(null);
    try {
      const form = new FormData(e.currentTarget);
      const r = await fetch("/api/admin/vital-signs/cross-instrument/cohort", {
        method: "POST",
        body: form,
      });
      const j = await r.json();
      if (j.ok) {
        setMsg(
          `${t("admin.vsSei.added", "Cohorte agregada")}: ${j.cohort.label} · VS ${j.vsMetrics} · SEI ${j.seiMetrics}`,
        );
        (e.target as HTMLFormElement).reset();
        await load();
      } else {
        setMsg(`Error: ${j.error ?? "unknown"}${j.details ? " — " + JSON.stringify(j.details) : ""}`);
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function recompute() {
    setRecomputing(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/vital-signs/cross-instrument/recompute", { method: "POST" });
      const j = await r.json();
      if (j.ok) {
        setMsg(`${t("admin.vsSei.recomputed", "Recalculado")}: ${j.written} correlaciones · ${j.cohorts} cohortes (${j.durationMs}ms)`);
        await load();
      } else {
        setMsg(`Error: ${j.error ?? "unknown"}`);
      }
    } finally {
      setRecomputing(false);
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md">
          <GitCompareArrows className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
            {t("admin.vsSei.title", "Correlaciones cruzadas VS ↔ SEI")}
          </h1>
          <p className="text-xs text-[var(--rowi-muted)]">
            {t(
              "admin.vsSei.subtitle",
              "Sube los resultados VS (OVS/TVS/LVS) y SEI de una misma cohorte. Las correlaciones se calculan entre cohortes (cada cohorte es un punto).",
            )}
          </p>
        </div>
      </div>

      {msg && (
        <div className="rowi-card text-xs flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[var(--rowi-primary)]" />
          <span>{msg}</span>
        </div>
      )}

      {/* Upload form */}
      <form onSubmit={uploadCohort} className="rowi-card space-y-4">
        <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">
          {t("admin.vsSei.newCohort", "Nueva cohorte emparejada")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="label"
            required
            placeholder={t("admin.vsSei.label", "Etiqueta (org / equipo / estudio)")}
            className="w-full bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-primary)] transition-all"
          />
          <select name="vsScope" className="w-full bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-primary)] transition-all" defaultValue="OVS">
            <option value="OVS">OVS</option>
            <option value="TVS">TVS</option>
            <option value="LVS">LVS</option>
          </select>
          <select name="source" className="w-full bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-primary)] transition-all" defaultValue="study">
            <option value="study">{t("admin.vsSei.sourceStudy", "Estudio (data histórica)")}</option>
            <option value="live">{t("admin.vsSei.sourceLive", "En vivo (org / cohorte)")}</option>
          </select>
          <input name="country" placeholder={t("admin.vsSei.country", "País (opcional)")} className="w-full bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-primary)] transition-all" />
          <input name="sector" placeholder={t("admin.vsSei.sector", "Sector (opcional)")} className="w-full bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-primary)] transition-all" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-[var(--rowi-muted)]">
            {t("admin.vsSei.vsFile", "Archivo VS (OVS/TVS .csv · LVS .xlsx)")}
            <input name="vsFile" type="file" required accept=".csv,.xlsx" className="block mt-1 text-sm" />
          </label>
          <label className="text-xs text-[var(--rowi-muted)]">
            {t("admin.vsSei.seiFile", "Archivo SEI (.csv)")}
            <input name="seiFile" type="file" required accept=".csv" className="block mt-1 text-sm" />
          </label>
        </div>
        <button type="submit" disabled={uploading} className="rowi-btn-primary flex items-center gap-2 text-sm">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {t("admin.vsSei.upload", "Subir cohorte")}
        </button>
      </form>

      {/* Cohorts */}
      <section className="rowi-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">
            {t("admin.vsSei.cohorts", "Cohortes")} ({cohorts.length})
          </h2>
          <button
            onClick={recompute}
            disabled={recomputing || cohorts.length < 3}
            className="rowi-btn flex items-center gap-2 text-xs"
            title={cohorts.length < 3 ? t("admin.vsSei.need3", "Se necesitan ≥3 cohortes") : undefined}
          >
            {recomputing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {t("admin.vsSei.recompute", "Recalcular correlaciones")}
          </button>
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[var(--rowi-muted)]" />
        ) : cohorts.length === 0 ? (
          <p className="text-xs text-[var(--rowi-muted)] italic">
            {t("admin.vsSei.noCohorts", "Aún no hay cohortes. Sube un par VS + SEI para empezar.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[var(--rowi-muted)] uppercase tracking-wide">
                <tr className="border-b border-[var(--rowi-border)]">
                  <th className="text-left py-2 px-2">{t("admin.vsSei.label", "Etiqueta")}</th>
                  <th className="text-left py-2 px-2">VS</th>
                  <th className="text-left py-2 px-2">{t("admin.vsSei.source", "Origen")}</th>
                  <th className="text-right py-2 px-2">n VS</th>
                  <th className="text-right py-2 px-2">n SEI</th>
                  <th className="text-right py-2 px-2">{t("admin.vsSei.metrics", "Métricas")}</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--rowi-border)]/40">
                    <td className="py-1.5 px-2 font-medium">{c.label}</td>
                    <td className="py-1.5 px-2">{c.vsScope}</td>
                    <td className="py-1.5 px-2 text-[var(--rowi-muted)]">{c.source}</td>
                    <td className="py-1.5 px-2 text-right">{c.vsSampleSize}</td>
                    <td className="py-1.5 px-2 text-right">{c.seiSampleSize}</td>
                    <td className="py-1.5 px-2 text-right">{c._count.metrics}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Correlations */}
      <section className="rowi-card">
        <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
          {t("admin.vsSei.correlations", "Correlaciones VS ↔ SEI (Pearson r, entre cohortes)")}
        </h2>
        {correlations.length === 0 ? (
          <p className="text-xs text-[var(--rowi-muted)] italic">
            {t("admin.vsSei.noCorr", "Sin correlaciones todavía. Necesitas ≥3 cohortes y recalcular.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[var(--rowi-muted)] uppercase tracking-wide">
                <tr className="border-b border-[var(--rowi-border)]">
                  <th className="text-left py-2 px-2">{t("admin.vsSei.scope", "Scope")}</th>
                  <th className="text-left py-2 px-2">VS</th>
                  <th className="text-left py-2 px-2">SEI</th>
                  <th className="text-right py-2 px-2">r</th>
                  <th className="text-right py-2 px-2">n</th>
                </tr>
              </thead>
              <tbody>
                {correlations.map((c, i) => (
                  <tr key={`${c.vsScope}-${c.vsKey}-${c.seiKey}-${i}`} className="border-b border-[var(--rowi-border)]/40">
                    <td className="py-1.5 px-2 text-[var(--rowi-muted)]">{c.vsScope}</td>
                    <td className="py-1.5 px-2 font-medium">{c.vsKey}</td>
                    <td className="py-1.5 px-2 font-medium">{c.seiKey}</td>
                    <td className="py-1.5 px-2 text-right font-mono">
                      <span className={c.correlation > 0.5 ? "text-emerald-600" : c.correlation < -0.5 ? "text-rose-600" : ""}>
                        {c.correlation >= 0 ? "+" : ""}
                        {c.correlation.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right text-[var(--rowi-muted)]">{c.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
