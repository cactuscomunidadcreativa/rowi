"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  TrendingUp,
  ChevronDown,
  Award,
  Target,
  Zap,
  Users,
  Brain,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  Shield,
  Download,
  X,
  Globe,
  ArrowRightLeft,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminBadge,
  AdminButton,
} from "@/components/admin/AdminPage";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SmartFilterCommand, createBenchmarkFilterCategories, type FilterValue } from "@/components/ui/smart-filter-command";

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

/* =========================================================
   🏆 Top Performers — Análisis por Outcome con Estadísticas
========================================================= */

interface CompetencyStats {
  key: string;
  avgScore: number;
  stdDev?: number;
  stdError?: number;
  ci95?: [number, number];
  importance: number;
  diffFromAvg: number;
  effectSize?: number;
  effectInterpretation?: string;
  isSignificant?: boolean;
}

interface TalentStats extends CompetencyStats {
  cluster: string;
}

interface PatternStats {
  competencies?: string[];
  talents?: string[];
  frequency: number;
  frequencyCI?: [number, number];
  avgOutcome: number;
  count?: number;
}

interface TopPerformer {
  id: string;
  outcomeKey: string;
  percentileThreshold: number;
  thresholdValue?: number;
  sampleSize: number;
  totalPopulation?: number;
  confidenceLevel?: "high" | "medium" | "low";
  lowConfidenceSample?: boolean;
  insufficientReason?: string;
  avgK: number | null;
  avgC: number | null;
  avgG: number | null;
  avgEL: number | null;
  avgRP: number | null;
  avgACT: number | null;
  avgNE: number | null;
  avgIM: number | null;
  avgOP: number | null;
  avgEMP: number | null;
  avgNG: number | null;
  topCompetencies: CompetencyStats[];
  topTalents: TalentStats[];
  topTalentsSummary: TalentStats[];
  commonPatterns: PatternStats[];
  talentPatterns: PatternStats[];
  statistics?: {
    globalMeans?: Record<string, number>;
    significantCompetencies?: number;
    significantTalents?: number;
    avgEffectSizeCompetencies?: number;
    avgEffectSizeTalents?: number;
  };
}

interface APIResponse {
  ok: boolean;
  topPerformers: TopPerformer[];
  total: number;
  filtered?: boolean;
  warnings?: string[];
  methodology?: {
    minTotalSample: number;
    minTopPerformerSample: number;
    confidenceLevels: Record<string, string>;
    percentileMethod: string;
    significanceTest: string;
    effectSizeInterpretation: Record<string, string>;
  };
}

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

