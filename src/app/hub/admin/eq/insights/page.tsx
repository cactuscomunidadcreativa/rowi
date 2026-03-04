// src/app/hub/admin/eq/insights/page.tsx
// ============================================================
// EQ Insights Admin - Insights y recomendaciones globales
// ============================================================

"use client";

import { useState, useEffect, useMemo } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Brain,
  Target,
  Zap,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const ROWI_BLUE = "#31A2E3";
const ROWI_PURPLE = "#7A59C9";

const COMPETENCY_LABELS: Record<string, string> = {
  EL: "Emotional Literacy",
  RP: "Recognize Patterns",
  ACT: "Consequential Thinking",
  NE: "Navigate Emotions",
  IM: "Intrinsic Motivation",
  OP: "Exercise Optimism",
  EMP: "Increase Empathy",
  NG: "Noble Goals",
};

/* ------------------------------------------------------------ */
/* NoData placeholder                                           */
/* ------------------------------------------------------------ */
function NoData({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[var(--rowi-muted)]">
      <AlertCircle className="w-10 h-10 mb-3 opacity-40" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

/* ------------------------------------------------------------ */
/* Helper: classify competency status from raw score             */
/* ------------------------------------------------------------ */
function getCompetencyStatus(score: number) {
  if (score >= 110) return "excellent";
  if (score >= 95) return "strong";
  if (score >= 80) return "growing";
  return "needs_attention";
}

/* ------------------------------------------------------------ */
/* Helper: derive insights from real data                       */
/* ------------------------------------------------------------ */
interface CompEntry {
  key: string;
  label: string;
  score: number;
  status: string;
}

interface DerivedInsight {
  type: string;
  icon: typeof TrendingUp;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  metric: string;
  color: string;
}

function deriveInsights(
  competencies: CompEntry[],
  brainStyles: { name: string; value: number; count: number }[],
  totalSnapshots: number,
  totalUsers: number,
): DerivedInsight[] {
  const insights: DerivedInsight[] = [];
  if (competencies.length === 0) return insights;

  const sorted = [...competencies].sort((a, b) => b.score - a.score);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  // Strongest competency
  insights.push({
    type: "positive",
    icon: TrendingUp,
    titleEn: `${highest.label} leads`,
    titleEs: `${highest.label} lidera`,
    descriptionEn: `${highest.label} is the strongest competency across all assessments with an average score of ${highest.score.toFixed(1)}.`,
    descriptionEs: `${highest.label} es la competencia más fuerte con un puntaje promedio de ${highest.score.toFixed(1)}.`,
    metric: highest.score.toFixed(1),
    color: "success",
  });

  // Weakest competency
  if (lowest.key !== highest.key) {
    insights.push({
      type: "warning",
      icon: AlertTriangle,
      titleEn: `${lowest.label} needs attention`,
      titleEs: `${lowest.label} necesita atención`,
      descriptionEn: `${lowest.label} shows the lowest average (${lowest.score.toFixed(1)}). Consider focused coaching programs.`,
      descriptionEs: `${lowest.label} tiene el promedio más bajo (${lowest.score.toFixed(1)}). Considerar programas de coaching enfocados.`,
      metric: lowest.score.toFixed(1),
      color: "warning",
    });
  }

  // Strong competencies count
  const strongCount = competencies.filter((c) => c.status === "excellent" || c.status === "strong").length;
  if (strongCount >= 4) {
    insights.push({
      type: "positive",
      icon: CheckCircle,
      titleEn: `${strongCount} competencies are strong`,
      titleEs: `${strongCount} competencias son fuertes`,
      descriptionEn: `${strongCount} out of 8 competencies score above 95, indicating overall healthy emotional intelligence.`,
      descriptionEs: `${strongCount} de 8 competencias superan 95, indicando inteligencia emocional saludable.`,
      metric: `${strongCount}/8`,
      color: "success",
    });
  }

  // Brain style diversity
  if (brainStyles.length >= 3) {
    insights.push({
      type: "info",
      icon: Brain,
      titleEn: "Diverse Brain Styles",
      titleEs: "Estilos Cerebrales diversos",
      descriptionEn: `${brainStyles.length} different brain styles detected across ${totalUsers} users, indicating cognitive diversity.`,
      descriptionEs: `${brainStyles.length} estilos cerebrales distintos entre ${totalUsers} usuarios, indicando diversidad cognitiva.`,
      metric: `${brainStyles.length}`,
      color: "primary",
    });
  }

  return insights;
}

/* ------------------------------------------------------------ */
/* Helper: derive recommendations from data                     */
/* ------------------------------------------------------------ */
interface Recommendation {
  priority: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string;
  descriptionEs: string;
  impactEn: string;
  impactEs: string;
}

function deriveRecommendations(competencies: CompEntry[], totalUsers: number): Recommendation[] {
  const recs: Recommendation[] = [];
  if (competencies.length === 0) return recs;

  const weak = competencies.filter((c) => c.status === "needs_attention");
  const growing = competencies.filter((c) => c.status === "growing");
  const strong = competencies.filter((c) => c.status === "excellent" || c.status === "strong");

  // Recommend coaching for weak competencies
  weak.forEach((comp) => {
    recs.push({
      priority: "high",
      titleEn: `Coaching program: ${comp.label}`,
      titleEs: `Programa de coaching: ${comp.label}`,
      descriptionEn: `${comp.label} averages ${comp.score.toFixed(1)}, which is below the optimal range. Consider focused coaching sessions for improvement.`,
      descriptionEs: `${comp.label} promedia ${comp.score.toFixed(1)}, por debajo del rango óptimo. Considerar sesiones de coaching enfocadas.`,
      impactEn: "High impact",
      impactEs: "Alto impacto",
    });
  });

  // Suggest reinforcement for growing competencies
  growing.slice(0, 2).forEach((comp) => {
    recs.push({
      priority: "medium",
      titleEn: `Reinforce ${comp.label}`,
      titleEs: `Reforzar ${comp.label}`,
      descriptionEn: `${comp.label} (${comp.score.toFixed(1)}) is growing. Structured practice could push it into the strong range.`,
      descriptionEs: `${comp.label} (${comp.score.toFixed(1)}) está creciendo. Práctica estructurada podría elevarla al rango fuerte.`,
      impactEn: "Medium impact",
      impactEs: "Impacto medio",
    });
  });

  // Peer mentoring if strong competencies exist
  if (strong.length >= 2 && totalUsers > 1) {
    recs.push({
      priority: "low",
      titleEn: "Peer mentoring program",
      titleEs: "Programa de mentoría entre pares",
      descriptionEn: `Pair users who excel in strong competencies (${strong.slice(0, 2).map((s) => s.label).join(", ")}) with those seeking improvement.`,
      descriptionEs: `Emparejar usuarios que destacan en competencias fuertes (${strong.slice(0, 2).map((s) => s.label).join(", ")}) con quienes buscan mejorar.`,
      impactEn: "Gradual impact",
      impactEs: "Impacto gradual",
    });
  }

  return recs;
}

/* ============================================================ */
/* Main component                                               */
/* ============================================================ */
export default function EQInsightsAdminPage() {
  const { locale } = useI18n();
  const isEn = locale === "en";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const txt = {
    title: isEn ? "EQ Insights" : "Insights EQ",
    subtitle: isEn ? "AI-powered insights and recommendations" : "Insights y recomendaciones con IA",
    loading: isEn ? "Analyzing data..." : "Analizando datos...",
    keyInsights: isEn ? "Key Insights" : "Insights Clave",
    competencyAnalysis: isEn ? "Competency Analysis" : "Análisis por Competencia",
    recommendations: isEn ? "Recommendations" : "Recomendaciones",
    brainStyleDist: isEn ? "Brain Style Distribution" : "Distribución de Estilos Cerebrales",
    strong: isEn ? "Strong" : "Fuerte",
    growing: isEn ? "Growing" : "Creciendo",
    needsAttention: isEn ? "Needs attention" : "Necesita atención",
    excellent: isEn ? "Excellent" : "Excelente",
    noData: isEn ? "No assessment data yet" : "Aún no hay datos de evaluaciones",
    errorLoading: isEn ? "Error loading data" : "Error al cargar datos",
  };

  /* ── fetch real data ───────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/eq/stats");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "API error");
        setStats(data.stats);
      } catch (err: any) {
        console.error("Error loading EQ stats:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── derive competency list from real data ─────────────────── */
  const competencies: CompEntry[] = useMemo(() => {
    if (!stats?.competencies) return [];
    return Object.entries(stats.competencies)
      .filter(([, val]) => typeof val === "number" && (val as number) > 0)
      .map(([key, val]) => {
        const score = Math.round((val as number) * 10) / 10;
        return {
          key,
          label: COMPETENCY_LABELS[key] || key,
          score,
          status: getCompetencyStatus(score),
        };
      });
  }, [stats]);

  /* ── brain styles for bar chart ────────────────────────────── */
  const brainStyles = useMemo(() => {
    if (!stats?.brainStyles) return [];
    return stats.brainStyles as { name: string; value: number; count: number }[];
  }, [stats]);

  /* ── dynamically derived insights & recs ───────────────────── */
  const insights = useMemo(
    () => deriveInsights(competencies, brainStyles, stats?.totalSnapshots || 0, stats?.totalUsers || 0),
    [competencies, brainStyles, stats],
  );

  const recommendations = useMemo(
    () => deriveRecommendations(competencies, stats?.totalUsers || 0),
    [competencies, stats],
  );

  /* ── helpers ───────────────────────────────────────────────── */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400";
      case "strong": return "text-blue-600 bg-blue-500/10 dark:text-blue-400";
      case "growing": return "text-amber-600 bg-amber-500/10 dark:text-amber-400";
      case "needs_attention": return "text-red-600 bg-red-500/10 dark:text-red-400";
      default: return "text-gray-500 bg-gray-500/10";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "excellent": return txt.excellent;
      case "strong": return txt.strong;
      case "growing": return txt.growing;
      case "needs_attention": return txt.needsAttention;
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-red-400/40 bg-red-500/5";
      case "medium": return "border-amber-400/40 bg-amber-500/5";
      case "low": return "border-blue-400/40 bg-blue-500/5";
      default: return "border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800";
    }
  };

  const getInsightColor = (color: string) => {
    switch (color) {
      case "success": return { border: "border-emerald-400/30 bg-emerald-500/5", icon: "bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" };
      case "warning": return { border: "border-amber-400/30 bg-amber-500/5", icon: "bg-amber-500/20", text: "text-amber-600 dark:text-amber-400" };
      case "primary": return { border: "border-blue-400/30 bg-blue-500/5", icon: "bg-blue-500/20", text: "text-blue-600 dark:text-blue-400" };
      default: return { border: "border-gray-200 dark:border-zinc-700", icon: "bg-gray-500/20", text: "text-gray-500" };
    }
  };

  /* ── loading state ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="relative">
            <Lightbulb className="w-16 h-16 text-amber-400 animate-pulse" />
            <Sparkles className="w-6 h-6 text-purple-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <span>{txt.loading}</span>
        </div>
      </div>
    );
  }

  /* ── error state ───────────────────────────────────────────── */
  if (error) {
    return <NoData message={`${txt.errorLoading}: ${error}`} />;
  }

  /* ── no data state ─────────────────────────────────────────── */
  if (!stats || competencies.length === 0) {
    return <NoData message={txt.noData} />;
  }

  /* ── radar chart data ──────────────────────────────────────── */
  const radarData = competencies.map((c) => ({
    key: c.key,
    label: c.label,
    score: c.score,
  }));

  /* ── brain style bar chart data ────────────────────────────── */
  const brainStyleData = brainStyles.map((b) => ({
    name: b.name,
    count: b.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-amber-500/20">
          <Lightbulb className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{txt.title}</h1>
          <p className="text-gray-500 text-sm">{txt.subtitle}</p>
        </div>
      </div>

      {/* Key Insights Grid */}
      {insights.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {txt.keyInsights}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, idx) => {
              const Icon = insight.icon;
              const colors = getInsightColor(insight.color);
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 ${colors.border}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${colors.icon}`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {isEn ? insight.titleEn : insight.titleEs}
                        </h4>
                        <span className={`text-sm font-bold ${colors.text}`}>
                          {insight.metric}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {isEn ? insight.descriptionEn : insight.descriptionEs}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competency Radar */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            {txt.competencyAnalysis}
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="key" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 135]} tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    color: "#111827",
                  }}
                  formatter={(value: number, _name: string, props: any) => [
                    `${value}`,
                    props.payload.label,
                  ]}
                />
                <Radar name="Score" dataKey="score" stroke={ROWI_PURPLE} fill={ROWI_PURPLE} fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brain Style Distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            {txt.brainStyleDist}
          </h3>
          {brainStyleData.length > 0 ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brainStyleData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#111827", fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      color: "#111827",
                    }}
                  />
                  <defs>
                    <linearGradient id="brainGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={ROWI_BLUE} />
                      <stop offset="100%" stopColor={ROWI_PURPLE} />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="count" fill="url(#brainGradient)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoData message={txt.noData} />
          )}
        </div>
      </div>

      {/* Competency Status Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{txt.competencyAnalysis}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {competencies.map((comp) => (
            <div key={comp.key} className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{comp.key}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(comp.status)}`}>
                  {getStatusLabel(comp.status)}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{comp.score.toFixed(1)}</p>
              <p className="text-xs text-gray-500 truncate">{comp.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            {txt.recommendations}
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-5 ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {isEn ? rec.titleEn : rec.titleEs}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {isEn ? rec.descriptionEn : rec.descriptionEs}
                    </p>
                    <span className={`text-xs ${
                      rec.priority === "high"
                        ? "text-red-600 dark:text-red-400"
                        : rec.priority === "medium"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}>
                      {isEn ? rec.impactEn : rec.impactEs}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
