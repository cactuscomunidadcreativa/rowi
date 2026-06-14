"use client";

/**
 * PreSeiInsight — resultado del Pre-SEI. Muestra el arquetipo Rowi, las 8
 * competencias, top pulse points, factores de éxito y las TRES vistas VS
 * (LVS/TVS/OVS) cada una con badge "inferido · no normado" + tooltip. Todo con
 * lenguaje de hipótesis, no clínico. Móvil-first.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getEqLevel, EQ_LEVELS } from "@/domains/eq/lib/eqLevels";
import type { PreSeiInsightData } from "./types";

interface Props {
  insight: PreSeiInsightData;
}

const SEI_ES: Record<string, string> = {
  EL: "Alfabetización Emocional",
  RP: "Reconocer Patrones",
  ACT: "Pensamiento Consecuente",
  NE: "Navegar Emociones",
  IM: "Motivación Intrínseca",
  OP: "Ejercitar Optimismo",
  EMP: "Empatía",
  NG: "Nobles Metas",
};

function bandColor(band: string): string {
  if (band === "high" || band === "above") return "var(--rowi-g2)";
  if (band === "low" || band === "below") return "var(--rowi-g1)";
  return "var(--rowi-muted)";
}

/** Badge "inferido · no normado" con tooltip (hover/focus). */
function InferredBadge() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-[var(--rowi-chip)] text-[var(--rowi-muted)] border border-[var(--rowi-card-border)]"
        aria-label={t("preSei.vs.tooltip", "Vista inferida, no normada")}
      >
        ⓘ {t("preSei.vs.badge", "Inferido · no normado")}
      </button>
      {open && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 top-full left-0 mt-1 w-64 rounded-lg bg-[var(--rowi-fg)] text-[var(--rowi-bg)] px-3 py-2 text-xs leading-snug shadow-lg"
          role="tooltip"
        >
          {t(
            "preSei.vs.tooltip",
            "Esta vista es una proyección de tus respuestas individuales. Se vuelve normada con el SEI/VS real o invitando a tu gente.",
          )}
        </motion.span>
      )}
    </span>
  );
}

export default function PreSeiInsight({ insight }: Props) {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--rowi-fg)] mb-1">
          {t("preSei.insight.title", "Tu primera lectura emocional")}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)]">
          {t(
            "preSei.insight.disclaimer",
            "Esto es tu reflejo emocional a partir de tus respuestas, una hipótesis, no un diagnóstico.",
          )}
        </p>
        <p className="text-sm text-[var(--rowi-muted)] mt-1">
          {t(
            "preSei.insight.levelsNote",
            "Con la información que tenemos, esto es lo que se asoma — no es lo que eres. Por eso verás niveles, no puntajes. Tu lectura real y normada es el SEI.",
          )}
        </p>
      </div>

      {/* Arquetipo dominante */}
      <div className="rowi-card flex items-center gap-4">
        <div className="text-4xl">{insight.archetype.emoji ?? "✨"}</div>
        <div>
          <p className="text-xs text-[var(--rowi-muted-weak)]">
            {t("preSei.insight.archetypeIntro", "Tu energía dominante hoy")}
          </p>
          <p className="text-lg font-semibold rowi-gradient-text">{insight.archetype.esName}</p>
          {insight.archetype.esTagline && (
            <p className="text-sm text-[var(--rowi-muted)]">{insight.archetype.esTagline}</p>
          )}
        </div>
      </div>

      {/* 8 competencias */}
      <div className="rowi-card">
        <h3 className="text-sm font-semibold text-[var(--rowi-fg)] mb-3">
          {t("preSei.insight.competencies", "Tus 8 competencias emocionales")}
        </h3>
        <div className="space-y-2">
          {Object.entries(insight.competencies).map(([key, score]) => {
            const level = getEqLevel(score);
            const levelIdx = EQ_LEVELS.findIndex((l) => l.key === level.key);
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-xs text-[var(--rowi-muted)]">
                  {t(`sei.competencies.${key}`, SEI_ES[key] ?? key)}
                </span>
                <div className="flex-1 h-2 rounded-full bg-[var(--rowi-chip)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${((levelIdx + 1) / EQ_LEVELS.length) * 100}%`,
                      background: "linear-gradient(90deg, var(--rowi-g2), var(--rowi-g1))",
                    }}
                  />
                </div>
                <span className="w-24 text-right text-xs text-[var(--rowi-fg)]">
                  {level.emoji} {t(level.labelKey, level.label)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 vistas VS — inferidas, no normadas */}
      <div className="rowi-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--rowi-fg)]">
            {t("preSei.vs.title", "Tus tres vistas Vital Signs")}
          </h3>
          <InferredBadge />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {insight.vsViews.map((v) => (
            <div
              key={v.scope}
              className="rounded-xl border border-[var(--rowi-card-border)] p-3 text-center"
            >
              <p className="text-xs text-[var(--rowi-muted)] mb-1">{t(v.lensKey, v.scope)}</p>
              <p className="text-lg font-bold" style={{ color: bandColor(v.band) }}>
                {v.score !== null
                  ? `${getEqLevel(v.score).emoji} ${t(getEqLevel(v.score).labelKey, getEqLevel(v.score).label)}`
                  : "—"}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-[var(--rowi-muted-weak)]">
                {v.scope}
              </p>
            </div>
          ))}
        </div>
        {/* Capacidad ≠ desempeño real (EQ Proposal Accelerator): inferido de
            tus respuestas solo habla de lo que tienes para dar; el cómo se
            vive lo dice el feedback real de tu gente. */}
        <p className="text-xs text-[var(--rowi-muted)] mt-3">
          {t(
            "preSei.vs.capacityNote",
            "Esto es tu capacidad — lo que tienes para dar. Cómo se vive de verdad (tu desempeño real) se ve cuando tu gente responde el Vital Signs y recibes feedback real.",
          )}
        </p>
      </div>

      {/* Top pulse points */}
      <div className="rowi-card">
        <h3 className="text-sm font-semibold text-[var(--rowi-fg)] mb-3">
          {t("preSei.insight.topPulsePoints", "Donde más brillas")}
        </h3>
        <ul className="space-y-1.5">
          {insight.topPulsePoints.map((pp) => (
            <li key={pp.code} className="flex items-center justify-between text-sm">
              <span className="text-[var(--rowi-fg)]">{pp.esName}</span>
              <span className="text-[var(--rowi-muted)]">
                {pp.score !== null
                  ? `${getEqLevel(pp.score).emoji} ${t(getEqLevel(pp.score).labelKey, getEqLevel(pp.score).label)}`
                  : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