export default function TopPerformersPage() {
  const { t } = useI18n();
  const params = useParams();
  const id = params.id as string;

  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [selectedOutcome, setSelectedOutcome] = useState<string>("effectiveness");
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [filtersData, setFiltersData] = useState<FiltersData | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [methodology, setMethodology] = useState<APIResponse["methodology"] | null>(null);
  const [showGlobalComparison, setShowGlobalComparison] = useState(false);
  const [globalTopPerformers, setGlobalTopPerformers] = useState<TopPerformer[]>([]);

  // Filtros activos - ahora soportan arrays para multi-selección
  const [filters, setFilters] = useState<Record<string, FilterValue>>({
    country: [],
    region: [],
    sector: [],
    jobFunction: [],
    jobRole: [],
    ageRange: [],
    gender: [],
    education: [],
    year: [],
    month: [],
    quarter: [],
  });

  // Cargar opciones de filtros
  async function loadFiltersData() {
    try {
      const res = await fetch(`/api/admin/benchmarks/${id}`);
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

  // Cargar top performers (pre-calculados)
  async function loadTopPerformers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/benchmarks/${id}/top-performers`);
      const data: APIResponse = await res.json();

      if (data.ok) {
        setTopPerformers(data.topPerformers);
        setGlobalTopPerformers(data.topPerformers); // Guardar copia global
        setIsFiltered(false);
        setWarnings([]);
        setMethodology(null);
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  // Helper para verificar si un filtro tiene valores
  const hasValue = (value: FilterValue): boolean => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== "";
  };

  // Calcular top performers con filtros
  async function calculateWithFilters() {
    const hasFilters = Object.values(filters).some(hasValue);
    if (!hasFilters) {
      loadTopPerformers();
      return;
    }

    setCalculating(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Para arrays, agregar cada valor como parámetro separado
          value.forEach(v => {
            if (v) queryParams.append(key, v);
          });
        } else if (value) {
          queryParams.set(key, value);
        }
      });

      const res = await fetch(`/api/admin/benchmarks/${id}/top-performers/calculate?${queryParams}`);
      const data: APIResponse = await res.json();

      if (data.ok) {
        setTopPerformers(data.topPerformers);
        setIsFiltered(true);
        setWarnings(data.warnings || []);
        setMethodology(data.methodology || null);
        toast.success(t("admin.benchmarks.topPerformers.calculated"));
      } else {
        toast.error(t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setCalculating(false);
    }
  }

  useEffect(() => {
    loadFiltersData();
    loadTopPerformers();
  }, [id]);

  const handleFilterChange = (key: string, value: FilterValue) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      country: [],
      region: [],
      sector: [],
      jobFunction: [],
      jobRole: [],
      ageRange: [],
      gender: [],
      education: [],
      year: [],
      month: [],
      quarter: [],
    });
    loadTopPerformers();
  };

  // Filtrar países por región seleccionada (soporta multi-selección)
  const filteredCountries = React.useMemo(() => {
    if (!filtersData) return [];
    const regions = Array.isArray(filters.region) ? filters.region : (filters.region ? [filters.region] : []);
    if (regions.length === 0) return filtersData.countries || [];
    return filtersData.countries.filter(
      (c) => regions.includes(filtersData.countryToRegion[c.value])
    );
  }, [filtersData, filters.region]);

  const hasActiveFilters = Object.values(filters).some(hasValue);

  const selectedProfile = topPerformers.find((tp) => tp.outcomeKey === selectedOutcome);
  const globalProfile = globalTopPerformers.find((tp) => tp.outcomeKey === selectedOutcome);

  // Helper para obtener color de nivel de confianza
  const getConfidenceLevelStyle = (level?: string) => {
    switch (level) {
      case "high":
        return { color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", icon: CheckCircle };
      case "medium":
        return { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30", icon: Info };
      case "low":
        return { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: AlertTriangle };
      default:
        return { color: "text-gray-600", bg: "bg-gray-100", icon: Info };
    }
  };

  // Helper para obtener color de effect size
  const getEffectSizeStyle = (interpretation?: string) => {
    switch (interpretation) {
      case "large":
        return "bg-green-500";
      case "medium":
        return "bg-blue-500";
      case "small":
        return "bg-yellow-500";
      default:
        return "bg-gray-300";
    }
  };

  // Helper para obtener valor simple de un filtro (para SearchableSelect fallback)
  const getSimpleValue = (value: FilterValue): string => {
    if (Array.isArray(value)) return value[0] || "";
    return value || "";
  };

  const renderSearchableFilter = (
    key: string,
    labelKey: string,
    options: FilterOption[]
  ) => {
    const currentValue = filters[key];
    const displayValue = getSimpleValue(currentValue);
    const arrayValue = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);

    return (
      <div>
        <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1 flex items-center gap-1">
          {t(labelKey)}
          {arrayValue.length > 1 && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--rowi-primary)] text-white">
              +{arrayValue.length - 1}
            </span>
          )}
        </label>
        <SearchableSelect
          options={options}
          value={displayValue}
          onChange={(value) => handleFilterChange(key, value ? [value] : [])}
          placeholder={t("admin.benchmarks.stats.all")}
          searchPlaceholder={`${t("common.search")}...`}
          emptyMessage={t("common.noResults")}
          showCount
        />
      </div>
    );
  };

  return (
    <AdminPage
      titleKey="admin.benchmarks.topPerformers.title"
      descriptionKey="admin.benchmarks.topPerformers.description"
      icon={TrendingUp}
      loading={loading}
      actions={
        <AdminButton
          variant="secondary"
          icon={Download}
          onClick={() => window.open(`/api/admin/benchmarks/${id}/export?type=top-performers`, "_blank")}
          size="sm"
        >
          {t("admin.benchmarks.export.exportCSV")}
        </AdminButton>
      }
    >
      {/* Smart Filter Command - Búsqueda inteligente */}
      {filtersData && (
        <div className="mb-4">
          <SmartFilterCommand
            categories={createBenchmarkFilterCategories({
              regions: filtersData.regions,
              countries: filteredCountries,
              sectors: filtersData.sectors,
              jobFunctions: filtersData.jobFunctions,
              jobRoles: filtersData.jobRoles,
              ageRanges: filtersData.ageRanges,
              genders: filtersData.genders,
              educations: filtersData.educations,
              years: filtersData.years,
              months: filtersData.months,
              quarters: filtersData.quarters,
            })}
            selectedFilters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={clearFilters}
            placeholder={t("admin.benchmarks.topPerformers.searchFilters")}
          />
        </div>
      )}

      {/* Resumen de filtros activos */}
      {hasActiveFilters && filtersData && (
        <div className="mb-4 p-3 rounded-lg border border-[var(--rowi-primary)]/30 bg-[var(--rowi-primary)]/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--rowi-foreground)]">
              {t("admin.benchmarks.stats.activeFilters")}:
            </span>
            <span className="text-xs text-[var(--rowi-muted)]">
              {!isFiltered && t("admin.benchmarks.topPerformers.clickCalculate")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              const values = Array.isArray(value) ? value : (value ? [value] : []);
              if (values.length === 0) return null;

              // Encontrar la categoría para obtener las labels
              const categoryMap: Record<string, { label: string; options: FilterOption[] }> = {
                region: { label: t("admin.benchmarks.stats.region"), options: filtersData.regions },
                country: { label: t("admin.benchmarks.stats.country"), options: filtersData.countries },
                sector: { label: t("admin.benchmarks.stats.sector"), options: filtersData.sectors },
                jobFunction: { label: t("admin.benchmarks.stats.jobFunction"), options: filtersData.jobFunctions },
                jobRole: { label: t("admin.benchmarks.stats.jobRole"), options: filtersData.jobRoles },
                ageRange: { label: t("admin.benchmarks.stats.age"), options: filtersData.ageRanges },
                gender: { label: t("admin.benchmarks.stats.gender"), options: filtersData.genders },
                education: { label: t("admin.benchmarks.stats.education"), options: filtersData.educations },
                year: { label: t("admin.benchmarks.stats.year"), options: filtersData.years },
              };

              const category = categoryMap[key];
              if (!category) return null;

              return values.map((v) => {
                const option = category.options.find((o) => o.value === v);
                return (
                  <button
                    key={`${key}-${v}`}
                    onClick={() => {
                      const newValues = values.filter((val) => val !== v);
                      handleFilterChange(key, newValues);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] hover:bg-[var(--rowi-primary)]/20 transition-colors border border-[var(--rowi-primary)]/30"
                  >
                    <span className="font-medium">{category.label}:</span>
                    <span>{option?.label || v}</span>
                    <X className="w-3 h-3" />
                  </button>
                );
              });
            })}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      <AdminCard className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {t("admin.benchmarks.stats.filters")}
              </h3>
              <p className="text-xs text-[var(--rowi-muted)]">
                {isFiltered
                  ? t("admin.benchmarks.topPerformers.filteredResults")
                  : hasActiveFilters
                    ? t("admin.benchmarks.topPerformers.clickCalculate")
                    : t("admin.benchmarks.topPerformers.globalResults")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <AdminButton variant="secondary" size="sm" onClick={clearFilters}>
                {t("admin.benchmarks.stats.clearFilters")}
              </AdminButton>
            )}
            <AdminButton
              variant="primary"
              size="sm"
              onClick={calculateWithFilters}
              disabled={calculating || !hasActiveFilters}
              icon={calculating ? RefreshCw : undefined}
            >
              {calculating ? t("admin.benchmarks.topPerformers.calculating") : t("admin.benchmarks.topPerformers.calculate")}
            </AdminButton>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtersData && (
            <>
              {renderSearchableFilter("region", "admin.benchmarks.stats.region", filtersData.regions)}
              {renderSearchableFilter("country", "admin.benchmarks.stats.country", filteredCountries)}
              {renderSearchableFilter("sector", "admin.benchmarks.stats.sector", filtersData.sectors)}
              {renderSearchableFilter("jobFunction", "admin.benchmarks.stats.jobFunction", filtersData.jobFunctions)}
              {renderSearchableFilter("jobRole", "admin.benchmarks.stats.jobRole", filtersData.jobRoles)}
              {renderSearchableFilter("ageRange", "admin.benchmarks.stats.age", filtersData.ageRanges)}
              {renderSearchableFilter("gender", "admin.benchmarks.stats.gender", filtersData.genders)}
              {renderSearchableFilter("education", "admin.benchmarks.stats.education", filtersData.educations)}
              {filtersData.years.length > 0 && renderSearchableFilter("year", "admin.benchmarks.stats.year", filtersData.years)}
            </>
          )}
        </div>
      </AdminCard>

      {/* Warnings */}
      {warnings.length > 0 && (
        <AdminCard className="mb-6 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                {t("admin.benchmarks.topPerformers.warnings")}
              </h4>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Outcome Selector */}
      <AdminCard className="mb-6">
        <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-2">
          {t("admin.benchmarks.topPerformers.selectOutcome")}
        </label>
        <div className="relative">
          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value)}
            className="w-full md:w-64 px-4 py-2 pr-10 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
          >
            {OUTCOMES.map((outcome) => (
              <option key={outcome} value={outcome}>
                {t(`admin.benchmarks.outcomes.${outcome}`)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--rowi-muted)] pointer-events-none" />
        </div>
      </AdminCard>

      {selectedProfile ? (
        <div className="space-y-6">
          {/* Low Confidence Warning Banner */}
          {selectedProfile.lowConfidenceSample && (
            <AdminCard className="border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">
                    {t("admin.benchmarks.topPerformers.lowConfidenceWarning")}
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    {t("admin.benchmarks.topPerformers.lowConfidenceDesc")}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    <div className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <span className="text-xs text-amber-600 dark:text-amber-400">{t("admin.benchmarks.topPerformers.currentSampleSize")}:</span>
                      <span className="ml-2 font-bold text-amber-800 dark:text-amber-200">{selectedProfile.sampleSize}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <span className="text-xs text-amber-600 dark:text-amber-400">{t("admin.benchmarks.topPerformers.recommendedMinimum")}:</span>
                      <span className="ml-2 font-bold text-amber-800 dark:text-amber-200">100</span>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    💡 {t("admin.benchmarks.topPerformers.lowConfidenceRecommendation")}
                  </p>
                </div>
              </div>
            </AdminCard>
          )}

          {/* Stats Overview with Confidence Level */}
          <AdminGrid cols={4}>
            <AdminCard compact>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
                    {selectedProfile.sampleSize.toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.topPerformers.sampleSize")}
                  </p>
                </div>
              </div>
            </AdminCard>

            <AdminCard compact>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
                    P{selectedProfile.percentileThreshold}+
                  </p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.topPerformers.threshold")}
                    {selectedProfile.thresholdValue && ` (≥${selectedProfile.thresholdValue.toFixed(1)})`}
                  </p>
                </div>
              </div>
            </AdminCard>

            <AdminCard compact>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
                    {selectedProfile.totalPopulation?.toLocaleString() || "-"}
                  </p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.topPerformers.totalPopulation")}
                  </p>
                </div>
              </div>
            </AdminCard>

            {/* Confidence Level Indicator */}
            <AdminCard compact>
              {(() => {
                const style = getConfidenceLevelStyle(selectedProfile.confidenceLevel);
                const Icon = style.icon;
                return (
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${style.color}`} />
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${style.color}`}>
                        {t(`admin.benchmarks.topPerformers.confidence.${selectedProfile.confidenceLevel || "unknown"}`)}
                      </p>
                      <p className="text-xs text-[var(--rowi-muted)]">
                        {t("admin.benchmarks.topPerformers.confidenceLevel")}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </AdminCard>
          </AdminGrid>

          {/* Global Comparison Toggle - Solo mostrar cuando hay filtros activos */}
          {isFiltered && globalProfile && (
            <AdminCard>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                      {t("admin.benchmarks.topPerformers.globalComparison")}
                    </h3>
                    <p className="text-xs text-[var(--rowi-muted)]">
                      {t("admin.benchmarks.topPerformers.globalComparisonDesc")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGlobalComparison(!showGlobalComparison)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showGlobalComparison
                      ? "bg-[var(--rowi-primary)] text-white"
                      : "bg-[var(--rowi-background)] border border-[var(--rowi-card-border)] text-[var(--rowi-foreground)] hover:bg-[var(--rowi-primary)]/10"
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  {t("admin.benchmarks.topPerformers.showGlobalComparison")}
                </button>
              </div>

              {/* Comparison Stats */}
              {showGlobalComparison && (
                <div className="mt-4 pt-4 border-t border-[var(--rowi-card-border)]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Sample Size Comparison */}
                    <div className="p-3 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-card-border)]">
                      <p className="text-xs text-[var(--rowi-muted)] mb-2">{t("admin.benchmarks.topPerformers.sampleSize")}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-blue-600 dark:text-blue-400">{t("admin.benchmarks.topPerformers.filtered")}</p>
                          <p className="text-lg font-bold text-[var(--rowi-foreground)]">{selectedProfile.sampleSize.toLocaleString()}</p>
                        </div>
                        <div className="text-[var(--rowi-muted)]">vs</div>
                        <div className="flex-1 text-right">
                          <p className="text-xs text-green-600 dark:text-green-400">{t("admin.benchmarks.topPerformers.global")}</p>
                          <p className="text-lg font-bold text-[var(--rowi-foreground)]">{globalProfile.sampleSize.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Top 3 Competencies Comparison */}
                    {selectedProfile.topCompetencies?.slice(0, 3).map((comp, idx) => {
                      const globalComp = globalProfile.topCompetencies?.find(c => c.key === comp.key);
                      const diff = globalComp ? (comp.avgScore - globalComp.avgScore).toFixed(1) : "-";
                      const isPositive = globalComp && comp.avgScore > globalComp.avgScore;
                      return (
                        <div key={comp.key} className="p-3 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-card-border)]">
                          <p className="text-xs text-[var(--rowi-muted)] mb-2">#{idx + 1} {t(`admin.benchmarks.metrics.${comp.key}`)}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <p className="text-xs text-blue-600 dark:text-blue-400">{t("admin.benchmarks.topPerformers.filtered")}</p>
                              <p className="text-lg font-bold text-[var(--rowi-foreground)]">{comp.avgScore?.toFixed(1)}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${isPositive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                              {isPositive ? "+" : ""}{diff}
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-xs text-green-600 dark:text-green-400">{t("admin.benchmarks.topPerformers.global")}</p>
                              <p className="text-lg font-bold text-[var(--rowi-foreground)]">{globalComp?.avgScore?.toFixed(1) || "-"}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </AdminCard>
          )}

          {/* Statistical Summary */}
          {selectedProfile.statistics && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.benchmarks.topPerformers.statisticalSummary")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.topPerformers.statisticalSummaryDesc")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-card-border)]">
                  <p className="text-xs text-[var(--rowi-muted)] mb-1">{t("admin.benchmarks.topPerformers.significantCompetencies")}</p>
                  <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                    {selectedProfile.statistics.significantCompetencies || 0}/8
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-card-border)]">
                  <p className="text-xs text-[var(--rowi-muted)] mb-1">{t("admin.benchmarks.topPerformers.significantTalents")}</p>
                  <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                    {selectedProfile.statistics.significantTalents || 0}/18
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-card-border)]">
                  <p className="text-xs text-[var(--rowi-muted)] mb-1">{t("admin.benchmarks.topPerformers.avgEffectSizeComp")}</p>
                  <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                    {selectedProfile.statistics.avgEffectSizeCompetencies?.toFixed(2) || "-"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-card-border)]">
                  <p className="text-xs text-[var(--rowi-muted)] mb-1">{t("admin.benchmarks.topPerformers.avgEffectSizeTalent")}</p>
                  <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                    {selectedProfile.statistics.avgEffectSizeTalents?.toFixed(2) || "-"}
                  </p>
                </div>
              </div>
            </AdminCard>
          )}

          {/* Summary - Top 3 Competencies */}
          {selectedProfile.topCompetencies && selectedProfile.topCompetencies.length > 0 && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.benchmarks.topPerformers.topCompetenciesSummary")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.topPerformers.topCompetenciesSummaryDesc")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedProfile.topCompetencies.slice(0, 3).map((comp, idx) => (
                  <div
                    key={comp.key}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700"
                  >
                    <span className="text-lg font-bold opacity-50">#{idx + 1}</span>
                    <span className="font-medium">
                      {t(`admin.benchmarks.metrics.${comp.key}`)}
                    </span>
                    <span className="text-sm font-bold">
                      {comp.avgScore?.toFixed(1)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-orange-200 dark:bg-orange-800 rounded">
                      +{comp.diffFromAvg?.toFixed(1)}
                    </span>
                    {comp.isSignificant && (
                      <span title={t("admin.benchmarks.topPerformers.significant")}><CheckCircle className="w-4 h-4 text-green-500" /></span>
                    )}
                  </div>
                ))}
              </div>
            </AdminCard>
          )}

          {/* Summary - Top 5 Brain Talents */}
          {selectedProfile.topTalentsSummary && selectedProfile.topTalentsSummary.length > 0 && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.benchmarks.topPerformers.topTalentsSummary")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.topPerformers.topTalentsSummaryDesc")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedProfile.topTalentsSummary.map((talent, idx) => {
                  const clusterColors: Record<string, string> = {
                    focus: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
                    decisions: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
                    drive: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
                  };
                  return (
                    <div
                      key={talent.key}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${clusterColors[talent.cluster] || "bg-gray-100"}`}
                    >
                      <span className="text-lg font-bold opacity-50">#{idx + 1}</span>
                      <span className="font-medium">
                        {t(`admin.benchmarks.talents.${talent.key}`)}
                      </span>
                      <span className="text-sm font-bold">
                        {talent.avgScore?.toFixed(1)}
                      </span>
                      {talent.isSignificant && (
                        <span title={t("admin.benchmarks.topPerformers.significant")}><CheckCircle className="w-4 h-4 text-green-500" /></span>
                      )}
                      {talent.effectInterpretation && (
                        <span className={`w-2 h-2 rounded-full ${getEffectSizeStyle(talent.effectInterpretation)}`}
                              title={`Effect size: ${talent.effectInterpretation}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </AdminCard>
          )}

          {/* Top Competencies */}
          <AdminCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                  {t("admin.benchmarks.topPerformers.keyCompetencies")}
                </h3>
                <p className="text-xs text-[var(--rowi-muted)]">
                  {isFiltered ? t("admin.benchmarks.topPerformers.diffFromAvgWithEffect") : t("admin.benchmarks.topPerformers.diffFromAvg")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {selectedProfile.topCompetencies?.slice(0, 8).map((comp, idx) => (
                <div key={comp.key} className="flex items-center gap-4">
                  <span className="w-6 text-center text-lg font-bold text-[var(--rowi-muted)]">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                          {t(`admin.benchmarks.metrics.${comp.key}`)}
                        </span>
                        {comp.isSignificant && (
                          <span title={t("admin.benchmarks.topPerformers.significant")}><CheckCircle className="w-4 h-4 text-green-500" /></span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--rowi-muted)]">
                          {comp.avgScore?.toFixed(1)}
                          {comp.ci95 && (
                            <span className="text-xs ml-1 opacity-70">
                              [{comp.ci95[0]?.toFixed(1)}-{comp.ci95[1]?.toFixed(1)}]
                            </span>
                          )}
                        </span>
                        {comp.effectSize !== undefined && comp.effectSize !== null && (
                          <AdminBadge variant={comp.effectInterpretation === "large" ? "success" : comp.effectInterpretation === "medium" ? "info" : "neutral"}>
                            d={comp.effectSize.toFixed(2)}
                          </AdminBadge>
                        )}
                        <AdminBadge variant={comp.diffFromAvg > 5 ? "success" : comp.diffFromAvg > 2 ? "info" : "neutral"}>
                          +{comp.diffFromAvg?.toFixed(1)}
                        </AdminBadge>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${comp.diffFromAvg > 10 ? "bg-green-500" : comp.diffFromAvg > 5 ? "bg-blue-500" : comp.diffFromAvg > 2 ? "bg-yellow-500" : "bg-gray-400"}`}
                        style={{ width: `${Math.min(100, Math.abs(comp.diffFromAvg || 0) * 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-[var(--rowi-card-border)]">
              <p className="text-xs text-[var(--rowi-muted)] mb-2">{t("admin.benchmarks.topPerformers.diffLegend")}</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> {t("admin.benchmarks.topPerformers.veryHigh")} (+10)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> {t("admin.benchmarks.topPerformers.high")} (+5)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> {t("admin.benchmarks.topPerformers.moderate")} (+2)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400"></span> {t("admin.benchmarks.topPerformers.low")} (&lt;+2)</span>
                {isFiltered && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> {t("admin.benchmarks.topPerformers.statisticallySignificant")}</span>}
              </div>
            </div>
          </AdminCard>

          {/* Common Patterns - Competency Combinations */}
          {Array.isArray(selectedProfile.commonPatterns) && selectedProfile.commonPatterns.length > 0 && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.benchmarks.topPerformers.commonPatterns")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.patterns.description")}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {selectedProfile.commonPatterns.map((pattern) => (
                  <div
                    key={pattern.competencies?.sort().join("+")}
                    className="p-4 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {pattern.competencies?.map((comp) => (
                        <AdminBadge key={comp} variant="primary">
                          {t(`admin.benchmarks.metrics.${comp}`)}
                        </AdminBadge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--rowi-muted)]">
                        {t("admin.benchmarks.patterns.successRate")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--rowi-foreground)]">
                          {pattern.frequency}%
                        </span>
                        {pattern.frequencyCI && (
                          <span className="text-xs text-[var(--rowi-muted)]">
                            [{pattern.frequencyCI[0]}-{pattern.frequencyCI[1]}%]
                          </span>
                        )}
                      </div>
                    </div>
                    {pattern.count && (
                      <p className="text-xs text-[var(--rowi-muted)] mt-1">
                        n = {pattern.count}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AdminCard>
          )}

          {/* Brain Talents Section - 18 talentos agrupados por cluster */}
          {selectedProfile.topTalents && selectedProfile.topTalents.length > 0 && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.benchmarks.topPerformers.brainTalents")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.topPerformers.brainTalentsDesc")}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* FOCUS Cluster (Azul) - talentos 0-5 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">FOCUS</span>
                  </div>
                  {selectedProfile.topTalents.slice(0, 6).map((talent) => (
                    <div key={talent.key} className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--rowi-foreground)]">
                          {t(`admin.benchmarks.talents.${talent.key}`)}
                        </span>
                        {talent.isSignificant && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {talent.avgScore?.toFixed(1)}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${getEffectSizeStyle(talent.effectInterpretation)}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* DECISIONS Cluster (Rojo) - talentos 6-11 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">DECISIONS</span>
                  </div>
                  {selectedProfile.topTalents.slice(6, 12).map((talent) => (
                    <div key={talent.key} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--rowi-foreground)]">
                          {t(`admin.benchmarks.talents.${talent.key}`)}
                        </span>
                        {talent.isSignificant && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {talent.avgScore?.toFixed(1)}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${getEffectSizeStyle(talent.effectInterpretation)}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* DRIVE Cluster (Verde) - talentos 12-17 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">DRIVE</span>
                  </div>
                  {selectedProfile.topTalents.slice(12, 18).map((talent) => (
                    <div key={talent.key} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--rowi-foreground)]">
                          {t(`admin.benchmarks.talents.${talent.key}`)}
                        </span>
                        {talent.isSignificant && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {talent.avgScore?.toFixed(1)}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${getEffectSizeStyle(talent.effectInterpretation)}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AdminCard>
          )}

          {/* Talent Patterns Section */}
          {Array.isArray(selectedProfile.talentPatterns) && selectedProfile.talentPatterns.length > 0 && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.benchmarks.topPerformers.talentPatterns")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.topPerformers.talentPatternsDesc")}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProfile.talentPatterns.map((pattern) => (
                  <div
                    key={pattern.talents?.sort().join("+")}
                    className="p-4 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)]"
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {pattern.talents?.map((talent) => (
                        <AdminBadge key={talent} variant="neutral">
                          {t(`admin.benchmarks.talents.${talent}`)}
                        </AdminBadge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--rowi-muted)]">
                        {t("admin.benchmarks.patterns.successRate")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--rowi-foreground)]">
                          {pattern.frequency}%
                        </span>
                        {pattern.frequencyCI && (
                          <span className="text-xs text-[var(--rowi-muted)]">
                            [{pattern.frequencyCI[0]}-{pattern.frequencyCI[1]}%]
                          </span>
                        )}
                      </div>
                    </div>
                    {pattern.count && (
                      <p className="text-xs text-[var(--rowi-muted)] mt-1">
                        n = {pattern.count}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AdminCard>
          )}

          {/* Methodology Info */}
          {methodology && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.benchmarks.topPerformers.methodology")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.topPerformers.methodologyDesc")}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--rowi-muted)] mb-1">{t("admin.benchmarks.topPerformers.minSample")}:</p>
                  <p className="text-[var(--rowi-foreground)]">{methodology.minTotalSample} {t("admin.benchmarks.topPerformers.records")}</p>
                </div>
                <div>
                  <p className="text-[var(--rowi-muted)] mb-1">{t("admin.benchmarks.topPerformers.minTopPerformers")}:</p>
                  <p className="text-[var(--rowi-foreground)]">{methodology.minTopPerformerSample} {t("admin.benchmarks.topPerformers.records")}</p>
                </div>
                <div>
                  <p className="text-[var(--rowi-muted)] mb-1">{t("admin.benchmarks.topPerformers.percentileMethod")}:</p>
                  <p className="text-[var(--rowi-foreground)]">{methodology.percentileMethod}</p>
                </div>
                <div>
                  <p className="text-[var(--rowi-muted)] mb-1">{t("admin.benchmarks.topPerformers.significanceTest")}:</p>
                  <p className="text-[var(--rowi-foreground)]">{methodology.significanceTest}</p>
                </div>
              </div>
            </AdminCard>
          )}
        </div>
      ) : (
        <AdminCard className="text-center py-12">
          <TrendingUp className="w-16 h-16 mx-auto text-[var(--rowi-muted)] mb-4" />
          <p className="text-[var(--rowi-muted)]">
            {t("admin.benchmarks.stats.noData")}
          </p>
        </AdminCard>
      )}
    </AdminPage>
  );
}
