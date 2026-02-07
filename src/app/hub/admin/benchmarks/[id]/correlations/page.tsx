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
   📊 Correlations Page — Visualización completa de correlaciones

   Muestra cómo las competencias EQ se correlacionan con outcomes
   de vida/trabajo. Incluye:
   - Heatmap visual
   - Filtros por outcome/competencia
   - Explicaciones educativas
   - Insights automáticos
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
}

interface Benchmark {
  id: string;
  name: string;
  totalRows: number;
}

// Mapeo de competencias EQ
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

// Colores para el heatmap
function getCorrelationColor(value: number): string {
  const absValue = Math.abs(value);
  if (value > 0) {
    // Positivo: verde
    if (absValue >= 0.5) return "bg-green-600 text-white";
    if (absValue >= 0.3) return "bg-green-500 text-white";
    if (absValue >= 0.2) return "bg-green-400 text-white";
    if (absValue >= 0.1) return "bg-green-300 text-green-900";
    return "bg-green-100 text-green-800";
  } else {
    // Negativo: rojo
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

export default function CorrelationsPage() {
  const { t, lang } = useI18n();
  const params = useParams();
  const id = params.id as string;

  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const [viewMode, setViewMode] = useState<"heatmap" | "list">("heatmap");

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
          setCorrelations(correlationsData.correlations);
        }
      } catch (error) {
        toast.error(t("common.error"));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // Crear matriz para heatmap
  const correlationMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, Correlation | null>> = {};

    for (const outcome of OUTCOMES) {
      matrix[outcome] = {};
      for (const comp of EQ_COMPETENCIES) {
        matrix[outcome][comp.key] = null;
      }
    }

    for (const corr of correlations) {
      if (matrix[corr.outcomeKey] && EQ_COMPETENCIES.find(c => c.key === corr.competencyKey)) {
        matrix[corr.outcomeKey][corr.competencyKey] = corr;
      }
    }

    return matrix;
  }, [correlations]);

  // Filtrar correlaciones para la lista
  const filteredCorrelations = useMemo(() => {
    let filtered = [...correlations];

    if (selectedOutcome) {
      filtered = filtered.filter(c => c.outcomeKey === selectedOutcome);
    }
    if (selectedCompetency) {
      filtered = filtered.filter(c => c.competencyKey === selectedCompetency);
    }

    return filtered.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [correlations, selectedOutcome, selectedCompetency]);

  // Top insights
  const topInsights = useMemo(() => {
    const sorted = [...correlations].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    return sorted.slice(0, 5);
  }, [correlations]);

  // Textos educativos
  const explanationTexts = {
    es: {
      title: "¿Qué son las correlaciones?",
      description: "Las correlaciones muestran la relación estadística entre las competencias de Inteligencia Emocional (EQ) y los resultados de vida/trabajo. Un valor de correlación va de -1 a +1:",
      positive: "Correlación positiva (+): Cuando una competencia EQ aumenta, el outcome también tiende a aumentar.",
      negative: "Correlación negativa (-): Cuando una competencia EQ aumenta, el outcome tiende a disminuir.",
      strength: "La fuerza indica qué tan confiable es la relación:",
      strong: "Fuerte (|r| > 0.5): Relación muy confiable",
      moderate: "Moderada (0.3 < |r| < 0.5): Relación notable",
      weak: "Débil (|r| < 0.3): Relación ligera",
      howToUse: "¿Cómo usar esto?",
      howToUseDesc: "Identifica qué competencias EQ tienen mayor impacto en los outcomes que te interesan. Enfoca el desarrollo en las competencias con correlaciones más fuertes.",
    },
    en: {
      title: "What are correlations?",
      description: "Correlations show the statistical relationship between Emotional Intelligence (EQ) competencies and life/work outcomes. A correlation value ranges from -1 to +1:",
      positive: "Positive correlation (+): When an EQ competency increases, the outcome also tends to increase.",
      negative: "Negative correlation (-): When an EQ competency increases, the outcome tends to decrease.",
      strength: "Strength indicates how reliable the relationship is:",
      strong: "Strong (|r| > 0.5): Very reliable relationship",
      moderate: "Moderate (0.3 < |r| < 0.5): Notable relationship",
      weak: "Weak (|r| < 0.3): Slight relationship",
      howToUse: "How to use this?",
      howToUseDesc: "Identify which EQ competencies have the greatest impact on outcomes that interest you. Focus development on competencies with stronger correlations.",
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
              {correlations.length} {lang === "es" ? "correlaciones calculadas" : "correlations calculated"} •
              {benchmark?.totalRows.toLocaleString()} {lang === "es" ? "registros" : "records"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {correlations.filter(c => c.strength === "strong").length}
              </p>
              <p className="text-xs text-[var(--rowi-muted)]">
                {lang === "es" ? "Fuertes" : "Strong"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {correlations.filter(c => c.strength === "moderate").length}
              </p>
              <p className="text-xs text-[var(--rowi-muted)]">
                {lang === "es" ? "Moderadas" : "Moderate"}
              </p>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Explicación educativa (colapsable) */}
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
      <AdminCard className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--rowi-foreground)]">
              {lang === "es" ? "Correlaciones más fuertes" : "Strongest Correlations"}
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
                  {t(`admin.benchmarks.metrics.${corr.competencyKey}`)}
                </span>
                <ArrowRight className="w-3 h-3 text-[var(--rowi-muted)]" />
                <span className="text-[var(--rowi-muted)]">
                  {t(`admin.benchmarks.outcomes.${corr.outcomeKey}`)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Vista Principal */}
      {viewMode === "heatmap" ? (
        /* =========== HEATMAP =========== */
        <AdminCard>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-[var(--rowi-primary)]" />
            <h3 className="font-semibold text-[var(--rowi-foreground)]">
              {lang === "es" ? "Matriz de Correlaciones" : "Correlation Matrix"}
            </h3>
          </div>

          {/* Leyenda de colores */}
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

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left text-[var(--rowi-muted)] font-medium">
                    {lang === "es" ? "Outcome" : "Outcome"}
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
                      const corr = correlationMatrix[outcome]?.[comp.key];
                      return (
                        <td key={comp.key} className="p-1 text-center">
                          {corr ? (
                            <div
                              className={`p-2 rounded cursor-pointer transition-transform hover:scale-110 ${getCorrelationColor(
                                corr.correlation
                              )}`}
                              title={`${t(`admin.benchmarks.metrics.${comp.key}`)} → ${t(
                                `admin.benchmarks.outcomes.${outcome}`
                              )}: ${corr.correlation.toFixed(3)} (${getStrengthLabel(corr.strength, lang)}, n=${corr.n})`}
                              onClick={() => {
                                setSelectedCompetency(comp.key);
                                setSelectedOutcome(outcome);
                                setViewMode("list");
                              }}
                            >
                              {corr.correlation.toFixed(2)}
                            </div>
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
      ) : (
        /* =========== LISTA =========== */
        <AdminCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-[var(--rowi-primary)]" />
              <h3 className="font-semibold text-[var(--rowi-foreground)]">
                {lang === "es" ? "Lista de Correlaciones" : "Correlation List"}
              </h3>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2">
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
                <option value="">{lang === "es" ? "Todas las competencias" : "All competencies"}</option>
                {EQ_COMPETENCIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {t(`admin.benchmarks.metrics.${c.key}`)} ({c.key})
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
                          {t(`admin.benchmarks.metrics.${corr.competencyKey}`)}
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
                          : "default"
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
      )}
    </AdminPage>
  );
}
