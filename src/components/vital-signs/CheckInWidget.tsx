"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Activity, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface CheckInData {
  ok: boolean;
  question?: string | null;
  pulsePointCode?: string;
  driver?: string;
  ageDays?: number | null;
  scale?: { min: number; max: number };
  reason?: string;
}

export default function CheckInWidget() {
  const { t } = useI18n();
  const [data, setData] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState<number>(3);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vital-signs/check-in")
      .then((r) => r.json())
      .then((d: CheckInData) => {
        setData(d);
        if (d?.scale) setValue(Math.round((d.scale.min + d.scale.max) / 2));
      })
      .catch(() => {
        // si la API falla, simplemente no mostramos el widget
        setData({ ok: false });
      })
      .finally(() => setLoading(false));
  }, []);

  async function submit() {
    if (!data?.pulsePointCode) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/vital-signs/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pulsePointCode: data.pulsePointCode,
          source: "self_check",
          value,
        }),
      });
      const j = await res.json();
      if (j?.ok === false) {
        setError(j.error ?? "save_failed");
        return;
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "save_failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;
  if (!data?.ok || !data?.question || !data?.pulsePointCode) return null;

  if (saved) {
    return (
      <div className="rowi-card border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-500/10">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--rowi-foreground)]">
              {t("vitalSigns.checkIn.savedTitle", "¡Gracias!")}
            </p>
            <p className="text-xs text-[var(--rowi-muted)] mt-0.5">
              {t(
                "vitalSigns.checkIn.savedDesc",
                "Tu microseñal queda registrada y ayuda a calibrar el modelo.",
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const scale = data.scale ?? { min: 1, max: 5 };

  return (
    <div className="rowi-card border-amber-500/40">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
              {t("vitalSigns.checkIn.title", "Pulse check semanal")}
            </h3>
            <span className="rowi-chip text-[10px]">{data.pulsePointCode}</span>
          </div>
          <p className="text-sm text-[var(--rowi-foreground)] mt-2">{data.question}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={scale.min}
          max={scale.max}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="flex-1 accent-[var(--rowi-g2)]"
          disabled={saving}
        />
        <span className="text-sm font-mono text-[var(--rowi-foreground)] w-8 text-center">{value}</span>
        <button
          onClick={submit}
          disabled={saving}
          className="rowi-btn-primary inline-flex items-center gap-2 text-xs disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
          {t("vitalSigns.checkIn.submit", "Registrar")}
        </button>
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--rowi-muted-weak)]">
        <span>{t("vitalSigns.checkIn.scaleLow", "Bajo")}</span>
        <span>{t("vitalSigns.checkIn.scaleHigh", "Alto")}</span>
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">{error}</p>}
    </div>
  );
}
