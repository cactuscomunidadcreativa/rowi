"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Filter,
  Info,
  ArrowRight,
  Sparkles,
  Target,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Layers,
  Zap,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
  AdminBadge,
} from "@/components/admin/AdminPage";

/* =========================================================
   📊 Correlations Page — Correlaciones multidimensionales

   Dimensiones:
   1. EQ Competencias (8 comp + K,C,G pursuits) → Outcomes
   2. Brain Talents (18 talentos) → Outcomes
   3. Análisis Agrupado (categorías y orientaciones) → Outcomes
========================================================= */

interface Correlation {
  id: string;
  competencyKey: string;
  outcomeKey: string;
  correlation: number;
  strength: "strong" | "moderate" | "weak";
  direction: "positive" | "negative";
  n: number;
  pValue: number | null;
  country: string | null;
  region: string | null;
  sector: string | null;
  year: number | null;
}

interface Benchmark {
  id: string;
  name: string;
  totalRows: number;
}

type Dimension = "eq" | "talents" | "grouped";

// =========================================================
// Definiciones de métricas por dimensión
// (usando las mismas definiciones de dictionary.ts y column-mapping.ts)
// =========================================================

// EQ Competencies (8 competencias agrupadas por pursuit)
const EQ_COMPETENCIES = [
  { key: "EL", area: "K", color: "blue" },
  { key: "RP", area: "K", color: "blue" },
  { key: "ACT", area: "C", color: "green" },
  { key: "NE", area: "C", color: "green" },
  { key: "IM", area: "C", color: "green" },
  { key: "OP", area: "C", color: "green" },
  { key: "EMP", area: "G", color: "purple" },
  { key: "NG", area: "G", color: "purple" },
];

// Brain Talents (18 talentos agrupados por categoría y orientación)
const BRAIN_TALENT_ITEMS = [
  // FOCUS - Data
  { key: "dataMining", category: "focus", orientation: "data", color: "#1E88E5" },
  { key: "modeling", category: "focus", orientation: "data", color: "#1E88E5" },
  { key: "prioritizing", category: "focus", orientation: "data", color: "#1E88E5" },
  // FOCUS - People
  { key: "connection", category: "focus", orientation: "people", color: "#42A5F5" },
  { key: "emotionalInsight", category: "focus", orientation: "people", color: "#42A5F5" },
  { key: "collaboration", category: "focus", orientation: "people", color: "#42A5F5" },
  // DECISIONS - Evaluative
  { key: "reflecting", category: "decisions", orientation: "evaluative", color: "#E53935" },
  { key: "adaptability", category: "decisions", orientation: "evaluative", color: "#E53935" },
  { key: "criticalThinking", category: "decisions", orientation: "evaluative", color: "#E53935" },
  // DECISIONS - Innovative
  { key: "resilience", category: "decisions", orientation: "innovative", color: "#EF5350" },
  { key: "riskTolerance", category: "decisions", orientation: "innovative", color: "#EF5350" },
  { key: "imagination", category: "decisions", orientation: "innovative", color: "#EF5350" },
  // DRIVE - Practical
  { key: "proactivity", category: "drive", orientation: "practical", color: "#43A047" },
  { key: "commitment", category: "drive", orientation: "practical", color: "#43A047" },
  { key: "problemSolving", category: "drive", orientation: "practical", color: "#43A047" },
  // DRIVE - Idealistic
  { key: "vision", category: "drive", orientation: "idealistic", color: "#66BB6A" },
  { key: "designing", category: "drive", orientation: "idealistic", color: "#66BB6A" },
  { key: "entrepreneurship", category: "drive", orientation: "idealistic", color: "#66BB6A" },
];

// Grouped analysis items
const GROUPED_ITEMS = [
  // Talent categories
  { key: "grp:focus", label: { es: "Focus (Enfoque)", en: "Focus" }, color: "#1E88E5", type: "talent_category" },
  { key: "grp:decisions", label: { es: "Decisions (Decisiones)", en: "Decisions" }, color: "#E53935", type: "talent_category" },
  { key: "grp:drive", label: { es: "Drive (Impulso)", en: "Drive" }, color: "#43A047", type: "talent_category" },
  // Talent orientations
  { key: "grp:focus_data", label: { es: "Focus · Data", en: "Focus · Data" }, color: "#1E88E5", type: "talent_orientation" },
  { key: "grp:focus_people", label: { es: "Focus · People", en: "Focus · People" }, color: "#42A5F5", type: "talent_orientation" },
  { key: "grp:decisions_evaluative", label: { es: "Decisions · Evaluative", en: "Decisions · Evaluative" }, color: "#E53935", type: "talent_orientation" },
  { key: "grp:decisions_innovative", label: { es: "Decisions · Innovative", en: "Decisions · Innovative" }, color: "#EF5350", type: "talent_orientation" },
  { key: "grp:drive_practical", label: { es: "Drive · Practical", en: "Drive · Practical" }, color: "#43A047", type: "talent_orientation" },
  { key: "grp:drive_idealistic", label: { es: "Drive · Idealistic", en: "Drive · Idealistic" }, color: "#66BB6A", type: "talent_orientation" },
];

