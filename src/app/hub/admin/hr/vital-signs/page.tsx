"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { Users, Loader2, ShieldAlert, Activity, TrendingUp, BarChart3 } from "lucide-react";

interface AggScore {
  level: string;
  dimension: string;
  mean: number;
  sd: number | null;
  n: number;
  cohesionBand: string | null;
  strengthBand: string;
  benchmarkDelta: number;
  suppressed: boolean;
}

interface AggResponse {
  ok: boolean;
  suppressed?: boolean;
  reason?: string;
  scope: string;
  assessmentCount: number;
  sampleSize: number;
  engagementIndex: number;
  overallDriverMean: number;
  scores: AggScore[];
}

const BAND_BG: Record<string, string> = {
  bottom_quartile: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",
  mid: "",
  top_quartile: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
};

const COHESION_LABEL: Record<string, { es: string; en: string }> = {
  high: { es: "Consenso fuerte", en: "Strong consensus" },
  mid: { es: "Consenso medio", en: "Mid consensus" },
  low: { es: "Subgrupos discrepan", en: "Subgroups disagree" },
};

export default function HrVitalSignsPage() {
  const { t, locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const [scope, setScope] = useState<"org" | "team">("org");
  const [data, setData] = useState<AggResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/vital-signs/aggregate?scope=${scope}&dataset=sample`);
      const j = await r.json();
      setData(j);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [scope]);

  const drivers = data?.scores.filter((s) => s.level === "driver") ?? [];
  const outcomes = data?.scores.filter((s) => s.level === "outcome") ?? [];

  return (
    <div className="space-y-6 p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
              {t("hr.vs.title", "Vital Signs · Lente RH")}
            </h1>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("hr.vs.subtitle", "Lectura agregada de los assessments registrados. N ≥ 5 por dimensión.")}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {(["org", "team"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={scope === s ? "rowi-btn-primary" : "rowi-btn"}
            >
              {s === "org" ? "OVS" : "TVS"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--rowi-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t("hr.vs.loading", "Cargando agregado...")}</span>
        </div>
      ) : !data || data.ok === false || data.suppressed || (data.sampleSize ?? 0) < 5 ? (
        <div className="rowi-card text-center py-12">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--rowi-foreground)] mb-2">
            {t("hr.vs.suppressed", "Datos suprimidos por privacidad")}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] max-w-md mx-auto">
            {t(
              "hr.vs.suppressedDesc",
              "No mostramos agregados por debajo de N=5 respondentes para proteger la identidad individual. Cuando más personas respondan, esta vista se llenará.",
            )}
          </p>
        </div>
      ) : !data || !data.ok ? (
        <div className="rowi-card text-center py-12">
          <p className="text-sm text-[var(--rowi-muted)]">
            {t("hr.vs.empty", "Sin assessments cargados todavía.")}
          </p>
        </div>
      ) : (
        <>
          {/* Top metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rowi-card">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-[var(--rowi-primary)]" />
                <span className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide">
                  {t("hr.vs.engagementIndex", "Engagement Index")}
                </span>
              </div>
              <div className="text-3xl font-bold rowi-gradient-text">
                {data.engagementIndex}
              </div>
              <div className="text-xs text-[var(--rowi-muted-weak)] mt-1">
                {data.engagementIndex >= 80
                  ? t("hr.vs.worldClass", "World class (≥80)")
                  : data.engagementIndex >= 50
                  ? t("hr.vs.average", "Promedio")
                  : t("hr.vs.lowEngagement", "Compromiso bajo")}
              </div>
            </div>
            <div className="rowi-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[var(--rowi-primary)]" />
                <span className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide">
                  {t("hr.vs.overallMean", "Mean drivers")}
                </span>
              </div>
              <div className="text-3xl font-bold text-[var(--rowi-foreground)]">
                {data.overallDriverMean.toFixed(1)}
              </div>
              <div className="text-xs text-[var(--rowi-muted-weak)] mt-1">
                {t("vs.benchmark.mean", "Norma = 100")}
              </div>
            </div>
            <div className="rowi-card">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[var(--rowi-primary)]" />
                <span className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide">
                  {t("hr.vs.sampleSize", "Respondentes")}
                </span>
              </div>
              <div className="text-3xl font-bold text-[var(--rowi-foreground)]">
                {data.sampleSize}
              </div>
              <div className="text-xs text-[var(--rowi-muted-weak)] mt-1">
                {data.assessmentCount} {t("hr.vs.assessments", "assessments")}
              </div>
            </div>
            <div className="rowi-card">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-[var(--rowi-primary)]" />
                <span className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide">
                  {t("hr.vs.scope", "Scope")}
                </span>
              </div>
              <div className="text-3xl font-bold text-[var(--rowi-foreground)] uppercase">
                {scope === "org" ? "OVS" : "TVS"}
              </div>
              <div className="text-xs text-[var(--rowi-muted-weak)] mt-1">
                {scope === "org" ? t("hr.vs.orgLevel", "Organización") : t("hr.vs.teamLevel", "Equipo")}
              </div>
            </div>
          </div>

          {/* Drivers */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
              {t("vs.section.drivers", "Los 5 drivers")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {drivers.map((d) => (
                <div key={d.dimension} className={`rowi-card ${BAND_BG[d.strengthBand]}`}>
                  <div className="text-xs text-[var(--rowi-muted-weak)] uppercase tracking-wide mb-1">
                    {d.dimension}
                  </div>
                  <div className="text-2xl font-bold text-[var(--rowi-foreground)]">
                    {d.mean.toFixed(1)}
                  </div>
                  <div className="text-xs text-[var(--rowi-muted)] mt-1">
                    SD={d.sd?.toFixed(1) ?? "—"}
                    {d.cohesionBand && (
                      <span className="ml-2">
                        · {lang === "en" ? COHESION_LABEL[d.cohesionBand].en : COHESION_LABEL[d.cohesionBand].es}
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-xs mt-2 font-medium ${
                      d.benchmarkDelta > 0
                        ? "text-emerald-700 dark:text-emerald-300"
                        : d.benchmarkDelta < 0
                        ? "text-rose-700 dark:text-rose-300"
                        : "text-[var(--rowi-muted)]"
                    }`}
                  >
                    {d.benchmarkDelta > 0 ? "+" : ""}
                    {d.benchmarkDelta.toFixed(1)} {t("vs.benchmark.label", "vs norma")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outcomes */}
          {outcomes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
                {t("hr.vs.outcomes", "Outcomes")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {outcomes.map((o) => (
                  <div key={o.dimension} className={`rowi-card ${BAND_BG[o.strengthBand]}`}>
                    <div className="text-xs text-[var(--rowi-muted-weak)] uppercase tracking-wide mb-1">
                      {o.dimension}
                    </div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {o.mean.toFixed(1)}
                    </div>
                    <div className="text-xs text-[var(--rowi-muted)] mt-1">
                      SD={o.sd?.toFixed(1) ?? "—"} · n={o.n}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
