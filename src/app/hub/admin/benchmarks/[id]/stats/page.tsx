"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  BarChart3,
  Filter,
  RefreshCcw,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
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
   📊 Estadísticas — Explorador con Filtros
========================================================= */

interface StatResult {
  metricKey: string;
  n: number;
  mean: number | null;
  median: number | null;
  stdDev: number | null;
  min: number | null;
  max: number | null;
  p10: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  p95: number | null;
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
}

const METRIC_GROUPS = {
  core: ["K", "C", "G", "eqTotal"],
  competencies: ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"],
  outcomes: [
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
  ],
  // 18 Brain Talents organizados por cluster
  // FOCUS (Azul): Data Mining, Modeling, Prioritizing, Connection, Emotional Insight, Collaboration
  // DECISIONS (Rojo): Reflecting, Adaptability, Critical Thinking, Resilience, Risk Tolerance, Imagination
  // DRIVE (Verde): Proactivity, Commitment, Problem Solving, Vision, Designing, Entrepreneurship
  talents: [
    // FOCUS
    "dataMining",
    "modeling",
    "prioritizing",
    "connection",
    "emotionalInsight",
    "collaboration",
    // DECISIONS
    "reflecting",
    "adaptability",
    "criticalThinking",
    "resilience",
    "riskTolerance",
    "imagination",
    // DRIVE
    "proactivity",
    "commitment",
    "problemSolving",
    "vision",
    "designing",
    "entrepreneurship",
  ],
};

