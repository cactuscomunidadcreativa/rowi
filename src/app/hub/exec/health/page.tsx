"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { Activity, Loader2, ShieldAlert, TrendingUp, Target, Users, Zap } from "lucide-react";

interface AggScore {
  level: string;
  dimension: string;
  mean: number;
  sd: number | null;
  n: number;
  cohesionBand: string | null;
  strengthBand: string;
  benchmarkDelta: number;
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

const DRIVER_ORDER = ["TRUST", "MOTIVATION", "TEAMWORK", "EXECUTION", "CHANGE"];

export default function ExecHealthPage() {
  const { t } = useI18n();
  const [data, setData] = useState<AggResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vital-signs/aggregate?scope=org&dataset=sample")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const drivers = (data?.scores ?? []).filter((s) => s.level === "driver");
  const outcomes = (data?.scores ?? []).filter((s) => s.level === "outcome");
  const driverByCode = Object.fromEntries(drivers.map((d) => [d.dimension, d]));

  // Pattern detection (the 3 patterns from book ch.7)
  const trust = driverByCode["TRUST"]?.mean ?? 100;
  const motivation = driverByCode["MOTIVATION"]?.mean ?? 100;
  const execution = driverByCode["EXECUTION"]?.mean ?? 100;
  const change = driverByCode["CHANGE"]?.mean ?? 100;
  const teamwork = driverByCode["TEAMWORK"]?.mean ?? 100;

  let pattern: { code: string; es: string; en: string; severity: "ok" | "watch" | "alert" } | null = null;
  if (execution >= 110 && (trust < 95 || motivation < 95)) {
    pattern = {
      code: "PRODUCTIVE_EMPTY",
      es: "Productiva pero vacía · Execution alta, Trust/Motivation bajos",
      en: "Productive but empty · high Execution, low Trust/Motivation",
      severity: "alert",
    };
  } else if (change < 90 && trust >= 100 && execution >= 100) {
    pattern = {
      code: "CHANGE_AVERSE",
      es: "Miedo al cambio · Trust y Execution sanos, Change crítico",
      en: "Change-averse · healthy Trust and Execution, critical Change",
      severity: "watch",
    };
  } else if (teamwork < 95 && (data?.scores?.filter((s) => s.level === "driver" && s.cohesionBand === "low").length ?? 0) >= 2) {
    pattern = {
      code: "FRAGMENTED",
      es: "Fragmentada · Teamwork bajo, subgrupos discrepan",
      en: "Fragmented · low Teamwork, subgroups disagree",
      severity: "alert",
    };
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
            {t("exec.health.title", "Salud emocional organizacional")}
          </h1>
          <p className="text-xs text-[var(--rowi-muted)]">
            {t("exec.health.subtitle", "Dashboard ejecutivo · ROE como motor del ROI. N ≥ 5 por dimensión.")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--rowi-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t("exec.health.loading", "Cargando...")}</span>
        </div>
      ) : !data || data.ok === false || data.suppressed || (data.sampleSize ?? 0) < 5 ? (
        <div className="rowi-card text-center py-12">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[var(--rowi-foreground)] mb-2">
            {t("exec.health.noData", "Sin datos suficientes todavía")}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] max-w-md mx-auto">
            {t("exec.health.noDataDesc", "Necesitamos al menos un assessment OVS con N ≥ 5 para mostrar este dashboard.")}
          </p>
        </div>
      ) : (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rowi-card">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[var(--rowi-primary)]" />
                <span className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide">ROE Index</span>
              </div>
              <div className="text-3xl font-bold rowi-gradient-text">
                {data.engagementIndex}
              </div>
              <div className="text-xs text-[var(--rowi-muted-weak)] mt-1">
                {t("exec.health.roeDesc", "Return on Emotion 0-100")}
              </div>
            </div>
            <div className="rowi-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[var(--rowi-primary)]" />
                <span className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide">
                  {t("exec.health.driverMean", "Mean drivers")}
                </span>
              </div>
              <div className="text-3xl font-bold text-[var(--rowi-foreground)]">
                {data.overallDriverMean?.toFixed(1) ?? "—"}
              </div>
              <div className="text-xs text-[var(--rowi-muted-weak)] mt-1">
                {t("vs.benchmark.mean", "Norma = 100")}
              </div>
            </div>
            <div className="rowi-card">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[var(--rowi-primary)]" />
                <span className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide">
                  {t("exec.health.sample", "Sample")}
                </span>
              </div>
              <div className="text-3xl font-bold text-[var(--rowi-foreground)]">{data.sampleSize}</div>
              <div className="text-xs text-[var(--rowi-muted-weak)] mt-1">
                {data.assessmentCount} {t("exec.health.assessments", "assessments")}
              </div>
            </div>
            <div className="rowi-card">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[var(--rowi-primary)]" />
                <span className="text-xs text-[var(--rowi-muted)] uppercase tracking-wide">
                  {t("exec.health.outcomes", "Outcomes")}
                </span>
              </div>
              <div className="text-3xl font-bold text-[var(--rowi-foreground)]">
                {outcomes.length > 0
                  ? (outcomes.reduce((s, o) => s + o.mean, 0) / outcomes.length).toFixed(1)
                  : "—"}
              </div>
              <div className="text-xs text-[var(--rowi-muted-weak)] mt-1">
                {t("exec.health.outcomesDesc", "Promedio outcomes")}
              </div>
            </div>
          </div>

          {/* Pattern alert */}
          {pattern && (
            <div
              className={`rowi-card ${
                pattern.severity === "alert"
                  ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
                  : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <ShieldAlert
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    pattern.severity === "alert"
                      ? "text-rose-700 dark:text-rose-300"
                      : "text-amber-700 dark:text-amber-300"
                  }`}
                />
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("exec.health.patternDetected", "Patrón detectado")}
                  </h3>
                  <p className="text-sm text-[var(--rowi-muted)] mt-1">{pattern.es}</p>
                </div>
              </div>
            </div>
          )}

          {/* Drivers in the canonical order */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
              {t("vs.section.drivers", "Los 5 drivers")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {DRIVER_ORDER.map((code) => {
                const d = driverByCode[code];
                if (!d) return null;
                return (
                  <div key={code} className="rowi-card">
                    <div className="text-xs text-[var(--rowi-muted-weak)] uppercase tracking-wide mb-1">
                      {d.dimension}
                    </div>
                    <div className="text-2xl font-bold text-[var(--rowi-foreground)]">
                      {d.mean.toFixed(1)}
                    </div>
                    <div className="text-xs text-[var(--rowi-muted)] mt-1">SD={d.sd?.toFixed(1) ?? "—"}</div>
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
                      {d.benchmarkDelta.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
