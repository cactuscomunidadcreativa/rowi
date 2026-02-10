"use client";

import { EQ_MAX, getEqLevel } from "@/domains/eq/lib/eqLevels";

/**
 * OutcomeCard con soporte para ghost (valor anterior)
 * - Muestra el outcome principal con su nivel SEI
 * - Ghost bar semitransparente del valor anterior
 * - Delta indicator (up/down)
 */

export default function OutcomeCard({
  title,
  score,
  prevScore,
}: {
  title: string;
  score: number | null;
  prevScore?: number | null;
  subs?: { label: string; value: number | null }[];
  ghost?: any;
  success?: any;
  successGhost?: any;
}) {
  const mainScore = typeof score === "number" ? Math.max(0, Math.min(EQ_MAX, score)) : null;
  const prevVal = typeof prevScore === "number" ? Math.max(0, Math.min(EQ_MAX, prevScore)) : null;
  const mainLevel = getEqLevel(mainScore ?? 0);
  const widthMain = mainScore ? (mainScore / EQ_MAX) * 100 : 0;
  const ghostWidth = prevVal ? (prevVal / EQ_MAX) * 100 : 0;
  const delta = mainScore != null && prevVal != null ? Math.round((mainScore - prevVal) * 10) / 10 : null;

  return (
    <div className="rounded-xl border border-white/10 p-4 shadow-sm bg-white/5">
      {/* TITLE + LEVEL + DELTA */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white">{title}</h3>
        <div className="flex items-center gap-2">
          {delta != null && delta !== 0 && (
            <span className={`text-[10px] font-semibold ${delta > 0 ? "text-green-400" : "text-red-400"}`}>
              {delta > 0 ? "\u2191" : "\u2193"} {Math.abs(delta)}
            </span>
          )}
          {mainScore != null && (
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ backgroundColor: `${mainLevel.color}20`, color: mainLevel.color }}
            >
              {mainLevel.label}
            </span>
          )}
        </div>
      </div>

      {/* MAIN BAR with ghost */}
      <div className="relative h-2.5 w-full rounded-full bg-gray-800/30 overflow-hidden">
        {/* Ghost bar (previous) */}
        {prevVal != null && ghostWidth > 0 && (
          <div
            className="absolute inset-y-0 left-0 h-full rounded-full opacity-25"
            style={{ width: `${ghostWidth}%`, backgroundColor: mainLevel.color }}
          />
        )}
        {/* Current bar */}
        <div
          className="relative h-full rounded-full transition-all duration-500"
          style={{
            width: `${widthMain}%`,
            backgroundColor: mainLevel.color,
          }}
        />
      </div>
    </div>
  );
}
