"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  Brain,
  RefreshCw,
  Loader2,
  TrendingUp,
  Activity,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface StatRow {
  dimension: string;
  level: string;
  n: number;
  mean: number;
  sd: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
}

interface CorrelationRow {
  xKey: string;
  yKey: string;
  correlation: number;
  n: number;
}

interface ScopeSummary {
  scope: "OVS" | "TVS" | "LVS" | "FVS";
  assessmentCount: number;
  contributingRows: number;
  lastDataAddedAt: string | null;
  lastRecomputedAt: string | null;
  statsVersion: number | null;
  globalStats: StatRow[];
  topCorrelations: CorrelationRow[];
}

const SCOPE_META: Record<ScopeSummary["scope"], { label: string; description: string }> = {
  OVS: { label: "OVS — Organizational", description: "Clima organizacional (5 drivers + outcomes a escala empresa)" },
  TVS: { label: "TVS — Team", description: "Clima de equipo (5 drivers + arquetipos)" },
  LVS: { label: "LVS — Leadership", description: "Evaluación 360 de liderazgo (Self / Manager / Reports / Peers / Clients)" },
  FVS: { label: "FVS — Family", description: "Vital Signs adaptado al sistema familiar (extensión Rowi)" },
};

export default function VsBenchmarkAdminPage() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<ScopeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>("OVS");
  const [lastRunMsg, setLastRunMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/vital-signs/benchmarks");
      const j = await r.json();
      if (j.ok) setSummary(j.summary);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function recompute(scope?: string) {
    setRecomputing(scope ?? "ALL");
    setLastRunMsg(null);
    try {
      const r = await fetch("/api/admin/vital-signs/benchmarks/recompute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scope ? { scope } : {}),
      });
      const j = await r.json();
      if (j.ok) {
        setLastRunMsg(
          `${j.scope}: ${j.stats.written} stats · ${j.correlations.written} correlations (${j.durationMs}ms)`,
        );
        await load();
      } else {
        setLastRunMsg(`Error: ${j.error ?? "unknown"}`);
      }
    } catch (e) {
      setLastRunMsg(e instanceof Error ? e.message : "Recompute failed");
    } finally {
      setRecomputing(null);
    }
  }

  function fmt(n: number | null, d = 1) {
    if (n === null || n === undefined) return "—";
    return n.toFixed(d);
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
              {t("admin.vsBench.title", "Benchmark del Rowiverse — Vital Signs")}
            </h1>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t(
                "admin.vsBench.subtitle",
                "Estadísticas globales y correlaciones internas por instrumento (OVS / TVS / LVS / FVS). Recalculado a partir de cada upload contribuyente.",
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => recompute()}
          disabled={!!recomputing}
          className="rowi-btn-primary flex items-center gap-2"
        >
          {recomputing === "ALL" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t("admin.vsBench.recomputeAll", "Recomputar todo")}
        </button>
      </div>

      {lastRunMsg && (
        <div className="rowi-card flex items-center gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-[var(--rowi-primary)]" />
          <span>{lastRunMsg}</span>
        </div>
      )}

      {loading && (
        <div className="rowi-card flex items-center gap-2 text-sm text-[var(--rowi-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("common.loading", "Cargando…")}
        </div>
      )}

      {!loading && summary.map((s) => {
        const isOpen = expanded === s.scope;
        const meta = SCOPE_META[s.scope];
        return (
          <section key={s.scope} className="rowi-card">
            <button
              onClick={() => setExpanded(isOpen ? null : s.scope)}
              className="w-full flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 text-left">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <div>
                  <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">{meta.label}</h2>
                  <p className="text-xs text-[var(--rowi-muted)]">{meta.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <Stat label={t("admin.vsBench.assessments", "Assessments")} value={s.assessmentCount} />
                <Stat label={t("admin.vsBench.contributingRows", "Filas contribuyentes")} value={s.contributingRows} />
                <Stat
                  label={t("admin.vsBench.lastRecompute", "Último recálculo")}
                  value={s.lastRecomputedAt ? new Date(s.lastRecomputedAt).toLocaleString() : "—"}
                />
              </div>
            </button>

            {isOpen && (
              <div className="mt-4 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.vsBench.statsVersion", "Versión stats")}: {s.statsVersion ?? "—"}
                  </p>
                  <button
                    onClick={() => recompute(s.scope)}
                    disabled={!!recomputing || s.contributingRows === 0}
                    className="rowi-btn flex items-center gap-2 text-xs"
                  >
                    {recomputing === s.scope ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    {t("admin.vsBench.recomputeScope", "Recomputar")} {s.scope}
                  </button>
                </div>

                {/* Global stats */}
                <div>
                  <h3 className="text-xs font-semibold text-[var(--rowi-muted)] uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" />
                    {t("admin.vsBench.globalStats", "Estadísticas globales por dimensión")}
                  </h3>
                  {s.globalStats.length === 0 ? (
                    <p className="text-xs text-[var(--rowi-muted)] italic">
                      {t("admin.vsBench.noStats", "Sin stats todavía. Carga un assessment contribuyente y recomputa.")}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-[var(--rowi-muted)] uppercase tracking-wide">
                          <tr className="border-b border-[var(--rowi-border)]">
                            <th className="text-left py-2 px-2">{t("admin.vsBench.dimension", "Dimensión")}</th>
                            <th className="text-left py-2 px-2">{t("admin.vsBench.level", "Nivel")}</th>
                            <th className="text-right py-2 px-2">n</th>
                            <th className="text-right py-2 px-2">mean</th>
                            <th className="text-right py-2 px-2">sd</th>
                            <th className="text-right py-2 px-2">p25</th>
                            <th className="text-right py-2 px-2">p50</th>
                            <th className="text-right py-2 px-2">p75</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.globalStats.map((row) => (
                            <tr key={`${row.level}-${row.dimension}`} className="border-b border-[var(--rowi-border)]/40">
                              <td className="py-1.5 px-2 font-medium">{row.dimension}</td>
                              <td className="py-1.5 px-2 text-[var(--rowi-muted)]">{row.level}</td>
                              <td className="py-1.5 px-2 text-right">{row.n}</td>
                              <td className="py-1.5 px-2 text-right font-medium">{fmt(row.mean, 2)}</td>
                              <td className="py-1.5 px-2 text-right">{fmt(row.sd, 2)}</td>
                              <td className="py-1.5 px-2 text-right">{fmt(row.p25)}</td>
                              <td className="py-1.5 px-2 text-right">{fmt(row.p50)}</td>
                              <td className="py-1.5 px-2 text-right">{fmt(row.p75)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Top correlations */}
                <div>
                  <h3 className="text-xs font-semibold text-[var(--rowi-muted)] uppercase tracking-wide mb-2 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {t("admin.vsBench.topCorrelations", "Top correlaciones internas (Pearson r)")}
                  </h3>
                  {s.topCorrelations.length === 0 ? (
                    <p className="text-xs text-[var(--rowi-muted)] italic">
                      {t("admin.vsBench.noCorr", "Sin correlaciones todavía.")}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-[var(--rowi-muted)] uppercase tracking-wide">
                          <tr className="border-b border-[var(--rowi-border)]">
                            <th className="text-left py-2 px-2">x</th>
                            <th className="text-left py-2 px-2">y</th>
                            <th className="text-right py-2 px-2">r</th>
                            <th className="text-right py-2 px-2">n</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.topCorrelations.map((c) => (
                            <tr key={`${c.xKey}-${c.yKey}`} className="border-b border-[var(--rowi-border)]/40">
                              <td className="py-1.5 px-2 font-medium">{c.xKey}</td>
                              <td className="py-1.5 px-2 font-medium">{c.yKey}</td>
                              <td className="py-1.5 px-2 text-right font-mono">
                                <span
                                  className={
                                    c.correlation > 0.5
                                      ? "text-emerald-600"
                                      : c.correlation < -0.5
                                        ? "text-rose-600"
                                        : ""
                                  }
                                >
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
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-right">
      <div className="text-[10px] text-[var(--rowi-muted)] uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold text-[var(--rowi-foreground)]">{value}</div>
    </div>
  );
}
