"use client";

/**
 * Sparkline de los últimos 7 días de Daily Pulse. Cada barra representa
 * un día; alto = value (1-5); gris = día sin respuesta. Hover muestra
 * el SEI competency del día.
 */
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface HistoryItem {
  date: string;
  dow: number;
  value: number | null;
  sei: string | null;
  pulsePointCode: string | null;
}

interface HistoryResponse {
  ok: boolean;
  days: number;
  items: HistoryItem[];
  answered: number;
  error?: string;
}

const DAY_LABELS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function bandColor(value: number | null): string {
  if (value === null) return "bg-[var(--rowi-card-elev)]";
  if (value <= 2) return "bg-rose-400 dark:bg-rose-500";
  if (value === 3) return "bg-amber-400 dark:bg-amber-500";
  return "bg-emerald-400 dark:bg-emerald-500";
}

export default function DailyPulseWeek() {
  const { t, lang } = useI18n();
  const isEN = lang === "en";
  const labels = isEN ? DAY_LABELS_EN : DAY_LABELS_ES;

  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tz = new Date().getTimezoneOffset();
    fetch(`/api/daily-pulse/history?days=7&tz=${tz}`)
      .then((r) => r.json())
      .then((json: HistoryResponse) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data?.ok) return null;

  return (
    <div className="rowi-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--rowi-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
            {t("dailyPulseWeek.title", "Tu semana")}
          </h3>
        </div>
        <span className="text-xs text-[var(--rowi-muted)]">
          {data.answered}/{data.days} {t("dailyPulseWeek.answered", "respondidos")}
        </span>
      </div>
      <div className="flex items-stretch justify-between gap-1.5 h-24">
        {data.items.map((it) => {
          const heightPct = it.value === null ? 8 : (it.value / 5) * 100;
          const dow = it.dow;
          const tooltip = it.value === null
            ? t("dailyPulseWeek.noAnswer", "Sin respuesta")
            : `${it.sei ?? "—"} · ${it.value}/5`;
          return (
            <div key={it.date} className="flex-1 flex flex-col items-center gap-1 min-w-0 h-full">
              {/* La zona de barra ocupa el alto disponible (flex-1) y alinea
                  la barra al fondo; así height:% se calcula sobre un padre
                  con altura real (antes h-full resolvía a 0 → barra invisible). */}
              <div className="w-full flex-1 flex items-end min-h-0">
                <div
                  className={`w-full rounded-md transition-all ${bandColor(it.value)}`}
                  style={{ height: `${heightPct}%` }}
                  title={tooltip}
                />
              </div>
              <span className="text-[10px] text-[var(--rowi-muted-weak)] flex-shrink-0">{labels[dow]}</span>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-[var(--rowi-muted-weak)] mt-2 text-center">
        {t(
          "dailyPulseWeek.caption",
          "Cada barra = tu respuesta del Pulso de ese día (1-5).",
        )}
      </div>
    </div>
  );
}
