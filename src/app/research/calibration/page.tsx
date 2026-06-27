"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import { Loader2, Beaker, CheckCircle2, AlertTriangle } from "lucide-react";
import { vsPpName, type VsLang } from "@/lib/vital-signs/vsLocale";

interface CalibrationItem {
  code: string;
  driver: string;
  esName: string;
  enName: string;
  hypothesis: {
    competencies: string[];
    talents: string[];
  };
  observation: {
    inferenceCount: number;
    feedbackTotal: number;
    ownCount: number;
    considerCount: number;
    rejectCount: number;
    ownRate: number | null;
    groundTruthCount: number;
    meanDelta: number | null;
  };
  readyForCalibration: boolean;
}

interface CalibResponse {
  ok: boolean;
  error?: string;
  viewerLevel?: string;
  currentWeightsVersion?: string;
  calibration?: CalibrationItem[];
}

export default function ResearchCalibrationPage() {
  const { t, locale } = useI18n();
  const vsLang = locale as VsLang;
  const [data, setData] = useState<CalibResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/research/calibration")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
      </div>
    );
  }

  if (!data?.ok || !data.calibration) {
    return (
      <div className="p-6">
        <div className="rowi-card bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30">
          <p className="text-sm text-[var(--rowi-muted)]">
            {data?.error ?? t("research.noAccess", "Sin acceso a Research Lens")}
          </p>
        </div>
      </div>
    );
  }

  const readyCount = data.calibration.filter((c) => c.readyForCalibration).length;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
            {t("research.calib.title", "Calibración BE2GROW · hipótesis vs realidad")}
          </h2>
          <p className="text-xs text-[var(--rowi-muted)]">
            {t("research.calib.currentVersion", "Versión actual")}:{" "}
            <span className="font-mono">{data.currentWeightsVersion}</span> ·{" "}
            {readyCount}/{data.calibration.length} {t("research.calib.readyForCalib", "PPs listos para calibrar (≥100 feedbacks + ≥30 ground truths)")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.calibration.map((pp) => {
          const obs = pp.observation;
          const ownPct = obs.ownRate !== null ? Math.round(obs.ownRate * 100) : null;
          return (
            <div key={pp.code} className="rowi-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs text-[var(--rowi-muted-weak)] uppercase tracking-wide">
                    {pp.driver}
                  </div>
                  <div className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {vsPpName(pp.code, vsLang, pp.esName, pp.enName)}
                  </div>
                </div>
                {pp.readyForCalibration ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Beaker className="w-5 h-5 text-[var(--rowi-muted-weak)]" />
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[var(--rowi-muted)]">{t("researchCalib.seiHyp", "Hipótesis SEI:")}</span>{" "}
                  <span className="text-[var(--rowi-foreground)]">
                    {pp.hypothesis.competencies.join(" · ")}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--rowi-muted)]">{t("researchCalib.btHyp", "Hipótesis Brain Talents:")}</span>{" "}
                  <span className="text-[var(--rowi-foreground)]">
                    {pp.hypothesis.talents.slice(0, 3).join(" · ")}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--rowi-card-border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--rowi-muted)]">
                    {t("research.calib.ownRate", "OWN rate")}
                  </span>
                  <span className="font-semibold text-[var(--rowi-foreground)]">
                    {ownPct !== null ? `${ownPct}%` : "—"}
                  </span>
                </div>
                {obs.ownRate !== null && (
                  <div className="h-1.5 rounded-full bg-[var(--rowi-card-border)] overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        ownPct! >= 70
                          ? "bg-emerald-500"
                          : ownPct! >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${ownPct}%` }}
                    />
                  </div>
                )}
                <div className="text-xs text-[var(--rowi-muted-weak)] flex flex-wrap gap-2">
                  <span>OWN {obs.ownCount}</span>
                  <span>CON {obs.considerCount}</span>
                  <span>REJ {obs.rejectCount}</span>
                  <span>·</span>
                  <span>n inf {obs.inferenceCount}</span>
                  <span>n gt {obs.groundTruthCount}</span>
                </div>
                {obs.meanDelta !== null && (
                  <div className="text-xs">
                    <span className="text-[var(--rowi-muted)]">{t("researchCalib.deltaAvg", "Δ prom:")}</span>{" "}
                    <span
                      className={`font-medium ${
                        obs.meanDelta > 2
                          ? "text-rose-700 dark:text-rose-300"
                          : obs.meanDelta < -2
                          ? "text-rose-700 dark:text-rose-300"
                          : "text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {obs.meanDelta > 0 ? "+" : ""}
                      {obs.meanDelta.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rowi-card bg-[var(--rowi-card-elev)] flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--rowi-muted)]">
          <p>
            {t("research.calib.notice", "Cuando un PP alcanza ≥100 feedbacks + ≥30 ground truths, queda listo para promover a v1 con pesos calibrados por regresión multivariada. La promoción requiere aprobación explícita del founder.")}
          </p>
        </div>
      </div>
    </div>
  );
}
