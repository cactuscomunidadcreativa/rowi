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
    color: "success",
  },
  {
    type: "warning",
    icon: AlertTriangle,
    title: "Navigate Emotions necesita atención",
    description: "Esta competencia muestra el menor crecimiento. Considerar programas de coaching específicos.",
    metric: "+2%",
    color: "warning",
  },
  {
    type: "positive",
    icon: CheckCircle,
    title: "Empathy líder en mejora",
    description: "La empatía es la competencia con mayor mejora este mes, reflejando mejor comunicación en equipos.",
    metric: "+15%",
    color: "success",
  },
  {
    type: "info",
    icon: Brain,
    title: "Brain Styles balanceados",
    description: "La distribución de estilos cerebrales es equilibrada, favoreciendo la diversidad cognitiva.",
    metric: "Óptimo",
    color: "primary",
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
      case "excellent": return "text-[var(--rowi-success)] bg-[var(--rowi-success)]/10";
      case "strong": return "text-[var(--rowi-primary)] bg-[var(--rowi-primary)]/10";
      case "growing": return "text-[var(--rowi-warning)] bg-[var(--rowi-warning)]/10";
      case "needs_attention": return "text-[var(--rowi-error)] bg-[var(--rowi-error)]/10";
      default: return "text-[var(--rowi-muted)] bg-[var(--rowi-muted)]/10";
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
      case "high": return "border-[var(--rowi-error)]/50 bg-[var(--rowi-error)]/5";
      case "medium": return "border-[var(--rowi-warning)]/50 bg-[var(--rowi-warning)]/5";
      case "low": return "border-[var(--rowi-primary)]/50 bg-[var(--rowi-primary)]/5";
      default: return "border-[var(--rowi-border)] bg-[var(--rowi-background)]";
    }
  };

  const getInsightColor = (color: string) => {
    switch (color) {
      case "success": return { border: "border-[var(--rowi-success)]/30 bg-[var(--rowi-success)]/5", icon: "bg-[var(--rowi-success)]/20", text: "text-[var(--rowi-success)]" };
      case "warning": return { border: "border-[var(--rowi-warning)]/30 bg-[var(--rowi-warning)]/5", icon: "bg-[var(--rowi-warning)]/20", text: "text-[var(--rowi-warning)]" };
      case "primary": return { border: "border-[var(--rowi-primary)]/30 bg-[var(--rowi-primary)]/5", icon: "bg-[var(--rowi-primary)]/20", text: "text-[var(--rowi-primary)]" };
      default: return { border: "border-[var(--rowi-border)]", icon: "bg-[var(--rowi-muted)]/20", text: "text-[var(--rowi-muted)]" };
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--rowi-muted)]">
          <div className="relative">
            <Lightbulb className="w-16 h-16 text-[var(--rowi-warning)] animate-pulse" />
            <Sparkles className="w-6 h-6 text-[var(--rowi-secondary)] absolute -top-1 -right-1 animate-bounce" />
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
        <div className="p-3 rounded-2xl bg-[var(--rowi-warning)]/20">
          <Lightbulb className="w-7 h-7 text-[var(--rowi-warning)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)]">{txt.title}</h1>
          <p className="text-[var(--rowi-muted)] text-sm">{txt.subtitle}</p>
        </div>
      </div>

      {/* Key Insights Grid */}
      <div>
        <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[var(--rowi-warning)]" />
          {txt.keyInsights}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {KEY_INSIGHTS.map((insight, idx) => {
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
                      <h4 className="font-semibold text-[var(--rowi-foreground)]">{insight.title}</h4>
                      <span className={`text-sm font-bold ${colors.text}`}>
                        {insight.metric}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--rowi-muted)]">{insight.description}</p>
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
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-[var(--rowi-secondary)]" />
            {txt.competencyAnalysis}
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={COMPETENCY_INSIGHTS}>
                <PolarGrid stroke="var(--rowi-border)" />
                <PolarAngleAxis dataKey="key" tick={{ fill: "var(--rowi-muted)", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 135]} tick={{ fill: "var(--rowi-muted)", fontSize: 10 }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
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
        <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--rowi-primary)]" />
            {txt.departmentComparison}
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPARTMENT_SCORES} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rowi-border)" />
                <XAxis type="number" domain={[70, 110]} tick={{ fill: "var(--rowi-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="dept" tick={{ fill: "var(--rowi-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{
                    background: "var(--rowi-surface)",
                    border: "1px solid var(--rowi-border)",
                    borderRadius: 8,
                    color: "var(--rowi-foreground)",
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
      <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-5 shadow-sm">
        <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4">{txt.competencyAnalysis}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COMPETENCY_INSIGHTS.map((comp) => (
            <div key={comp.key} className="bg-[var(--rowi-background)] rounded-xl p-4 hover:bg-[var(--rowi-border)] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--rowi-secondary)]">{comp.key}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(comp.status)}`}>
                  {getStatusLabel(comp.status)}
                </span>
              </div>
              <p className="text-2xl font-bold text-[var(--rowi-foreground)] mb-1">{comp.score}</p>
              <div className="flex items-center gap-1 text-[var(--rowi-success)] text-xs">
                <TrendingUp className="w-3 h-3" />
                +{comp.trend}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[var(--rowi-success)]" />
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
                  <h4 className="font-semibold text-[var(--rowi-foreground)] mb-1">{rec.title}</h4>
                  <p className="text-sm text-[var(--rowi-muted)] mb-2">{rec.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-[var(--rowi-muted)]">
                      <Users className="w-3 h-3" />
                      {rec.users} {txt.affectedUsers}
                    </span>
                    <span className={`${
                      rec.priority === "high"
                        ? "text-[var(--rowi-error)]"
                        : rec.priority === "medium"
                        ? "text-[var(--rowi-warning)]"
                        : "text-[var(--rowi-primary)]"
                    }`}>
                      {rec.impact}
                    </span>
                  </div>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--rowi-background)] hover:bg-[var(--rowi-border)] text-[var(--rowi-foreground)] text-sm transition-colors">
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
