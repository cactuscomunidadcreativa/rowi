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
        <div className="flex flex-col items-center gap-4 text-[var(--rowi-muted)]">
          <CheckSquare className="w-16 h-16 text-[var(--rowi-primary)] animate-pulse" />
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
          <div className="p-3 rounded-2xl bg-[var(--rowi-primary)]/20">
            <CheckSquare className="w-7 h-7 text-[var(--rowi-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--rowi-foreground)]">{txt.title}</h1>
            <p className="text-[var(--rowi-muted)] text-sm">{txt.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-surface)] text-[var(--rowi-foreground)] text-sm focus:border-[var(--rowi-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20"
          >
            <option value="week">{txt.week}</option>
            <option value="month">{txt.month}</option>
            <option value="quarter">{txt.quarter}</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] hover:opacity-90 transition-colors text-white text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            {txt.export}
          </button>
          <a
            href="/hub/admin/tasks/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-surface)] hover:bg-[var(--rowi-background)] transition-colors text-[var(--rowi-foreground)] text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            {txt.configuration}
          </a>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-primary)]/10">
              <CheckSquare className="w-5 h-5 text-[var(--rowi-primary)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-success)] bg-[var(--rowi-success)]/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +12%
            </span>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats.totalTasks.toLocaleString()}</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.totalTasks}</p>
        </div>

        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-success)]/10">
              <CheckCircle className="w-5 h-5 text-[var(--rowi-success)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-success)] bg-[var(--rowi-success)]/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +8%
            </span>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats.completedTasks.toLocaleString()}</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.completed}</p>
        </div>

        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-warning)]/10">
              <Clock className="w-5 h-5 text-[var(--rowi-warning)]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats.pendingTasks.toLocaleString()}</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.pending}</p>
        </div>

        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-[var(--rowi-error)]/10">
              <AlertTriangle className="w-5 h-5 text-[var(--rowi-error)]" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--rowi-error)] bg-[var(--rowi-error)]/10 px-2 py-0.5 rounded-full">
              <ArrowDownRight className="w-3 h-3" />
              -5%
            </span>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats.overdueTasks}</p>
          <p className="text-sm text-[var(--rowi-muted)]">{txt.overdue}</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[var(--rowi-secondary)]/10">
              <Target className="w-5 h-5 text-[var(--rowi-secondary)]" />
            </div>
            <span className="text-[var(--rowi-muted)]">{txt.completionRate}</span>
          </div>
          <p className="text-4xl font-bold text-[var(--rowi-foreground)]">{stats.completionRate}%</p>
          <div className="h-2.5 bg-[var(--rowi-border)] rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--rowi-secondary)] to-[var(--rowi-primary)] rounded-full"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[var(--rowi-primary)]/10">
              <Clock className="w-5 h-5 text-[var(--rowi-primary)]" />
            </div>
            <span className="text-[var(--rowi-muted)]">{txt.avgTime}</span>
          </div>
          <p className="text-4xl font-bold text-[var(--rowi-foreground)]">{stats.avgCompletionTime} <span className="text-lg text-[var(--rowi-muted)]">{txt.days}</span></p>
        </div>

        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[var(--rowi-success)]/10">
              <Users className="w-5 h-5 text-[var(--rowi-success)]" />
            </div>
            <span className="text-[var(--rowi-muted)]">{txt.activeUsers}</span>
          </div>
          <p className="text-4xl font-bold text-[var(--rowi-foreground)]">{stats.activeUsers}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--rowi-primary)]/10">
              <TrendingUp className="w-5 h-5 text-[var(--rowi-primary)]" />
            </div>
            {txt.weeklyTrend}
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rowi-border)" />
                <XAxis dataKey="week" tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
                  }}
                />
                <Bar dataKey="created" fill={ROWI_BLUE} radius={[6, 6, 0, 0]} name={txt.created} />
                <Bar dataKey="completed" fill={ROWI_TEAL} radius={[6, 6, 0, 0]} name={txt.completed} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotional Insights */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--rowi-secondary)]/10">
              <Brain className="w-5 h-5 text-[var(--rowi-secondary)]" />
            </div>
            {txt.emotionalInsights}
          </h3>
          <div className="space-y-5">
            {EMOTIONAL_INSIGHTS.map((insight) => (
              <div key={insight.emotion}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--rowi-foreground)]">{insight.emotion}</span>
                  <span className="text-sm font-semibold text-[var(--rowi-foreground)]">{insight.count} {txt.tasks}</span>
                </div>
                <div className="h-2.5 bg-[var(--rowi-border)] rounded-full overflow-hidden">
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
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--rowi-warning)]/10">
              <BarChart3 className="w-5 h-5 text-[var(--rowi-warning)]" />
            </div>
            {txt.priorityDist}
          </h3>
          <div className="space-y-5">
            {PRIORITY_DIST.map((priority) => (
              <div key={priority.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: priority.color }} />
                    <span className="text-sm font-medium text-[var(--rowi-foreground)]">{priority.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--rowi-foreground)]">{priority.value}%</span>
                </div>
                <div className="h-2.5 bg-[var(--rowi-border)] rounded-full overflow-hidden">
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
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--rowi-success)]/10">
              <Users className="w-5 h-5 text-[var(--rowi-success)]" />
            </div>
            {txt.topContributors}
          </h3>
          <div className="space-y-3">
            {TOP_CONTRIBUTORS.map((user, idx) => (
              <div key={user.name} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--rowi-background)] hover:bg-[var(--rowi-border)] transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--rowi-foreground)]">{user.name}</p>
                  <p className="text-xs text-[var(--rowi-muted)]">{user.completed}/{user.tasks} {txt.tasks}</p>
                </div>
                <span className="text-[var(--rowi-success)] font-bold bg-[var(--rowi-success)]/10 px-2.5 py-1 rounded-lg">{user.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
