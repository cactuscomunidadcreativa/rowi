"use client";

import { EQ_MAX } from "@/domains/eq/lib/eqLevels"; // ✅ añadimos referencia a 135

export function EqTotalBar({ value }: { value: number | null }) {
  // ✅ Limitamos entre 0 y EQ_MAX (135)
  const v =
    typeof value === "number"
      ? Math.max(0, Math.min(EQ_MAX, value))
      : null;

  // ✅ Calculamos el ancho relativo (de 0 a 100%) respecto al máximo 135
  const widthPercent = v ? (v / EQ_MAX) * 100 : 0;

  return (
    <div className="rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">EQ Total</span>
        {/* ✅ mostramos valor real / 135 */}
        <span className="text-lg font-semibold">
          {v != null ? `${v} / ${EQ_MAX}` : "—"}
        </span>
      </div>

      <div className="mt-3 h-3 w-full rounded-full bg-gray-800/50 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${widthPercent}%`,
            background:
              "linear-gradient(90deg,#d797cf,#31a2e3,#7a59c9)"
          }}
        />
      </div>
    </div>
  );
}