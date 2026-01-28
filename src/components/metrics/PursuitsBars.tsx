"use client";

import { EQ_MAX } from "@/domains/eq/lib/eqLevels"; // ✅ usamos el valor máximo 135

const COLORS = { know: "#1E88E5", choose: "#E53935", give: "#43A047" };

export function PursuitsBars({
  know,
  choose,
  give
}: {
  know: number | null;
  choose: number | null;
  give: number | null;
}) {
  const Item = ({
    label,
    value,
    color
  }: {
    label: string;
    value: number | null;
    color: string;
  }) => {
    // ✅ Limitamos entre 0 y 135
    const v =
      typeof value === "number"
        ? Math.max(0, Math.min(EQ_MAX, value))
        : null;

    // ✅ Calculamos porcentaje relativo a 135
    const widthPercent = v ? (v / EQ_MAX) * 100 : 0;

    return (
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          {/* ✅ mostramos el valor real /135 */}
          <span className="text-sm text-gray-400">
            {v != null ? `${v} / ${EQ_MAX}` : "—"}
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-800/50 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${widthPercent}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border p-4 shadow-sm">
      <div className="text-sm text-gray-500 mb-2">Pursuits (SEI)</div>
      <Item label="Know Yourself" value={know} color={COLORS.know} />
      <Item label="Choose Yourself" value={choose} color={COLORS.choose} />
      <Item label="Give Yourself" value={give} color={COLORS.give} />
    </div>
  );
}