export default function BenchmarkStatsPage() {
  const { t } = useI18n();
  const params = useParams();
  const id = params.id as string;

  const [stats, setStats] = useState<StatResult[]>([]);
  const [filtersData, setFiltersData] = useState<FiltersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Filtros activos
  const [filters, setFilters] = useState({
    country: "",
    region: "",
    sector: "",
    jobFunction: "",
    jobRole: "",
    ageRange: "",
    gender: "",
    education: "",
  });

  // Grupo de métricas seleccionado
  const [selectedGroup, setSelectedGroup] = useState<keyof typeof METRIC_GROUPS>("core");

  async function loadFiltersData() {
    setLoadingFilters(true);
    try {
      const res = await fetch(`/api/admin/benchmarks/${id}`);
      const data = await res.json();

      if (data.ok && data.benchmark) {
        // Construir opciones de filtros desde el benchmark
        setFiltersData({
          countries: data.benchmark.countries || [],
          regions: data.benchmark.regions || [],
          sectors: data.benchmark.sectors || [],
          jobFunctions: data.benchmark.jobFunctions || [],
          jobRoles: data.benchmark.jobRoles || [],
          ageRanges: data.benchmark.ageRanges || [],
          genders: data.benchmark.genders || [],
          educations: data.benchmark.educations || [],
        });
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setLoadingFilters(false);
    }
  }

  async function loadStats() {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.set(key, value);
      });

      const res = await fetch(`/api/admin/benchmarks/${id}/stats?${queryParams}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.statistics || []);
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiltersData();
  }, [id]);

  useEffect(() => {
    loadStats();
  }, [id, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      country: "",
      region: "",
      sector: "",
      jobFunction: "",
      jobRole: "",
      ageRange: "",
      gender: "",
      education: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const getStatForMetric = (metricKey: string) => {
    return stats.find((s) => s.metricKey === metricKey);
  };

  const renderFilterSelect = (
    key: keyof typeof filters,
    labelKey: string,
    options: FilterOption[]
  ) => (
    <div>
      <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
        {t(labelKey)}
      </label>
      <div className="relative">
        <select
          value={filters[key]}
          onChange={(e) => handleFilterChange(key, e.target.value)}
          className="w-full px-3 py-2 pr-8 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
        >
          <option value="">{t("admin.benchmarks.stats.all")}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} {opt.count ? `(${opt.count})` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)] pointer-events-none" />
      </div>
    </div>
  );

  const renderStatCard = (metricKey: string) => {
    const stat = getStatForMetric(metricKey);
    const isInsufficient = stat && stat.n < 30;

    return (
      <AdminCard key={metricKey} compact>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-[var(--rowi-foreground)]">
            {t(`admin.benchmarks.metrics.${metricKey}`)}
          </h4>
          {stat && (
            <AdminBadge variant={isInsufficient ? "warning" : "secondary"}>
              n={stat.n}
            </AdminBadge>
          )}
        </div>

        {stat ? (
          isInsufficient ? (
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("admin.benchmarks.stats.insufficientData")}
            </p>
          ) : (
            <div className="space-y-2">
              {/* Mean & Median */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--rowi-muted)]">
                  {t("admin.benchmarks.stats.mean")}
                </span>
                <span className="text-lg font-bold text-[var(--rowi-foreground)]">
                  {stat.mean?.toFixed(1) || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--rowi-muted)]">
                  {t("admin.benchmarks.stats.median")}
                </span>
                <span className="text-sm text-[var(--rowi-foreground)]">
                  {stat.median?.toFixed(1) || "-"}
                </span>
              </div>

              {/* StdDev */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--rowi-muted)]">
                  {t("admin.benchmarks.stats.stdDev")}
                </span>
                <span className="text-sm text-[var(--rowi-foreground)]">
                  {stat.stdDev?.toFixed(2) || "-"}
                </span>
              </div>

              {/* Range */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--rowi-muted)]">
                  {t("admin.benchmarks.stats.min")} - {t("admin.benchmarks.stats.max")}
                </span>
                <span className="text-sm text-[var(--rowi-foreground)]">
                  {stat.min?.toFixed(1)} - {stat.max?.toFixed(1)}
                </span>
              </div>

              {/* Percentiles Bar */}
              <div className="mt-3 pt-3 border-t border-[var(--rowi-card-border)]">
                <p className="text-xs text-[var(--rowi-muted)] mb-2">
                  {t("admin.benchmarks.stats.p10")} - {t("admin.benchmarks.stats.p90")}
                </p>
                <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  {/* P10-P90 range */}
                  <div
                    className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-30"
                    style={{
                      left: `${((stat.p10 || 0) / 120) * 100}%`,
                      width: `${(((stat.p90 || 0) - (stat.p10 || 0)) / 120) * 100}%`,
                    }}
                  />
                  {/* P25-P75 range */}
                  <div
                    className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-700 opacity-60"
                    style={{
                      left: `${((stat.p25 || 0) / 120) * 100}%`,
                      width: `${(((stat.p75 || 0) - (stat.p25 || 0)) / 120) * 100}%`,
                    }}
                  />
                  {/* Median marker */}
                  <div
                    className="absolute h-full w-0.5 bg-[var(--rowi-primary)]"
                    style={{ left: `${((stat.median || 0) / 120) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-[var(--rowi-muted)]">
                  <span>{stat.p10?.toFixed(0)}</span>
                  <span>{stat.p25?.toFixed(0)}</span>
                  <span>{stat.median?.toFixed(0)}</span>
                  <span>{stat.p75?.toFixed(0)}</span>
                  <span>{stat.p90?.toFixed(0)}</span>
                </div>
              </div>
            </div>
          )
        ) : (
          <p className="text-xs text-[var(--rowi-muted)]">
            {t("admin.benchmarks.stats.noData")}
          </p>
        )}
      </AdminCard>
    );
  };

  return (
    <AdminPage
      titleKey="admin.benchmarks.stats.title"
      descriptionKey="admin.benchmarks.stats.description"
      icon={BarChart3}
      loading={loading && loadingFilters}
      actions={
        <div className="flex items-center gap-2">
          <AdminButton
            variant="secondary"
            icon={Download}
            onClick={() => window.open(`/api/admin/benchmarks/${id}/export?type=stats`, "_blank")}
            size="sm"
          >
            {t("admin.benchmarks.export.exportCSV")}
          </AdminButton>
          <AdminButton
            variant="secondary"
            icon={RefreshCcw}
            onClick={loadStats}
            size="sm"
          >
            {t("admin.common.refresh")}
          </AdminButton>
        </div>
      }
    >
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
                {hasActiveFilters
                  ? `${Object.values(filters).filter((v) => v).length} ${t("admin.benchmarks.stats.filtersActive")}`
                  : t("admin.benchmarks.stats.noFiltersActive")}
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <AdminButton variant="secondary" size="sm" onClick={clearFilters}>
              {t("admin.benchmarks.stats.clearFilters")}
            </AdminButton>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtersData && (
            <>
              {renderFilterSelect("country", "admin.benchmarks.stats.country", filtersData.countries)}
              {renderFilterSelect("region", "admin.benchmarks.stats.region", filtersData.regions)}
              {renderFilterSelect("sector", "admin.benchmarks.stats.sector", filtersData.sectors)}
              {renderFilterSelect("jobFunction", "admin.benchmarks.stats.jobFunction", filtersData.jobFunctions)}
              {renderFilterSelect("jobRole", "admin.benchmarks.stats.jobRole", filtersData.jobRoles)}
              {renderFilterSelect("ageRange", "admin.benchmarks.stats.age", filtersData.ageRanges)}
              {renderFilterSelect("gender", "admin.benchmarks.stats.gender", filtersData.genders)}
              {renderFilterSelect("education", "admin.benchmarks.stats.education", filtersData.educations)}
            </>
          )}
        </div>
      </AdminCard>

      {/* Metric Group Selector */}
      <AdminCard className="mb-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(METRIC_GROUPS) as Array<keyof typeof METRIC_GROUPS>).map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedGroup === group
                  ? "bg-[var(--rowi-primary)] text-white"
                  : "bg-[var(--rowi-background)] text-[var(--rowi-muted)] hover:bg-[var(--rowi-card-border)]"
              }`}
            >
              {t(`admin.benchmarks.stats.group.${group}`)}
            </button>
          ))}
        </div>
      </AdminCard>

      {/* Stats Grid */}
      <AdminGrid cols={4}>
        {METRIC_GROUPS[selectedGroup].map((metricKey) => renderStatCard(metricKey))}
      </AdminGrid>

      {/* Summary Stats */}
      {stats.length > 0 && (
        <AdminCard className="mt-6">
          <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-4">
            {t("admin.benchmarks.stats.summary")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--rowi-card-border)]">
                  <th className="text-left py-2 px-3 text-[var(--rowi-muted)] font-medium">
                    {t("admin.benchmarks.stats.metric")}
                  </th>
                  <th className="text-right py-2 px-3 text-[var(--rowi-muted)] font-medium">n</th>
                  <th className="text-right py-2 px-3 text-[var(--rowi-muted)] font-medium">
                    {t("admin.benchmarks.stats.mean")}
                  </th>
                  <th className="text-right py-2 px-3 text-[var(--rowi-muted)] font-medium">
                    {t("admin.benchmarks.stats.median")}
                  </th>
                  <th className="text-right py-2 px-3 text-[var(--rowi-muted)] font-medium">
                    {t("admin.benchmarks.stats.stdDev")}
                  </th>
                  <th className="text-right py-2 px-3 text-[var(--rowi-muted)] font-medium">
                    {t("admin.benchmarks.stats.p25")}
                  </th>
                  <th className="text-right py-2 px-3 text-[var(--rowi-muted)] font-medium">
                    {t("admin.benchmarks.stats.p75")}
                  </th>
                  <th className="text-right py-2 px-3 text-[var(--rowi-muted)] font-medium">
                    {t("admin.benchmarks.stats.p90")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {METRIC_GROUPS[selectedGroup].map((metricKey) => {
                  const stat = getStatForMetric(metricKey);
                  return (
                    <tr
                      key={metricKey}
                      className="border-b border-[var(--rowi-card-border)] hover:bg-[var(--rowi-background)]"
                    >
                      <td className="py-2 px-3 font-medium text-[var(--rowi-foreground)]">
                        {t(`admin.benchmarks.metrics.${metricKey}`)}
                      </td>
                      <td className="text-right py-2 px-3 text-[var(--rowi-muted)]">
                        {stat?.n || "-"}
                      </td>
                      <td className="text-right py-2 px-3 text-[var(--rowi-foreground)]">
                        {stat?.mean?.toFixed(1) || "-"}
                      </td>
                      <td className="text-right py-2 px-3 text-[var(--rowi-foreground)]">
                        {stat?.median?.toFixed(1) || "-"}
                      </td>
                      <td className="text-right py-2 px-3 text-[var(--rowi-foreground)]">
                        {stat?.stdDev?.toFixed(2) || "-"}
                      </td>
                      <td className="text-right py-2 px-3 text-[var(--rowi-foreground)]">
                        {stat?.p25?.toFixed(1) || "-"}
                      </td>
                      <td className="text-right py-2 px-3 text-[var(--rowi-foreground)]">
                        {stat?.p75?.toFixed(1) || "-"}
                      </td>
                      <td className="text-right py-2 px-3 text-[var(--rowi-foreground)]">
                        {stat?.p90?.toFixed(1) || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </AdminPage>
  );
}
