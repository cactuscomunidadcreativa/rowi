"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { EQ_MAX } from "@/domains/eq/lib/eqLevels";

/* =========================================================
   🎨 Paleta SEI (8 competencias)
   - Azul → Know Yourself (EL, RP)
   - Rojo → Choose Yourself (ACT, NE, IM, OP)
   - Verde → Give Yourself (EMP, NG)
========================================================= */
const COLOR_SEI: Record<string, string> = {
  EL: "#1E88E5", // Azul - Emotional Literacy
  RP: "#42A5F5", // Azul - Recognize Patterns
  ACT: "#E53935", // Rojo - Consequential Thinking
  NE: "#F4511E", // Rojo - Navigate Emotions
  IM: "#F44336", // Rojo - Intrinsic Motivation
  OP: "#EF5350", // Rojo - Optimism
  EMP: "#43A047", // Verde - Empathy
  NG: "#388E3C", // Verde - Noble Goals
};

/* =========================================================
   🧠 Componente principal
========================================================= */
export default function CompetenciesSpider({
  comps,
  compare,
  datePresent,
  dateCompare,
  max = EQ_MAX,
}: {
  comps: Partial<Record<string, number | null>>;
  compare?: Partial<Record<string, number | null>> | null;
  datePresent?: string | null;
  dateCompare?: string | null;
  max?: number;
}) {
  const keys = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

  const data = keys.map((k) => ({
    k,
    present: comps?.[k] ?? null,
    other: compare?.[k] ?? null,
  }));

  const hasPresent = Object.values(comps || {}).some(
    (v) => typeof v === "number" && v > 0
  );

  const hasCompare =
    compare &&
    Object.values(compare).some(
      (v) =>
        typeof v === "number" &&
        !isNaN(v) &&
        v !== null &&
        v !== 0 &&
        v > 0
    );

  if (!hasPresent && !hasCompare) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-gray-400 border rounded-xl">
        <p>No hay datos para mostrar.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 340 }}>
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="#9AA0A6" strokeOpacity={0.25} />
          <PolarAngleAxis
            dataKey="k"
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
                  fontSize={13}
                >
                  {k}
                </text>
              );
            }}
          />
          <PolarRadiusAxis domain={[65, max]} tick={false} stroke="#9AA0A6" />

          <Tooltip
            formatter={(val: any) =>
              val ? [`${val} / ${EQ_MAX}`] : ["Sin datos"]
            }
            labelFormatter={() => ""}
          />

          {/* 🎯 Presente */}
          {hasPresent && (
            <Radar
              name={`Actual${datePresent ? ` · ${datePresent}` : ""}`}
              dataKey="present"
              stroke="#7A59C9"
              strokeWidth={2}
              fill="#7A59C9"
              fillOpacity={0.25}
            />
          )}

          {/* 🔁 Comparación */}
          {hasCompare && (
            <Radar
              name={`Comparación${dateCompare ? ` · ${dateCompare}` : ""}`}
              dataKey="other"
              stroke="#31A2E3"
              strokeWidth={2}
              fill="#31A2E3"
              fillOpacity={0.15}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}