// Outcomes
const OUTCOMES = [
  "effectiveness",
  "relationships",
  "qualityOfLife",
  "wellbeing",
  "influence",
  "decisionMaking",
  "community",
  "network",
  "achievement",
  "satisfaction",
  "balance",
  "health",
];

// Category labels for brain talents
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  focus: { es: "FOCUS", en: "FOCUS" },
  decisions: { es: "DECISIONS", en: "DECISIONS" },
  drive: { es: "DRIVE", en: "DRIVE" },
};

const ORIENTATION_LABELS: Record<string, Record<string, string>> = {
  data: { es: "Data", en: "Data" },
  people: { es: "People", en: "People" },
  evaluative: { es: "Evaluative", en: "Evaluative" },
  innovative: { es: "Innovative", en: "Innovative" },
  practical: { es: "Practical", en: "Practical" },
  idealistic: { es: "Idealistic", en: "Idealistic" },
};

// =========================================================
// Helpers
// =========================================================

function getCorrelationColor(value: number): string {
  const absValue = Math.abs(value);
  if (value > 0) {
    if (absValue >= 0.5) return "bg-green-600 text-white";
    if (absValue >= 0.3) return "bg-green-500 text-white";
    if (absValue >= 0.2) return "bg-green-400 text-white";
    if (absValue >= 0.1) return "bg-green-300 text-green-900";
    return "bg-green-100 text-green-800";
  } else {
    if (absValue >= 0.5) return "bg-red-600 text-white";
    if (absValue >= 0.3) return "bg-red-500 text-white";
    if (absValue >= 0.2) return "bg-red-400 text-white";
    if (absValue >= 0.1) return "bg-red-300 text-red-900";
    return "bg-red-100 text-red-800";
  }
}

function getStrengthLabel(strength: string, lang: string): string {
  const labels: Record<string, Record<string, string>> = {
    strong: { es: "Fuerte", en: "Strong" },
    moderate: { es: "Moderada", en: "Moderate" },
    weak: { es: "Débil", en: "Weak" },
  };
  return labels[strength]?.[lang] || strength;
}

/** Get display label for any competencyKey */
function getMetricLabel(key: string, t: (k: string) => string, lang: string): string {
  // Grouped keys
  const groupedItem = GROUPED_ITEMS.find((g) => g.key === key);
  if (groupedItem) return groupedItem.label[lang as "es" | "en"] || groupedItem.label.en;

  // EQ competencies
  if (["K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"].includes(key)) {
    return t(`admin.benchmarks.metrics.${key}`);
  }

  // Brain talents
  const talentItem = BRAIN_TALENT_ITEMS.find((bt) => bt.key === key);
  if (talentItem) {
    return t(`admin.benchmarks.talents.${key}`);
  }

  return key;
}

/** Determine which dimension a competencyKey belongs to */
function getDimensionForKey(key: string): Dimension {
  if (key.startsWith("grp:")) return "grouped";
  if (BRAIN_TALENT_ITEMS.some((bt) => bt.key === key)) return "talents";
  return "eq";
}

// =========================================================
// Component
// =========================================================

