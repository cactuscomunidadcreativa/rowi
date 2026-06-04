"use client";

/**
 * Emotional Budgeting — the blind-spot card.
 *
 * Shows the SEI↔VS cross for the signed-in user: per pulse point, whether their
 * measured perception is a blind spot (perceives more than capacity sustains),
 * aligned, or a hidden strength (capacity they undervalue).
 *
 * Consumes GET /api/vital-signs/me/budget?assessmentId=<id>.
 */

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2, Gem } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Cell = "blind_spot" | "aligned" | "hidden_strength" | null;

interface CrossedPulsePoint {
  code: string;
  driver?: string;
  capacity: number | null;
  perception: number | null;
  gap: number | null;
  cell: Cell;
}

interface BudgetResponse {
  ok: boolean;
  crossable: boolean;
  reason?: string;
  message?: string;
  instrument?: string;
  method?: "absolute" | "relative_z";
  blindSpots?: string[];
  hiddenStrengths?: string[];
  pulsePoints?: CrossedPulsePoint[];
}

const CELL_META: Record<
  Exclude<Cell, null>,
  { icon: typeof AlertTriangle; color: string; bg: string; labelKey: string; labelEs: string }
> = {
  blind_spot: {
    icon: AlertTriangle,
    color: "#B23A48",
    bg: "rgba(178,58,72,0.08)",
    labelKey: "vitalSigns.budget.cell.blindSpot",
    labelEs: "Punto ciego",
  },
  aligned: {
    icon: CheckCircle2,
    color: "#6E8B3D",
    bg: "rgba(110,139,61,0.08)",
    labelKey: "vitalSigns.budget.cell.aligned",
    labelEs: "Alineado",
  },
  hidden_strength: {
    icon: Gem,
    color: "#C9A227",
    bg: "rgba(201,162,39,0.10)",
    labelKey: "vitalSigns.budget.cell.hidden",
    labelEs: "Fortaleza oculta",
  },
};

function prettyCode(code: string): string {
  // TEAMWORK_CONNECTION → Connection
  const part = code.split("_").slice(1).join(" ") || code;
  return part.charAt(0) + part.slice(1).toLowerCase();
}

export function BudgetCrossCard({ assessmentId }: { assessmentId?: string }) {
  const { t } = useI18n();
  const [data, setData] = useState<BudgetResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url = assessmentId
      ? `/api/vital-signs/me/budget?assessmentId=${encodeURIComponent(assessmentId)}`
      : `/api/vital-signs/me/budget`;
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d: BudgetResponse) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData({ ok: false, crossable: false });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 p-6 flex items-center gap-3 text-neutral-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{t("vitalSigns.budget.loading", "Calculando tu brecha…")}</span>
      </div>
    );
  }

  if (!data?.ok || !data.crossable) {
    return (
      <div className="rounded-2xl border border-neutral-200 p-6 text-neutral-600">
        <h3 className="font-semibold text-neutral-800 mb-1">
          {t("vitalSigns.budget.title", "Tu brecha: capacidad vs percepción")}
        </h3>
        <p className="text-sm">
          {data?.reason === "no_sei"
            ? t("vitalSigns.budget.noSei", "Aún no tienes un SEI para inferir tu capacidad.")
            : t(
                "vitalSigns.budget.noMeasured",
                "Necesitas un reporte VS (LVS/TVS) para cruzarlo con tu capacidad.",
              )}
        </p>
      </div>
    );
  }

  const grouped: Record<Exclude<Cell, null>, CrossedPulsePoint[]> = {
    blind_spot: [],
    aligned: [],
    hidden_strength: [],
  };
  for (const pp of data.pulsePoints ?? []) {
    if (pp.cell) grouped[pp.cell].push(pp);
  }

  const order: Array<Exclude<Cell, null>> = ["blind_spot", "hidden_strength", "aligned"];

  return (
    <div className="rounded-2xl border border-neutral-200 p-6">
      <h3 className="font-semibold text-neutral-800">
        {t("vitalSigns.budget.title", "Tu brecha: capacidad vs percepción")}
      </h3>
      <p className="text-sm text-neutral-500 mt-1 mb-4">
        {data.method === "relative_z"
          ? t(
              "vitalSigns.budget.subtitleRelative",
              "Comparación relativa: dónde te crees fuerte vs dónde tu capacidad real lo sostiene.",
            )
          : t(
              "vitalSigns.budget.subtitleAbsolute",
              "Comparación de tu capacidad (SEI) con el clima percibido.",
            )}
      </p>

      <div className="space-y-4">
        {order.map((cell) => {
          const items = grouped[cell];
          if (items.length === 0) return null;
          const meta = CELL_META[cell];
          const Icon = meta.icon;
          return (
            <div key={cell} className="rounded-xl p-3" style={{ background: meta.bg }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" style={{ color: meta.color }} aria-hidden="true" />
                <span className="text-sm font-semibold" style={{ color: meta.color }}>
                  {t(meta.labelKey, meta.labelEs)}
                </span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {items.map((pp) => (
                  <li
                    key={pp.code}
                    className="text-sm rounded-full bg-white border border-neutral-200 px-3 py-1 text-neutral-700"
                  >
                    {prettyCode(pp.code)}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BudgetCrossCard;
