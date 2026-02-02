"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { upload } from "@vercel/blob/client";
import {
  FlaskConical,
  Database,
  TrendingUp,
  Target,
  BarChart3,
  Loader2,
  AlertCircle,
  Users,
  Download,
  RefreshCw,
  Eye,
  FileUp,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  X,
  Upload,
  FileSpreadsheet,
  Zap,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useUserContext } from "@/contexts/UserContextProvider";

/* =========================================================
   📊 Research Page - Investigador Académico
   Usa las APIs existentes de /api/admin/benchmarks
========================================================= */

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TabType = "benchmarks" | "top-performers" | "correlations";

const TABS: { id: TabType; labelES: string; labelEN: string; icon: React.ElementType }[] = [
  { id: "benchmarks", labelES: "Benchmarks", labelEN: "Benchmarks", icon: Database },
  { id: "top-performers", labelES: "Top Performers", labelEN: "Top Performers", icon: Target },
  { id: "correlations", labelES: "Correlaciones", labelEN: "Correlations", icon: TrendingUp },
];

const BENCHMARK_TYPES = [
  { value: "ROWIVERSE", label: "Rowiverse (Global)" },
  { value: "EXTERNAL", label: "External" },
  { value: "INTERNAL", label: "Internal" },
];

const BENCHMARK_SCOPES = [
  { value: "GLOBAL", label: "Global" },
  { value: "REGION", label: "Region" },
  { value: "COUNTRY", label: "Country" },
  { value: "SECTOR", label: "Sector" },
  { value: "TENANT", label: "Tenant" },
  { value: "HUB", label: "Hub" },
  { value: "COMMUNITY", label: "Community" },
];

