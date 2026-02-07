"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Target,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminBadge,
  AdminButton,
} from "@/components/admin/AdminPage";
import { SearchableSelect, SelectOption } from "@/components/ui/searchable-select";
import { SmartFilterCommand, createBenchmarkFilterCategories, FilterCategory, FilterValue } from "@/components/ui/smart-filter-command";

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
  months: FilterOption[];
  quarters: FilterOption[];
  countryToRegion: Record<string, string>;
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
  month?: string;
  quarter?: string;
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

interface TopPerformerByOutcome {
  segmentName: string;
  outcome: string;
  topPerformerCount: number;
  totalCount: number;
  percentage: number;
  avgOutcomeScore: number;
  topCompetencies: Array<{
    key: string;
    topPerformerMean: number;
    generalMean: number;
    diffPercent: number;
  }>;
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
  const [activeTab, setActiveTab] = useState<"stats" | "topPerformers">("stats");

  // Metric groups filter
  const [selectedMetricGroups, setSelectedMetricGroups] = useState<Set<string>>(
    new Set(["core", "competencies", "outcomes", "talents"])
  );

  // Outcome selector for Top Performers analysis
  const [selectedOutcome, setSelectedOutcome] = useState<string>("effectiveness");
  const [topPerformersByOutcome, setTopPerformersByOutcome] = useState<TopPerformerByOutcome[]>([]);
  const [loadingTopPerformers, setLoadingTopPerformers] = useState(false);

  // Cross-benchmark segment comparison
  const [crossBenchmarkMode, setCrossBenchmarkMode] = useState(false);
  const [segmentBenchmarkIds, setSegmentBenchmarkIds] = useState<string[]>(["", ""]);
  const [segmentFiltersData, setSegmentFiltersData] = useState<(FiltersData | null)[]>([null, null]);

