"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { EQ_MAX, getSeiLevel } from "@/domains/eq/lib/eqLevels";

type Item = { key: string; actual: number; feedback: number };

export default function EQCompare({
  data,
  title = "Actual vs Feedback",
}: {
  data: Item[];
  title?: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.02)",
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

      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="key"
              tick={{ fill: "#9AA0A6", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[65, EQ_MAX]}
              tick={{ fill: "#9AA0A6", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            {/* 🎯 Tooltip con nivel SEI */}
            <Tooltip
              contentStyle={{
                background: "rgba(0,0,0,0.8)",
                borderRadius: 8,
                border: "none",
                color: "#fff",
              }}
              formatter={(value: number, name: string) => {
                const lvl = getSeiLevel(value);
                const label =
                  name === "actual" ? "Actual" : "Feedback";
                return [`${value} / ${EQ_MAX}`, `${label}: ${lvl.name}`];
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: 8,
                fontSize: 12,
                color: "#B0BEC5",
              }}
            />

            {/* 🎨 Gradientes Rowi */}
            <defs>
              <linearGradient id="gradActual" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7a59c9" />
                <stop offset="100%" stopColor="#d797cf" />
              </linearGradient>
              <linearGradient id="gradFeedback" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#31a2e3" />
                <stop offset="100%" stopColor="#7ed6ff" />
              </linearGradient>
            </defs>

            <Bar
              dataKey="actual"
              name="Actual"
              fill="url(#gradActual)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="feedback"
              name="Feedback"
              fill="url(#gradFeedback)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}