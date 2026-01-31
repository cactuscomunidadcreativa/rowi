// src/app/hub/admin/weekflow/page.tsx
// ============================================================
// WeekFlow Admin - Gestión y métricas de WeekFlow
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  Workflow,
  Loader2,
  Users,
  TrendingUp,
  MessageSquare,
  Heart,
  Calendar,
  Settings,
  Download,
  CheckCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Target,
  Zap,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

const ROWI_BLUE = "#31A2E3";
const ROWI_PURPLE = "#7A59C9";
const ROWI_PINK = "#D797CF";
const ROWI_TEAL = "#26A69A";

interface WeekFlowStats {
  totalSessions: number;
  activeUsers: number;
  totalContributions: number;
  moodCheckins: number;
  avgParticipation: number;
  completedFocus: number;
  consecutiveWeeks: number;
}

// Demo data
const DEMO_STATS: WeekFlowStats = {
  totalSessions: 156,
  activeUsers: 234,
  totalContributions: 1892,
  moodCheckins: 876,
  avgParticipation: 78.5,
  completedFocus: 432,
  consecutiveWeeks: 12,
};

const WEEKLY_PARTICIPATION = [
  { week: "S48", users: 180, contributions: 245, moods: 156 },
  { week: "S49", users: 195, contributions: 278, moods: 172 },
  { week: "S50", users: 210, contributions: 312, moods: 185 },
  { week: "S51", users: 198, contributions: 289, moods: 178 },
  { week: "S52", users: 225, contributions: 345, moods: 198 },
  { week: "S1", users: 234, contributions: 378, moods: 212 },
];

const CONTRIBUTION_TYPES = [
  { type: "Show & Tell", count: 456, color: ROWI_BLUE },
  { type: "To Discuss", count: 389, color: ROWI_PURPLE },
  { type: "Focus", count: 534, color: ROWI_TEAL },
  { type: "Tasks", count: 513, color: ROWI_PINK },
];

const MOOD_DISTRIBUTION = [
  { mood: "Motivado", count: 234, percentage: 27, color: "#66BB6A" },
  { mood: "Enfocado", count: 198, percentage: 23, color: ROWI_BLUE },
  { mood: "Tranquilo", count: 156, percentage: 18, color: ROWI_TEAL },
  { mood: "Energético", count: 134, percentage: 15, color: "#FFA726" },
  { mood: "Abrumado", count: 89, percentage: 10, color: "#E53935" },
  { mood: "Otros", count: 65, percentage: 7, color: "#9E9E9E" },
];

const TOP_PARTICIPANTS = [
  { name: "María López", contributions: 45, streak: 12, points: 890 },
  { name: "Juan García", contributions: 42, streak: 10, points: 820 },
  { name: "Ana Martínez", contributions: 38, streak: 12, points: 785 },
  { name: "Carlos Ruiz", contributions: 35, streak: 8, points: 720 },
  { name: "Sofia Herrera", contributions: 32, streak: 11, points: 695 },
];

