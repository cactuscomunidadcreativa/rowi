// src/app/hub/admin/tasks/page.tsx
// ============================================================
// Tasks Admin - Gestión y métricas de tareas ROWI
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  CheckSquare,
  Loader2,
  Users,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Settings,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Brain,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const ROWI_BLUE = "#31A2E3";
const ROWI_PURPLE = "#7A59C9";
const ROWI_PINK = "#D797CF";
const ROWI_TEAL = "#26A69A";

interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  activeUsers: number;
}

// Demo data
const DEMO_STATS: TaskStats = {
  totalTasks: 1456,
  completedTasks: 987,
  pendingTasks: 412,
  overdueTasks: 57,
  completionRate: 67.8,
  avgCompletionTime: 2.4,
  activeUsers: 234,
};

const WEEKLY_TREND = [
  { week: "S1", created: 45, completed: 38 },
  { week: "S2", created: 52, completed: 48 },
  { week: "S3", created: 48, completed: 42 },
  { week: "S4", created: 61, completed: 55 },
];

const PRIORITY_DIST = [
  { name: "Alta", value: 25, color: "#E53935" },
  { name: "Media", value: 45, color: "#FFA726" },
  { name: "Baja", value: 30, color: "#66BB6A" },
];

const TOP_CONTRIBUTORS = [
  { name: "María López", tasks: 45, completed: 42, rate: 93 },
  { name: "Juan García", tasks: 38, completed: 32, rate: 84 },
  { name: "Ana Martínez", tasks: 35, completed: 30, rate: 86 },
  { name: "Carlos Ruiz", tasks: 32, completed: 28, rate: 88 },
  { name: "Sofia Herrera", tasks: 28, completed: 25, rate: 89 },
];

const EMOTIONAL_INSIGHTS = [
  { emotion: "Motivado", count: 156, color: "#66BB6A" },
  { emotion: "Enfocado", count: 134, color: ROWI_BLUE },
  { emotion: "Abrumado", count: 45, color: "#FFA726" },
  { emotion: "Bloqueado", count: 23, color: "#E53935" },
];

