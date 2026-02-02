"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";

// === Componentes ===
import CompetenciesSpider from "@/components/charts/CompetenciesSpider";
import { EqTotalBar } from "@/components/metrics/EqTotalBar";
import { PursuitsBars } from "@/components/metrics/PursuitsBars";
import { MoodChip } from "@/components/dashboard/MoodChip";
import { TalentCluster } from "@/components/talents/TalentCluster";
import OutcomesPanel from "@/components/outcomes/OutcomesPanel";
import OverallSummary from "@/components/outcomes/OverallSummary";
import CoachPanel from "@/components/coach/CoachPanel";
import FeedbackPanel from "@/components/dashboard/FeedbackPanel";
import RowiLevelPill from "@/components/shared/RowiLevelPill";

// === EQ config ===
import {
  EQ_MAX,
  EQ_LEVELS,
  getEqLevel,
  toPercentOf135,
} from "@/domains/eq/lib/eqLevels";

export default function ClientDashboard() {
  const { t, locale } = useI18n();

  const [base, setBase] = useState<any>(null);
  const [compareSnap, setCompareSnap] = useState<any>(null);
  const [datePresent, setDatePresent] = useState<string | null>(null);
  const [dateCompare, setDateCompare] = useState<string | null>(null);
  const [mode, setMode] = useState("none");
  const [date, setDate] = useState("");

  // === 1️⃣ Cargar snapshot EQ real ===
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/eq/me", { cache: "no-store" });
        const data = await r.json();
        setBase(data);
      } catch (err) {
        console.error("❌ Error cargando /api/eq/me:", err);
      }
    }
    load();
  }, []);

  if (!base) {
    return (
      <div className="text-gray-400 py-10 text-sm animate-pulse">
        Cargando datos emocionales…
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ENCABEZADO */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500">Fuente de datos: {base.source}</p>
        </div>
      </div>

      {/* === EQ TOTAL + COMPETENCIAS === */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <EqTotalBar
            value={base.eq.total ?? 0}
            label={`EQ Total — ${base.eq.total ?? 0}/${EQ_MAX}`}
            color={getEqLevel(base.eq.total ?? 0).color}
          />

          <PursuitsBars
            know={base.eq.pursuits?.know ?? null}
            choose={base.eq.pursuits?.choose ?? null}
            give={base.eq.pursuits?.give ?? null}
            max={EQ_MAX}
          />

          <MoodChip
            text={base.mood?.recentText ?? "—"}
            emoji={base.mood?.recentEmoji ?? "🙂"}
          />
          <RowiLevelPill
            signals={{ hasSEI: true, hasProfile: true, coachSessions: 0 }}
            size="sm"
            className="mt-1"
          />
        </div>

        {/* COMPETENCIAS */}
        <div className="rounded-xl border p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="font-medium">🧭 Competencias</h2>
          </div>

          <CompetenciesSpider comps={base.eq.competencias} />
          <IndicatorsLegend />
        </div>
      </div>

      {/* TALENTOS */}
      <div className="grid gap-4 md:grid-cols-3">
        <TalentCluster
          title="Focus"
          color="#1E88E5"
          talents={Object.entries(base.eq.talents?.focus || {}).map(([k, v]) => ({
            label: k,
            value: toPercentOf135(typeof v === "number" ? v : 0),
            raw: typeof v === "number" ? v : null,
          }))}
        />
        <TalentCluster
          title="Decisions"
          color="#E53935"
          talents={Object.entries(base.eq.talents?.decisions || {}).map(([k, v]) => ({
            label: k,
            value: toPercentOf135(typeof v === "number" ? v : 0),
            raw: typeof v === "number" ? v : null,
          }))}
        />
        <TalentCluster
          title="Drive"
          color="#43A047"
          talents={Object.entries(base.eq.talents?.drive || {}).map(([k, v]) => ({
            label: k,
            value: toPercentOf135(typeof v === "number" ? v : 0),
            raw: typeof v === "number" ? v : null,
          }))}
        />
      </div>

      {/* OUTCOMES */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <OverallSummary
            overall4={base.outcomes?.overall4 ?? null}
            subtitle={`${base.outcomes?.overall4} / ${EQ_MAX} · ${
              getEqLevel(base.outcomes?.overall4 ?? 0).label
            }`}
            color={getEqLevel(base.outcomes?.overall4 ?? 0).color}
          />
        </div>

        <div className="md:col-span-2">
          <OutcomesPanel present={base.outcomes} />
        </div>
      </div>

      {/* ROWI COACH */}
      <section className="rowi-card space-y-3 mt-6">
        <h2 className="font-medium flex items-center gap-2 text-lg">
          💬 EQ Rowi Coach
        </h2>
        <CoachPanel insights={base.insights} />
      </section>

      {/* INFO ADICIONAL */}
      <section className="rowi-card space-y-3 mt-8">
        <h2 className="font-medium text-lg flex items-center gap-2">
          🧩 {t("dashboard.additionalInfo") || "Información adicional"}
        </h2>
        <ul className="text-sm space-y-1 text-gray-300">
          <li>
            <b>Usuario:</b> {base.user?.name} ({base.user?.email})
          </li>
          {base.brain?.style && (
            <li>
              <b>Estilo cerebral:</b> {base.brain.style}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

/********* Utilidad de indicadores *********/
function IndicatorsLegend() {
  return (
    <div className="mt-3 text-sm">
      <div className="font-medium mb-1">Indicadores</div>
      <ul className="space-y-1">
        {EQ_LEVELS.map((lvl) => (
          <li key={lvl.key} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-8 rounded"
              style={{ background: lvl.color }}
            />
            <span>
              {lvl.label} ({lvl.min}-{lvl.max})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}