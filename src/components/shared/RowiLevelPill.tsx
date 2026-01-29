"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type RowiSignals = {
  hasProfile?: boolean;
  hasSEI?: boolean;
  coachSessions?: number;
};

type Props = {
  signals?: RowiSignals;
  size?: "xs" | "sm" | "md";
  className?: string;
  showLabel?: boolean;
};

/* =========================================================
   🌍 Traducciones de niveles
========================================================= */
const translations = {
  es: {
    egg: { label: "Huevito", tip: "Comienza tu viaje" },
    signals: { label: "Señales", tip: "Falta completar tu SEI" },
    almost: { label: "Casi listo", tip: "Falta tu perfil personal" },
    minrowi: { label: "Mini Rowi", tip: "Tu guía emocional inicial" },
    rowi: { label: "Rowi", tip: "Coach calibrado contigo" },
  },
  en: {
    egg: { label: "Egg", tip: "Start your journey" },
    signals: { label: "Signals", tip: "Complete your SEI" },
    almost: { label: "Almost ready", tip: "Complete your profile" },
    minrowi: { label: "Mini Rowi", tip: "Your initial emotional guide" },
    rowi: { label: "Rowi", tip: "Coach calibrated with you" },
  },
};

/* =========================================================
   🔹 Resolver nivel según señales de progreso
========================================================= */
function resolveLevel(signals?: RowiSignals) {
  const s = { hasProfile: false, hasSEI: false, coachSessions: 0, ...(signals || {}) };
  const sessions = s.coachSessions || 0;

  if (!s.hasProfile && !s.hasSEI && sessions < 1)
    return { key: "egg", icon: "🥚", img: "/rowivectors/Rowi-01.png" };

  if (s.hasProfile && !s.hasSEI)
    return { key: "signals", icon: "🔭", img: "/rowivectors/Rowi-02.png" };

  if (s.hasSEI && !s.hasProfile)
    return { key: "almost", icon: "✨", img: "/rowivectors/Rowi-03.png" };

  if (s.hasProfile && s.hasSEI && sessions < 5)
    return { key: "minrowi", icon: "🐣", img: "/rowivectors/Rowi-04.png" };

  return { key: "rowi", icon: "🦉", img: "/rowivectors/Rowi-06.png" };
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
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;
  const lv = resolveLevel(signals);
  const levelText = t[lv.key as keyof typeof t];

  const sizeClasses = {
    xs: { px: "px-2 py-1", text: "text-[10px]", img: 14 },
    sm: { px: "px-2.5 py-1", text: "text-xs", img: 18 },
    md: { px: "px-3 py-1.5", text: "text-sm", img: 22 },
  };

  const s = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 ${s.px} ${s.text} font-medium text-gray-700 dark:text-gray-300 ${className}`}
      title={`${levelText.label} · ${levelText.tip}`}
      aria-label={`${levelText.label} · ${levelText.tip}`}
    >
      <Image
        src={lv.img}
        alt={levelText.label}
        width={s.img}
        height={s.img}
        className="object-contain"
      />
      {showLabel && (
        <span className="flex items-center gap-1">
          <span>{lv.icon}</span>
          <span>{levelText.label}</span>
        </span>
      )}
    </span>
  );
}

export { resolveLevel };
