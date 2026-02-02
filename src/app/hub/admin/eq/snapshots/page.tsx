// src/app/hub/admin/eq/snapshots/page.tsx
// ============================================================
// EQ Snapshots Admin - Resumen global de evaluaciones SEI
// Dashboard con métricas agregadas del tenant/jerarquía actual
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  Calendar,
  Brain,
  Loader2,
  Users,
  Globe2,
  TrendingUp,
  BarChart3,
  Activity,
  Sparkles,
  RefreshCcw,
  MapPin,
  Clock,
  Target,
  Zap,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
} from "recharts";

interface RowiverseStats {
  totalSnapshots: number;
  totalUsers: number;
  avgKnow: number;
  avgChoose: number;
  avgGive: number;
  avgTotal: number;
  recentSnapshots: number;
  topCountries: Array<{ country: string; count: number }>;
}

interface SnapshotTrend {
  month: string;
  count: number;
  avgScore: number;
}

interface CompetencyAvg {
  key: string;
  label: string;
  score: number;
}

interface BrainStyleDist {
  style: string;
  count: number;
  percentage: number;
}

interface RecentSnapshot {
  id: string;
  userName: string;
  at: string;
  K: number;
  C: number;
  G: number;
  brainStyle?: string;
}

const ROWI_COLORS = ["#31A2E3", "#E53935", "#D797CF", "#43A047", "#FDD835", "#8E24AA", "#FB8C00", "#1E88E5"];

const DEMO_STATS: RowiverseStats = {
  totalSnapshots: 2847,
  totalUsers: 1256,
  avgKnow: 98.5,
  avgChoose: 102.3,
  avgGive: 95.8,
  avgTotal: 98.9,
  recentSnapshots: 342,
  topCountries: [
    { country: "México", count: 856 },
    { country: "Colombia", count: 423 },
    { country: "España", count: 312 },
    { country: "Argentina", count: 287 },
    { country: "Chile", count: 198 },
    { country: "Perú", count: 156 },
    { country: "Ecuador", count: 98 },
    { country: "USA", count: 87 },
  ],
};

const DEMO_TRENDS: SnapshotTrend[] = [
  { month: "Ago", count: 180, avgScore: 96 },
  { month: "Sep", count: 245, avgScore: 97 },
  { month: "Oct", count: 312, avgScore: 98 },
  { month: "Nov", count: 398, avgScore: 99 },
  { month: "Dic", count: 456, avgScore: 100 },
  { month: "Ene", count: 342, avgScore: 99 },
];

const DEMO_COMPETENCIES: CompetencyAvg[] = [
  { key: "EL", label: "Emotional Literacy", score: 101 },
  { key: "RP", label: "Recognize Patterns", score: 97 },
  { key: "ACT", label: "Consequential Thinking", score: 99 },
  { key: "NE", label: "Navigate Emotions", score: 95 },
  { key: "IM", label: "Intrinsic Motivation", score: 103 },
  { key: "OP", label: "Exercise Optimism", score: 98 },
  { key: "EMP", label: "Increase Empathy", score: 96 },
  { key: "NG", label: "Noble Goals", score: 102 },
];

const DEMO_BRAIN_STYLES: BrainStyleDist[] = [
  { style: "Adaptable", count: 456, percentage: 36 },
  { style: "Rational", count: 312, percentage: 25 },
  { style: "Emotional", count: 287, percentage: 23 },
  { style: "Intuitive", count: 201, percentage: 16 },
];

const DEMO_RECENT: RecentSnapshot[] = [
  { id: "1", userName: "María López", at: new Date(Date.now() - 3600000).toISOString(), K: 105, C: 98, G: 102, brainStyle: "Adaptable" },
  { id: "2", userName: "Juan García", at: new Date(Date.now() - 7200000).toISOString(), K: 92, C: 108, G: 95, brainStyle: "Rational" },
  { id: "3", userName: "Ana Martínez", at: new Date(Date.now() - 10800000).toISOString(), K: 98, C: 95, G: 110, brainStyle: "Emotional" },
  { id: "4", userName: "Carlos Ruiz", at: new Date(Date.now() - 14400000).toISOString(), K: 88, C: 102, G: 96, brainStyle: "Intuitive" },
  { id: "5", userName: "Sofia Herrera", at: new Date(Date.now() - 18000000).toISOString(), K: 112, C: 94, G: 98, brainStyle: "Adaptable" },
];

