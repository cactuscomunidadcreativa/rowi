"use client";

import Link from "next/link";
import { MessageCircle, FileSearch, Activity, BarChart3, GitCompareArrows, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/react";

interface Surface {
  href: string;
  icon: typeof MessageCircle;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
  admin?: boolean;
}

const SURFACES: Surface[] = [
  {
    href: "/research/chat",
    icon: MessageCircle,
    titleKey: "research.hub.chat",
    titleFallback: "Análisis conversacional",
    descKey: "research.hub.chatDesc",
    descFallback: "Explora correlaciones VS/SEI y calibración BE2GROW hablando con Rowi Investigación.",
  },
  {
    href: "/research/cases",
    icon: FileSearch,
    titleKey: "research.hub.cases",
    titleFallback: "Casos",
    descKey: "research.hub.casesDesc",
    descFallback: "Revisa casos del rowiverse (seudonimizados salvo founder / scientific lead). Acceso auditado.",
  },
  {
    href: "/research/calibration",
    icon: Activity,
    titleKey: "research.hub.calibration",
    titleFallback: "Calibración",
    descKey: "research.hub.calibrationDesc",
    descFallback: "Refina la matriz BE2GROW (v0 → v1) con ground truth de debriefs y uploads.",
  },
  {
    href: "/hub/admin/vital-signs/benchmarks",
    icon: BarChart3,
    titleKey: "research.hub.benchmarks",
    titleFallback: "Benchmark VS",
    descKey: "research.hub.benchmarksDesc",
    descFallback: "Estadísticas y correlaciones internas por instrumento (OVS/TVS/LVS/FVS).",
    admin: true,
  },
  {
    href: "/hub/admin/vital-signs/cross-instrument",
    icon: GitCompareArrows,
    titleKey: "research.hub.crossInstrument",
    titleFallback: "Cruce VS ↔ SEI",
    descKey: "research.hub.crossInstrumentDesc",
    descFallback: "Sube cohortes con VS + SEI y correlaciona ambos instrumentos entre cohortes.",
    admin: true,
  },
];

export default function ResearchHubPage() {
  const { t } = useI18n();
  return (
    <div className="px-6 py-6 space-y-6">
      <p className="text-sm text-[var(--rowi-muted)] max-w-2xl">
        {t(
          "research.hub.intro",
          "El lente de investigación reúne las herramientas para refinar el modelo Emotional Budgeting con evidencia: datos agregados y anónimos, correlación a nivel cohorte, y acceso auditado.",
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SURFACES.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group rowi-card flex items-start gap-3 hover:shadow-md transition-shadow"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t(s.titleKey, s.titleFallback)}
                  </h2>
                  {s.admin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--rowi-muted)]/15 text-[var(--rowi-muted)] uppercase tracking-wide">
                      SuperAdmin
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--rowi-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-[var(--rowi-muted)] mt-1">{t(s.descKey, s.descFallback)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