  // Toggle metric group selection
  const toggleMetricGroup = (group: string) => {
    setSelectedMetricGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        // Don't allow deselecting all
        if (next.size > 1) next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  // Get visible metrics based on selected groups
  const getVisibleMetrics = (group: keyof typeof METRIC_GROUPS) => {
    if (!selectedMetricGroups.has(group)) return [];
    return METRIC_GROUPS[group];
  };

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
          months: data.benchmark.months || [],
          quarters: data.benchmark.quarters || [],
          countryToRegion: data.benchmark.countryToRegion || {},
        });
      }
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  }

  // Load filters for a specific benchmark (cross-benchmark mode)
  async function loadFiltersForBenchmark(benchmarkId: string, segmentIndex: number) {
    if (!benchmarkId) {
      setSegmentFiltersData((prev) => {
        const next = [...prev];
        next[segmentIndex] = null;
        return next;
      });
      return;
    }

    try {
      const res = await fetch(`/api/admin/benchmarks/${benchmarkId}`);
      const data = await res.json();

      if (data.ok && data.benchmark) {
        const filters: FiltersData = {
          countries: data.benchmark.countries || [],
          regions: data.benchmark.regions || [],
          sectors: data.benchmark.sectors || [],
          jobFunctions: data.benchmark.jobFunctions || [],
          jobRoles: data.benchmark.jobRoles || [],
          ageRanges: data.benchmark.ageRanges || [],
          genders: data.benchmark.genders || [],
          educations: data.benchmark.educations || [],
          years: data.benchmark.years || [],
          months: data.benchmark.months || [],
          quarters: data.benchmark.quarters || [],
          countryToRegion: data.benchmark.countryToRegion || {},
        };
        setSegmentFiltersData((prev) => {
          const next = [...prev];
          next[segmentIndex] = filters;
          return next;
        });
      }
    } catch (error) {
      console.error("Error loading filters for benchmark:", error);
    }
  }

  // Update segment benchmark ID (cross-benchmark mode)
  const updateSegmentBenchmarkId = (index: number, benchmarkId: string) => {
    setSegmentBenchmarkIds((prev) => {
      const next = [...prev];
      next[index] = benchmarkId;
      return next;
    });
    // Clear segment filters when changing benchmark
    updateSegment(index, "country", "");
    updateSegment(index, "region", "");
    updateSegment(index, "sector", "");
    updateSegment(index, "jobFunction", "");
    updateSegment(index, "jobRole", "");
    updateSegment(index, "ageRange", "");
    updateSegment(index, "gender", "");
    updateSegment(index, "education", "");
    updateSegment(index, "year", "");
    updateSegment(index, "month", "");
    updateSegment(index, "quarter", "");
    // Load filters for new benchmark
    loadFiltersForBenchmark(benchmarkId, index);
  };

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
    // Cross-benchmark mode validation
    if (crossBenchmarkMode) {
      const validBenchmarks = segmentBenchmarkIds.filter((id) => id);
      if (validBenchmarks.length < 2) {
        toast.error(t("admin.benchmarks.compare.selectBenchmarkForEach"));
        return;
      }
      await compareCrossBenchmarkSegments();
      return;
    }

    // Normal single-benchmark mode
    if (!selectedBenchmarkId) {
      toast.error(t("admin.benchmarks.compare.selectBenchmark"));
      return;
    }

    // Validate segments have at least one filter
    const validSegments = segments.filter((s) =>
      s.country || s.region || s.sector || s.jobFunction || s.jobRole || s.ageRange || s.gender || s.education || s.year || s.month || s.quarter
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

  // Compare segments from different benchmarks
  const compareCrossBenchmarkSegments = async () => {
    setComparing(true);
    try {
      const res = await fetch("/api/admin/benchmarks/compare-cross-segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: segments.map((seg, idx) => ({
            ...seg,
            benchmarkId: segmentBenchmarkIds[idx],
          })),
          metricGroups: Array.from(selectedMetricGroups),
        }),
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

  // Cargar top performers por outcome para cada segmento
  const loadTopPerformersByOutcome = async (outcome: string) => {
    if (!selectedBenchmarkId || segmentSummaries.length === 0) return;

    setLoadingTopPerformers(true);
    try {
      const results: TopPerformerByOutcome[] = [];

      for (const segment of segments) {
        // Construir query params para el segmento
        const params = new URLSearchParams();
        params.append("outcome", outcome);
        if (segment.country) params.append("country", segment.country);
        if (segment.region) params.append("region", segment.region);
        if (segment.sector) params.append("sector", segment.sector);
        if (segment.jobFunction) params.append("jobFunction", segment.jobFunction);
        if (segment.jobRole) params.append("jobRole", segment.jobRole);
        if (segment.ageRange) params.append("ageRange", segment.ageRange);
        if (segment.gender) params.append("gender", segment.gender);
        if (segment.education) params.append("education", segment.education);
        if (segment.year) params.append("year", segment.year);
        if (segment.month) params.append("month", segment.month);
        if (segment.quarter) params.append("quarter", segment.quarter);

        const res = await fetch(
          `/api/admin/benchmarks/${selectedBenchmarkId}/top-performers/calculate?${params.toString()}`
        );
        const data = await res.json();

        if (data.ok && data.analysis) {
          results.push({
            segmentName: segment.name,
            outcome,
            topPerformerCount: data.analysis.topPerformerCount || 0,
            totalCount: data.analysis.totalCount || 0,
            percentage: data.analysis.topPerformerPercentage || 0,
            avgOutcomeScore: data.analysis.outcomeStats?.topPerformers?.mean || 0,
            topCompetencies: (data.analysis.competencyAnalysis || [])
              .slice(0, 5)
              .map((c: any) => ({
                key: c.metric,
                topPerformerMean: c.topPerformers?.mean || 0,
                generalMean: c.general?.mean || 0,
                diffPercent: c.difference?.meanDiffPercent || 0,
              })),
          });
        }
      }

      setTopPerformersByOutcome(results);
    } catch (error) {
      console.error("Error loading top performers:", error);
      toast.error("Error al cargar top performers");
    } finally {
      setLoadingTopPerformers(false);
    }
  };

  // Cargar top performers cuando cambia el outcome o hay resultados
  useEffect(() => {
    if (mode === "segments" && segmentSummaries.length > 0 && activeTab === "topPerformers") {
      loadTopPerformersByOutcome(selectedOutcome);
    }
  }, [selectedOutcome, segmentSummaries, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Obtener países filtrados por región para cada segmento
  const getFilteredCountriesForSegment = (segmentIndex: number): FilterOption[] => {
    // In cross-benchmark mode, use segment-specific filters
    const filters = crossBenchmarkMode ? segmentFiltersData[segmentIndex] : filtersData;
    if (!filters) return [];
    const regionFilter = segments[segmentIndex].region;
    if (!regionFilter) return filters.countries;
    return filters.countries.filter(
      (c) => filters.countryToRegion[c.value] === regionFilter
    );
  };

  // Get filters data for a segment (cross-benchmark or normal mode)
  const getFiltersForSegment = (segmentIndex: number): FiltersData | null => {
    if (crossBenchmarkMode) {
      return segmentFiltersData[segmentIndex];
    }
    return filtersData;
  };

  // Renderizar filtro con SearchableSelect
  const renderSearchableFilter = (
    segmentIndex: number,
    field: keyof SegmentFilter,
    options: FilterOption[],
    label: string
  ) => (
    <div className="flex-1 min-w-[140px]">
      <label className="block text-xs text-[var(--rowi-muted)] mb-1">{label}</label>
      <SearchableSelect
        options={options as SelectOption[]}
        value={(segments[segmentIndex][field] as string) || ""}
        onChange={(val) => {
          updateSegment(segmentIndex, field, val);
          // Limpiar país si cambia la región
          if (field === "region") {
            updateSegment(segmentIndex, "country", "");
          }
        }}
        placeholder="Todos"
        searchPlaceholder="Buscar..."
        emptyMessage="Sin resultados"
        showCount={true}
        className="text-xs"
      />
    </div>
  );

  // Crear categorías de filtro para un segmento específico
  const getSegmentFilterCategories = (segmentIndex: number): FilterCategory[] => {
    if (!filtersData) return [];
    return createBenchmarkFilterCategories({
      regions: filtersData.regions,
      countries: getFilteredCountriesForSegment(segmentIndex),
      sectors: filtersData.sectors,
      jobFunctions: filtersData.jobFunctions,
      genders: filtersData.genders,
      ageRanges: filtersData.ageRanges,
      years: filtersData.years,
      months: filtersData.months,
      quarters: filtersData.quarters,
    });
  };

  // Obtener filtros seleccionados para un segmento (convertido a FilterValue para SmartFilterCommand)
  const getSegmentSelectedFilters = (segmentIndex: number): Record<string, FilterValue> => ({
    region: segments[segmentIndex].region || [],
    country: segments[segmentIndex].country || [],
    sector: segments[segmentIndex].sector || [],
    jobFunction: segments[segmentIndex].jobFunction || [],
    gender: segments[segmentIndex].gender || [],
    ageRange: segments[segmentIndex].ageRange || [],
    year: segments[segmentIndex].year || [],
    month: segments[segmentIndex].month || [],
    quarter: segments[segmentIndex].quarter || [],
  });

  // Handler para cambio de filtro en un segmento (convierte FilterValue a string para el estado)
  const handleSegmentFilterChange = (segmentIndex: number, key: string, value: FilterValue) => {
    // En Compare usamos valores simples por segmento, así que tomamos el primer valor del array
    const simpleValue = Array.isArray(value) ? value[0] || "" : value;
    updateSegment(segmentIndex, key as keyof SegmentFilter, simpleValue);
    if (key === "region") {
      updateSegment(segmentIndex, "country", "");
    }
  };

  // Limpiar filtros de un segmento
  const clearSegmentFilters = (segmentIndex: number) => {
    updateSegment(segmentIndex, "region", "");
    updateSegment(segmentIndex, "country", "");
    updateSegment(segmentIndex, "sector", "");
    updateSegment(segmentIndex, "jobFunction", "");
    updateSegment(segmentIndex, "gender", "");
    updateSegment(segmentIndex, "ageRange", "");
    updateSegment(segmentIndex, "year", "");
    updateSegment(segmentIndex, "month", "");
    updateSegment(segmentIndex, "quarter", "");
  };

  // Get column names based on mode
  const getColumnNames = () => {
    if (mode === "benchmarks") {
      return comparedBenchmarks.map((b) => ({ id: b.id, name: b.name }));
    }
    return segmentSummaries.map((s) => ({ id: s.name, name: s.name }));
  };

  // Check if a metric group has any data
  const hasDataForMetricGroup = (group: keyof typeof METRIC_GROUPS) => {
    if (!comparison) return false;
    const metrics = METRIC_GROUPS[group];
    const columns = getColumnNames();

    for (const metric of metrics) {
      const metricData = comparison.statistics[metric];
      if (metricData) {
        for (const col of columns) {
          if (metricData[col.id]?.n > 0) {
            return true;
          }
        }
      }
    }
    return false;
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

          {/* Cross-benchmark Toggle */}
          <div className="mb-4 p-3 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-card-border)]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={crossBenchmarkMode}
                onChange={(e) => {
                  setCrossBenchmarkMode(e.target.checked);
                  if (e.target.checked) {
                    // Initialize segment benchmark IDs
                    const initial = segments.map(() => benchmarks[0]?.id || "");
                    setSegmentBenchmarkIds(initial);
                    // Load filters for each
                    initial.forEach((id, idx) => loadFiltersForBenchmark(id, idx));
                  }
                }}
                className="w-4 h-4 rounded border-[var(--rowi-card-border)] text-[var(--rowi-primary)] focus:ring-[var(--rowi-primary)]"
              />
              <div>
                <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                  {t("admin.benchmarks.compare.crossBenchmarkMode")}
                </span>
                <p className="text-xs text-[var(--rowi-muted)]">
                  {t("admin.benchmarks.compare.crossBenchmarkDesc")}
                </p>
              </div>
            </label>
          </div>

          {/* Metric Groups Filter */}
          <div className="mb-4 p-3 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-card-border)]">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[var(--rowi-muted)]" />
              <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                {t("admin.benchmarks.compare.selectMetricGroups")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "core", label: t("admin.benchmarks.stats.coreEQ"), count: METRIC_GROUPS.core.length },
                { key: "competencies", label: t("admin.benchmarks.stats.competencies"), count: METRIC_GROUPS.competencies.length },
                { key: "outcomes", label: t("admin.benchmarks.stats.group.outcomes"), count: METRIC_GROUPS.outcomes.length },
                { key: "talents", label: t("admin.benchmarks.stats.group.talents"), count: METRIC_GROUPS.talents.length },
              ].map((group) => (
                <button
                  key={group.key}
                  onClick={() => toggleMetricGroup(group.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    selectedMetricGroups.has(group.key)
                      ? "bg-[var(--rowi-primary)] text-white"
                      : "bg-[var(--rowi-card)] text-[var(--rowi-muted)] border border-[var(--rowi-card-border)] hover:border-[var(--rowi-primary)]"
                  }`}
                >
                  {group.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    selectedMetricGroups.has(group.key) ? "bg-white/20" : "bg-[var(--rowi-muted)]/20"
                  }`}>
                    {group.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Benchmark Selector (only in normal mode) */}
          {!crossBenchmarkMode && (
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
          )}

          {/* Segments Definition */}
          <div className="space-y-4">
            {segments.map((segment, idx) => {
              const segFilters = getFiltersForSegment(idx);
              const benchmarkForSegment = crossBenchmarkMode
                ? benchmarks.find((b) => b.id === segmentBenchmarkIds[idx])
                : benchmarks.find((b) => b.id === selectedBenchmarkId);

              return (
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

                  {/* Benchmark selector per segment (cross-benchmark mode) */}
                  {crossBenchmarkMode && (
                    <div className="mb-3">
                      <label className="block text-xs text-[var(--rowi-muted)] mb-1">
                        {t("admin.benchmarks.compare.benchmarkForSegment")}
                      </label>
                      <select
                        value={segmentBenchmarkIds[idx] || ""}
                        onChange={(e) => updateSegmentBenchmarkId(idx, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] text-[var(--rowi-foreground)] text-sm"
                      >
                        <option value="">{t("admin.benchmarks.compare.selectBenchmark")}</option>
                        {benchmarks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.totalRows?.toLocaleString() || 0})
                          </option>
                        ))}
                      </select>
                      {benchmarkForSegment && (
                        <p className="text-xs text-[var(--rowi-muted)] mt-1">
                          {benchmarkForSegment.scope} - {benchmarkForSegment.type}
                        </p>
                      )}
                    </div>
                  )}

                  {segFilters ? (
                    <>
                      {/* Smart Filter Command para este segmento */}
                      <div className="mb-3">
                        <SmartFilterCommand
                          categories={getSegmentFilterCategories(idx)}
                          selectedFilters={getSegmentSelectedFilters(idx)}
                          onFilterChange={(key, value) => handleSegmentFilterChange(idx, key, value)}
                          onClearAll={() => clearSegmentFilters(idx)}
                          placeholder={t("admin.benchmarks.stats.searchFiltersFor").replace("{name}", segment.name)}
                        />
                      </div>
                      {/* Filtros detallados */}
                      <div className="flex flex-wrap gap-3">
                        {segFilters.regions.length > 0 && renderSearchableFilter(idx, "region", segFilters.regions, t("admin.benchmarks.stats.region"))}
                        {segFilters.countries.length > 0 && renderSearchableFilter(idx, "country", getFilteredCountriesForSegment(idx), t("admin.benchmarks.stats.country"))}
                        {segFilters.sectors.length > 0 && renderSearchableFilter(idx, "sector", segFilters.sectors, t("admin.benchmarks.stats.sector"))}
                        {segFilters.jobFunctions.length > 0 && renderSearchableFilter(idx, "jobFunction", segFilters.jobFunctions, t("admin.benchmarks.stats.jobFunction"))}
                        {segFilters.genders.length > 0 && renderSearchableFilter(idx, "gender", segFilters.genders, t("admin.benchmarks.stats.gender"))}
                        {segFilters.ageRanges.length > 0 && renderSearchableFilter(idx, "ageRange", segFilters.ageRanges, t("admin.benchmarks.stats.age"))}
                        {segFilters.years.length > 0 && renderSearchableFilter(idx, "year", segFilters.years, t("admin.benchmarks.stats.year"))}
                        {segFilters.months.length > 0 && renderSearchableFilter(idx, "month", segFilters.months, t("admin.benchmarks.stats.month"))}
                        {segFilters.quarters.length > 0 && renderSearchableFilter(idx, "quarter", segFilters.quarters, t("admin.benchmarks.stats.quarter"))}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-[var(--rowi-muted)] flex items-center gap-2">
                      {crossBenchmarkMode && !segmentBenchmarkIds[idx] ? (
                        <span>{t("admin.benchmarks.compare.selectBenchmarkFirst")}</span>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          {t("common.loading")}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
              <AdminBadge variant={selectedIds.length >= 2 ? "success" : "neutral"}>
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
            {mode === "segments" && segmentSummaries.length > 0 && (
              <button
                onClick={() => setActiveTab("topPerformers")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "topPerformers"
                    ? "bg-[var(--rowi-primary)] text-white"
                    : "bg-[var(--rowi-card)] text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Top Performers por Outcome
              </button>
            )}
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
              {/* Active Metric Groups Info */}
              <div className="flex items-center gap-2 mb-4 text-xs text-[var(--rowi-muted)]">
                <BarChart3 className="w-4 h-4" />
                <span>{t("admin.benchmarks.compare.showingGroups")}:</span>
                {Array.from(selectedMetricGroups).map((group) => (
                  <span key={group} className="px-2 py-0.5 bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] rounded">
                    {group === "core" ? t("admin.benchmarks.stats.coreEQ") :
                     group === "competencies" ? t("admin.benchmarks.stats.competencies") :
                     group === "outcomes" ? t("admin.benchmarks.stats.group.outcomes") :
                     t("admin.benchmarks.stats.group.talents")}
                  </span>
                ))}
              </div>

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
              {selectedMetricGroups.has("core") && (
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
              )}

              {/* Competencias */}
              {selectedMetricGroups.has("competencies") && (
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
              )}

              {/* Outcomes */}
              {selectedMetricGroups.has("outcomes") && (
              <AdminCard className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-4">
                  {t("admin.benchmarks.stats.group.outcomes")}
                </h3>
                {!hasDataForMetricGroup("outcomes") ? (
                  <div className="text-center py-6 text-[var(--rowi-muted)]">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t("admin.benchmarks.compare.noOutcomesData")}</p>
                    <p className="text-xs mt-1">{t("admin.benchmarks.compare.noOutcomesDataHint")}</p>
                  </div>
                ) : (
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
                )}
              </AdminCard>
              )}

              {/* Talents */}
              {selectedMetricGroups.has("talents") && (
              <AdminCard className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-4">
                  {t("admin.benchmarks.stats.group.talents")}
                </h3>
                {!hasDataForMetricGroup("talents") ? (
                  <div className="text-center py-6 text-[var(--rowi-muted)]">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t("admin.benchmarks.compare.noTalentsData")}</p>
                    <p className="text-xs mt-1">{t("admin.benchmarks.compare.noTalentsDataHint")}</p>
                  </div>
                ) : (
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
                )}
              </AdminCard>
              )}
            </>
          )}

          {/* TOP PERFORMERS BY OUTCOME TAB */}
          {activeTab === "topPerformers" && mode === "segments" && (
            <>
              {/* Outcome Selector */}
              <AdminCard className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-[var(--rowi-primary)]" />
                    <span className="text-sm font-semibold text-[var(--rowi-foreground)]">
                      Seleccionar Outcome a analizar:
                    </span>
                  </div>
                  <select
                    value={selectedOutcome}
                    onChange={(e) => setSelectedOutcome(e.target.value)}
                    className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] text-sm"
                  >
                    {METRIC_GROUPS.outcomes.map((outcome) => (
                      <option key={outcome} value={outcome}>
                        {t(`admin.benchmarks.outcomes.${outcome}`) || outcome}
                      </option>
                    ))}
                  </select>
                  {loadingTopPerformers && (
                    <RefreshCw className="w-4 h-4 animate-spin text-[var(--rowi-muted)]" />
                  )}
                </div>
              </AdminCard>

              {/* Top Performers Comparison Cards */}
              {topPerformersByOutcome.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {topPerformersByOutcome.map((data, idx) => (
                    <AdminCard
                      key={data.segmentName}
                      className={`p-4 ${idx === 0 ? "border-2 border-[var(--rowi-primary)]" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className={`w-5 h-5 ${idx === 0 ? "text-[var(--rowi-primary)]" : "text-yellow-500"}`} />
                        <h4 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                          {data.segmentName}
                        </h4>
                        {idx === 0 && <span className="text-xs text-[var(--rowi-primary)]">(Base)</span>}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 rounded bg-[var(--rowi-background)]">
                          <span className="text-xs text-[var(--rowi-muted)]">Top Performers</span>
                          <span className="text-sm font-bold text-[var(--rowi-primary)]">
                            {data.topPerformerCount.toLocaleString()} ({data.percentage.toFixed(1)}%)
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-2 rounded bg-[var(--rowi-background)]">
                          <span className="text-xs text-[var(--rowi-muted)]">
                            Promedio {t(`admin.benchmarks.outcomes.${selectedOutcome}`) || selectedOutcome}
                          </span>
                          <span className="text-sm font-bold">
                            {data.avgOutcomeScore.toFixed(1)}
                          </span>
                        </div>

                        {data.topCompetencies.length > 0 && (
                          <div className="pt-2 border-t border-[var(--rowi-card-border)]">
                            <p className="text-xs text-[var(--rowi-muted)] mb-2 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Competencias clave de Top Performers:
                            </p>
                            <div className="space-y-1">
                              {data.topCompetencies.map((comp) => {
                                const indicator = getDiffIndicator(comp.diffPercent);
                                const Icon = indicator.icon;
                                return (
                                  <div key={comp.key} className="flex items-center justify-between text-xs">
                                    <span className="text-[var(--rowi-foreground)]">
                                      {t(`admin.benchmarks.metrics.${comp.key}`) || comp.key}
                                    </span>
                                    <span className={`flex items-center gap-1 ${indicator.color}`}>
                                      <Icon className="w-3 h-3" />
                                      {comp.diffPercent > 0 ? "+" : ""}{comp.diffPercent.toFixed(1)}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </AdminCard>
                  ))}
                </div>
              )}

              {/* Detailed Comparison Table */}
              {topPerformersByOutcome.length > 0 && (
                <AdminCard>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Comparación detallada: Top Performers en {t(`admin.benchmarks.outcomes.${selectedOutcome}`) || selectedOutcome}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--rowi-card-border)]">
                          <th className="text-left py-2 px-3 font-medium text-[var(--rowi-muted)]">
                            Competencia
                          </th>
                          {topPerformersByOutcome.map((data, idx) => (
                            <th key={data.segmentName} className="text-center py-2 px-3 font-medium">
                              <span className={idx === 0 ? "text-[var(--rowi-primary)]" : "text-[var(--rowi-foreground)]"}>
                                {data.segmentName}
                              </span>
                              <br />
                              <span className="text-xs text-[var(--rowi-muted)] font-normal">
                                (TP vs General)
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {METRIC_GROUPS.competencies.map((metric) => (
                          <tr key={metric} className="border-b border-[var(--rowi-card-border)] hover:bg-[var(--rowi-background)]">
                            <td className="py-2 px-3 font-medium">
                              {t(`admin.benchmarks.metrics.${metric}`) || metric}
                            </td>
                            {topPerformersByOutcome.map((data) => {
                              const comp = data.topCompetencies.find((c) => c.key === metric);
                              if (!comp) return <td key={data.segmentName} className="text-center py-2 px-3 text-[var(--rowi-muted)]">-</td>;

                              const indicator = getDiffIndicator(comp.diffPercent);
                              const Icon = indicator.icon;

                              return (
                                <td key={data.segmentName} className="text-center py-2 px-3">
                                  <div className="flex flex-col items-center">
                                    <span className="font-bold">{comp.topPerformerMean.toFixed(1)}</span>
                                    <span className={`flex items-center gap-1 text-xs ${indicator.color}`}>
                                      <Icon className="w-3 h-3" />
                                      {comp.diffPercent > 0 ? "+" : ""}{comp.diffPercent.toFixed(1)}%
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AdminCard>
              )}

              {topPerformersByOutcome.length === 0 && !loadingTopPerformers && (
                <AdminCard className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-[var(--rowi-muted)] opacity-50" />
                  <p className="text-[var(--rowi-muted)]">
                    Ejecuta la comparación de segmentos primero para ver los top performers por outcome
                  </p>
                </AdminCard>
              )}
            </>
          )}
        </>
      )}
    </AdminPage>
  );
}
