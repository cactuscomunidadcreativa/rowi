"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  GitCompareArrows,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Users,
  Award,
  Download,
  RefreshCw,
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
  Layers,
  Filter,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminBadge,
  AdminButton,
} from "@/components/admin/AdminPage";

interface Benchmark {
  id: string;
  name: string;
  type: string;
  scope: string;
  status: string;
  totalRows: number;
  createdAt: string;
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FiltersData {
  countries: FilterOption[];
  regions: FilterOption[];
  sectors: FilterOption[];
  jobFunctions: FilterOption[];
  jobRoles: FilterOption[];
  ageRanges: FilterOption[];
  genders: FilterOption[];
  educations: FilterOption[];
  years: FilterOption[];
}

interface SegmentFilter {
  name: string;
  country?: string;
  region?: string;
  sector?: string;
  jobFunction?: string;
  jobRole?: string;
  ageRange?: string;
  gender?: string;
  education?: string;
  year?: string;
}

interface StatData {
  n: number;
  mean: number;
  median: number;
  stdDev: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
}

interface ComparisonData {
  statistics: Record<string, Record<string, StatData>>;
  topPerformers?: Record<string, Record<string, any>>;
  differences: Record<string, Record<string, { meanDiff: number; meanDiffPercent: number; medianDiff: number }>>;
  significantDifferences: Array<{ metric: string; avgAbsDiffPercent: number }>;
}

interface SegmentSummary {
  name: string;
  filters: SegmentFilter;
  sampleSize: number;
  avgK?: number;
  avgC?: number;
  avgG?: number;
  topCompetencies: Array<{ key: string; mean: number }>;
}

const METRIC_GROUPS = {
  core: ["K", "C", "G"],
  competencies: ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"],
  outcomes: [
    "effectiveness", "relationships", "qualityOfLife", "wellbeing",
    "influence", "decisionMaking", "community", "network",
    "achievement", "satisfaction", "balance", "health",
  ],
  talents: [
    "dataMining", "modeling", "prioritizing", "connection", "emotionalInsight", "collaboration",
    "reflecting", "adaptability", "criticalThinking", "resilience", "riskTolerance", "imagination",
    "proactivity", "commitment", "problemSolving", "vision", "designing", "entrepreneurship",
  ],
};

export default function CompareBenchmarksPage() {
  const { t } = useI18n();

  // Mode: "benchmarks" or "segments"
  const [mode, setMode] = useState<"benchmarks" | "segments">("segments");

  // Benchmarks mode state
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparedBenchmarks, setComparedBenchmarks] = useState<Benchmark[]>([]);

  // Segments mode state
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>("");
  const [filtersData, setFiltersData] = useState<FiltersData | null>(null);
  const [segments, setSegments] = useState<SegmentFilter[]>([
    { name: "Segmento 1" },
    { name: "Segmento 2" },
  ]);
  const [segmentSummaries, setSegmentSummaries] = useState<SegmentSummary[]>([]);

  // Shared state
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "summary">("stats");

  // Load benchmarks list
  useEffect(() => {
    async function loadBenchmarks() {
      try {
        const res = await fetch("/api/admin/benchmarks");
        const data = await res.json();
        if (data.ok) {
          const completed = data.benchmarks.filter((b: Benchmark) => b.status === "COMPLETED");
          setBenchmarks(completed);
          // Auto-select first benchmark for segments mode
          if (completed.length > 0 && !selectedBenchmarkId) {
            setSelectedBenchmarkId(completed[0].id);
          }
        }
      } catch (error) {
        toast.error(t("common.error"));
      } finally {
        setLoading(false);
      }
    }
    loadBenchmarks();
  }, []);

