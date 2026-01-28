"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { EQ_MAX, EQ_LEVELS, getEqLevel } from "@/domains/eq/lib/eqLevels";

/** Tipo de item */
type Item = { key: string; score: number };

/** Devuelve color según nivel SEI */
function getBarColor(score: number | null | undefined) {
  if (typeof score !== "number") return "#9AA0A6";
  const lvl = getEqLevel(score);
  return lvl?.color ?? "#9AA0A6";
}

/** Componente principal */
export default function EQBar({
  data,
  title = "Perfil de EQ (Barras)",
}: {
  data: Item[];
  title?: string;
}) {
  // Color promedio del dataset (para borde o acento)
  const avgColor =
    data.length > 0
      ? getBarColor(data.reduce((a, b) => a + (b.score || 0), 0) / data.length)
      : "#7a59c9";

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <h3
        style={{
          marginBottom: 8,
          fontSize: 16,
          fontWeight: 600,
          color: "#ECEFF1",
        }}
      >
        {title}
      </h3>

      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="key"
              tick={{
                fill: "#9AA0A6",
                fontSize: 12,
                dy: 4,
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[65, EQ_MAX]}
              tick={false} // ❌ ocultamos los números
              axisLine={false}
              tickLine={false}
            />

            {/* Tooltip personalizado solo con el nivel */}
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{
                background: "rgba(0,0,0,0.8)",
                borderRadius: 8,
                border: "none",
                color: "#fff",
                fontSize: 12,
                padding: 10,
              }}
              formatter={(value: number) => {
                const lvl = getEqLevel(value);
                return [
                  `${lvl.emoji} ${lvl.label}`,
                  "Nivel emocional",
                ];
              }}
            />

            {/* Gradiente SEI */}
            <defs>
              <linearGradient id="eqBarGradient" x1="0" y1="0" x2="1" y2="1">
                {EQ_LEVELS.map((lvl, i) => (
                  <stop
                    key={lvl.key}
                    offset={`${(i / (EQ_LEVELS.length - 1)) * 100}%`}
                    stopColor={lvl.color}
                  />
                ))}
              </linearGradient>
            </defs>

            {/* Barras con color dinámico */}
            <Bar
              dataKey="score"
              fill="url(#eqBarGradient)"
              radius={[6, 6, 0, 0]}
              stroke={avgColor}
              strokeWidth={1.5}
              label={{
                position: "top",
                formatter: (value: number) => {
                  const lvl = getEqLevel(value);
                  return `${lvl.emoji} ${lvl.label}`;
                },
                fill: "#E0E0E0",
                fontSize: 12,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}