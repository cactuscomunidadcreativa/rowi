"use client";

/**
 * Mini-SEI trend card — the monthly Total EQ trajectory (trait), complement to
 * the daily-pulse (state). Consumes GET /api/mini-sei/series.
 */

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n/react";

interface SeriesPoint {
  id: string;
  takenAt: string;
  totalEq: number;
  totalEqBand: string;
}

interface SeriesResponse {
  ok: boolean;
  count: number;
  latestTotalEq: number | null;
  trendSinceFirst: number | null;
  series: SeriesPoint[];
}

export function MiniSeiTrendCard() {
  const { t } = useI18n();
  const [data, setData] = useState<SeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mini-sei/series")
      .then((r) => r.json())
      .then((d: SeriesResponse) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 p-6 flex items-center gap-3 text-neutral-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t("miniSei.title", "Tu Rowi Test mensual")}</span>
      </div>
    );
  }

  if (!data?.ok || data.count === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 p-6">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--rowi-primary)]" aria-hidden="true" />
          {t("miniSei.title", "Tu Rowi Test mensual")}
        </h3>
        <p className="text-sm text-neutral-500 mt-2">
          {t("miniSei.empty", "Aún no has tomado tu primer Rowi Test. Tarda 2 minutos.")}
        </p>
        <a
          href="/mini-sei"
          className="inline-block mt-3 text-sm font-medium text-[var(--rowi-primary)] hover:underline"
        >
          {t("miniSei.cta", "Tomar el Rowi Test")}
        </a>
      </div>
    );
  }

  const trend = data.trendSinceFirst;
  const TrendIcon = trend === null || Math.abs(trend) < 1 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor =
    trend === null || Math.abs(trend) < 1 ? "#666" : trend > 0 ? "#3C8C5A" : "#B23A48";
  const trendLabel =
    trend === null || Math.abs(trend) < 1
      ? t("miniSei.trend.stable", "Estable")
      : trend > 0
        ? t("miniSei.trend.up", "En ascenso")
        : t("miniSei.trend.down", "En descenso");

  // Simple sparkline: min/max normalized bars.
  const vals = data.series.map((p) => p.totalEq);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;

  return (
    <div className="rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--rowi-primary)]" aria-hidden="true" />
          {t("miniSei.title", "Tu Rowi Test mensual")}
        </h3>
        <span className="flex items-center gap-1 text-sm font-medium" style={{ color: trendColor }}>
          <TrendIcon className="h-4 w-4" aria-hidden="true" />
          {trendLabel}
        </span>
      </div>
      <p className="text-sm text-neutral-500 mt-1">
        {t("miniSei.subtitle", "Cómo evoluciona tu capacidad emocional mes a mes (lectura indicativa).")}
      </p>

      <div className="flex items-end gap-1 h-20 mt-4" aria-hidden="true">
        {data.series.map((p) => {
          const h = 20 + ((p.totalEq - min) / span) * 56;
          const color = p.totalEqBand === "high" ? "#3C8C5A" : p.totalEqBand === "low" ? "#B23A48" : "#C9A227";
          return (
            <div
              key={p.id}
              className="flex-1 rounded-t"
              style={{ height: `${h}px`, background: color, minWidth: 4 }}
              title={`${p.totalEq}`}
            />
          );
        })}
      </div>

      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-2xl font-bold text-neutral-800">{data.latestTotalEq}</span>
        <span className="text-sm text-neutral-500">{t("miniSei.totalEq", "EQ Total")}</span>
      </div>
      <p className="text-xs text-neutral-400 mt-2">
        {t(
          "miniSei.indicativeNote",
          "Lectura indicativa, no normada. El SEI completo de Six Seconds da el resultado certificado.",
        )}
      </p>
    </div>
  );
}

export default MiniSeiTrendCard;
