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
        <div className="flex flex-col items-center gap-4 text-[var(--rowi-muted)]">
          <div className="relative">
            <TrendingUp className="w-16 h-16 text-[var(--rowi-success)] animate-pulse" />
            <Sparkles className="w-6 h-6 text-[var(--rowi-warning)] absolute -top-1 -right-1 animate-bounce" />
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
        <div className="p-3 rounded-2xl bg-[var(--rowi-success)]/20">
          <TrendingUp className="w-7 h-7 text-[var(--rowi-success)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)]">{txt.title}</h1>
          <p className="text-[var(--rowi-muted)] text-sm">{txt.subtitle}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-success)]/10">
              <TrendingUp className="w-5 h-5 text-[var(--rowi-success)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-success)] bg-[var(--rowi-success)]/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +12.6%
            </span>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">+8.4</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.avgGrowth}</p>
        </div>

        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-primary)]/10">
              <Users className="w-5 h-5 text-[var(--rowi-primary)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-success)] bg-[var(--rowi-success)]/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +5%
            </span>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">847</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.activeUsers}</p>
        </div>

        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-warning)]/10">
              <Award className="w-5 h-5 text-[var(--rowi-warning)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-success)] bg-[var(--rowi-success)]/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +18%
            </span>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">1,256</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.completedGoals}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress Trend */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--rowi-primary)]" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rowi-border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 110]} tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
                  }}
                />
                <Area type="monotone" dataKey="total" stroke={ROWI_BLUE} strokeWidth={2} fill="url(#totalGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* K-C-G Progress */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--rowi-secondary)]" />
            {txt.pursuitProgress}
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_PROGRESS}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rowi-border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 110]} tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
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
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--rowi-success)]" />
            {txt.competencyGrowth}
          </h3>
          <div className="space-y-3">
            {COMPETENCY_GROWTH.map((comp) => (
              <div key={comp.key} className="flex items-center gap-3">
                <span className="w-10 text-xs font-bold text-[var(--rowi-secondary)]">{comp.key}</span>
                <div className="flex-1">
                  <div className="h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--rowi-success)] to-emerald-400 transition-all duration-500"
                      style={{ width: `${(comp.current / 135) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-[var(--rowi-foreground)] font-medium w-12 text-right">{comp.current}</span>
                <span className="flex items-center gap-0.5 text-xs text-[var(--rowi-success)] w-14">
                  <ArrowUpRight className="w-3 h-3" />
                  +{comp.growth}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Improvers */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--rowi-warning)]" />
            {txt.topImprovers}
          </h3>
          <div className="space-y-3">
            {TOP_IMPROVERS.map((user, idx) => (
              <div key={user.name} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--rowi-background)] hover:bg-[var(--rowi-border)] transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--rowi-warning)] to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--rowi-foreground)]">{user.name}</p>
                  <p className="text-xs text-[var(--rowi-muted)]">{txt.current}: {user.current}</p>
                </div>
                <span className="flex items-center gap-1 text-[var(--rowi-success)] font-semibold">
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