export default function WeekFlowAdminPage() {
  const { locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WeekFlowStats>(DEMO_STATS);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const txt = {
    title: "WeekFlow",
    subtitle: locale === "en" ? "Weekly collaboration metrics and insights" : "Métricas e insights de colaboración semanal",
    loading: locale === "en" ? "Loading WeekFlow data..." : "Cargando datos de WeekFlow...",
    totalSessions: locale === "en" ? "Total Sessions" : "Sesiones Totales",
    activeUsers: locale === "en" ? "Active Users" : "Usuarios Activos",
    contributions: locale === "en" ? "Contributions" : "Contribuciones",
    moodCheckins: locale === "en" ? "Mood Check-ins" : "Check-ins de Ánimo",
    avgParticipation: locale === "en" ? "Avg. Participation" : "Participación Promedio",
    completedFocus: locale === "en" ? "Focus Completed" : "Focus Completados",
    consecutiveWeeks: locale === "en" ? "Consecutive Weeks" : "Semanas Consecutivas",
    weeklyTrend: locale === "en" ? "Weekly Participation" : "Participación Semanal",
    contributionTypes: locale === "en" ? "Contribution Types" : "Tipos de Contribución",
    moodDistribution: locale === "en" ? "Mood Distribution" : "Distribución de Ánimos",
    topParticipants: locale === "en" ? "Top Participants" : "Top Participantes",
    configuration: locale === "en" ? "Configuration" : "Configuración",
    export: locale === "en" ? "Export" : "Exportar",
    week: locale === "en" ? "Week" : "Semana",
    month: locale === "en" ? "Month" : "Mes",
    quarter: locale === "en" ? "Quarter" : "Trimestre",
    streak: locale === "en" ? "streak" : "racha",
    points: locale === "en" ? "points" : "puntos",
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  function handleExport() {
    const csvData = [
      ["Métrica", "Valor"],
      ["Sesiones Totales", stats.totalSessions],
      ["Usuarios Activos", stats.activeUsers],
      ["Contribuciones", stats.totalContributions],
      ["Mood Check-ins", stats.moodCheckins],
      ["Participación Promedio", `${stats.avgParticipation}%`],
      ["Focus Completados", stats.completedFocus],
      ["Semanas Consecutivas", stats.consecutiveWeeks],
    ];
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "weekflow_metrics.csv";
    link.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <Workflow className="w-16 h-16 text-violet-500 animate-pulse" />
          <span>{txt.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <Workflow className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{txt.title}</h1>
            <p className="text-gray-400 text-sm">{txt.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="week">{txt.week}</option>
            <option value="month">{txt.month}</option>
            <option value="quarter">{txt.quarter}</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors text-white text-sm"
          >
            <Download className="w-4 h-4" />
            {txt.export}
          </button>
          <a
            href="/hub/admin/weekflow/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-colors text-white text-sm"
          >
            <Settings className="w-4 h-4" />
            {txt.configuration}
          </a>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-2xl border border-violet-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <Calendar className="w-5 h-5 text-violet-400" />
            </div>
            <span className="flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight className="w-3 h-3" />
              +8%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
          <p className="text-sm text-gray-400">{txt.totalSessions}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-2xl border border-blue-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight className="w-3 h-3" />
              +15%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
          <p className="text-sm text-gray-400">{txt.activeUsers}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 rounded-2xl border border-emerald-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight className="w-3 h-3" />
              +22%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalContributions.toLocaleString()}</p>
          <p className="text-sm text-gray-400">{txt.contributions}</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500/10 to-rose-600/10 rounded-2xl border border-pink-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-pink-500/20">
              <Heart className="w-5 h-5 text-pink-400" />
            </div>
            <span className="flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight className="w-3 h-3" />
              +18%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.moodCheckins}</p>
          <p className="text-sm text-gray-400">{txt.moodCheckins}</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-violet-400" />
            <span className="text-gray-400">{txt.avgParticipation}</span>
          </div>
          <p className="text-4xl font-bold text-white">{stats.avgParticipation}%</p>
          <div className="h-2 bg-gray-700 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
              style={{ width: `${stats.avgParticipation}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-gray-400">{txt.completedFocus}</span>
          </div>
          <p className="text-4xl font-bold text-white">{stats.completedFocus}</p>
        </div>

        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-gray-400">{txt.consecutiveWeeks}</span>
          </div>
          <p className="text-4xl font-bold text-white">{stats.consecutiveWeeks} <span className="text-lg text-gray-400">{txt.week}s</span></p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Participation */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            {txt.weeklyTrend}
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_PARTICIPATION}>
                <defs>
                  <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ROWI_BLUE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ROWI_BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17,24,39,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <Area type="monotone" dataKey="users" stroke={ROWI_BLUE} fill="url(#usersGrad)" strokeWidth={2} />
                <Line type="monotone" dataKey="contributions" stroke={ROWI_PURPLE} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contribution Types */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-400" />
            {txt.contributionTypes}
          </h3>
          <div className="space-y-4">
            {CONTRIBUTION_TYPES.map((type) => (
              <div key={type.type}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                    <span className="text-sm text-gray-300">{type.type}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{type.count}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(type.count / 600) * 100}%`, backgroundColor: type.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-pink-400" />
            {txt.moodDistribution}
          </h3>
          <div className="space-y-3">
            {MOOD_DISTRIBUTION.map((mood) => (
              <div key={mood.mood}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mood.color }} />
                    <span className="text-sm text-gray-300">{mood.mood}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{mood.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${mood.percentage}%`, backgroundColor: mood.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Participants */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            {txt.topParticipants}
          </h3>
          <div className="space-y-3">
            {TOP_PARTICIPANTS.map((user, idx) => (
              <div key={user.name} className="flex items-center gap-4 p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.contributions} {txt.contributions} • {user.streak} {txt.week}s {txt.streak}</p>
                </div>
                <span className="text-amber-400 font-semibold">{user.points} {txt.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
