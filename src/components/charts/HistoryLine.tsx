"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { EQ_MAX, getEqLevel } from "@/domains/eq/lib/eqLevels"; // ✅ función corregida

export type HistoryPoint = { date: string; avg: number };

export default function HistoryLine({
  data,
  title = "Evolución de EQ — Promedio",
}: {
  data: HistoryPoint[];
  title?: string;
}) {
  return (
    <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
      <h3 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">{title}</h3>

      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

            <XAxis
              dataKey="date"
              tick={{ fill: "#9AA0A6", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            {/* Escala SEI: 65–135 */}
            <YAxis
              domain={[65, EQ_MAX]}
              tick={{ fill: "#9AA0A6", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            {/* Línea de referencia promedio SEI */}
            <ReferenceLine
              y={100}
              stroke="#9AA0A6"
              strokeDasharray="4 4"
              label={{
                value: "Promedio SEI (100)",
                position: "right",
                fill: "#9AA0A6",
                fontSize: 11,
              }}
            />

            {/* Tooltip enriquecido */}
            <Tooltip
              contentStyle={{
                background: "rgba(0,0,0,0.85)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
              }}
              formatter={(value: number) => {
                const lvl = getEqLevel(value);
                return [`${value} / ${EQ_MAX}`, `${lvl.label} ${lvl.emoji}`];
              }}
              labelFormatter={(label: string) => `Fecha: ${label}`}
            />

            {/* Gradiente Rowi */}
            <defs>
              <linearGradient id="gradEQLine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#31A2E3" />
                <stop offset="50%" stopColor="#7A59C9" />
                <stop offset="100%" stopColor="#D797CF" />
              </linearGradient>
            </defs>

            {/* Línea principal */}
            <Line
              type="monotone"
              dataKey="avg"
              stroke="url(#gradEQLine)"
              strokeWidth={2.5}
              dot={{
                fill: "#7A59C9",
                strokeWidth: 1.2,
                stroke: "#31A2E3",
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: "#D797CF",
                stroke: "#31A2E3",
                strokeWidth: 1.5,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}