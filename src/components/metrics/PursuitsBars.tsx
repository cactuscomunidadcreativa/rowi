"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { EQ_MAX, getEqLevel } from "@/domains/eq/lib/eqLevels";

const COLORS = { know: "#1E88E5", choose: "#E53935", give: "#43A047" };

const translations = {
  es: {
    title: "Propósitos (SEI)",
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
  max = EQ_MAX,
}: {
  know: number | null;
  choose: number | null;
  give: number | null;
  max?: number;
}) {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const Item = ({
    label,
    value,
    color,
    delay = 0,
  }: {
    label: string;
    value: number | null;
    color: string;
    delay?: number;
  }) => {
    const v = typeof value === "number" ? Math.max(0, Math.min(max, value)) : null;
    const widthPercent = v ? (v / max) * 100 : 0;
    const level = getEqLevel(v ?? 0);

    return (
      <div className="mb-3 last:mb-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${level.color}20`, color: level.color }}
          >
            {v != null ? level.label : "—"}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${widthPercent}%` }}
            transition={{ duration: 0.8, delay }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Item label={t.know} value={know} color={COLORS.know} delay={0.1} />
      <Item label={t.choose} value={choose} color={COLORS.choose} delay={0.2} />
      <Item label={t.give} value={give} color={COLORS.give} delay={0.3} />
    </div>
  );
}
