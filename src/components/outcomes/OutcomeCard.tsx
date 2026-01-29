"use client";

import { EQ_MAX, getEqLevel } from "@/domains/eq/lib/eqLevels";

/**
 * OutcomeCard simplificado
 * - Solo muestra el outcome principal con su nivel
 * - Sin subfactores (Success Factors se muestran aparte)
 */

export default function OutcomeCard({
  title,
  score,
}: {
  title: string;
  score: number | null;
  subs?: { label: string; value: number | null }[];
  ghost?: any;
  success?: any;
  successGhost?: any;
}) {
  const mainScore = typeof score === "number" ? Math.max(0, Math.min(EQ_MAX, score)) : null;
  const mainLevel = getEqLevel(mainScore ?? 0);
  const widthMain = mainScore ? (mainScore / EQ_MAX) * 100 : 0;

  return (
    <div className="rounded-xl border border-white/10 p-4 shadow-sm bg-white/5">
      {/* TITLE + LEVEL */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white">{title}</h3>
        {mainScore != null && (
          <span
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ backgroundColor: `${mainLevel.color}20`, color: mainLevel.color }}
          >
            {mainLevel.label}
          </span>
        )}
      </div>

      {/* MAIN BAR */}
      <div className="h-2.5 w-full rounded-full bg-gray-800/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${widthMain}%`,
            backgroundColor: mainLevel.color,
          }}
        />
      </div>
    </div>
  );
}