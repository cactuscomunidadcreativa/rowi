// src/app/hub/admin/eq/progress/page.tsx
// ============================================================
// EQ Progress Admin - Seguimiento de progreso global de EQ
// Datos reales de la base de datos
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
  Target,
  Calendar,
  Award,
  AlertCircle,
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
} from "recharts";

const ROWI_BLUE = "#31A2E3";
const ROWI_PURPLE = "#7A59C9";
const ROWI_PINK = "#D797CF";

interface StatsData {
  totalSnapshots: number;
  totalUsers: number;
  avgKnow: number;
  avgChoose: number;
  avgGive: number;
  avgTotal: number;
  recentSnapshots: number;
  competencies: Record<string, number>;
  monthlyTrend: Array<{ month: string; avg: number }>;
}

export default function EQProgressAdminPage() {
  const { locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);

  const txt = {
    title: locale === "en" ? "EQ Progress" : "Progreso EQ",
    subtitle: locale === "en" ? "Global progress tracking across ROWI" : "Seguimiento de progreso global en ROWI",
    loading: locale === "en" ? "Loading progress data..." : "Cargando datos de progreso...",
    totalSnapshots: locale === "en" ? "Total Snapshots" : "Total Snapshots",
    totalUsers: locale === "en" ? "Users with EQ" : "Usuarios con EQ",
    avgEQ: locale === "en" ? "Average EQ" : "EQ Promedio",
    monthlyTrend: locale === "en" ? "Monthly Progress Trend" : "Tendencia de Progreso Mensual",
    competencyScores: locale === "en" ? "Competency Scores" : "Puntuaciones por Competencia",
    kcgProgress: locale === "en" ? "K-C-G Averages" : "Promedios K-C-G",
    noData: locale === "en" ? "No data available yet" : "Sin datos disponibles aún",
    recent30d: locale === "en" ? "Recent (30d)" : "Recientes (30d)",
  };

  const COMP_LABELS: Record<string, Record<string, string>> = {
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
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/admin/eq/stats");
      const data = await res.json();
      if (data.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--rowi-muted)]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>{txt.loading}</span>
        </div>
      </div>
    );
  }

  const monthlyData = stats?.monthlyTrend || [];
  const competencyEntries = stats?.competencies
    ? Object.entries(stats.competencies).map(([key, value]) => ({
        key,
        name: COMP_LABELS[key]?.[locale === "en" ? "en" : "es"] || key,
        score: Math.round(Number(value) || 0),
      }))
    : [];

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

      {/* Stats Cards - real data */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={BarChart3} color="primary" value={stats?.totalSnapshots?.toLocaleString() || "0"} label={txt.totalSnapshots} />
        <StatCard icon={Users} color="secondary" value={stats?.totalUsers?.toLocaleString() || "0"} label={txt.totalUsers} />
        <StatCard icon={Brain} color="warning" value={stats?.avgTotal?.toFixed(1) || "0"} label={txt.avgEQ} />
        <StatCard icon={Calendar} color="success" value={stats?.recentSnapshots?.toLocaleString() || "0"} label={txt.recent30d} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress Trend */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--rowi-primary)]" />
            {txt.monthlyTrend}
          </h3>
          {monthlyData.length > 0 ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ROWI_BLUE} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={ROWI_BLUE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--rowi-border)" />
                  <XAxis dataKey="month" tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--rowi-surface)", border: "1px solid var(--rowi-border)", borderRadius: 8, color: "var(--rowi-foreground)" }} />
                  <Area type="monotone" dataKey="avg" stroke={ROWI_BLUE} strokeWidth={2} fill="url(#totalGradient)" name="EQ Avg" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoData text={txt.noData} />
          )}
        </div>

        {/* K-C-G Progress */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--rowi-secondary)]" />
            {txt.kcgProgress}
          </h3>
          {stats ? (
            <div className="space-y-6 py-4">
              <KCGBar label="Know Yourself" value={stats.avgKnow} color={ROWI_BLUE} />
              <KCGBar label="Choose Yourself" value={stats.avgChoose} color={ROWI_PURPLE} />
              <KCGBar label="Give Yourself" value={stats.avgGive} color={ROWI_PINK} />
            </div>
          ) : (
            <NoData text={txt.noData} />
          )}
        </div>
      </div>

      {/* Competency Scores */}
      <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
        <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[var(--rowi-success)]" />
          {txt.competencyScores}
        </h3>
        {competencyEntries.length > 0 && competencyEntries.some(c => c.score > 0) ? (
          <div className="space-y-3">
            {competencyEntries.map((comp) => (
              <div key={comp.key} className="flex items-center gap-3">
                <span className="w-10 text-xs font-bold text-[var(--rowi-secondary)]">{comp.key}</span>
                <div className="flex-1">
                  <div className="h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--rowi-success)] to-emerald-400 transition-all duration-500"
                      style={{ width: `${(comp.score / 135) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-[var(--rowi-muted)] w-32 truncate">{comp.name}</span>
                <span className="text-sm text-[var(--rowi-foreground)] font-medium w-12 text-right">{comp.score}</span>
              </div>
            ))}
          </div>
        ) : (
          <NoData text={txt.noData} />
        )}
      </div>
    </div>
  );
}

const STAT_COLORS: Record<string, { bg: string; text: string }> = {
  primary: { bg: "bg-blue-500/10", text: "text-blue-500" },
  secondary: { bg: "bg-purple-500/10", text: "text-purple-500" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-500" },
  success: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
};

function StatCard({ icon: Icon, color, value, label }: { icon: any; color: string; value: string; label: string }) {
  const c = STAT_COLORS[color] || STAT_COLORS.primary;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 shadow-sm">
      <div className="mb-2">
        <div className={`p-2 rounded-xl ${c.bg} inline-block`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function KCGBar({ label, value, color }: { label: string; value: number; color: string }) {
  const numValue = Number(value) || 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-[var(--rowi-foreground)]">{label}</span>
        <span className="text-lg font-bold text-[var(--rowi-foreground)]">{numValue.toFixed(1)}</span>
      </div>
      <div className="h-3 bg-[var(--rowi-border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(numValue / 135) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function NoData({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-[var(--rowi-muted)]">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">{text}</p>
      </div>
    </div>
  );
}
