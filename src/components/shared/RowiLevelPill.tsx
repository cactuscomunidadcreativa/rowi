"use client";
import { useI18n } from "@/lib/i18n/react";

export type RowiSignals = {
  hasProfile?: boolean;
  hasSEI?: boolean;
  coachSessions?: number; // cuántas interacciones o planes con Rowi Coach
};

type Props = {
  signals?: RowiSignals;
  size?: "xs" | "sm" | "md";
  className?: string;
  showLabel?: boolean; // si quieres solo el icono sin texto
};

/* =========================================================
   🔹 Resolver nivel según señales de progreso
========================================================= */
function resolveLevel(signals?: RowiSignals) {
  const s = { hasProfile: false, hasSEI: false, coachSessions: 0, ...(signals || {}) };
  const sessions = s.coachSessions || 0;

  if (!s.hasProfile && !s.hasSEI && sessions < 1)
    return { key: "egg", icon: "🥚", labelKey: "level.egg.label", tipKey: "level.egg.tip", img: "/egg-1.png" };

  if (s.hasProfile && !s.hasSEI)
    return { key: "signals", icon: "🔭", labelKey: "level.signals.label", tipKey: "level.signals.tip", img: "/egg-2.png" };

  if (s.hasSEI && !s.hasProfile)
    return { key: "almost", icon: "✨", labelKey: "level.almost.label", tipKey: "level.almost.tip", img: "/egg-2.png" };

  if (s.hasProfile && s.hasSEI && sessions < 5)
    return { key: "minrowi", icon: "🐣", labelKey: "level.minrowi.label", tipKey: "level.minrowi.tip", img: "/egg-2.png" };

  return { key: "rowi", icon: "🦉", labelKey: "level.rowi.label", tipKey: "level.rowi.tip", img: "/owl.png" };
}

/* =========================================================
   🧩 Componente RowiLevelPill
========================================================= */
export default function RowiLevelPill({
  signals,
  size = "sm",
  className = "",
  showLabel = true,
}: Props) {
  const { t } = useI18n();
  const lv = resolveLevel(signals);

  const px = size === "xs" ? "px-1.5 py-0.5" : size === "md" ? "px-3 py-1.5" : "px-2 py-1";
  const text = size === "xs" ? "text-[10px]" : size === "md" ? "text-sm" : "text-xs";
  const imgSize = size === "xs" ? "h-3.5 w-3.5" : size === "md" ? "h-5 w-5" : "h-4 w-4";

  const label = t(lv.labelKey) || defaultLabels[lv.key].label;
  const tip = t(lv.tipKey) || defaultLabels[lv.key].tip;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/[0.03] ${px} ${text} ${className}`}
      title={`${label} · ${tip}`}
      aria-label={`${label} · ${tip}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={lv.img}
        alt={label}
        className={imgSize}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      {showLabel ? (
        <span>
          {lv.icon} {label}
        </span>
      ) : (
        <span aria-hidden="true">{lv.icon}</span>
      )}
    </span>
  );
}

/* =========================================================
   📚 Fallbacks locales en caso no haya traducción
========================================================= */
const defaultLabels: Record<string, { label: string; tip: string }> = {
  egg: { label: "Huevito", tip: "Comienza tu viaje" },
  signals: { label: "Señales", tip: "Falta completar tu SEI" },
  almost: { label: "Casi listo", tip: "Falta tu perfil personal" },
  minrowi: { label: "Mini Rowi", tip: "Tu guía emocional inicial" },
  rowi: { label: "Rowi", tip: "Coach calibrado contigo" },
};

// También exportamos el resolver
export { resolveLevel };