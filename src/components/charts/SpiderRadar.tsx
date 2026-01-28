"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { EQ_MAX } from "@/domains/eq/lib/eqLevels"; // Escala SEI 135

type Item = { key: string; score: number };

const LABELS_FULL: Record<string, string> = {
  EL: "Emotional Literacy",
  RP: "Recognize Patterns",
  ACT: "Consequential Thinking",
  NE: "Navigate Emotions",
  IM: "Intrinsic Motivation",
  OP: "Optimism",
  EMP: "Empathy",
  NG: "Noble Goals",
};

const COLOR_SEI: Record<string, string> = {
  EL: "#1E88E5",
  RP: "#1565C0",
  ACT: "#E53935",
  NE: "#FB8C00",
  IM: "#FDD835",
  OP: "#43A047",
  EMP: "#8E24AA",
  NG: "#7B1FA2",
};

export default function SpiderRadar({
  data,
  title = "Perfil de EQ (Radar SEI)",
}: {
  data: Item[];
  title?: string;
}) {
  const hasValues = data.some((d) => d.score > 0);
  if (!hasValues) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-gray-400 border rounded-xl">
        <p>No hay datos de competencias disponibles.</p>
      </div>
    );
  }

  return (
    <div
      className="p-4 rounded-2xl border border-white/10 bg-white/5"
      style={{ height: 360 }}
    >
      <h3 className="mb-3 font-semibold text-gray-100">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          {/* Fondo + grid */}
          <PolarGrid stroke="rgba(255,255,255,0.08)" />

          {/* Etiquetas con color SEI */}
          <PolarAngleAxis
            dataKey="key"
            tick={(props: any) => {
              const { x, y, payload } = props;
              const k = payload?.value as string;
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={COLOR_SEI[k] ?? "#ccc"}
                  fontWeight={600}
                  fontSize={11}
                >
                  {k}
                </text>
              );
            }}
          />

          {/* Escala SEI real 65–135 */}
          <PolarRadiusAxis
            angle={30}
            domain={[65, EQ_MAX]}
            tick={{ fill: "#9AA0A6", fontSize: 10 }}
            axisLine={false}
          />

          {/* Tooltip con nombre completo */}
          <Tooltip
            contentStyle={{
              background: "rgba(0,0,0,0.85)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
            }}
            formatter={(value: number, key: string, entry: any) => [
              `${value} / ${EQ_MAX}`,
              LABELS_FULL[entry.payload.key] ?? entry.payload.key,
            ]}
          />

          {/* Radar principal con gradiente Rowi */}
          <defs>
            <radialGradient id="rowiRadarFill" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#31A2E3" stopOpacity={0.45} />
              <stop offset="70%" stopColor="#7A59C9" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#D797CF" stopOpacity={0.25} />
            </radialGradient>
          </defs>

          <Radar
            name="EQ Snapshot"
            dataKey="score"
            stroke="#7A59C9"
            fill="url(#rowiRadarFill)"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}