export default function TasksAdminPage() {
  const { locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TaskStats>(DEMO_STATS);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const txt = {
    title: locale === "en" ? "Tasks Management" : "Gestión de Tareas",
    subtitle: locale === "en" ? "Task metrics and emotional insights" : "Métricas de tareas e insights emocionales",
    loading: locale === "en" ? "Loading task data..." : "Cargando datos de tareas...",
    totalTasks: locale === "en" ? "Total Tasks" : "Total Tareas",
    completed: locale === "en" ? "Completed" : "Completadas",
    pending: locale === "en" ? "Pending" : "Pendientes",
    overdue: locale === "en" ? "Overdue" : "Vencidas",
    completionRate: locale === "en" ? "Completion Rate" : "Tasa de Completado",
    avgTime: locale === "en" ? "Avg. Completion Time" : "Tiempo Promedio",
    activeUsers: locale === "en" ? "Active Users" : "Usuarios Activos",
    weeklyTrend: locale === "en" ? "Weekly Trend" : "Tendencia Semanal",
    priorityDist: locale === "en" ? "Priority Distribution" : "Distribución por Prioridad",
    topContributors: locale === "en" ? "Top Contributors" : "Principales Contribuidores",
    emotionalInsights: locale === "en" ? "Emotional Insights" : "Insights Emocionales",
    configuration: locale === "en" ? "Configuration" : "Configuración",
    export: locale === "en" ? "Export" : "Exportar",
    days: locale === "en" ? "days" : "días",
    tasks: locale === "en" ? "tasks" : "tareas",
    week: locale === "en" ? "Week" : "Semana",
    month: locale === "en" ? "Month" : "Mes",
    quarter: locale === "en" ? "Quarter" : "Trimestre",
    created: locale === "en" ? "Created" : "Creadas",
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  function handleExport() {
    const csvData = [
      ["Métrica", "Valor"],
      ["Total Tareas", stats.totalTasks],
      ["Completadas", stats.completedTasks],
      ["Pendientes", stats.pendingTasks],
      ["Vencidas", stats.overdueTasks],
      ["Tasa Completado", `${stats.completionRate}%`],
      ["Tiempo Promedio", `${stats.avgCompletionTime} días`],
      ["Usuarios Activos", stats.activeUsers],
    ];
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tasks_metrics.csv";
    link.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <CheckSquare className="w-16 h-16 text-blue-500 animate-pulse" />
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
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <CheckSquare className="w-7 h-7 text-blue-400" />
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
            className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="week">{txt.week}</option>
            <option value="month">{txt.month}</option>
            <option value="quarter">{txt.quarter}</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm"
          >
            <Download className="w-4 h-4" />
            {txt.export}
          </button>
          <a
            href="/hub/admin/tasks/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-colors text-white text-sm"
          >
            <Settings className="w-4 h-4" />
            {txt.configuration}
          </a>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-2xl border border-blue-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <CheckSquare className="w-5 h-5 text-blue-400" />
            </div>
            <span className="flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight className="w-3 h-3" />
              +12%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalTasks.toLocaleString()}</p>
          <p className="text-sm text-gray-400">{txt.totalTasks}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 rounded-2xl border border-emerald-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="flex items-center gap-1 text-xs text-green-400">
              <ArrowUpRight className="w-3 h-3" />
              +8%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completedTasks.toLocaleString()}</p>
          <p className="text-sm text-gray-400">{txt.completed}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-2xl border border-amber-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pendingTasks.toLocaleString()}</p>
          <p className="text-sm text-gray-400">{txt.pending}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-rose-600/10 rounded-2xl border border-red-500/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="flex items-center gap-1 text-xs text-red-400">
              <ArrowDownRight className="w-3 h-3" />
              -5%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.overdueTasks}</p>
          <p className="text-sm text-gray-400">{txt.overdue}</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-violet-400" />
            <span className="text-gray-400">{txt.completionRate}</span>
          </div>
          <p className="text-4xl font-bold text-white">{stats.completionRate}%</p>
          <div className="h-2 bg-gray-700 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400">{txt.avgTime}</span>
          </div>
          <p className="text-4xl font-bold text-white">{stats.avgCompletionTime} <span className="text-lg text-gray-400">{txt.days}</span></p>
        </div>

        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-gray-400">{txt.activeUsers}</span>
          </div>
          <p className="text-4xl font-bold text-white">{stats.activeUsers}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            {txt.weeklyTrend}
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_TREND}>
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
                <Bar dataKey="created" fill={ROWI_BLUE} radius={[4, 4, 0, 0]} name={txt.created} />
                <Bar dataKey="completed" fill={ROWI_TEAL} radius={[4, 4, 0, 0]} name={txt.completed} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotional Insights */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            {txt.emotionalInsights}
          </h3>
          <div className="space-y-4">
            {EMOTIONAL_INSIGHTS.map((insight) => (
              <div key={insight.emotion}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{insight.emotion}</span>
                  <span className="text-sm font-semibold text-white">{insight.count} {txt.tasks}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(insight.count / 200) * 100}%`, backgroundColor: insight.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            {txt.priorityDist}
          </h3>
          <div className="space-y-4">
            {PRIORITY_DIST.map((priority) => (
              <div key={priority.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: priority.color }} />
                    <span className="text-sm text-gray-300">{priority.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{priority.value}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${priority.value}%`, backgroundColor: priority.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            {txt.topContributors}
          </h3>
          <div className="space-y-3">
            {TOP_CONTRIBUTORS.map((user, idx) => (
              <div key={user.name} className="flex items-center gap-4 p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.completed}/{user.tasks} {txt.tasks}</p>
                </div>
                <span className="text-emerald-400 font-semibold">{user.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
