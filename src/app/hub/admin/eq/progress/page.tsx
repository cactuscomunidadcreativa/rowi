// src/app/hub/admin/eq/progress/page.tsx
// ============================================================
// EQ Progress Admin - Seguimiento de progreso global de EQ
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  TrendingUp,
  Loader2,
  Users,
  Brain,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Calendar,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

const ROWI_BLUE = "#31A2E3";
const ROWI_PURPLE = "#7A59C9";
const ROWI_PINK = "#D797CF";

// Demo data
const MONTHLY_PROGRESS = [
  { month: "Jul", know: 85, choose: 82, give: 78, total: 81.7 },
  { month: "Ago", know: 87, choose: 84, give: 80, total: 83.7 },
  { month: "Sep", know: 89, choose: 86, give: 83, total: 86.0 },
  { month: "Oct", know: 91, choose: 88, give: 85, total: 88.0 },
  { month: "Nov", know: 93, choose: 90, give: 88, total: 90.3 },
  { month: "Dic", know: 95, choose: 92, give: 90, total: 92.3 },
  { month: "Ene", know: 97, choose: 94, give: 92, total: 94.3 },
];

const TOP_IMPROVERS = [
  { name: "María López", improvement: 15.2, current: 108 },
  { name: "Juan García", improvement: 12.8, current: 102 },
  { name: "Ana Martínez", improvement: 11.5, current: 99 },
  { name: "Carlos Ruiz", improvement: 10.2, current: 96 },
  { name: "Sofia Herrera", improvement: 9.8, current: 94 },
];

const COMPETENCY_GROWTH = [
  { key: "EL", name: "Emotional Literacy", growth: 8.5, current: 95 },
  { key: "RP", name: "Recognize Patterns", growth: 6.2, current: 88 },
  { key: "ACT", name: "Consequential Thinking", growth: 7.8, current: 92 },
  { key: "NE", name: "Navigate Emotions", growth: 5.4, current: 85 },
  { key: "IM", name: "Intrinsic Motivation", growth: 9.1, current: 97 },
  { key: "OP", name: "Exercise Optimism", growth: 6.8, current: 90 },
  { key: "EMP", name: "Increase Empathy", growth: 7.2, current: 91 },
  { key: "NG", name: "Noble Goals", growth: 8.0, current: 94 },
];

export default function EQProgressAdminPage() {
  const { locale } = useI18n();
  const [loading, setLoading] = useState(true);

  const txt = {
    title: locale === "en" ? "EQ Progress" : "Progreso EQ",
    subtitle: locale === "en" ? "Global progress tracking across ROWI" : "Seguimiento de progreso global en ROWI",
    loading: locale === "en" ? "Loading progress data..." : "Cargando datos de progreso...",
    avgGrowth: locale === "en" ? "Avg Growth" : "Crecimiento Promedio",
    activeUsers: locale === "en" ? "Active Users" : "Usuarios Activos",
    completedGoals: locale === "en" ? "Completed Goals" : "Metas Cumplidas",
    topImprovers: locale === "en" ? "Top Improvers" : "Mayor Mejora",
    monthlyTrend: locale === "en" ? "Monthly Progress Trend" : "Tendencia de Progreso Mensual",
    competencyGrowth: locale === "en" ? "Competency Growth" : "Crecimiento por Competencia",
    pursuitProgress: locale === "en" ? "K-C-G Progress" : "Progreso K-C-G",
    improvement: locale === "en" ? "improvement" : "mejora",
    current: locale === "en" ? "Current" : "Actual",
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="relative">
            <TrendingUp className="w-16 h-16 text-emerald-500 animate-pulse" />
            <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <span>{txt.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
          <TrendingUp className="w-7 h-7 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{txt.title}</h1>
          <p className="text-gray-400 text-sm">{txt.subtitle}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 rounded-2xl border border-emerald-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              +12.6%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">+8.4</p>
          <p className="text-sm text-gray-400">{txt.avgGrowth}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-2xl border border-blue-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              +5%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">847</p>
          <p className="text-sm text-gray-400">{txt.activeUsers}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-2xl border border-amber-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              +18%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">1,256</p>
          <p className="text-sm text-gray-400">{txt.completedGoals}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress Trend */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            {txt.monthlyTrend}
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_PROGRESS}>
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ROWI_BLUE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ROWI_BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 110]} tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17,24,39,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <Area type="monotone" dataKey="total" stroke={ROWI_BLUE} strokeWidth={2} fill="url(#totalGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* K-C-G Progress */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            {txt.pursuitProgress}
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_PROGRESS}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 110]} tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17,24,39,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <Line type="monotone" dataKey="know" stroke={ROWI_BLUE} strokeWidth={2} dot={{ fill: ROWI_BLUE, r: 4 }} name="Know" />
                <Line type="monotone" dataKey="choose" stroke={ROWI_PURPLE} strokeWidth={2} dot={{ fill: ROWI_PURPLE, r: 4 }} name="Choose" />
                <Line type="monotone" dataKey="give" stroke={ROWI_PINK} strokeWidth={2} dot={{ fill: ROWI_PINK, r: 4 }} name="Give" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competency Growth */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            {txt.competencyGrowth}
          </h3>
          <div className="space-y-3">
            {COMPETENCY_GROWTH.map((comp) => (
              <div key={comp.key} className="flex items-center gap-3">
                <span className="w-10 text-xs font-bold text-violet-400">{comp.key}</span>
                <div className="flex-1">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                      style={{ width: `${(comp.current / 135) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-white font-medium w-12 text-right">{comp.current}</span>
                <span className="flex items-center gap-0.5 text-xs text-emerald-400 w-14">
                  <ArrowUpRight className="w-3 h-3" />
                  +{comp.growth}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Improvers */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            {txt.topImprovers}
          </h3>
          <div className="space-y-3">
            {TOP_IMPROVERS.map((user, idx) => (
              <div key={user.name} className="flex items-center gap-4 p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{txt.current}: {user.current}</p>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  +{user.improvement}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