  // Load filter options when benchmark selected (segments mode)
  useEffect(() => {
    if (mode === "segments" && selectedBenchmarkId) {
      loadFiltersData();
    }
  }, [mode, selectedBenchmarkId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadFiltersData() {
    if (!selectedBenchmarkId) return;

    try {
      const res = await fetch(`/api/admin/benchmarks/${selectedBenchmarkId}`);
      const data = await res.json();

      if (data.ok && data.benchmark) {
        setFiltersData({
          countries: data.benchmark.countries || [],
          regions: data.benchmark.regions || [],
          sectors: data.benchmark.sectors || [],
          jobFunctions: data.benchmark.jobFunctions || [],
          jobRoles: data.benchmark.jobRoles || [],
          ageRanges: data.benchmark.ageRanges || [],
          genders: data.benchmark.genders || [],
          educations: data.benchmark.educations || [],
          years: data.benchmark.years || [],
        });
      }
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  }

  const toggleBenchmarkSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev
    );
  };

  const updateSegment = (index: number, field: keyof SegmentFilter, value: string) => {
    setSegments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSegment = () => {
    if (segments.length < 4) {
      setSegments((prev) => [...prev, { name: `Segmento ${prev.length + 1}` }]);
    }
  };

  const removeSegment = (index: number) => {
    if (segments.length > 2) {
      setSegments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const runComparison = async () => {
    if (mode === "benchmarks") {
      await compareBenchmarks();
    } else {
      await compareSegments();
    }
  };

  const compareBenchmarks = async () => {
    if (selectedIds.length < 2) {
      toast.error(t("admin.benchmarks.compare.selectAtLeast2"));
      return;
    }

    setComparing(true);
    try {
      const res = await fetch("/api/admin/benchmarks/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benchmarkIds: selectedIds }),
      });
      const data = await res.json();

      if (data.ok) {
        setComparison(data.comparison);
        setComparedBenchmarks(data.benchmarks);
        setSegmentSummaries([]);
        toast.success(t("admin.benchmarks.compare.success"));
      } else {
        toast.error(data.error || t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setComparing(false);
    }
  };

  const compareSegments = async () => {
    if (!selectedBenchmarkId) {
      toast.error(t("admin.benchmarks.compare.selectBenchmark"));
      return;
    }

    // Validate segments have at least one filter
    const validSegments = segments.filter((s) =>
      s.country || s.region || s.sector || s.jobFunction || s.jobRole || s.ageRange || s.gender || s.education || s.year
    );

    if (validSegments.length < 2) {
      toast.error(t("admin.benchmarks.compare.defineSegments"));
      return;
    }

    setComparing(true);
    try {
      const res = await fetch(`/api/admin/benchmarks/${selectedBenchmarkId}/compare-segments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments }),
      });
      const data = await res.json();

      if (data.ok) {
        setComparison(data.comparison);
        setSegmentSummaries(data.segments);
        setComparedBenchmarks([]);
        toast.success(t("admin.benchmarks.compare.success"));
      } else {
        toast.error(data.error || t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setComparing(false);
    }
  };

  const getDiffIndicator = (diffPercent: number) => {
    if (Math.abs(diffPercent) < 1) {
      return { icon: Minus, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800" };
    }
    if (diffPercent > 0) {
      return { icon: TrendingUp, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" };
    }
    return { icon: TrendingDown, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" };
  };

  const exportToCSV = () => {
    if (!comparison) return;

    const columnNames = mode === "benchmarks"
      ? comparedBenchmarks.map((b) => b.name)
      : segmentSummaries.map((s) => s.name);

    if (columnNames.length === 0) return;

    const headers = ["Metrica", ...columnNames, "Diferencia %"];
    const rows: string[][] = [];

    Object.entries(comparison.statistics).forEach(([metric, data]) => {
      const row = [t(`admin.benchmarks.metrics.${metric}`) || metric];

      if (mode === "benchmarks") {
        comparedBenchmarks.forEach((b) => {
          const stat = data[b.id];
          row.push(stat ? stat.mean.toFixed(2) : "-");
        });
      } else {
        segmentSummaries.forEach((s) => {
          const stat = data[s.name];
          row.push(stat ? stat.mean.toFixed(2) : "-");
        });
      }

      const diffs = comparison.differences[metric];
      if (diffs) {
        const diffValues = Object.values(diffs);
        if (diffValues.length > 0) {
          row.push(diffValues[0].meanDiffPercent.toFixed(2) + "%");
        } else {
          row.push("-");
        }
      } else {
        row.push("-");
      }
      rows.push(row);
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `comparison-${mode}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("admin.benchmarks.compare.exported"));
  };

  const renderFilterSelect = (
    segmentIndex: number,
    field: keyof SegmentFilter,
    options: FilterOption[],
    label: string
  ) => (
    <div className="flex-1 min-w-[120px]">
      <label className="block text-xs text-[var(--rowi-muted)] mb-1">{label}</label>
      <select
        value={(segments[segmentIndex][field] as string) || ""}
        onChange={(e) => updateSegment(segmentIndex, field, e.target.value)}
        className="w-full px-2 py-1.5 text-xs rounded border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)]"
      >
        <option value="">Todos</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} {opt.count ? `(${opt.count})` : ""}
          </option>
        ))}
      </select>
    </div>
  );

  // Get column names based on mode
  const getColumnNames = () => {
    if (mode === "benchmarks") {
      return comparedBenchmarks.map((b) => ({ id: b.id, name: b.name }));
    }
    return segmentSummaries.map((s) => ({ id: s.name, name: s.name }));
  };

  return (
    <AdminPage
      titleKey="admin.benchmarks.compare.title"
      descriptionKey="admin.benchmarks.compare.description"
      icon={GitCompareArrows}
      loading={loading}
    >
      {/* Mode Selector */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => { setMode("segments"); setComparison(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "segments"
              ? "bg-[var(--rowi-primary)] text-white"
              : "bg-[var(--rowi-card)] text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] border border-[var(--rowi-card-border)]"
          }`}
        >
          <Filter className="w-4 h-4" />
          {t("admin.benchmarks.compare.compareSegments")}
        </button>
        <button
          onClick={() => { setMode("benchmarks"); setComparison(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === "benchmarks"
              ? "bg-[var(--rowi-primary)] text-white"
              : "bg-[var(--rowi-card)] text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] border border-[var(--rowi-card-border)]"
          }`}
        >
          <Layers className="w-4 h-4" />
          {t("admin.benchmarks.compare.compareBenchmarks")}
        </button>
      </div>

      {/* SEGMENTS MODE */}
      {mode === "segments" && (
        <AdminCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                  {t("admin.benchmarks.compare.defineSegmentsTitle")}
                </h3>
                <p className="text-xs text-[var(--rowi-muted)]">
                  {t("admin.benchmarks.compare.defineSegmentsDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {segments.length < 4 && (
                <AdminButton variant="secondary" size="sm" onClick={addSegment} icon={Plus}>
                  {t("admin.benchmarks.compare.addSegment")}
                </AdminButton>
              )}
              <AdminButton
                variant="primary"
                size="sm"
                onClick={runComparison}
                disabled={comparing}
                icon={comparing ? RefreshCw : GitCompareArrows}
              >
                {comparing ? t("common.processing") : t("admin.benchmarks.compare.compare")}
              </AdminButton>
            </div>
          </div>

          {/* Benchmark Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-2">
              {t("admin.benchmarks.compare.selectBaseBenchmark")}
            </label>
            <select
              value={selectedBenchmarkId}
              onChange={(e) => setSelectedBenchmarkId(e.target.value)}
              className="w-full md:w-96 px-3 py-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)]"
            >
              {benchmarks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.totalRows?.toLocaleString() || 0} registros)
                </option>
              ))}
            </select>
          </div>

          {/* Segments Definition */}
          <div className="space-y-4">
            {segments.map((segment, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-2 ${idx === 0 ? "border-[var(--rowi-primary)]" : "border-[var(--rowi-card-border)]"} bg-[var(--rowi-background)]`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${idx === 0 ? "bg-[var(--rowi-primary)] text-white" : "bg-[var(--rowi-muted)]/20 text-[var(--rowi-muted)]"}`}>
                      {idx === 0 ? "Base" : `#${idx + 1}`}
                    </span>
                    <input
                      type="text"
                      value={segment.name}
                      onChange={(e) => updateSegment(idx, "name", e.target.value)}
                      className="text-sm font-semibold text-[var(--rowi-foreground)] bg-transparent border-b border-dashed border-[var(--rowi-card-border)] focus:border-[var(--rowi-primary)] outline-none px-1 min-w-[150px]"
                      placeholder={idx === 0 ? "Ej: Latinoamérica" : idx === 1 ? "Ej: Norteamérica" : `Segmento ${idx + 1}`}
                    />
                  </div>
                  {segments.length > 2 && (
                    <button
                      onClick={() => removeSegment(idx)}
                      className="p-1 text-[var(--rowi-muted)] hover:text-red-500 transition-colors"
                      title="Eliminar segmento"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {filtersData ? (
                  <div className="flex flex-wrap gap-2">
                    {filtersData.regions.length > 0 && renderFilterSelect(idx, "region", filtersData.regions, t("admin.benchmarks.stats.region"))}
                    {filtersData.countries.length > 0 && renderFilterSelect(idx, "country", filtersData.countries, t("admin.benchmarks.stats.country"))}
                    {filtersData.sectors.length > 0 && renderFilterSelect(idx, "sector", filtersData.sectors, t("admin.benchmarks.stats.sector"))}
                    {filtersData.jobFunctions.length > 0 && renderFilterSelect(idx, "jobFunction", filtersData.jobFunctions, t("admin.benchmarks.stats.jobFunction"))}
                    {filtersData.genders.length > 0 && renderFilterSelect(idx, "gender", filtersData.genders, t("admin.benchmarks.stats.gender"))}
                    {filtersData.ageRanges.length > 0 && renderFilterSelect(idx, "ageRange", filtersData.ageRanges, t("admin.benchmarks.stats.age"))}
                    {filtersData.years.length > 0 && renderFilterSelect(idx, "year", filtersData.years, t("admin.benchmarks.stats.year"))}
                  </div>
                ) : (
                  <div className="text-xs text-[var(--rowi-muted)] flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {t("common.loading")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* BENCHMARKS MODE */}
      {mode === "benchmarks" && (
        <AdminCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                  {t("admin.benchmarks.compare.selectBenchmarks")}
                </h3>
                <p className="text-xs text-[var(--rowi-muted)]">
                  {t("admin.benchmarks.compare.selectDescription")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AdminBadge variant={selectedIds.length >= 2 ? "success" : "secondary"}>
                {selectedIds.length}/4 {t("admin.benchmarks.compare.selected")}
              </AdminBadge>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={runComparison}
                disabled={comparing || selectedIds.length < 2}
                icon={comparing ? RefreshCw : GitCompareArrows}
              >
                {comparing ? t("common.processing") : t("admin.benchmarks.compare.compare")}
              </AdminButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {benchmarks.map((benchmark) => {
              const isSelected = selectedIds.includes(benchmark.id);
              const order = selectedIds.indexOf(benchmark.id);
              return (
                <button
                  key={benchmark.id}
                  onClick={() => toggleBenchmarkSelection(benchmark.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? "border-[var(--rowi-primary)] bg-[var(--rowi-primary)]/5"
                      : "border-[var(--rowi-card-border)] hover:border-[var(--rowi-primary)]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--rowi-foreground)] truncate">
                      {benchmark.name}
                    </span>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[var(--rowi-primary)] text-white flex items-center justify-center text-xs font-bold">
                        {order + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)]">
                    <Users className="w-3 h-3" />
                    <span>{benchmark.totalRows?.toLocaleString() || 0}</span>
                    <span>-</span>
                    <span>{benchmark.scope}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {benchmarks.length === 0 && !loading && (
            <div className="text-center py-8 text-[var(--rowi-muted)]">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t("admin.benchmarks.compare.noBenchmarks")}</p>
            </div>
          )}
        </AdminCard>
      )}

      {/* RESULTS */}
      {comparison && (getColumnNames().length > 0 || segmentSummaries.length > 0) && (
        <>
          {/* Segment Summaries (only for segments mode) */}
          {mode === "segments" && segmentSummaries.length > 0 && (
            <AdminCard className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-4">
                {t("admin.benchmarks.compare.segmentSummary")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {segmentSummaries.map((segment, idx) => (
                  <div key={segment.name} className={`p-4 rounded-lg border-2 ${idx === 0 ? "border-[var(--rowi-primary)] bg-[var(--rowi-primary)]/5" : "border-[var(--rowi-card-border)]"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {idx === 0 && <span className="text-xs text-[var(--rowi-primary)]">(Base)</span>}
                      <h4 className="text-sm font-semibold text-[var(--rowi-foreground)]">{segment.name}</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--rowi-muted)]">Muestra:</span>
                        <span className="font-bold">{segment.sampleSize.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--rowi-muted)]">K / C / G:</span>
                        <span className="font-medium">
                          {segment.avgK?.toFixed(0) || "-"} / {segment.avgC?.toFixed(0) || "-"} / {segment.avgG?.toFixed(0) || "-"}
                        </span>
                      </div>
                      {segment.topCompetencies.length > 0 && (
                        <div className="pt-2 border-t border-[var(--rowi-card-border)]">
                          <p className="text-[var(--rowi-muted)] mb-1">Top competencias:</p>
                          <div className="flex flex-wrap gap-1">
                            {segment.topCompetencies.map((c) => (
                              <span key={c.key} className="px-1.5 py-0.5 bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] rounded">
                                {t(`admin.benchmarks.metrics.${c.key}`) || c.key}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "stats"
                  ? "bg-[var(--rowi-primary)] text-white"
                  : "bg-[var(--rowi-card)] text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              {t("admin.benchmarks.compare.statistics")}
            </button>
            <div className="flex-1" />
            <AdminButton variant="secondary" size="sm" onClick={exportToCSV} icon={Download}>
              {t("admin.benchmarks.compare.exportCSV")}
            </AdminButton>
          </div>

          {/* Significant Differences */}
          {comparison.significantDifferences.length > 0 && (
            <AdminCard className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
                {t("admin.benchmarks.compare.significantDiffs")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {comparison.significantDifferences.slice(0, 8).map((diff) => (
                  <AdminBadge
                    key={diff.metric}
                    variant={diff.avgAbsDiffPercent > 5 ? "warning" : "info"}
                  >
                    {t(`admin.benchmarks.metrics.${diff.metric}`) || diff.metric}: {diff.avgAbsDiffPercent.toFixed(1)}%
                  </AdminBadge>
                ))}
              </div>
            </AdminCard>
          )}

          {activeTab === "stats" && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {getColumnNames().map((col, idx) => {
                  const kData = comparison.statistics["K"]?.[col.id];
                  const cData = comparison.statistics["C"]?.[col.id];
                  const gData = comparison.statistics["G"]?.[col.id];
                  const effectivenessData = comparison.statistics["effectiveness"]?.[col.id];
                  const wellbeingData = comparison.statistics["wellbeing"]?.[col.id];

                  return (
                    <AdminCard key={col.id} className={`p-4 ${idx === 0 ? "border-2 border-[var(--rowi-primary)]" : ""}`}>
                      <div className="flex items-center gap-2 mb-3">
                        {idx === 0 && <span className="text-xs text-[var(--rowi-primary)] font-medium">(Base)</span>}
                        <h4 className="text-sm font-semibold text-[var(--rowi-foreground)] truncate">{col.name}</h4>
                      </div>
                      <div className="text-xs text-[var(--rowi-muted)] mb-2">
                        n = {kData?.n?.toLocaleString() || 0}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[var(--rowi-muted)]">K / C / G</span>
                          <span className="text-sm font-bold">
                            {kData?.mean?.toFixed(0) || "-"} / {cData?.mean?.toFixed(0) || "-"} / {gData?.mean?.toFixed(0) || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[var(--rowi-muted)]">Efectividad</span>
                          <span className="text-sm font-medium">{effectivenessData?.mean?.toFixed(1) || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[var(--rowi-muted)]">Bienestar</span>
                          <span className="text-sm font-medium">{wellbeingData?.mean?.toFixed(1) || "-"}</span>
                        </div>
                      </div>
                    </AdminCard>
                  );
                })}
              </div>

              {/* Core EQ */}
              <AdminCard className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-4">
                  {t("admin.benchmarks.stats.coreEQ")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--rowi-card-border)]">
                        <th className="text-left py-2 px-3 font-medium text-[var(--rowi-muted)]">
                          {t("admin.benchmarks.stats.metric")}
                        </th>
                        {getColumnNames().map((col, idx) => (
                          <th key={col.id} className="text-center py-2 px-3 font-medium">
                            <span className={`inline-flex items-center gap-1 ${idx === 0 ? "text-[var(--rowi-primary)]" : "text-[var(--rowi-foreground)]"}`}>
                              {idx === 0 && <span className="text-xs">(Base)</span>}
                              {col.name.substring(0, 20)}
                            </span>
                          </th>
                        ))}
                        <th className="text-center py-2 px-3 font-medium text-[var(--rowi-muted)]">
                          {t("admin.benchmarks.compare.difference")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {METRIC_GROUPS.core.map((metric) => {
                        const metricData = comparison.statistics[metric];
                        const diffData = comparison.differences[metric];
                        return (
                          <tr key={metric} className="border-b border-[var(--rowi-card-border)] hover:bg-[var(--rowi-background)]">
                            <td className="py-2 px-3 font-medium">
                              {t(`admin.benchmarks.metrics.${metric}`)}
                            </td>
                            {getColumnNames().map((col) => (
                              <td key={col.id} className="text-center py-2 px-3">
                                {metricData?.[col.id] ? (
                                  <div>
                                    <span className="font-bold">{metricData[col.id].mean?.toFixed(1) || "-"}</span>
                                    <span className="text-xs text-[var(--rowi-muted)] ml-1">
                                      (n={metricData[col.id].n?.toLocaleString() || 0})
                                    </span>
                                  </div>
                                ) : "-"}
                              </td>
                            ))}
                            <td className="text-center py-2 px-3">
                              {diffData && Object.values(diffData)[0] && (() => {
                                const diff = Object.values(diffData)[0];
                                const indicator = getDiffIndicator(diff.meanDiffPercent);
                                const Icon = indicator.icon;
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${indicator.bg} ${indicator.color}`}>
                                    <Icon className="w-3 h-3" />
                                    {diff.meanDiffPercent > 0 ? "+" : ""}{diff.meanDiffPercent.toFixed(1)}%
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AdminCard>

              {/* Competencias */}
              <AdminCard className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-4">
                  {t("admin.benchmarks.stats.competencies")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--rowi-card-border)]">
                        <th className="text-left py-2 px-3 font-medium text-[var(--rowi-muted)]">
                          {t("admin.benchmarks.stats.metric")}
                        </th>
                        {getColumnNames().map((col, idx) => (
                          <th key={col.id} className="text-center py-2 px-3 font-medium">
                            <span className={idx === 0 ? "text-[var(--rowi-primary)]" : "text-[var(--rowi-foreground)]"}>
                              {col.name.substring(0, 20)}
                            </span>
                          </th>
                        ))}
                        <th className="text-center py-2 px-3 font-medium text-[var(--rowi-muted)]">
                          {t("admin.benchmarks.compare.difference")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {METRIC_GROUPS.competencies.map((metric) => {
                        const metricData = comparison.statistics[metric];
                        const diffData = comparison.differences[metric];
                        return (
                          <tr key={metric} className="border-b border-[var(--rowi-card-border)] hover:bg-[var(--rowi-background)]">
                            <td className="py-2 px-3 font-medium">
                              {t(`admin.benchmarks.metrics.${metric}`)}
                            </td>
                            {getColumnNames().map((col) => (
                              <td key={col.id} className="text-center py-2 px-3">
                                {metricData?.[col.id] ? (
                                  <div>
                                    <span className="font-bold">{metricData[col.id].mean?.toFixed(1) || "-"}</span>
                                    <span className="text-xs text-[var(--rowi-muted)] ml-1">
                                      +/-{metricData[col.id].stdDev?.toFixed(1) || 0}
                                    </span>
                                  </div>
                                ) : "-"}
                              </td>
                            ))}
                            <td className="text-center py-2 px-3">
                              {diffData && Object.values(diffData)[0] && (() => {
                                const diff = Object.values(diffData)[0];
                                const indicator = getDiffIndicator(diff.meanDiffPercent);
                                const Icon = indicator.icon;
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${indicator.bg} ${indicator.color}`}>
                                    <Icon className="w-3 h-3" />
                                    {diff.meanDiffPercent > 0 ? "+" : ""}{diff.meanDiffPercent.toFixed(1)}%
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AdminCard>

              {/* Outcomes */}
              <AdminCard className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-4">
                  {t("admin.benchmarks.stats.group.outcomes")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--rowi-card-border)]">
                        <th className="text-left py-2 px-3 font-medium text-[var(--rowi-muted)]">
                          {t("admin.benchmarks.stats.metric")}
                        </th>
                        {getColumnNames().map((col, idx) => (
                          <th key={col.id} className="text-center py-2 px-3 font-medium">
                            <span className={idx === 0 ? "text-[var(--rowi-primary)]" : "text-[var(--rowi-foreground)]"}>
                              {col.name.substring(0, 20)}
                            </span>
                          </th>
                        ))}
                        <th className="text-center py-2 px-3 font-medium text-[var(--rowi-muted)]">
                          {t("admin.benchmarks.compare.difference")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {METRIC_GROUPS.outcomes.map((metric) => {
                        const metricData = comparison.statistics[metric];
                        const diffData = comparison.differences[metric];
                        if (!metricData || Object.keys(metricData).length === 0) return null;
                        return (
                          <tr key={metric} className="border-b border-[var(--rowi-card-border)] hover:bg-[var(--rowi-background)]">
                            <td className="py-2 px-3 font-medium">
                              {t(`admin.benchmarks.outcomes.${metric}`) || metric}
                            </td>
                            {getColumnNames().map((col) => (
                              <td key={col.id} className="text-center py-2 px-3">
                                {metricData?.[col.id] ? (
                                  <div>
                                    <span className="font-bold">{metricData[col.id].mean?.toFixed(1) || "-"}</span>
                                    <span className="text-xs text-[var(--rowi-muted)] ml-1">
                                      +/-{metricData[col.id].stdDev?.toFixed(1) || 0}
                                    </span>
                                  </div>
                                ) : "-"}
                              </td>
                            ))}
                            <td className="text-center py-2 px-3">
                              {diffData && Object.values(diffData)[0] && (() => {
                                const diff = Object.values(diffData)[0];
                                const indicator = getDiffIndicator(diff.meanDiffPercent);
                                const Icon = indicator.icon;
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${indicator.bg} ${indicator.color}`}>
                                    <Icon className="w-3 h-3" />
                                    {diff.meanDiffPercent > 0 ? "+" : ""}{diff.meanDiffPercent.toFixed(1)}%
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AdminCard>

              {/* Talents */}
              <AdminCard className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-4">
                  {t("admin.benchmarks.stats.group.talents")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--rowi-card-border)]">
                        <th className="text-left py-2 px-3 font-medium text-[var(--rowi-muted)]">
                          {t("admin.benchmarks.stats.metric")}
                        </th>
                        {getColumnNames().map((col, idx) => (
                          <th key={col.id} className="text-center py-2 px-3 font-medium">
                            <span className={idx === 0 ? "text-[var(--rowi-primary)]" : "text-[var(--rowi-foreground)]"}>
                              {col.name.substring(0, 20)}
                            </span>
                          </th>
                        ))}
                        <th className="text-center py-2 px-3 font-medium text-[var(--rowi-muted)]">
                          {t("admin.benchmarks.compare.difference")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {METRIC_GROUPS.talents.map((metric) => {
                        const metricData = comparison.statistics[metric];
                        const diffData = comparison.differences[metric];
                        if (!metricData || Object.keys(metricData).length === 0) return null;
                        return (
                          <tr key={metric} className="border-b border-[var(--rowi-card-border)] hover:bg-[var(--rowi-background)]">
                            <td className="py-2 px-3 font-medium">
                              {t(`admin.benchmarks.talents.${metric}`) || metric}
                            </td>
                            {getColumnNames().map((col) => (
                              <td key={col.id} className="text-center py-2 px-3">
                                {metricData?.[col.id] ? (
                                  <div>
                                    <span className="font-bold">{metricData[col.id].mean?.toFixed(1) || "-"}</span>
                                    <span className="text-xs text-[var(--rowi-muted)] ml-1">
                                      +/-{metricData[col.id].stdDev?.toFixed(1) || 0}
                                    </span>
                                  </div>
                                ) : "-"}
                              </td>
                            ))}
                            <td className="text-center py-2 px-3">
                              {diffData && Object.values(diffData)[0] && (() => {
                                const diff = Object.values(diffData)[0];
                                const indicator = getDiffIndicator(diff.meanDiffPercent);
                                const Icon = indicator.icon;
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${indicator.bg} ${indicator.color}`}>
                                    <Icon className="w-3 h-3" />
                                    {diff.meanDiffPercent > 0 ? "+" : ""}{diff.meanDiffPercent.toFixed(1)}%
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AdminCard>
            </>
          )}
        </>
      )}
    </AdminPage>
  );
}
