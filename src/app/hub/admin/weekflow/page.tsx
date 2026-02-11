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
  Brain,
  Target,
  Zap,
  BarChart3,
} from "lucide-react";

const ROWI_BLUE = "#31A2E3";
const ROWI_PURPLE = "#7A59C9";
const ROWI_TEAL = "#26A69A";

interface MetricsData {
  summary: {
    totalCheckins: number;
    totalContributions: number;
    totalTasks: number;
    completedTasks: number;
    participationRate: number;
    taskCompletionRate: number;
    consecutiveWeeks: number;
  };
  teamPulse: {
    dominantEmotion: string | null;
    avgIntensity: number;
    emotionDistribution: { emotion: string; count: number; percentage: number }[];
    totalResponses: number;
  };
  contributions: {
    byType: Record<string, number>;
    total: number;
  };
  sessions: {
    count: number;
    withFullParticipation: number;
  };
}

interface HubOption {
  id: string;
  name: string;
}

export default function WeekFlowAdminPage() {
  const { locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [hubs, setHubs] = useState<HubOption[]>([]);
  const [selectedHub, setSelectedHub] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState("MONTHLY");

  const txt = {
    title: "WeekFlow",
    subtitle: locale === "en" ? "Weekly collaboration metrics and insights" : "Métricas e insights de colaboración semanal",
    loading: locale === "en" ? "Loading WeekFlow data..." : "Cargando datos de WeekFlow...",
    noHubs: locale === "en" ? "No WeekFlow spaces configured" : "No hay espacios WeekFlow configurados",
    noHubsDesc: locale === "en" ? "Create a WeekFlow space from your community" : "Crea un espacio WeekFlow desde tu comunidad",
    totalSessions: locale === "en" ? "Sessions" : "Sesiones",
    totalCheckins: locale === "en" ? "Mood Check-ins" : "Check-ins de Ánimo",
    contributions: locale === "en" ? "Contributions" : "Contribuciones",
    tasks: locale === "en" ? "Tasks" : "Tareas",
    participation: locale === "en" ? "Participation" : "Participación",
    taskCompletion: locale === "en" ? "Task Completion" : "Tareas Completadas",
    consecutiveWeeks: locale === "en" ? "Consecutive Weeks" : "Semanas Consecutivas",
    contributionTypes: locale === "en" ? "Contribution Types" : "Tipos de Contribución",
    moodDistribution: locale === "en" ? "Team Pulse" : "Pulso del Equipo",
    dominantEmotion: locale === "en" ? "Dominant Emotion" : "Emoción Dominante",
    configuration: locale === "en" ? "Configuration" : "Configuración",
    export: locale === "en" ? "Export" : "Exportar",
    weekly: locale === "en" ? "Week" : "Semana",
    monthly: locale === "en" ? "Month" : "Mes",
    quarterly: locale === "en" ? "Quarter" : "Trimestre",
    showTell: "Show & Tell",
    toDiscuss: locale === "en" ? "To Discuss" : "Para Discutir",
    focus: locale === "en" ? "Focus" : "Mi Foco",
    noData: locale === "en" ? "No data for this period" : "Sin datos para este periodo",
    selectHub: locale === "en" ? "Select community" : "Seleccionar comunidad",
  };

  // Cargar hubs disponibles
  useEffect(() => {
    async function loadHubs() {
      try {
        const res = await fetch("/api/hubs/my");
        const data = await res.json();
        if (data.ok && data.hubs?.length > 0) {
          const hubList = data.hubs.map((h: any) => ({ id: h.id, name: h.name }));
          setHubs(hubList);
          setSelectedHub(hubList[0].id);
        }
      } catch (err) {
        console.error("Error loading hubs:", err);
      }
    }
    loadHubs();
  }, []);

  // Cargar métricas cuando cambia hub o periodo
  useEffect(() => {
    if (!selectedHub) {
      setLoading(false);
      return;
    }
    loadMetrics();
  }, [selectedHub, selectedPeriod]);

  async function loadMetrics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekflow/metrics?hubId=${selectedHub}&period=${selectedPeriod}`);
      const data = await res.json();
      if (data.ok) {
        setMetrics(data.metrics);
      } else {
        setMetrics(null);
      }
    } catch (err) {
      console.error("Error loading metrics:", err);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!metrics) return;
    const csvData = [
      ["Métrica", "Valor"],
      ["Sesiones", metrics.sessions.count],
      ["Check-ins", metrics.summary.totalCheckins],
      ["Contribuciones", metrics.summary.totalContributions],
      ["Tareas", metrics.summary.totalTasks],
      ["Tareas Completadas", metrics.summary.completedTasks],
      ["Participación", `${metrics.summary.participationRate}%`],
      ["Semanas Consecutivas", metrics.summary.consecutiveWeeks],
      ["Emoción Dominante", metrics.teamPulse.dominantEmotion || "N/A"],
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

  if (hubs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Workflow className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">{txt.noHubs}</h2>
          <p className="text-gray-400">{txt.noHubsDesc}</p>
        </div>
      </div>
    );
  }

  const s = metrics?.summary;
  const tp = metrics?.teamPulse;

  // Datos de contribuciones por tipo
  const contribTypes = [
    { type: txt.showTell, count: metrics?.contributions.byType.SHOW_TELL || 0, color: ROWI_BLUE },
    { type: txt.toDiscuss, count: metrics?.contributions.byType.TO_DISCUSS || 0, color: ROWI_PURPLE },
    { type: txt.focus, count: metrics?.contributions.byType.FOCUS || 0, color: ROWI_TEAL },
  ];
  const maxContrib = Math.max(...contribTypes.map(c => c.count), 1);

  // Colores para emociones
  const EMOTION_COLORS: Record<string, string> = {
    JOY: "#F7DC6F", TRUST: "#9B59B6", FEAR: "#1ABC9C", SURPRISE: "#F39C12",
    SADNESS: "#5DADE2", DISGUST: "#27AE60", ANGER: "#E74C3C", ANTICIPATION: "#E67E22",
  };

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
        <div className="flex items-center gap-2 flex-wrap">
          {hubs.length > 1 && (
            <select
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-violet-500 focus:outline-none"
            >
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="WEEKLY">{txt.weekly}</option>
            <option value="MONTHLY">{txt.monthly}</option>
            <option value="QUARTERLY">{txt.quarterly}</option>
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

      {!metrics ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{txt.noData}</p>
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Calendar className="w-5 h-5 text-violet-400" />}
              value={metrics.sessions.count}
              label={txt.totalSessions}
              gradient="from-violet-500/10 to-purple-600/10"
              border="border-violet-500/30"
            />
            <StatCard
              icon={<Heart className="w-5 h-5 text-pink-400" />}
              value={s?.totalCheckins || 0}
              label={txt.totalCheckins}
              gradient="from-pink-500/10 to-rose-600/10"
              border="border-pink-500/30"
            />
            <StatCard
              icon={<MessageSquare className="w-5 h-5 text-emerald-400" />}
              value={s?.totalContributions || 0}
              label={txt.contributions}
              gradient="from-emerald-500/10 to-green-600/10"
              border="border-emerald-500/30"
            />
            <StatCard
              icon={<CheckCircle className="w-5 h-5 text-blue-400" />}
              value={`${s?.completedTasks || 0}/${s?.totalTasks || 0}`}
              label={txt.tasks}
              gradient="from-blue-500/10 to-cyan-600/10"
              border="border-blue-500/30"
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-violet-400" />
                <span className="text-gray-400">{txt.participation}</span>
              </div>
              <p className="text-4xl font-bold text-white">{s?.participationRate || 0}%</p>
              <div className="h-2 bg-gray-700 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700"
                  style={{ width: `${s?.participationRate || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-gray-400">{txt.taskCompletion}</span>
              </div>
              <p className="text-4xl font-bold text-white">{s?.taskCompletionRate || 0}%</p>
              <div className="h-2 bg-gray-700 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700"
                  style={{ width: `${s?.taskCompletionRate || 0}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-gray-400">{txt.consecutiveWeeks}</span>
              </div>
              <p className="text-4xl font-bold text-white">
                {s?.consecutiveWeeks || 0} <span className="text-lg text-gray-400">{txt.weekly}s</span>
              </p>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contribution Types */}
            <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                {txt.contributionTypes}
              </h3>
              <div className="space-y-4">
                {contribTypes.map((type) => (
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
                        style={{ width: `${(type.count / maxContrib) * 100}%`, backgroundColor: type.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mood Distribution / Team Pulse */}
            <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-pink-400" />
                {txt.moodDistribution}
              </h3>
              {tp && tp.emotionDistribution.length > 0 ? (
                <div className="space-y-3">
                  {tp.dominantEmotion && (
                    <div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                      <p className="text-xs text-gray-400 mb-1">{txt.dominantEmotion}</p>
                      <p className="text-lg font-bold text-white capitalize">{tp.dominantEmotion.toLowerCase()}</p>
                      <p className="text-xs text-gray-400">
                        {tp.totalResponses} check-ins • {locale === "en" ? "Avg intensity" : "Intensidad promedio"}: {tp.avgIntensity}/3
                      </p>
                    </div>
                  )}
                  {tp.emotionDistribution.slice(0, 6).map((mood) => (
                    <div key={mood.emotion}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: EMOTION_COLORS[mood.emotion.toUpperCase()] || "#9E9E9E" }}
                          />
                          <span className="text-sm text-gray-300 capitalize">{mood.emotion.toLowerCase()}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{mood.percentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${mood.percentage}%`,
                            backgroundColor: EMOTION_COLORS[mood.emotion.toUpperCase()] || "#9E9E9E",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{txt.noData}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  gradient,
  border,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  gradient: string;
  border: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl border ${border} p-5`}>
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-xl bg-white/5">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