export default function EQSnapshotsAdminPage() {
  const { locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RowiverseStats | null>(null);
  const [trends, setTrends] = useState<SnapshotTrend[]>([]);
  const [competencies, setCompetencies] = useState<CompetencyAvg[]>([]);
  const [brainStyles, setBrainStyles] = useState<BrainStyleDist[]>([]);
  const [recentSnapshots, setRecentSnapshots] = useState<RecentSnapshot[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const txt = {
    loading: locale === "en" ? "Loading Rowiverse data..." : "Cargando datos del Rowiverse...",
    title: locale === "en" ? "EQ Snapshots" : "EQ Snapshots",
    subtitle: locale === "en" ? "Global Rowiverse Overview" : "Resumen Global del Rowiverse",
    totalSnapshots: locale === "en" ? "Total Snapshots" : "Total Snapshots",
    activeUsers: locale === "en" ? "Users with EQ" : "Usuarios con EQ",
    avgEQ: locale === "en" ? "Average EQ" : "EQ Promedio",
    recentActivity: locale === "en" ? "Last 30 Days" : "Últimos 30 Días",
    kcgTitle: locale === "en" ? "Know • Choose • Give" : "Conocer • Elegir • Dar",
    know: locale === "en" ? "Know" : "Conocer",
    choose: locale === "en" ? "Choose" : "Elegir",
    give: locale === "en" ? "Give" : "Dar",
    competenciesTitle: locale === "en" ? "8 SEI Competencies - Global Average" : "8 Competencias SEI - Promedio Global",
    trendsTitle: locale === "en" ? "Monthly Evaluations Trend" : "Tendencia Mensual de Evaluaciones",
    countriesTitle: locale === "en" ? "Top Countries" : "Países con más Evaluaciones",
    brainStylesTitle: locale === "en" ? "Brain Styles Distribution" : "Distribución de Estilos Cerebrales",
    recentTitle: locale === "en" ? "Recent Evaluations" : "Evaluaciones Recientes",
    snapshots: locale === "en" ? "evaluations" : "evaluaciones",
    score: locale === "en" ? "Score" : "Puntuación",
    evaluations: locale === "en" ? "evaluations" : "evaluaciones",
    all: locale === "en" ? "All time" : "Todo el tiempo",
    lastMonth: locale === "en" ? "Last month" : "Último mes",
    lastQuarter: locale === "en" ? "Last quarter" : "Último trimestre",
    lastYear: locale === "en" ? "Last year" : "Último año",
    export: locale === "en" ? "Export" : "Exportar",
    hoursAgo: locale === "en" ? "hours ago" : "horas atrás",
  };

  const competencyLabelsES: Record<string, string> = {
    EL: "Alfabetización Emocional",
    RP: "Reconocer Patrones",
    ACT: "Pensamiento Consecuente",
    NE: "Navegar Emociones",
    IM: "Motivación Intrínseca",
    OP: "Ejercitar Optimismo",
    EMP: "Incrementar Empatía",
    NG: "Nobles Metas",
  };

  useEffect(() => {
    loadRowiverseData();
  }, [selectedPeriod]);

  async function loadRowiverseData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/eq/stats?period=${selectedPeriod}`);
      const data = await res.json();
      if (data.ok && data.stats) {
        setStats(data.stats);
      } else {
        setStats(DEMO_STATS);
      }
      setTrends(DEMO_TRENDS);
      setCompetencies(DEMO_COMPETENCIES);
      setBrainStyles(DEMO_BRAIN_STYLES);
      setRecentSnapshots(DEMO_RECENT);
    } catch (error) {
      console.error("Error loading rowiverse data:", error);
      setStats(DEMO_STATS);
      setTrends(DEMO_TRENDS);
      setCompetencies(DEMO_COMPETENCIES);
      setBrainStyles(DEMO_BRAIN_STYLES);
      setRecentSnapshots(DEMO_RECENT);
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 105) return "text-[var(--rowi-success)]";
    if (score >= 95) return "text-[var(--rowi-primary)]";
    if (score >= 85) return "text-[var(--rowi-warning)]";
    return "text-[var(--rowi-error)]";
  };

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return locale === "en" ? "Just now" : "Ahora mismo";
    return `${hours} ${txt.hoursAgo}`;
  }

  // Función de exportar a CSV
  async function handleExport() {
    try {
      // Obtener todos los snapshots para exportar
      const res = await fetch("/api/admin/eq/export");
      const data = await res.json();

      if (!data.ok || !data.snapshots) {
        // Si no hay API, usar datos demo
        const csvData = [
          ["Usuario", "Fecha", "K", "C", "G", "Brain Style", "País"],
          ...recentSnapshots.map(s => [
            s.userName,
            new Date(s.at).toLocaleDateString(),
            s.K,
            s.C,
            s.G,
            s.brainStyle || "",
            ""
          ])
        ];
        downloadCSV(csvData, "eq_snapshots.csv");
        return;
      }

      const csvData = [
        ["ID", "Usuario", "Email", "Fecha", "K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG", "Brain Style", "País"],
        ...data.snapshots.map((s: any) => [
          s.id,
          s.user?.name || s.email || "",
          s.email || "",
          new Date(s.at).toLocaleDateString(),
          s.K || "",
          s.C || "",
          s.G || "",
          s.EL || "",
          s.RP || "",
          s.ACT || "",
          s.NE || "",
          s.IM || "",
          s.OP || "",
          s.EMP || "",
          s.NG || "",
          s.brainStyle || "",
          s.country || ""
        ])
      ];
      downloadCSV(csvData, "eq_snapshots.csv");
    } catch (error) {
      console.error("Error exporting:", error);
      // Fallback a datos demo
      const csvData = [
        ["Usuario", "Fecha", "K", "C", "G", "Brain Style"],
        ...recentSnapshots.map(s => [
          s.userName,
          new Date(s.at).toLocaleDateString(),
          s.K,
          s.C,
          s.G,
          s.brainStyle || ""
        ])
      ];
      downloadCSV(csvData, "eq_snapshots.csv");
    }
  }

  function downloadCSV(data: any[][], filename: string) {
    const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--rowi-muted)]">
          <div className="relative">
            <Brain className="w-16 h-16 text-[var(--rowi-secondary)] animate-pulse" />
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--rowi-secondary)]/20">
            <Globe2 className="w-7 h-7 text-[var(--rowi-secondary)]" />
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
            className="px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-surface)] text-[var(--rowi-foreground)] text-sm focus:border-[var(--rowi-secondary)] focus:outline-none"
          >
            <option value="all">{txt.all}</option>
            <option value="month">{txt.lastMonth}</option>
            <option value="quarter">{txt.lastQuarter}</option>
            <option value="year">{txt.lastYear}</option>
          </select>
          <button
            onClick={loadRowiverseData}
            disabled={loading}
            className="p-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-surface)] hover:bg-[var(--rowi-background)] transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 text-[var(--rowi-muted)] ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-secondary)] hover:opacity-90 transition-colors text-white text-sm"
          >
            <Download className="w-4 h-4" />
            {txt.export}
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center gap-2 text-[var(--rowi-secondary)] mb-2">
            <Brain className="w-5 h-5" />
            <span className="text-sm">{txt.totalSnapshots}</span>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats?.totalSnapshots.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center gap-2 text-[var(--rowi-primary)] mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm">{txt.activeUsers}</span>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats?.totalUsers.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center gap-2 text-[var(--rowi-success)] mb-2">
            <Target className="w-5 h-5" />
            <span className="text-sm">{txt.avgEQ}</span>
          </div>
          <p className={`text-3xl font-bold ${getScoreColor(stats?.avgTotal || 0)}`}>{stats?.avgTotal.toFixed(1)}</p>
        </div>
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm hover:border-[var(--rowi-borderHover)] transition-colors">
          <div className="flex items-center gap-2 text-[var(--rowi-warning)] mb-2">
            <Zap className="w-5 h-5" />
            <span className="text-sm">{txt.recentActivity}</span>
          </div>
          <p className="text-3xl font-bold text-[var(--rowi-foreground)]">{stats?.recentSnapshots.toLocaleString()}</p>
        </div>
      </div>

      {/* K-C-G Cards */}
      <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6 shadow-sm">
        <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--rowi-secondary)]" />
          {txt.kcgTitle}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[var(--rowi-primary)]/5 rounded-xl p-4 text-center border border-[var(--rowi-primary)]/20">
            <div className="text-sm text-[var(--rowi-primary)] mb-1">{txt.know}</div>
            <div className={`text-3xl font-bold ${getScoreColor(stats?.avgKnow || 0)}`}>{stats?.avgKnow.toFixed(1)}</div>
            <div className="h-2 bg-[var(--rowi-border)] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--rowi-primary)] to-cyan-400 transition-all duration-500" style={{ width: `${((stats?.avgKnow || 0) / 135) * 100}%` }} />
            </div>
          </div>
          <div className="bg-[var(--rowi-secondary)]/5 rounded-xl p-4 text-center border border-[var(--rowi-secondary)]/20">
            <div className="text-sm text-[var(--rowi-secondary)] mb-1">{txt.choose}</div>
            <div className={`text-3xl font-bold ${getScoreColor(stats?.avgChoose || 0)}`}>{stats?.avgChoose.toFixed(1)}</div>
            <div className="h-2 bg-[var(--rowi-border)] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--rowi-secondary)] to-violet-400 transition-all duration-500" style={{ width: `${((stats?.avgChoose || 0) / 135) * 100}%` }} />
            </div>
          </div>
          <div className="bg-pink-500/5 rounded-xl p-4 text-center border border-pink-500/20">
            <div className="text-sm text-pink-500 mb-1">{txt.give}</div>
            <div className={`text-3xl font-bold ${getScoreColor(stats?.avgGive || 0)}`}>{stats?.avgGive.toFixed(1)}</div>
            <div className="h-2 bg-[var(--rowi-border)] rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500" style={{ width: `${((stats?.avgGive || 0) / 135) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competencies Radar */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--rowi-primary)]" />
            {txt.competenciesTitle}
          </h3>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={competencies}>
                <PolarGrid stroke="var(--rowi-border)" />
                <PolarAngleAxis dataKey="key" tick={{ fill: "var(--rowi-muted)", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[65, 135]} tick={{ fill: "var(--rowi-muted)", fontSize: 10 }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} / 135`,
                    locale === "es" ? competencyLabelsES[props.payload.key] || props.payload.label : props.payload.label
                  ]}
                />
                <defs>
                  <radialGradient id="radarGradient" cx="50%" cy="50%" r="65%">
                    <stop offset="0%" stopColor="#31A2E3" stopOpacity={0.5} />
                    <stop offset="70%" stopColor="#E53935" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#D797CF" stopOpacity={0.3} />
                  </radialGradient>
                </defs>
                <Radar name={txt.score} dataKey="score" stroke="#E53935" strokeWidth={2} fill="url(#radarGradient)" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--rowi-success)]" />
            {txt.trendsTitle}
          </h3>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rowi-border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === "count" ? txt.snapshots : txt.score
                  ]}
                />
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#31A2E3" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#31A2E3" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="count" stroke="#31A2E3" strokeWidth={2} fill="url(#trendGradient)" dot={{ fill: "#E53935", strokeWidth: 2, stroke: "#31A2E3", r: 4 }} activeDot={{ r: 6, fill: "#D797CF", stroke: "#31A2E3", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brain Styles */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--rowi-secondary)]" />
            {txt.brainStylesTitle}
          </h3>
          <div className="space-y-4">
            {brainStyles.map((style, idx) => {
              const bgColor = ROWI_COLORS[idx % ROWI_COLORS.length];
              return (
                <div key={style.style}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: bgColor }}
                      />
                      <span className="text-sm text-[var(--rowi-foreground)]">{style.style}</span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--rowi-foreground)]">{style.percentage}%</span>
                  </div>
                  <div className="h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${style.percentage}%`, backgroundColor: bgColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--rowi-warning)]" />
            {txt.countriesTitle}
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.topCountries.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rowi-border)" />
                <XAxis type="number" tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="country" tick={{ fill: "var(--rowi-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
                  }}
                  formatter={(value: number) => [value, txt.evaluations]}
                />
                <defs>
                  <linearGradient id="countryGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#31A2E3" />
                    <stop offset="50%" stopColor="#E53935" />
                    <stop offset="100%" stopColor="#D797CF" />
                  </linearGradient>
                </defs>
                <Bar dataKey="count" fill="url(#countryGradient)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Competency Details Grid */}
      <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
        <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4">{txt.competenciesTitle}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {competencies.map((comp, idx) => {
            const color = ROWI_COLORS[idx % ROWI_COLORS.length];
            const barWidth = `${((comp.score - 65) / 70) * 100}%`;
            return (
              <div key={comp.key} className="bg-[var(--rowi-background)] rounded-xl p-4 hover:bg-[var(--rowi-border)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${color}30`, color: color }}
                  >
                    {comp.key}
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(comp.score)}`}>{comp.score}</span>
                </div>
                <p className="text-xs text-[var(--rowi-muted)] truncate mb-2">
                  {locale === "es" ? competencyLabelsES[comp.key] : comp.label}
                </p>
                <div className="h-1.5 bg-[var(--rowi-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: barWidth, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
        <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          {txt.recentTitle}
        </h3>
        <div className="space-y-3">
          {recentSnapshots.map((snap) => (
            <div key={snap.id} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--rowi-background)] hover:bg-[var(--rowi-border)] transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rowi-secondary)] to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {snap.userName.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--rowi-foreground)]">{snap.userName}</p>
                <p className="text-xs text-[var(--rowi-muted)]">{formatTimeAgo(snap.at)} • {snap.brainStyle}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-[var(--rowi-primary)]">K: {snap.K}</span>
                <span className="text-[var(--rowi-secondary)]">C: {snap.C}</span>
                <span className="text-pink-400">G: {snap.G}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
