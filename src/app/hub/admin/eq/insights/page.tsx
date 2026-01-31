// src/app/hub/admin/eq/insights/page.tsx
// ============================================================
// EQ Insights Admin - Insights y recomendaciones globales
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  Lightbulb,
  Loader2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Brain,
  Users,
  Target,
  Zap,
  Heart,
  ArrowRight,
  BarChart3,
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

// Demo insights
const KEY_INSIGHTS = [
  {
    type: "positive",
    icon: TrendingUp,
    title: "Intrinsic Motivation en aumento",
    description: "La motivación intrínseca ha crecido un 12% en el último trimestre. Los usuarios muestran mayor compromiso con sus metas.",
    metric: "+12%",
    color: "emerald",
  },
  {
    type: "warning",
    icon: AlertTriangle,
    title: "Navigate Emotions necesita atención",
    description: "Esta competencia muestra el menor crecimiento. Considerar programas de coaching específicos.",
    metric: "+2%",
    color: "amber",
  },
  {
    type: "positive",
    icon: CheckCircle,
    title: "Empathy líder en mejora",
    description: "La empatía es la competencia con mayor mejora este mes, reflejando mejor comunicación en equipos.",
    metric: "+15%",
    color: "emerald",
  },
  {
    type: "info",
    icon: Brain,
    title: "Brain Styles balanceados",
    description: "La distribución de estilos cerebrales es equilibrada, favoreciendo la diversidad cognitiva.",
    metric: "Óptimo",
    color: "blue",
  },
];

const COMPETENCY_INSIGHTS = [
  { key: "EL", label: "Emotional Literacy", score: 95, trend: 8, status: "strong" },
  { key: "RP", label: "Recognize Patterns", score: 88, trend: 5, status: "growing" },
  { key: "ACT", label: "Consequential Thinking", score: 92, trend: 7, status: "strong" },
  { key: "NE", label: "Navigate Emotions", score: 78, trend: 2, status: "needs_attention" },
  { key: "IM", label: "Intrinsic Motivation", score: 97, trend: 12, status: "excellent" },
  { key: "OP", label: "Exercise Optimism", score: 85, trend: 6, status: "growing" },
  { key: "EMP", label: "Increase Empathy", score: 91, trend: 15, status: "excellent" },
  { key: "NG", label: "Noble Goals", score: 89, trend: 9, status: "strong" },
];

const RECOMMENDATIONS = [
  {
    priority: "high",
    title: "Programa de Navigate Emotions",
    description: "Implementar talleres de 4 semanas enfocados en regulación emocional para los 120 usuarios con puntuaciones menores a 75.",
    impact: "Alto impacto",
    users: 120,
  },
  {
    priority: "medium",
    title: "Reconocimiento de logros IM",
    description: "Celebrar públicamente a los 45 usuarios que han mostrado mayor crecimiento en Motivación Intrínseca.",
    impact: "Impacto medio",
    users: 45,
  },
  {
    priority: "low",
    title: "Mentoría entre pares",
    description: "Emparejar usuarios con alta Empatía con aquellos que buscan mejorar en esta área.",
    impact: "Impacto gradual",
    users: 80,
  },
];

const DEPARTMENT_SCORES = [
  { dept: "Ventas", score: 94 },
  { dept: "Marketing", score: 89 },
  { dept: "Tecnología", score: 86 },
  { dept: "RRHH", score: 98 },
  { dept: "Operaciones", score: 82 },
  { dept: "Finanzas", score: 85 },
];