export default function CorrelationsPage() {
  const { t, lang } = useI18n();
  const params = useParams();
  const id = params.id as string;

  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [allCorrelations, setAllCorrelations] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [viewMode, setViewMode] = useState<"heatmap" | "list">("heatmap");
  const [dimension, setDimension] = useState<Dimension>("eq");

  // Cargar datos
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [benchmarkRes, correlationsRes] = await Promise.all([
          fetch(`/api/admin/benchmarks/${id}`),
          fetch(`/api/admin/benchmarks/${id}/correlations`),
        ]);

        const benchmarkData = await benchmarkRes.json();
        const correlationsData = await correlationsRes.json();

        if (benchmarkData.ok) {
          setBenchmark(benchmarkData.benchmark);
        }

        if (correlationsData.ok) {
          setAllCorrelations(correlationsData.correlations);
        }
      } catch (error) {
        toast.error(t("common.error"));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // Filtrar correlaciones globales (year === null) por dimensión
  const correlations = useMemo(() => {
    const global = allCorrelations.filter((c) => c.year === null);
    return global.filter((c) => getDimensionForKey(c.competencyKey) === dimension);
  }, [allCorrelations, dimension]);

  // Check if we have data for each dimension
  const dimensionCounts = useMemo(() => {
    const global = allCorrelations.filter((c) => c.year === null);
    return {
      eq: global.filter((c) => getDimensionForKey(c.competencyKey) === "eq").length,
      talents: global.filter((c) => getDimensionForKey(c.competencyKey) === "talents").length,
      grouped: global.filter((c) => getDimensionForKey(c.competencyKey) === "grouped").length,
    };
  }, [allCorrelations]);

  // =========================================================
  // Heatmap matrices
  // =========================================================

  // EQ heatmap matrix
  const eqMatrix = useMemo(() => {
    if (dimension !== "eq") return {};
    const matrix: Record<string, Record<string, Correlation | null>> = {};
    for (const outcome of OUTCOMES) {
      matrix[outcome] = {};
      for (const comp of EQ_COMPETENCIES) {
        matrix[outcome][comp.key] = null;
      }
    }
    for (const corr of correlations) {
      if (matrix[corr.outcomeKey] && EQ_COMPETENCIES.find((c) => c.key === corr.competencyKey)) {
        matrix[corr.outcomeKey][corr.competencyKey] = corr;
      }
    }
    return matrix;
  }, [correlations, dimension]);

  // Brain Talents heatmap matrix
  const talentMatrix = useMemo(() => {
    if (dimension !== "talents") return {};
    const matrix: Record<string, Record<string, Correlation | null>> = {};
    for (const outcome of OUTCOMES) {
      matrix[outcome] = {};
      for (const talent of BRAIN_TALENT_ITEMS) {
        matrix[outcome][talent.key] = null;
      }
    }
    for (const corr of correlations) {
      if (matrix[corr.outcomeKey] && BRAIN_TALENT_ITEMS.find((bt) => bt.key === corr.competencyKey)) {
        matrix[corr.outcomeKey][corr.competencyKey] = corr;
      }
    }
    return matrix;
  }, [correlations, dimension]);

  // Grouped heatmap matrix
  const groupedMatrix = useMemo(() => {
    if (dimension !== "grouped") return {};
    const matrix: Record<string, Record<string, Correlation | null>> = {};
    for (const outcome of OUTCOMES) {
      matrix[outcome] = {};
      for (const group of GROUPED_ITEMS) {
        matrix[outcome][group.key] = null;
      }
    }
    for (const corr of correlations) {
      if (matrix[corr.outcomeKey] && GROUPED_ITEMS.find((g) => g.key === corr.competencyKey)) {
        matrix[corr.outcomeKey][corr.competencyKey] = corr;
      }
    }
    return matrix;
  }, [correlations, dimension]);

  // Filtered list
  const filteredCorrelations = useMemo(() => {
    let filtered = [...correlations];
    if (selectedOutcome) {
      filtered = filtered.filter((c) => c.outcomeKey === selectedOutcome);
    }
    if (selectedCompetency) {
      filtered = filtered.filter((c) => c.competencyKey === selectedCompetency);
    }
    return filtered.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [correlations, selectedOutcome, selectedCompetency]);

  // Top insights for current dimension
  const topInsights = useMemo(() => {
    const sorted = [...correlations].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    return sorted.slice(0, 5);
  }, [correlations]);

  // Recalculate handler
  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const res = await fetch(`/api/admin/benchmarks/${id}/correlations/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(
          lang === "es"
            ? `${data.summary.totalCorrelations} correlaciones calculadas`
            : `${data.summary.totalCorrelations} correlations calculated`
        );
        // Reload
        const correlationsRes = await fetch(`/api/admin/benchmarks/${id}/correlations`);
        const correlationsData = await correlationsRes.json();
        if (correlationsData.ok) {
          setAllCorrelations(correlationsData.correlations);
        }
      } else {
        toast.error(data.error || "Error");
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setRecalculating(false);
    }
  }

  // Available metric keys for filter dropdown
  const availableMetrics = useMemo(() => {
    if (dimension === "eq") return EQ_COMPETENCIES.map((c) => c.key);
    if (dimension === "talents") return BRAIN_TALENT_ITEMS.map((bt) => bt.key);
    return GROUPED_ITEMS.map((g) => g.key);
  }, [dimension]);

  // Dimension labels
  const dimensionLabels: Record<Dimension, Record<string, string>> = {
    eq: { es: "EQ Competencias", en: "EQ Competencies" },
    talents: { es: "Talentos Cerebrales", en: "Brain Talents" },
    grouped: { es: "Análisis Agrupado", en: "Grouped Analysis" },
  };

  // =========================================================
  // Explanation texts
  // =========================================================
  const explanationTexts = {
    es: {
      title: "¿Qué son las correlaciones?",
      description: "Las correlaciones muestran la relación estadística entre métricas (competencias EQ, talentos cerebrales) y los resultados de vida/trabajo. Un valor de correlación va de -1 a +1:",
      positive: "Correlación positiva (+): Cuando la métrica aumenta, el outcome también tiende a aumentar.",
      negative: "Correlación negativa (-): Cuando la métrica aumenta, el outcome tiende a disminuir.",
      strength: "La fuerza indica qué tan confiable es la relación:",
      strong: "Fuerte (|r| > 0.5): Relación muy confiable",
      moderate: "Moderada (0.3 < |r| < 0.5): Relación notable",
      weak: "Débil (|r| < 0.3): Relación ligera",
      howToUse: "¿Cómo usar esto?",
      howToUseDesc: "Identifica qué competencias o talentos tienen mayor impacto en los outcomes. El análisis agrupado revela patrones a nivel de categorías (Focus, Decisions, Drive).",
    },
    en: {
      title: "What are correlations?",
      description: "Correlations show the statistical relationship between metrics (EQ competencies, brain talents) and life/work outcomes. A correlation value ranges from -1 to +1:",
      positive: "Positive correlation (+): When the metric increases, the outcome also tends to increase.",
      negative: "Negative correlation (-): When the metric increases, the outcome tends to decrease.",
      strength: "Strength indicates how reliable the relationship is:",
      strong: "Strong (|r| > 0.5): Very reliable relationship",
      moderate: "Moderate (0.3 < |r| < 0.5): Notable relationship",
      weak: "Weak (|r| < 0.3): Slight relationship",
      howToUse: "How to use this?",
      howToUseDesc: "Identify which competencies or talents have the greatest impact on outcomes. Grouped analysis reveals patterns at category level (Focus, Decisions, Drive).",
    },
  };

  const texts = explanationTexts[lang as keyof typeof explanationTexts] || explanationTexts.es;

  if (loading) {
    return (
      <AdminPage titleKey="admin.benchmarks.correlations.title" icon={Brain} loading={true}>
        <div />
      </AdminPage>
    );
  }

  return (
    <AdminPage
      titleKey="admin.benchmarks.correlations.title"
      descriptionKey="admin.benchmarks.correlations.pageDescription"
      icon={Brain}
      actions={
        <div className="flex items-center gap-2">
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={handleRecalculate}
            disabled={recalculating}
          >
            <RefreshCcw className={`w-4 h-4 mr-1 ${recalculating ? "animate-spin" : ""}`} />
            {recalculating
              ? (lang === "es" ? "Calculando..." : "Calculating...")
              : (lang === "es" ? "Recalcular" : "Recalculate")}
          </AdminButton>
          <AdminButton
            variant={viewMode === "heatmap" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setViewMode("heatmap")}
          >
            Heatmap
          </AdminButton>
          <AdminButton
            variant={viewMode === "list" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            {lang === "es" ? "Lista" : "List"}
          </AdminButton>
        </div>
      }
    >
      {/* Header con stats */}
      <AdminCard className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--rowi-foreground)]">
              {benchmark?.name}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)]">
              {allCorrelations.filter((c) => c.year === null).length}{" "}
              {lang === "es" ? "correlaciones calculadas" : "correlations calculated"} •{" "}
              {benchmark?.totalRows.toLocaleString()} {lang === "es" ? "registros" : "records"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {correlations.filter((c) => c.strength === "strong").length}
              </p>
              <p className="text-xs text-[var(--rowi-muted)]">
                {lang === "es" ? "Fuertes" : "Strong"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {correlations.filter((c) => c.strength === "moderate").length}
              </p>
              <p className="text-xs text-[var(--rowi-muted)]">
                {lang === "es" ? "Moderadas" : "Moderate"}
              </p>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Dimension Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(["eq", "talents", "grouped"] as Dimension[]).map((dim) => {
          const count = dimensionCounts[dim];
          const isActive = dimension === dim;
          const icons = { eq: Brain, talents: Zap, grouped: Layers };
          const Icon = icons[dim];
          return (
            <button
              key={dim}
              onClick={() => {
                setDimension(dim);
                setSelectedOutcome(null);
                setSelectedCompetency(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[var(--rowi-primary)] text-white shadow-md"
                  : "bg-[var(--rowi-card-bg)] text-[var(--rowi-muted)] border border-[var(--rowi-card-border)] hover:border-[var(--rowi-primary)]/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {dimensionLabels[dim][lang] || dimensionLabels[dim].en}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20" : "bg-[var(--rowi-card-border)]"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explicación educativa */}
      <AdminCard className="mb-6">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-[var(--rowi-foreground)]">
                {texts.title}
              </h3>
              <p className="text-xs text-[var(--rowi-muted)]">
                {lang === "es" ? "Aprende a interpretar los datos" : "Learn to interpret the data"}
              </p>
            </div>
          </div>
          {showExplanation ? (
            <ChevronUp className="w-5 h-5 text-[var(--rowi-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--rowi-muted)]" />
          )}
        </button>

        {showExplanation && (
          <div className="mt-4 pt-4 border-t border-[var(--rowi-card-border)] space-y-4">
            <p className="text-sm text-[var(--rowi-muted)]">{texts.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {lang === "es" ? "Positiva" : "Positive"}
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">{texts.positive}</p>
              </div>

              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-700 dark:text-red-400">
                    {lang === "es" ? "Negativa" : "Negative"}
                  </span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">{texts.negative}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--rowi-card-bg)] border border-[var(--rowi-card-border)]">
              <p className="text-sm font-medium text-[var(--rowi-foreground)] mb-2">{texts.strength}</p>
              <div className="space-y-1 text-xs text-[var(--rowi-muted)]">
                <p>• <span className="font-medium text-green-600">{texts.strong}</span></p>
                <p>• <span className="font-medium text-yellow-600">{texts.moderate}</span></p>
                <p>• <span className="font-medium text-gray-500">{texts.weak}</span></p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-gradient-to-r from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10 border border-[var(--rowi-primary)]/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[var(--rowi-primary)]" />
                <span className="font-medium text-[var(--rowi-foreground)]">{texts.howToUse}</span>
              </div>
              <p className="text-xs text-[var(--rowi-muted)]">{texts.howToUseDesc}</p>
            </div>
          </div>
        )}
      </AdminCard>

      {/* Top Insights */}
      {topInsights.length > 0 && (
        <AdminCard className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--rowi-foreground)]">
                {lang === "es" ? "Correlaciones más fuertes" : "Strongest Correlations"}
                <span className="ml-2 text-sm font-normal text-[var(--rowi-muted)]">
                  ({dimensionLabels[dimension][lang] || dimensionLabels[dimension].en})
                </span>
              </h3>
              <p className="text-xs text-[var(--rowi-muted)]">
                {lang === "es" ? "Las relaciones más significativas encontradas" : "The most significant relationships found"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {topInsights.map((corr, idx) => (
              <div
                key={corr.id}
                className={`p-3 rounded-lg border ${
                  corr.direction === "positive"
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[var(--rowi-muted)]">#{idx + 1}</span>
                  <span className={`text-lg font-bold ${corr.direction === "positive" ? "text-green-600" : "text-red-600"}`}>
                    {corr.correlation.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="font-medium text-[var(--rowi-foreground)]">
                    {getMetricLabel(corr.competencyKey, t, lang)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-[var(--rowi-muted)] shrink-0" />
                  <span className="text-[var(--rowi-muted)] truncate">
                    {t(`admin.benchmarks.outcomes.${corr.outcomeKey}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* No data message */}
      {correlations.length === 0 && (
        <AdminCard className="mb-6">
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto text-[var(--rowi-muted)] mb-3" />
            <p className="text-[var(--rowi-foreground)] font-medium mb-2">
              {lang === "es"
                ? "No hay correlaciones calculadas para esta dimensión"
                : "No correlations calculated for this dimension"}
            </p>
            <p className="text-sm text-[var(--rowi-muted)] mb-4">
              {lang === "es"
                ? "Presiona Recalcular para generar correlaciones de todas las dimensiones"
                : "Press Recalculate to generate correlations for all dimensions"}
            </p>
            <AdminButton variant="primary" onClick={handleRecalculate} disabled={recalculating}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${recalculating ? "animate-spin" : ""}`} />
              {recalculating
                ? (lang === "es" ? "Calculando..." : "Calculating...")
                : (lang === "es" ? "Calcular correlaciones" : "Calculate correlations")}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {/* Vista Principal */}
      {correlations.length > 0 && viewMode === "heatmap" ? (
        <>
          {/* =========== EQ HEATMAP =========== */}
          {dimension === "eq" && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-[var(--rowi-primary)]" />
                <h3 className="font-semibold text-[var(--rowi-foreground)]">
                  {lang === "es" ? "Matriz: EQ Competencias → Outcomes" : "Matrix: EQ Competencies → Outcomes"}
                </h3>
              </div>

              <HeatmapLegend lang={lang} />

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-[var(--rowi-muted)] font-medium">
                        Outcome
                      </th>
                      {EQ_COMPETENCIES.map((comp) => (
                        <th
                          key={comp.key}
                          className={`p-2 text-center font-medium ${
                            comp.area === "K"
                              ? "text-blue-600"
                              : comp.area === "C"
                              ? "text-green-600"
                              : "text-purple-600"
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{comp.key}</span>
                            <span className="text-[10px] opacity-60">{comp.area}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {OUTCOMES.map((outcome) => (
                      <tr key={outcome} className="border-t border-[var(--rowi-card-border)]">
                        <td className="p-2 font-medium text-[var(--rowi-foreground)]">
                          {t(`admin.benchmarks.outcomes.${outcome}`)}
                        </td>
                        {EQ_COMPETENCIES.map((comp) => {
                          const corr = eqMatrix[outcome]?.[comp.key];
                          return (
                            <td key={comp.key} className="p-1 text-center">
                              {corr ? (
                                <HeatmapCell
                                  corr={corr}
                                  label={`${t(`admin.benchmarks.metrics.${comp.key}`)} → ${t(`admin.benchmarks.outcomes.${outcome}`)}`}
                                  lang={lang}
                                  onClick={() => {
                                    setSelectedCompetency(comp.key);
                                    setSelectedOutcome(outcome);
                                    setViewMode("list");
                                  }}
                                />
                              ) : (
                                <div className="p-2 text-gray-300">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-[var(--rowi-muted)] mt-4 text-center">
                {lang === "es"
                  ? "Haz clic en una celda para ver más detalles"
                  : "Click on a cell to see more details"}
              </p>
            </AdminCard>
          )}

          {/* =========== BRAIN TALENTS HEATMAP =========== */}
          {dimension === "talents" && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-[var(--rowi-primary)]" />
                <h3 className="font-semibold text-[var(--rowi-foreground)]">
                  {lang === "es" ? "Matriz: Talentos Cerebrales → Outcomes" : "Matrix: Brain Talents → Outcomes"}
                </h3>
              </div>

              <HeatmapLegend lang={lang} />

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-[var(--rowi-muted)] font-medium sticky left-0 bg-[var(--rowi-card-bg)] z-10">
                        Outcome
                      </th>
                      {BRAIN_TALENT_ITEMS.map((talent, idx) => {
                        // Show category separator
                        const prevTalent = idx > 0 ? BRAIN_TALENT_ITEMS[idx - 1] : null;
                        const isNewCategory = !prevTalent || prevTalent.category !== talent.category;
                        return (
                          <th
                            key={talent.key}
                            className={`p-1.5 text-center font-medium ${isNewCategory && idx > 0 ? "border-l-2 border-[var(--rowi-card-border)]" : ""}`}
                            style={{ color: talent.color }}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] leading-tight truncate max-w-[60px]">
                                {t(`admin.benchmarks.talents.${talent.key}`)}
                              </span>
                              <span className="text-[8px] opacity-60 uppercase">
                                {CATEGORY_LABELS[talent.category]?.[lang] || talent.category}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {OUTCOMES.map((outcome) => (
                      <tr key={outcome} className="border-t border-[var(--rowi-card-border)]">
                        <td className="p-2 font-medium text-[var(--rowi-foreground)] sticky left-0 bg-[var(--rowi-card-bg)] z-10">
                          {t(`admin.benchmarks.outcomes.${outcome}`)}
                        </td>
                        {BRAIN_TALENT_ITEMS.map((talent, idx) => {
                          const prevTalent = idx > 0 ? BRAIN_TALENT_ITEMS[idx - 1] : null;
                          const isNewCategory = !prevTalent || prevTalent.category !== talent.category;
                          const corr = talentMatrix[outcome]?.[talent.key];
                          return (
                            <td key={talent.key} className={`p-0.5 text-center ${isNewCategory && idx > 0 ? "border-l-2 border-[var(--rowi-card-border)]" : ""}`}>
                              {corr ? (
                                <HeatmapCell
                                  corr={corr}
                                  label={`${t(`admin.benchmarks.talents.${talent.key}`)} → ${t(`admin.benchmarks.outcomes.${outcome}`)}`}
                                  lang={lang}
                                  onClick={() => {
                                    setSelectedCompetency(talent.key);
                                    setSelectedOutcome(outcome);
                                    setViewMode("list");
                                  }}
                                />
                              ) : (
                                <div className="p-1.5 text-gray-300 text-[10px]">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-[var(--rowi-muted)] mt-4 text-center">
                {lang === "es"
                  ? "18 talentos cerebrales agrupados por Focus · Decisions · Drive"
                  : "18 brain talents grouped by Focus · Decisions · Drive"}
              </p>
            </AdminCard>
          )}

          {/* =========== GROUPED ANALYSIS HEATMAP =========== */}
          {dimension === "grouped" && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-[var(--rowi-primary)]" />
                <h3 className="font-semibold text-[var(--rowi-foreground)]">
                  {lang === "es" ? "Matriz: Grupos Agregados → Outcomes" : "Matrix: Grouped Averages → Outcomes"}
                </h3>
              </div>

              <p className="text-sm text-[var(--rowi-muted)] mb-4">
                {lang === "es"
                  ? "Promedio de talentos por categoría y orientación. Revela patrones a nivel macro."
                  : "Average of talents by category and orientation. Reveals macro-level patterns."}
              </p>

              <HeatmapLegend lang={lang} />

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-[var(--rowi-muted)] font-medium">
                        Outcome
                      </th>
                      {GROUPED_ITEMS.map((group, idx) => {
                        const isCategory = group.type === "talent_category";
                        const prevItem = idx > 0 ? GROUPED_ITEMS[idx - 1] : null;
                        const isSeparator = prevItem && prevItem.type !== group.type;
                        return (
                          <th
                            key={group.key}
                            className={`p-2 text-center font-medium ${isSeparator ? "border-l-2 border-[var(--rowi-card-border)]" : ""} ${isCategory ? "text-sm" : "text-xs"}`}
                            style={{ color: group.color }}
                          >
                            <div className="flex flex-col items-center">
                              <span className="truncate max-w-[80px]">
                                {group.label[lang as "es" | "en"] || group.label.en}
                              </span>
                              <span className="text-[8px] opacity-60">
                                {isCategory
                                  ? (lang === "es" ? "Categoría" : "Category")
                                  : (lang === "es" ? "Orientación" : "Orientation")}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {OUTCOMES.map((outcome) => (
                      <tr key={outcome} className="border-t border-[var(--rowi-card-border)]">
                        <td className="p-2 font-medium text-[var(--rowi-foreground)]">
                          {t(`admin.benchmarks.outcomes.${outcome}`)}
                        </td>
                        {GROUPED_ITEMS.map((group, idx) => {
                          const prevItem = idx > 0 ? GROUPED_ITEMS[idx - 1] : null;
                          const isSeparator = prevItem && prevItem.type !== group.type;
                          const corr = groupedMatrix[outcome]?.[group.key];
                          return (
                            <td key={group.key} className={`p-1 text-center ${isSeparator ? "border-l-2 border-[var(--rowi-card-border)]" : ""}`}>
                              {corr ? (
                                <HeatmapCell
                                  corr={corr}
                                  label={`${group.label[lang as "es" | "en"] || group.label.en} → ${t(`admin.benchmarks.outcomes.${outcome}`)}`}
                                  lang={lang}
                                  onClick={() => {
                                    setSelectedCompetency(group.key);
                                    setSelectedOutcome(outcome);
                                    setViewMode("list");
                                  }}
                                />
                              ) : (
                                <div className="p-2 text-gray-300">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-[var(--rowi-muted)] mt-4 text-center">
                {lang === "es"
                  ? "Categorías (3) muestran el efecto general. Orientaciones (6) revelan sub-patrones."
                  : "Categories (3) show the general effect. Orientations (6) reveal sub-patterns."}
              </p>
            </AdminCard>
          )}
        </>
      ) : correlations.length > 0 ? (
        /* =========== LISTA =========== */
        <AdminCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-[var(--rowi-primary)]" />
              <h3 className="font-semibold text-[var(--rowi-foreground)]">
                {lang === "es" ? "Lista de Correlaciones" : "Correlation List"}
                <span className="ml-2 text-sm font-normal text-[var(--rowi-muted)]">
                  ({dimensionLabels[dimension][lang] || dimensionLabels[dimension].en})
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedOutcome || ""}
                onChange={(e) => setSelectedOutcome(e.target.value || null)}
                className="text-sm px-3 py-1.5 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)]"
              >
                <option value="">{lang === "es" ? "Todos los outcomes" : "All outcomes"}</option>
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {t(`admin.benchmarks.outcomes.${o}`)}
                  </option>
                ))}
              </select>

              <select
                value={selectedCompetency || ""}
                onChange={(e) => setSelectedCompetency(e.target.value || null)}
                className="text-sm px-3 py-1.5 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)]"
              >
                <option value="">
                  {lang === "es" ? "Todas las métricas" : "All metrics"}
                </option>
                {availableMetrics.map((key) => (
                  <option key={key} value={key}>
                    {getMetricLabel(key, t, lang)}
                  </option>
                ))}
              </select>

              {(selectedOutcome || selectedCompetency) && (
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedOutcome(null);
                    setSelectedCompetency(null);
                  }}
                >
                  {lang === "es" ? "Limpiar" : "Clear"}
                </AdminButton>
              )}
            </div>
          </div>

          <p className="text-sm text-[var(--rowi-muted)] mb-4">
            {lang === "es"
              ? `Mostrando ${filteredCorrelations.length} correlaciones ordenadas por fuerza`
              : `Showing ${filteredCorrelations.length} correlations sorted by strength`}
          </p>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredCorrelations.map((corr) => (
              <div
                key={corr.id}
                className={`p-3 rounded-lg border transition-all ${
                  corr.direction === "positive"
                    ? "border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                    : "border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {corr.direction === "positive" ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--rowi-foreground)]">
                          {getMetricLabel(corr.competencyKey, t, lang)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[var(--rowi-muted)]" />
                        <span className="text-[var(--rowi-foreground)]">
                          {t(`admin.benchmarks.outcomes.${corr.outcomeKey}`)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--rowi-muted)]">
                        n = {corr.n.toLocaleString()} {lang === "es" ? "registros" : "records"}
                        {corr.pValue && ` • p < ${corr.pValue.toFixed(4)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AdminBadge
                      variant={
                        corr.strength === "strong"
                          ? "success"
                          : corr.strength === "moderate"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {getStrengthLabel(corr.strength, lang)}
                    </AdminBadge>
                    <span
                      className={`text-xl font-bold ${
                        corr.direction === "positive" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {corr.correlation > 0 ? "+" : ""}
                      {corr.correlation.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      ) : null}
    </AdminPage>
  );
}

// =========================================================
// Reusable sub-components
// =========================================================

function HeatmapLegend({ lang }: { lang: string }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-4 text-xs">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded bg-red-500"></div>
        <span>{lang === "es" ? "Negativa fuerte" : "Strong negative"}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded bg-gray-200"></div>
        <span>{lang === "es" ? "Débil" : "Weak"}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded bg-green-500"></div>
        <span>{lang === "es" ? "Positiva fuerte" : "Strong positive"}</span>
      </div>
    </div>
  );
}

function HeatmapCell({
  corr,
  label,
  lang,
  onClick,
}: {
  corr: Correlation;
  label: string;
  lang: string;
  onClick: () => void;
}) {
  return (
    <div
      className={`p-1.5 rounded cursor-pointer transition-transform hover:scale-110 ${getCorrelationColor(corr.correlation)}`}
      title={`${label}: ${corr.correlation.toFixed(3)} (${getStrengthLabel(corr.strength, lang)}, n=${corr.n})`}
      onClick={onClick}
    >
      {corr.correlation.toFixed(2)}
    </div>
  );
}
