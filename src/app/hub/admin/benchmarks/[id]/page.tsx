"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  BarChart3,
  Users,
  Globe,
  TrendingUp,
  Brain,
  Activity,
  ChevronRight,
  Building2,
  RefreshCcw,
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
   📊 Benchmark Dashboard — Vista Individual
========================================================= */

interface Benchmark {
  id: string;
  name: string;
  description: string | null;
  type: string;
  scope: string;
  status: string;
  totalRows: number;
  processedRows: number;
  isLearning: boolean;
  isActive: boolean;
  uploadedAt: string;
  lastEnrichedAt: string | null;
  _count: {
    dataPoints: number;
    statistics: number;
    correlations: number;
    topPerformers: number;
    outcomePatterns: number;
    userComparisons: number;
  };
}

interface Metadata {
  countries: number;
  sectors: number;
  countryBreakdown: { country: string; _count: number }[];
  sectorBreakdown: { sector: string; _count: number }[];
}

interface Correlation {
  id: string;
  competencyKey: string;
  outcomeKey: string;
  correlation: number;
  strength: string;
  direction: string;
  n: number;
}

export default function BenchmarkDashboardPage() {
  const { t } = useI18n();
  const params = useParams();
  const id = params.id as string;

  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [topCorrelations, setTopCorrelations] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [benchmarkRes, correlationsRes] = await Promise.all([
        fetch(`/api/admin/benchmarks/${id}`),
        fetch(`/api/admin/benchmarks/${id}/correlations?minStrength=moderate`),
      ]);

      const benchmarkData = await benchmarkRes.json();
      const correlationsData = await correlationsRes.json();

      if (benchmarkData.ok) {
        setBenchmark(benchmarkData.benchmark);
        setMetadata(benchmarkData.metadata);
      }

      if (correlationsData.ok) {
        // Get top 5 correlations by absolute value
        const sorted = correlationsData.correlations
          .sort((a: Correlation, b: Correlation) => Math.abs(b.correlation) - Math.abs(a.correlation))
          .slice(0, 5);
        setTopCorrelations(sorted);
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (!benchmark) {
    return (
      <AdminPage titleKey="admin.benchmarks.dashboard.title" icon={BarChart3} loading={loading}>
        <div />
      </AdminPage>
    );
  }

  const quickLinks = [
    {
      href: `/hub/admin/benchmarks/${id}/stats`,
      icon: Activity,
      labelKey: "admin.benchmarks.stats.title",
      count: benchmark._count.statistics,
      color: "from-blue-500 to-blue-600",
    },
    {
      href: `/hub/admin/benchmarks/${id}/top-performers`,
      icon: TrendingUp,
      labelKey: "admin.benchmarks.topPerformers.title",
      count: benchmark._count.topPerformers,
      color: "from-green-500 to-green-600",
    },
    {
      href: `/hub/admin/benchmarks/${id}/compare`,
      icon: Users,
      labelKey: "admin.benchmarks.compare.title",
      count: benchmark._count.userComparisons,
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <AdminPage
      titleKey="admin.benchmarks.dashboard.title"
      icon={BarChart3}
      loading={loading}
      actions={
        <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadData} size="sm">
          {t("admin.common.refresh")}
        </AdminButton>
      }
    >
      {/* Header Info */}
      <AdminCard className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--rowi-foreground)] mb-1">
              {benchmark.name}
            </h2>
            <div className="flex items-center gap-3 text-sm text-[var(--rowi-muted)]">
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {t(`admin.benchmarks.types.${benchmark.type.toLowerCase()}`)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {t(`admin.benchmarks.scopes.${benchmark.scope.toLowerCase()}`)}
              </span>
            </div>
            {benchmark.description && (
              <p className="text-sm text-[var(--rowi-muted)] mt-2">
                {benchmark.description}
              </p>
            )}
          </div>
          <AdminBadge variant={benchmark.status === "COMPLETED" ? "success" : "warning"}>
            {t(`admin.benchmarks.status.${benchmark.status.toLowerCase()}`)}
          </AdminBadge>
        </div>
      </AdminCard>

      {/* Quick Stats */}
      <AdminGrid cols={4} className="mb-6">
        <AdminCard compact>
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] bg-clip-text text-transparent">
              {benchmark.totalRows.toLocaleString()}
            </p>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("admin.benchmarks.dashboard.totalRecords")}
            </p>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {metadata?.countries || 0}
            </p>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("admin.benchmarks.dashboard.countries")}
            </p>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {metadata?.sectors || 0}
            </p>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("admin.benchmarks.dashboard.sectors")}
            </p>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {benchmark._count.topPerformers}
            </p>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("admin.benchmarks.topPerformers.title")}
            </p>
          </div>
        </AdminCard>
      </AdminGrid>

      {/* Quick Links */}
      <AdminGrid cols={3} className="mb-6">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <AdminCard compact className="group hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg`}>
                  <link.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-[var(--rowi-foreground)]">
                    {link.count}
                  </p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t(link.labelKey)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--rowi-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </AdminCard>
          </Link>
        ))}
      </AdminGrid>

      {/* Top Correlations & Country Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Correlations */}
        <AdminCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {t("admin.benchmarks.dashboard.topCorrelations")}
              </h3>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.benchmarks.correlations.description")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {topCorrelations.map((corr) => (
              <div key={corr.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                    {t(`admin.benchmarks.metrics.${corr.competencyKey}`)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--rowi-muted)]" />
                  <span className="text-sm text-[var(--rowi-muted)]">
                    {t(`admin.benchmarks.outcomes.${corr.outcomeKey}`)}
                  </span>
                </div>
                <AdminBadge variant={corr.direction === "positive" ? "success" : "danger"}>
                  {corr.correlation.toFixed(2)}
                </AdminBadge>
              </div>
            ))}
          </div>

          {topCorrelations.length === 0 && (
            <p className="text-sm text-[var(--rowi-muted)] text-center py-4">
              {t("admin.benchmarks.stats.noData")}
            </p>
          )}
        </AdminCard>

        {/* Country Breakdown */}
        <AdminCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {t("admin.benchmarks.stats.country")}
              </h3>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.benchmarks.dashboard.overview")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {metadata?.countryBreakdown.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-[var(--rowi-foreground)]">
                  {item.country || t("common.unknown")}
                </span>
                <span className="text-sm font-medium text-[var(--rowi-muted)]">
                  {item._count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {(!metadata?.countryBreakdown || metadata.countryBreakdown.length === 0) && (
            <p className="text-sm text-[var(--rowi-muted)] text-center py-4">
              {t("admin.benchmarks.stats.noData")}
            </p>
          )}
        </AdminCard>
      </div>
    </AdminPage>
  );
}