export default function EQInsightsAdminPage() {
  const { locale } = useI18n();
  const [loading, setLoading] = useState(true);

  const txt = {
    title: locale === "en" ? "EQ Insights" : "Insights EQ",
    subtitle: locale === "en" ? "AI-powered insights and recommendations" : "Insights y recomendaciones con IA",
    loading: locale === "en" ? "Analyzing data..." : "Analizando datos...",
    keyInsights: locale === "en" ? "Key Insights" : "Insights Clave",
    competencyAnalysis: locale === "en" ? "Competency Analysis" : "Análisis por Competencia",
    recommendations: locale === "en" ? "Recommendations" : "Recomendaciones",
    departmentComparison: locale === "en" ? "Department Comparison" : "Comparación por Departamento",
    viewDetails: locale === "en" ? "View Details" : "Ver Detalles",
    affectedUsers: locale === "en" ? "affected users" : "usuarios afectados",
    trend: locale === "en" ? "trend" : "tendencia",
    strong: locale === "en" ? "Strong" : "Fuerte",
    growing: locale === "en" ? "Growing" : "Creciendo",
    needsAttention: locale === "en" ? "Needs attention" : "Necesita atención",
    excellent: locale === "en" ? "Excellent" : "Excelente",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-emerald-400 bg-emerald-500/20";
      case "strong": return "text-blue-400 bg-blue-500/20";
      case "growing": return "text-amber-400 bg-amber-500/20";
      case "needs_attention": return "text-red-400 bg-red-500/20";
      default: return "text-gray-400 bg-gray-500/20";
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
      case "high": return "border-red-500/50 bg-red-500/10";
      case "medium": return "border-amber-500/50 bg-amber-500/10";
      case "low": return "border-blue-500/50 bg-blue-500/10";
      default: return "border-gray-500/50 bg-gray-500/10";
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <div className="relative">
            <Lightbulb className="w-16 h-16 text-amber-500 animate-pulse" />
            <Sparkles className="w-6 h-6 text-violet-400 absolute -top-1 -right-1 animate-bounce" />
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
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
          <Lightbulb className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{txt.title}</h1>
          <p className="text-gray-400 text-sm">{txt.subtitle}</p>
        </div>
      </div>

      {/* Key Insights Grid */}
      <div>
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          {txt.keyInsights}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {KEY_INSIGHTS.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl border p-5 ${
                  insight.color === "emerald"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : insight.color === "amber"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-blue-500/30 bg-blue-500/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${
                    insight.color === "emerald"
                      ? "bg-emerald-500/20"
                      : insight.color === "amber"
                      ? "bg-amber-500/20"
                      : "bg-blue-500/20"
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      insight.color === "emerald"
                        ? "text-emerald-400"
                        : insight.color === "amber"
                        ? "text-amber-400"
                        : "text-blue-400"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white">{insight.title}</h4>
                      <span className={`text-sm font-bold ${
                        insight.color === "emerald"
                          ? "text-emerald-400"
                          : insight.color === "amber"
                          ? "text-amber-400"
                          : "text-blue-400"
                      }`}>
                        {insight.metric}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{insight.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competency Analysis */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-400" />
            {txt.competencyAnalysis}
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={COMPETENCY_INSIGHTS}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="key" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 135]} tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17,24,39,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} (${txt.trend}: +${props.payload.trend}%)`,
                    props.payload.label
                  ]}
                />
                <Radar name="Score" dataKey="score" stroke={ROWI_PURPLE} fill={ROWI_PURPLE} fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Comparison */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            {txt.departmentComparison}
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPARTMENT_SCORES} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[70, 110]} tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="dept" tick={{ fill: "#fff", fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17,24,39,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <defs>
                  <linearGradient id="deptGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={ROWI_BLUE} />
                    <stop offset="100%" stopColor={ROWI_PURPLE} />
                  </linearGradient>
                </defs>
                <Bar dataKey="score" fill="url(#deptGradient)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Competency Status Grid */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
        <h3 className="font-semibold text-white mb-4">{txt.competencyAnalysis}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COMPETENCY_INSIGHTS.map((comp) => (
            <div key={comp.key} className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-violet-400">{comp.key}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(comp.status)}`}>
                  {getStatusLabel(comp.status)}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{comp.score}</p>
              <div className="flex items-center gap-1 text-emerald-400 text-xs">
                <TrendingUp className="w-3 h-3" />
                +{comp.trend}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          {txt.recommendations}
        </h3>
        <div className="space-y-3">
          {RECOMMENDATIONS.map((rec, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-5 ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-400 mb-2">{rec.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Users className="w-3 h-3" />
                      {rec.users} {txt.affectedUsers}
                    </span>
                    <span className={`${
                      rec.priority === "high"
                        ? "text-red-400"
                        : rec.priority === "medium"
                        ? "text-amber-400"
                        : "text-blue-400"
                    }`}>
                      {rec.impact}
                    </span>
                  </div>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors">
                  {txt.viewDetails}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
