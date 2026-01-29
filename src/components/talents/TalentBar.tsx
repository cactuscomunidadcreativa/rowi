"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { getEqLevel } from "@/domains/eq/lib/eqLevels";
import { useI18n } from "@/lib/i18n/useI18n";

const LEVEL_LABELS: Record<string, { es: string; en: string }> = {
  desafio: { es: "Desafío", en: "Challenge" },
  emergente: { es: "Emergente", en: "Emerging" },
  funcional: { es: "Funcional", en: "Functional" },
  diestro: { es: "Diestro", en: "Skilled" },
  experto: { es: "Experto", en: "Expert" },
};

export function TalentBar({
  label,
  value,
  color,
  raw,
  benefit,
  risk,
}: {
  label: string;
  value: number | null | undefined;
  color: string;
  raw?: number | null;
  benefit?: string;
  risk?: string;
}) {
  const { lang } = useI18n();
  const v = typeof value === "number" ? Math.max(0, Math.min(100, value)) : (value == null ? null : Number(value));
  const [show, setShow] = useState(false);

  // Get level from raw 135-scale value
  const level = getEqLevel(raw ?? 0);
  const levelLabel = LEVEL_LABELS[level.key]?.[lang as "es" | "en"] ?? level.label;

  return (
    <div
      className="rounded-lg bg-gray-50 dark:bg-zinc-800 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {raw != null && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${level.color}20`, color: level.color }}
          >
            {levelLabel}
          </span>
        )}
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: v != null ? `${v}%` : "0%" }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      {show && (benefit || risk) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 text-xs space-y-1"
        >
          {benefit && <div className="text-green-600 dark:text-green-400">+ {benefit}</div>}
          {risk && <div className="text-red-500 dark:text-red-400">– {risk}</div>}
        </motion.div>
      )}
    </div>
  );
}
