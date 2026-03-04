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
  Activity,
  BarChart3,
  Globe,
  Target,
  Heart,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
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
const ROWI_PINK = "#D797CF";
const ROWI_PURPLE = "#7A59C9";
const ROWI_TEAL = "#26A69A";

const BRAIN_STYLE_COLORS: Record<string, string> = {
  Driver: ROWI_BLUE,
  Guardian: ROWI_TEAL,
  Innovator: ROWI_PURPLE,
  Connector: ROWI_PINK,
};

interface GlobalStats {
  totalSnapshots: number;
  totalUsers: number;
  avgKnow: number;
  avgChoose: number;
  avgGive: number;
  avgTotal: number;
  recentSnapshots: number;
  topCountries: Array<{ country: string; count: number }>;
  competencies: {
    EL: number; RP: number; ACT: number; NE: number;
    IM: number; OP: number; EMP: number; NG: number;
  };
  monthlyTrend: Array<{ month: string; avg: number }>;
  brainStyles: Array<{ name: string; value: number; count: number }>;
}

export default function EQDashboardGlobal() {
  const { locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats | null>(null);

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

  const COMPETENCY_LABELS: Record<string, Record<string, string>> = {
    EL: { en: "Emotional Literacy", es: "Alfabetización Emocional" },
    RP: { en: "Recognize Patterns", es: "Reconocer Patrones" },
    ACT: { en: "Consequential Thinking", es: "Pensamiento Consecuente" },
    NE: { en: "Navigate Emotions", es: "Navegar Emociones" },
    IM: { en: "Intrinsic Motivation", es: "Motivación Intrínseca" },
    OP: { en: "Exercise Optimism", es: "Ejercitar Optimismo" },
    EMP: { en: "Increase Empathy", es: "Incrementar Empatía" },
    NG: { en: "Noble Goals", es: "Metas Nobles" },
  };

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

  // Build chart data from real API response
  const competencyData = stats?.competencies
    ? Object.entries(stats.competencies).map(([key, value]) => ({
        name: key,
        fullName: COMPETENCY_LABELS[key]?.[locale === "en" ? "en" : "es"] || key,
        value: Math.round(Number(value) || 0),
      }))
    : [];

  const monthlyData = stats?.monthlyTrend || [];

  const brainStylesData = (stats?.brainStyles || []).map(bs => ({
    ...bs,
    color: BRAIN_STYLE_COLORS[bs.name] || ROWI_BLUE,
  }));

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
          href="/hub/admin/eq/snapshots"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--rowi-secondary)]/10 hover:bg-[var(--rowi-secondary)]/20 text-[var(--rowi-secondary)] rounded-xl transition-colors"
        >
          {txt.viewSnapshots}
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Stats Cards — no fake percentages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} iconBg="primary" value={stats?.totalSnapshots} label={txt.totalSnapshots} />
        <StatCard icon={Users} iconBg="secondary" value={stats?.totalUsers} label={txt.totalUsers} />
        <StatCard icon={Activity} iconBg="warning" value={stats?.avgTotal?.toFixed(1)} label={txt.avgEQ} />
        <StatCard icon={Calendar} iconBg="success" value={stats?.recentSnapshots} label={txt.recentActivity} />
      </div>

      {/* K-C-G Section */}
      <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
        <h3 className="text-[var(--rowi-foreground)] font-semibold mb-6">{txt.pursuits}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PursuitCard icon={Brain} color="primary" value={stats?.avgKnow} label={txt.know} />
          <PursuitCard icon={Target} color="secondary" value={stats?.avgChoose} label={txt.choose} />
          <PursuitCard icon={Heart} color="pink" value={stats?.avgGive} label={txt.give} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competencies Radar */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="text-[var(--rowi-foreground)] font-semibold mb-4">{txt.competencies}</h3>
          {competencyData.length > 0 && competencyData.some(c => c.value > 0) ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={competencyData}>
                  <PolarGrid stroke="var(--rowi-border)" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} />
                  <PolarRadiusAxis angle={22.5} domain={[0, 135]} tick={{ fill: "var(--rowi-muted)", fontSize: 10 }} />
                  <Radar name="EQ" dataKey="value" stroke={ROWI_PURPLE} fill={ROWI_PURPLE} fillOpacity={0.4} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--rowi-surface)", border: "1px solid var(--rowi-border)", borderRadius: "8px", color: "var(--rowi-foreground)" }}
                    formatter={(value: number, _: string, props: any) => [`${value}`, props.payload.fullName]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoDataPlaceholder text={txt.noData} />
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="text-[var(--rowi-foreground)] font-semibold mb-4">{txt.monthlyTrend}</h3>
          {monthlyData.length > 0 ? (
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
                  <YAxis stroke="var(--rowi-muted)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--rowi-surface)", border: "1px solid var(--rowi-border)", borderRadius: "8px", color: "var(--rowi-foreground)" }} />
                  <Area type="monotone" dataKey="avg" stroke={ROWI_BLUE} strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoDataPlaceholder text={txt.noData} />
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brain Styles Distribution */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="text-[var(--rowi-foreground)] font-semibold mb-4">{txt.brainStyles}</h3>
          {brainStylesData.length > 0 ? (
            <>
              <div style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={brainStylesData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                      {brainStylesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "var(--rowi-surface)", border: "1px solid var(--rowi-border)", borderRadius: "8px", color: "var(--rowi-foreground)" }} formatter={(value: number) => [`${value}%`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {brainStylesData.map((style) => (
                  <div key={style.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: style.color }} />
                    <span className="text-sm text-[var(--rowi-muted)]">{style.name} ({style.value}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <NoDataPlaceholder text={txt.noData} />
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="text-[var(--rowi-foreground)] font-semibold mb-4">{txt.topCountries}</h3>
          {stats?.topCountries && stats.topCountries.length > 0 ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topCountries.slice(0, 6)} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--rowi-border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--rowi-muted)" fontSize={12} />
                  <YAxis type="category" dataKey="country" stroke="var(--rowi-muted)" fontSize={12} width={50} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--rowi-surface)", border: "1px solid var(--rowi-border)", borderRadius: "8px", color: "var(--rowi-foreground)" }} />
                  <Bar dataKey="count" fill={ROWI_TEAL} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoDataPlaceholder text={txt.noData} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reusable sub-components ──────────────────────────────── */

const STAT_CARD_COLORS: Record<string, { bg: string; text: string }> = {
  primary: { bg: "bg-blue-500/10", text: "text-blue-500" },
  secondary: { bg: "bg-purple-500/10", text: "text-purple-500" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-500" },
  success: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
};

function StatCard({ icon: Icon, iconBg, value, label }: { icon: any; iconBg: string; value: any; label: string }) {
  const c = STAT_CARD_COLORS[iconBg] || STAT_CARD_COLORS.primary;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 shadow-sm hover:border-gray-300 dark:hover:border-zinc-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {typeof value === "number" ? value.toLocaleString() : value || "0"}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

const PURSUIT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  primary: { bg: "bg-blue-500/20", text: "text-blue-500", bar: "bg-gradient-to-r from-blue-500 to-violet-500" },
  secondary: { bg: "bg-purple-500/20", text: "text-purple-500", bar: "bg-gradient-to-r from-purple-500 to-violet-500" },
  pink: { bg: "bg-pink-500/20", text: "text-pink-500", bar: "bg-gradient-to-r from-pink-500 to-rose-500" },
};

function PursuitCard({ icon: Icon, color, value, label }: { icon: any; color: string; value: any; label: string }) {
  const numValue = Number(value) || 0;
  const c = PURSUIT_COLORS[color] || PURSUIT_COLORS.primary;
  return (
    <div className="text-center">
      <div className={`w-16 h-16 mx-auto rounded-2xl ${c.bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-8 h-8 ${c.text}`} />
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{numValue.toFixed(1)}</div>
      <p className="text-sm text-gray-500 mb-3">{label}</p>
      <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${c.bar}`}
          style={{ width: `${(numValue / 135) * 100}%` }}
        />
      </div>
    </div>
  );
}

function NoDataPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-[250px] text-[var(--rowi-muted)]">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">{text}</p>
      </div>
    </div>
  );
}
