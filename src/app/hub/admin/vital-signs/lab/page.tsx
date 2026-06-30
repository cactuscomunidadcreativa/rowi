"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FlaskConical, Loader2, Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { vsPpName, type VsLang } from "@/lib/vital-signs/vsLocale";

interface WeightRow {
  id: string;
  pulsePointCode: string;
  version: number;
  predictor: string;
  weight: number;
  active: boolean;
}

interface GroupedWeights {
  [pp: string]: { [version: number]: WeightRow[] };
}

const PULSE_POINT_LABELS: Record<string, { es: string; en: string }> = {
  TRUST_TRANSPARENCY: { es: "Transparencia", en: "Transparency" },
  TRUST_COHERENCE: { es: "Coherencia", en: "Coherence" },
  TRUST_CARE: { es: "Cuidado", en: "Care" },
  MOTIVATION_MEANING: { es: "Sentido", en: "Meaning" },
  MOTIVATION_MASTERY: { es: "Maestría", en: "Mastery" },
  MOTIVATION_AUTONOMY: { es: "Autonomía", en: "Autonomy" },
  CHANGE_IMAGINATION: { es: "Imaginación", en: "Imagination" },
  CHANGE_EXPLORATION: { es: "Exploración", en: "Exploration" },
  CHANGE_CELEBRATION: { es: "Celebración", en: "Celebration" },
  TEAMWORK_DIVERGENCE: { es: "Divergencia", en: "Divergence" },
  TEAMWORK_CONNECTION: { es: "Conexión", en: "Connection" },
  TEAMWORK_JOY: { es: "Alegría", en: "Joy" },
  EXECUTION_ACCOUNTABILITY: { es: "Responsabilidad", en: "Accountability" },
  EXECUTION_FEEDBACK: { es: "Feedback", en: "Feedback" },
  EXECUTION_FOCUS: { es: "Foco", en: "Focus" },
};

const PP_ORDER = Object.keys(PULSE_POINT_LABELS);

export default function VsLabIndexPage() {
  const { t, lang } = useI18n();
  const [weights, setWeights] = useState<GroupedWeights>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/vital-signs/weights")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setWeights(d.weights ?? {});
      })
      .finally(() => setLoading(false));
  }, []);

  function activeVersion(pp: string): number | null {
    const versions = weights[pp];
    if (!versions) return null;
    for (const [v, rows] of Object.entries(versions)) {
      if (rows.some((r) => r.active)) return Number(v);
    }
    return null;
  }

  function maxVersion(pp: string): number | null {
    const versions = weights[pp];
    if (!versions) return null;
    const nums = Object.keys(versions).map(Number).filter((n) => !Number.isNaN(n));
    return nums.length === 0 ? null : Math.max(...nums);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <FlaskConical className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--rowi-foreground)]">
            {t("vsLab.title", "VS Lab — pesos del modelo")}
          </h1>
          <p className="text-sm text-[var(--rowi-muted)] mt-0.5">
            {t(
              "vsLab.description",
              "Cada pulse point puede usar la matriz BE2GROW v0 (hipótesis hardcoded) o una versión calibrada con correlaciones empíricas. Activa una versión para que el motor la use; el resto queda como historia.",
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PP_ORDER.map((pp) => {
          const active = activeVersion(pp);
          const max = maxVersion(pp);
          const label = PULSE_POINT_LABELS[pp];
          return (
            <Link
              key={pp}
              href={`/hub/admin/vital-signs/lab/${pp}`}
              className="rowi-card hover:border-[var(--rowi-g2)]/60 transition-colors block"
            >
              <div className="flex items-start gap-2 mb-2">
                <Activity className="w-4 h-4 text-[var(--rowi-g2)] flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {vsPpName(pp, lang as VsLang, label?.es ?? pp, label?.en ?? pp)}
                  </h3>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--rowi-muted-weak)]">
                    {pp}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--rowi-muted)] flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {active === null ? (
                  <span className="rowi-chip">{t("vsLab.usingV0", "Usando v0 (hipótesis)")}</span>
                ) : (
                  <span className="rowi-chip bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    {t("vsLab.activeVersion", "Activa: v{{n}}").replace("{{n}}", String(active))}
                  </span>
                )}
                {max !== null && max !== active && (
                  <span className="rowi-chip text-[var(--rowi-muted)]">
                    {t("vsLab.maxVersion", "Última: v{{n}}").replace("{{n}}", String(max))}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
