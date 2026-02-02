// src/app/hub/eq/dashboard/page.tsx
// ============================================================
// EQ Dashboard Global - Panel administrativo de EQ de todo ROWI
// Estadísticas globales, tendencias y métricas del sistema
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  Brain,
  Users,
  TrendingUp,
  Activity,
  BarChart3,
  Globe,
  Target,
  Heart,
  Sparkles,
  Calendar,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Colores Rowi
const ROWI_BLUE = "#31A2E3";
const ROWI_RED = "#E53935";
const ROWI_PINK = "#D797CF";
const ROWI_PURPLE = "#7A59C9";
const ROWI_TEAL = "#26A69A";

interface GlobalStats {
  totalSnapshots: number;
  totalUsers: number;
  avgKnow: number;
  avgChoose: number;
  avgGive: number;
  avgTotal: number;
  recentSnapshots: number;
  topCountries: Array<{ country: string; count: number }>;
}

export default function EQDashboardGlobal() {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats | null>(null);

  // Traducciones
  const txt = {
    title: locale === "en" ? "EQ Global Dashboard" : "Dashboard EQ Global",
    subtitle: locale === "en"
      ? "Emotional intelligence metrics across ROWI"
      : "Métricas de inteligencia emocional en ROWI",
    loading: locale === "en" ? "Loading statistics..." : "Cargando estadísticas...",
    totalSnapshots: locale === "en" ? "Total Snapshots" : "Snapshots Totales",
    totalUsers: locale === "en" ? "Users with EQ" : "Usuarios con EQ",
    avgEQ: locale === "en" ? "Average EQ" : "EQ Promedio",
    recentActivity: locale === "en" ? "Recent (30d)" : "Recientes (30d)",
    pursuits: "Pursuits K-C-G",
    know: "Know Yourself",
    choose: "Choose Yourself",
    give: "Give Yourself",
    competencies: locale === "en" ? "EQ Competencies" : "Competencias EQ",
    monthlyTrend: locale === "en" ? "Monthly Trend" : "Tendencia Mensual",
    brainStyles: locale === "en" ? "Brain Styles Distribution" : "Distribución Estilos Cerebrales",
    topCountries: locale === "en" ? "Top Countries" : "Principales Países",
    noData: locale === "en" ? "No data available" : "Sin datos disponibles",
    viewSnapshots: locale === "en" ? "View All Snapshots" : "Ver Todos los Snapshots",
  };

  // Competencias SEI
  const competencyData = [
    { name: "EL", fullName: locale === "en" ? "Emotional Literacy" : "Alfabetización Emocional", value: 78 },
    { name: "RP", fullName: locale === "en" ? "Recognize Patterns" : "Reconocer Patrones", value: 72 },
    { name: "ACT", fullName: locale === "en" ? "Consequential Thinking" : "Pensamiento Consecuente", value: 85 },
    { name: "NE", fullName: locale === "en" ? "Navigate Emotions" : "Navegar Emociones", value: 68 },
    { name: "IM", fullName: locale === "en" ? "Intrinsic Motivation" : "Motivación Intrínseca", value: 82 },
    { name: "OP", fullName: locale === "en" ? "Exercise Optimism" : "Ejercitar Optimismo", value: 75 },
    { name: "EMP", fullName: locale === "en" ? "Increase Empathy" : "Incrementar Empatía", value: 88 },
    { name: "NG", fullName: locale === "en" ? "Noble Goals" : "Metas Nobles", value: 79 },
  ];

  // Datos de tendencia mensual (demo)
  const monthlyData = [
    { month: "Jul", avg: 72 },
    { month: "Aug", avg: 74 },
    { month: "Sep", avg: 73 },
    { month: "Oct", avg: 76 },
    { month: "Nov", avg: 78 },
    { month: "Dec", avg: 77 },
    { month: "Jan", avg: 80 },
  ];

  // Distribución de Brain Styles (demo)
  const brainStylesData = [
    { name: "Driver", value: 25, color: ROWI_BLUE },
    { name: "Guardian", value: 30, color: ROWI_TEAL },
    { name: "Innovator", value: 20, color: ROWI_PURPLE },
    { name: "Connector", value: 25, color: ROWI_PINK },
  ];

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/eq/stats");
      const json = await res.json();
      if (json.ok) {
        setStats(json.stats);
      }
    } catch (error) {
      console.error("Error loading EQ stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-[var(--rowi-muted)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{txt.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--rowi-secondary)]/20">
            <Brain className="w-6 h-6 text-[var(--rowi-secondary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--rowi-foreground)]">{txt.title}</h1>
            <p className="text-[var(--rowi-muted)] text-sm">{txt.subtitle}</p>
          </div>
        </div>
        <a
          href="/hub/eq/snapshots"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--rowi-secondary)]/10 hover:bg-[var(--rowi-secondary)]/20 text-[var(--rowi-secondary)] rounded-xl transition-colors"
        >
          {txt.viewSnapshots}
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Snapshots */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-[var(--rowi-primary)]/10">
              <BarChart3 className="w-5 h-5 text-[var(--rowi-primary)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-success)] bg-[var(--rowi-success)]/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +12%
            </span>
          </div>
          <div className="text-3xl font-bold text-[var(--rowi-foreground)] mb-1">
            {stats?.totalSnapshots?.toLocaleString() || "0"}
          </div>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.totalSnapshots}</p>
        </div>

        {/* Total Users */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-[var(--rowi-secondary)]/10">
              <Users className="w-5 h-5 text-[var(--rowi-secondary)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-success)] bg-[var(--rowi-success)]/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +8%
            </span>
          </div>
          <div className="text-3xl font-bold text-[var(--rowi-foreground)] mb-1">
            {stats?.totalUsers?.toLocaleString() || "0"}
          </div>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.totalUsers}</p>
        </div>

        {/* Average EQ */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-[var(--rowi-warning)]/10">
              <Activity className="w-5 h-5 text-[var(--rowi-warning)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-success)] bg-[var(--rowi-success)]/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +3%
            </span>
          </div>
          <div className="text-3xl font-bold text-[var(--rowi-foreground)] mb-1">
            {stats?.avgTotal?.toFixed(1) || "0"}
          </div>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.avgEQ}</p>
        </div>

        {/* Recent Activity */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-[var(--rowi-success)]/10">
              <Calendar className="w-5 h-5 text-[var(--rowi-success)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-error)] bg-[var(--rowi-error)]/10 px-2 py-0.5 rounded-full">
              <ArrowDownRight className="w-3 h-3" />
              -5%
            </span>
          </div>
          <div className="text-3xl font-bold text-[var(--rowi-foreground)] mb-1">
            {stats?.recentSnapshots?.toLocaleString() || "0"}
          </div>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.recentActivity}</p>
        </div>
      </div>

      {/* K-C-G Section */}
      <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
        <h3 className="text-[var(--rowi-foreground)] font-semibold mb-6">{txt.pursuits}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Know */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--rowi-primary)]/20 flex items-center justify-center mb-3">
              <Brain className="w-8 h-8 text-[var(--rowi-primary)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--rowi-foreground)] mb-1">
              {stats?.avgKnow?.toFixed(1) || "0"}
            </div>
            <p className="text-sm text-[var(--rowi-muted)] mb-3">{txt.know}</p>
            <div className="h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--rowi-primary)] to-cyan-500"
                style={{ width: `${((stats?.avgKnow || 0) / 135) * 100}%` }}
              />
            </div>
          </div>

          {/* Choose */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--rowi-secondary)]/20 flex items-center justify-center mb-3">
              <Target className="w-8 h-8 text-[var(--rowi-secondary)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--rowi-foreground)] mb-1">
              {stats?.avgChoose?.toFixed(1) || "0"}
            </div>
            <p className="text-sm text-[var(--rowi-muted)] mb-3">{txt.choose}</p>
            <div className="h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--rowi-secondary)] to-violet-500"
                style={{ width: `${((stats?.avgChoose || 0) / 135) * 100}%` }}
              />
            </div>
          </div>

          {/* Give */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-500/20 flex items-center justify-center mb-3">
              <Heart className="w-8 h-8 text-pink-500" />
            </div>
            <div className="text-3xl font-bold text-[var(--rowi-foreground)] mb-1">
              {stats?.avgGive?.toFixed(1) || "0"}
            </div>
            <p className="text-sm text-[var(--rowi-muted)] mb-3">{txt.give}</p>
            <div className="h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                style={{ width: `${((stats?.avgGive || 0) / 135) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competencies Radar */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="text-[var(--rowi-foreground)] font-semibold mb-4">{txt.competencies}</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={competencyData}>
                <PolarGrid stroke="var(--rowi-border)" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: "var(--rowi-muted)", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={22.5}
                  domain={[0, 100]}
                  tick={{ fill: "var(--rowi-muted)", fontSize: 10 }}
                />
                <Radar
                  name="EQ"
                  dataKey="value"
                  stroke={ROWI_PURPLE}
                  fill={ROWI_PURPLE}
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: "8px",
                    color: "var(--rowi-foreground)",
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value}`,
                    props.payload.fullName
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="text-[var(--rowi-foreground)] font-semibold mb-4">{txt.monthlyTrend}</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ROWI_BLUE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ROWI_BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rowi-border)" />
                <XAxis dataKey="month" stroke="var(--rowi-muted)" fontSize={12} />
                <YAxis domain={[60, 100]} stroke="var(--rowi-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: "8px",
                    color: "var(--rowi-foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avg"
                  stroke={ROWI_BLUE}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAvg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brain Styles Distribution */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="text-[var(--rowi-foreground)] font-semibold mb-4">{txt.brainStyles}</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={brainStylesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {brainStylesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: "8px",
                    color: "var(--rowi-foreground)",
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {brainStylesData.map((style) => (
              <div key={style.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: style.color }}
                />
                <span className="text-sm text-[var(--rowi-muted)]">
                  {style.name} ({style.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="text-[var(--rowi-foreground)] font-semibold mb-4">{txt.topCountries}</h3>
          {stats?.topCountries && stats.topCountries.length > 0 ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.topCountries.slice(0, 6)}
                  layout="vertical"
                  margin={{ left: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--rowi-border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--rowi-muted)" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="country"
                    stroke="var(--rowi-muted)"
                    fontSize={12}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--rowi-surface)",
                      border: "1px solid var(--rowi-border)",
                      borderRadius: "8px",
                      color: "var(--rowi-foreground)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill={ROWI_TEAL}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-[var(--rowi-muted)]">
              <div className="text-center">
                <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{txt.noData}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
