"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { EQ_MAX, getEqLevel } from "@/domains/eq/lib/eqLevels";

const COLORS = { know: "#1E88E5", choose: "#E53935", give: "#43A047" };

const translations = {
  es: {
    title: "Propositos (SEI)",
    know: "Conocerte",
    choose: "Elegirte",
    give: "Entregarte",
  },
  en: {
    title: "Pursuits (SEI)",
    know: "Know Yourself",
    choose: "Choose Yourself",
    give: "Give Yourself",
  },
};

export function PursuitsBars({
  know,
  choose,
  give,
  prevKnow,
  prevChoose,
  prevGive,
  max = EQ_MAX,
}: {
  know: number | null;
  choose: number | null;
  give: number | null;
  prevKnow?: number | null;
  prevChoose?: number | null;
  prevGive?: number | null;
  max?: number;
}) {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const Item = ({
    label,
    value,
    prev,
    color,
    delay = 0,
  }: {
    label: string;
    value: number | null;
    prev?: number | null;
    color: string;
    delay?: number;
  }) => {
    const v = typeof value === "number" ? Math.max(0, Math.min(max, value)) : null;
    const pv = typeof prev === "number" ? Math.max(0, Math.min(max, prev)) : null;
    const widthPercent = v ? (v / max) * 100 : 0;
    const ghostWidth = pv ? (pv / max) * 100 : 0;
    const level = getEqLevel(v ?? 0);
    const delta = v != null && pv != null ? Math.round((v - pv) * 10) / 10 : null;

    return (
      <div className="mb-3 last:mb-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <div className="flex items-center gap-2">
            {delta != null && delta !== 0 && (
              <span className={`text-[10px] font-semibold ${delta > 0 ? "text-green-500" : "text-red-400"}`}>
                {delta > 0 ? "\u2191" : "\u2193"} {Math.abs(delta)}
              </span>
            )}
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${level.color}20`, color: level.color }}
            >
              {v != null ? level.label : "\u2014"}
            </span>
          </div>
        </div>
        <div className="relative h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
          {/* Ghost bar (previous) */}
          {pv != null && ghostWidth > 0 && (
            <div
              className="absolute inset-y-0 left-0 h-full rounded-full opacity-25"
              style={{ width: `${ghostWidth}%`, backgroundColor: color }}
            />
          )}
          {/* Current bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${widthPercent}%` }}
            transition={{ duration: 0.8, delay }}
            className="relative h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Item label={t.know} value={know} prev={prevKnow} color={COLORS.know} delay={0.1} />
      <Item label={t.choose} value={choose} prev={prevChoose} color={COLORS.choose} delay={0.2} />
      <Item label={t.give} value={give} prev={prevGive} color={COLORS.give} delay={0.3} />
    </div>
  );
}