export default function ResearchPage() {
  const { lang } = useI18n();
  const { currentContext, getContextsOfType } = useUserContext();

  const [activeTab, setActiveTab] = useState<TabType>("benchmarks");
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filtrar benchmarks por contexto actual si es una comunidad
  const contextFilter = currentContext?.type === "community" && currentContext?.id
    ? `?communityId=${currentContext.id}`
    : "";

  // Fetch benchmarks list
  const { data: benchmarksData, error: benchmarksError, isLoading: benchmarksLoading, mutate: refreshBenchmarks } = useSWR(
    `/api/admin/benchmarks${contextFilter}`,
    fetcher
  );

  // Fetch top performers para el benchmark seleccionado
  const { data: topPerformersData, isLoading: topPerformersLoading, mutate: refreshTopPerformers } = useSWR(
    selectedBenchmarkId && activeTab === "top-performers"
      ? `/api/admin/benchmarks/${selectedBenchmarkId}/top-performers`
      : null,
    fetcher
  );

  // Fetch correlaciones
  const { data: correlationsData, isLoading: correlationsLoading, mutate: refreshCorrelations } = useSWR(
    selectedBenchmarkId && activeTab === "correlations"
      ? `/api/admin/benchmarks/${selectedBenchmarkId}/correlations`
      : null,
    fetcher
  );

  const benchmarks = benchmarksData?.benchmarks || [];
  const communities = getContextsOfType("community");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FlaskConical className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {lang === "es" ? "Centro de Investigación" : "Research Center"}
                </h1>
                <p className="text-violet-200">
                  {currentContext?.type === "community"
                    ? `${currentContext.name} - ${lang === "es" ? "Datos de comunidad" : "Community data"}`
                    : lang === "es" ? "Todos los benchmarks" : "All benchmarks"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-violet-700 rounded-lg hover:bg-violet-50 transition-colors font-medium"
              >
                <FileUp className="w-4 h-4" />
                {lang === "es" ? "Subir Benchmark" : "Upload Benchmark"}
              </button>
              <button
                onClick={() => refreshBenchmarks()}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title={lang === "es" ? "Actualizar" : "Refresh"}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-violet-700 shadow-lg"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {lang === "es" ? tab.labelES : tab.labelEN}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {benchmarksError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">
              {lang === "es" ? "Error al cargar benchmarks" : "Error loading benchmarks"}
            </p>
          </div>
        )}

        {/* Benchmark selector */}
        {(activeTab === "top-performers" || activeTab === "correlations") && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {lang === "es" ? "Seleccionar Benchmark" : "Select Benchmark"}
            </label>
            <select
              value={selectedBenchmarkId || ""}
              onChange={(e) => setSelectedBenchmarkId(e.target.value || null)}
              className="w-full md:w-96 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
            >
              <option value="">{lang === "es" ? "-- Seleccionar --" : "-- Select --"}</option>
              {benchmarks.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b._count?.dataPoints || 0} {lang === "es" ? "puntos" : "points"})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tab: Benchmarks List */}
        {activeTab === "benchmarks" && (
          <BenchmarksTab
            benchmarks={benchmarks}
            isLoading={benchmarksLoading}
            lang={lang}
            onSelectBenchmark={(id) => {
              setSelectedBenchmarkId(id);
              setActiveTab("top-performers");
            }}
            onRefresh={refreshBenchmarks}
          />
        )}

        {/* Tab: Top Performers */}
        {activeTab === "top-performers" && (
          <TopPerformersTab
            data={topPerformersData}
            isLoading={topPerformersLoading}
            benchmarkId={selectedBenchmarkId}
            lang={lang}
            onGenerate={refreshTopPerformers}
          />
        )}

        {/* Tab: Correlations */}
        {activeTab === "correlations" && (
          <CorrelationsTab
            data={correlationsData}
            isLoading={correlationsLoading}
            benchmarkId={selectedBenchmarkId}
            lang={lang}
            onCalculate={refreshCorrelations}
          />
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadBenchmarkModal
            lang={lang}
            communities={communities}
            currentCommunityId={currentContext?.type === "community" ? currentContext.id : null}
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false);
              refreshBenchmarks();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   📋 Tab: Lista de Benchmarks
========================================================= */
function BenchmarksTab({
  benchmarks,
  isLoading,
  lang,
  onSelectBenchmark,
  onRefresh,
}: {
  benchmarks: any[];
  isLoading: boolean;
  lang: string;
  onSelectBenchmark: (id: string) => void;
  onRefresh: () => void;
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Generar Top Performers
  const handleGenerateTopPerformers = async (benchmarkId: string) => {
    setGeneratingId(benchmarkId);
    try {
      const res = await fetch(`/api/admin/benchmarks/${benchmarkId}/top-performers/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Error generating top performers:", err);
    } finally {
      setGeneratingId(null);
    }
  };

  // Calcular Correlaciones
  const handleCalculateCorrelations = async (benchmarkId: string) => {
    setProcessingId(benchmarkId);
    try {
      const res = await fetch(`/api/admin/benchmarks/${benchmarkId}/correlations/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Error calculating correlations:", err);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!benchmarks.length) {
    return (
      <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
        <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 mb-4">
          {lang === "es" ? "No hay benchmarks disponibles" : "No benchmarks available"}
        </p>
        <p className="text-sm text-gray-400">
          {lang === "es" ? "Sube un archivo CSV o Excel para comenzar" : "Upload a CSV or Excel file to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {benchmarks.map((bench: any) => (
        <motion.div
          key={bench.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {bench.name}
                </h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  bench.status === "READY"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : bench.status === "PROCESSING"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-400"
                }`}>
                  {bench.status}
                </span>
                <span className="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-full">
                  {bench.type}
                </span>
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  {bench.scope}
                </span>
              </div>

              {bench.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {bench.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mt-3 text-sm flex-wrap">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <BarChart3 className="w-4 h-4" />
                  <span>{bench._count?.dataPoints || 0} {lang === "es" ? "puntos" : "points"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <Target className="w-4 h-4" />
                  <span>{bench._count?.topPerformers || 0} top performers</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>{bench._count?.correlations || 0} {lang === "es" ? "correlaciones" : "correlations"}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Generate Top Performers */}
              <button
                onClick={() => handleGenerateTopPerformers(bench.id)}
                disabled={generatingId === bench.id || bench.status !== "READY"}
                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50"
                title={lang === "es" ? "Generar Top Performers" : "Generate Top Performers"}
              >
                {generatingId === bench.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Target className="w-5 h-5" />
                )}
              </button>

              {/* Calculate Correlations */}
              <button
                onClick={() => handleCalculateCorrelations(bench.id)}
                disabled={processingId === bench.id || bench.status !== "READY"}
                className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors disabled:opacity-50"
                title={lang === "es" ? "Calcular Correlaciones" : "Calculate Correlations"}
              >
                {processingId === bench.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <TrendingUp className="w-5 h-5" />
                )}
              </button>

              {/* View Analysis */}
              <button
                onClick={() => onSelectBenchmark(bench.id)}
                className="p-2 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                title={lang === "es" ? "Ver análisis" : "View analysis"}
              >
                <Eye className="w-5 h-5" />
              </button>

              {/* Export */}
              <button
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                title={lang === "es" ? "Exportar" : "Export"}
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* =========================================================
   🎯 Tab: Top Performers
========================================================= */
function TopPerformersTab({
  data,
  isLoading,
  benchmarkId,
  lang,
  onGenerate,
}: {
  data: any;
  isLoading: boolean;
  benchmarkId: string | null;
  lang: string;
  onGenerate: () => void;
}) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!benchmarkId) return;
    setGenerating(true);
    try {
      await fetch(`/api/admin/benchmarks/${benchmarkId}/top-performers/generate`, {
        method: "POST",
      });
      onGenerate();
    } finally {
      setGenerating(false);
    }
  };

  if (!benchmarkId) {
    return (
      <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
        <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">
          {lang === "es" ? "Selecciona un benchmark" : "Select a benchmark"}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const topPerformers = data?.topPerformers || [];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {lang === "es" ? "Análisis Top Performers" : "Top Performers Analysis"}
          </h3>
          <p className="text-sm text-gray-500">
            {topPerformers.length} {lang === "es" ? "outcomes analizados" : "outcomes analyzed"}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {lang === "es" ? "Regenerar" : "Regenerate"}
        </button>
      </div>

      {!topPerformers.length ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
          <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            {lang === "es" ? "No hay datos de top performers" : "No top performer data"}
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            {lang === "es" ? "Generar ahora" : "Generate now"}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {topPerformers.map((tp: any) => (
            <motion.div
              key={tp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {tp.outcomeKey}
                  </h4>
                  <p className="text-sm text-gray-500">
                    n = {tp.sampleSize} | {lang === "es" ? "Confianza" : "Confidence"}:
                    <span className={`ml-1 ${
                      tp.confidenceLevel === "high" ? "text-green-600" :
                      tp.confidenceLevel === "medium" ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {tp.confidenceLevel}
                    </span>
                  </p>
                </div>
                {tp.thresholdValue && (
                  <div className="text-right">
                    <span className="text-xs text-gray-500">P90</span>
                    <p className="font-mono text-lg font-bold text-violet-600">
                      {typeof tp.thresholdValue === 'number' ? tp.thresholdValue.toFixed(1) : tp.thresholdValue}
                    </p>
                  </div>
                )}
              </div>

              {/* Top Competencies */}
              {tp.topCompetencies && tp.topCompetencies.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {lang === "es" ? "Competencias Clave" : "Key Competencies"}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {tp.topCompetencies.slice(0, 5).map((comp: any, idx: number) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm ${
                          comp.isSignificant
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : "bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {comp.key || comp.competencyKey}: {(comp.effectSize || 0).toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              {tp.statistics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-zinc-700">
                  <div>
                    <span className="text-xs text-gray-500">{lang === "es" ? "Comp. Significativas" : "Significant Comp."}</span>
                    <p className="font-semibold">{tp.statistics.significantCompetencies || 0}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{lang === "es" ? "Talentos Signif." : "Significant Talents"}</span>
                    <p className="font-semibold">{tp.statistics.significantTalents || 0}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{lang === "es" ? "Effect Size Prom." : "Avg Effect Size"}</span>
                    <p className="font-semibold">{(tp.statistics.avgEffectSizeCompetencies || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{lang === "es" ? "Población" : "Population"}</span>
                    <p className="font-semibold">{tp.totalPopulation || 0}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   📈 Tab: Correlaciones
========================================================= */
function CorrelationsTab({
  data,
  isLoading,
  benchmarkId,
  lang,
  onCalculate,
}: {
  data: any;
  isLoading: boolean;
  benchmarkId: string | null;
  lang: string;
  onCalculate: () => void;
}) {
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!benchmarkId) return;
    setCalculating(true);
    try {
      await fetch(`/api/admin/benchmarks/${benchmarkId}/correlations/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      onCalculate();
    } finally {
      setCalculating(false);
    }
  };

  if (!benchmarkId) {
    return (
      <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
        <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">
          {lang === "es" ? "Selecciona un benchmark" : "Select a benchmark"}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const grouped = data?.grouped || {};
  const outcomes = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {lang === "es" ? "Análisis de Correlaciones" : "Correlations Analysis"}
          </h3>
          <p className="text-sm text-gray-500">
            {data?.total || 0} {lang === "es" ? "correlaciones en" : "correlations across"} {outcomes.length} outcomes
          </p>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {calculating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {lang === "es" ? "Recalcular" : "Recalculate"}
        </button>
      </div>

      {!outcomes.length ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            {lang === "es" ? "No hay correlaciones calculadas" : "No correlations calculated"}
          </p>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            {lang === "es" ? "Calcular ahora" : "Calculate now"}
          </button>
        </div>
      ) : (
        outcomes.map((outcomeKey) => (
          <motion.div
            key={outcomeKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-5"
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white capitalize mb-4">
              {outcomeKey}
            </h4>

            <div className="space-y-2">
              {grouped[outcomeKey].map((corr: any) => (
                <div
                  key={corr.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {corr.competencyKey}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      corr.strength === "strong"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : corr.strength === "moderate"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-gray-100 text-gray-600 dark:bg-zinc-600 dark:text-gray-400"
                    }`}>
                      {corr.strength}
                    </span>
                    <span className={`font-mono font-bold ${
                      corr.correlation >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {corr.correlation > 0 ? "+" : ""}{corr.correlation.toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

/* =========================================================
   📤 Modal: Subir Benchmark
========================================================= */
function UploadBenchmarkModal({
  lang,
  communities,
  currentCommunityId,
  onClose,
  onSuccess,
}: {
  lang: string;
  communities: any[];
  currentCommunityId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("INTERNAL");
  const [scope, setScope] = useState("GLOBAL");
  const [communityId, setCommunityId] = useState(currentCommunityId || "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file || !name.trim()) {
      setError(lang === "es" ? "Nombre y archivo son requeridos" : "Name and file are required");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      // 1. Subir archivo a Vercel Blob usando la API existente
      setProgress(20);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/benchmarks/blob-token",
      });

      setProgress(50);

      // 2. Iniciar procesamiento usando la API existente
      const res = await fetch("/api/admin/benchmarks/start-processing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          name: name.trim(),
          type,
          scope,
          isLearning: false,
        }),
      });

      setProgress(80);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar");
      }

      setProgress(100);
      setTimeout(() => onSuccess(), 500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {lang === "es" ? "Subir Benchmark" : "Upload Benchmark"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {lang === "es" ? "Nombre" : "Name"} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === "es" ? "Nombre del benchmark" : "Benchmark name"}
              className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {lang === "es" ? "Tipo" : "Type"}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
            >
              {BENCHMARK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {lang === "es" ? "Alcance" : "Scope"}
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-violet-500 outline-none"
            >
              {BENCHMARK_SCOPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {lang === "es" ? "Archivo (CSV/Excel)" : "File (CSV/Excel)"} *
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                file
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20"
                  : "border-gray-300 dark:border-zinc-600 hover:border-violet-400"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-violet-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">
                    {lang === "es" ? "Click para seleccionar archivo" : "Click to select file"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">CSV, XLSX, XLS (max 500MB)</p>
                </>
              )}
            </div>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {lang === "es" ? "Procesando..." : "Processing..."}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-violet-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {lang === "es" ? "Cancelar" : "Cancel"}
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !file || !name.trim()}
              className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {lang === "es" ? "Subir" : "Upload"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
