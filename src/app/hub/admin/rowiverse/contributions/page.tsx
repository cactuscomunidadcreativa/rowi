"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  Globe2,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  FileSpreadsheet,
  UserPlus,
  BarChart3,
  RefreshCw,
} from "lucide-react";

interface ContributionStats {
  totalContributions: number;
  bySource: Record<string, number>;
  byCountry: Array<{ country: string; count: number }>;
  lastContribution: string | null;
}

interface BenchmarkInfo {
  id: string;
  name: string;
  totalRows: number;
  processedRows: number;
  lastEnrichedAt: string | null;
  createdAt: string;
}

interface RecentContribution {
  id: string;
  sourceType: string;
  eqTotal: number | null;
  country: string | null;
  status: string;
  createdAt: string;
}

export default function RowiverseContributionsPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<ContributionStats | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkInfo | null>(null);
  const [recentContributions, setRecentContributions] = useState<
    RecentContribution[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch("/api/rowiverse/stats");
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
        setBenchmark(data.benchmark);
      }
    } catch (error) {
      console.error("Error loading RowiVerse stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <header className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-7 h-7" />
              {t("admin.rowiverse.contributions.title")}
            </h1>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-[var(--rowi-primary)] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-[var(--rowi-primary)]" />
            {t("admin.rowiverse.contributions.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] text-sm mt-1">
            {t("admin.rowiverse.contributions.description")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] hover:bg-[var(--rowi-primary)]/20 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {t("common.refresh")}
          </button>

          <a
            href="/hub/admin/rowiverse"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-card-border)] hover:bg-[var(--rowi-muted)]/10 transition-colors"
          >
            <Globe2 className="w-4 h-4" />
            {t("admin.rowiverse.contributions.backToGlobal")}
          </a>
        </div>
      </header>

      {/* Benchmark Info */}
      {benchmark && (
        <section className="rowi-card bg-gradient-to-r from-[var(--rowi-primary)]/5 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Globe2 className="w-5 h-5" />
                {benchmark.name}
              </h2>
              <p className="text-sm text-[var(--rowi-muted)] mt-1">
                {t("admin.rowiverse.contributions.benchmarkDescription")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[var(--rowi-primary)]">
                {benchmark.totalRows.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.rowiverse.contributions.totalDataPoints")}
              </p>
            </div>
          </div>

          {benchmark.lastEnrichedAt && (
            <div className="mt-4 pt-4 border-t border-[var(--rowi-card-border)]">
              <p className="text-xs text-[var(--rowi-muted)] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t("admin.rowiverse.contributions.lastEnriched")}:{" "}
                {new Date(benchmark.lastEnrichedAt).toLocaleString()}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Stats Grid */}
      {stats && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label={t("admin.rowiverse.contributions.totalContributions")}
            value={stats.totalContributions.toLocaleString()}
            color="primary"
          />

          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            label={t("admin.rowiverse.contributions.countriesRepresented")}
            value={stats.byCountry.length.toString()}
            color="success"
          />

          <StatCard
            icon={<FileSpreadsheet className="w-5 h-5" />}
            label={t("admin.rowiverse.contributions.csvUploads")}
            value={(stats.bySource["csv_upload"] || 0).toLocaleString()}
            color="warning"
          />

          <StatCard
            icon={<UserPlus className="w-5 h-5" />}
            label={t("admin.rowiverse.contributions.registrations")}
            value={(stats.bySource["registration"] || 0).toLocaleString()}
            color="info"
          />
        </section>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contributions by Source */}
        {stats && (
          <section className="rowi-card">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              {t("admin.rowiverse.contributions.bySource")}
            </h3>

            <div className="space-y-3">
              {Object.entries(stats.bySource).map(([source, count]) => (
                <div
                  key={source}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--rowi-muted)]/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {source === "csv_upload"
                        ? "📄"
                        : source === "registration"
                        ? "👤"
                        : source === "eq_snapshot"
                        ? "📊"
                        : "📝"}
                    </span>
                    <span className="font-medium">
                      {source === "csv_upload"
                        ? t("admin.rowiverse.contributions.source.csv")
                        : source === "registration"
                        ? t("admin.rowiverse.contributions.source.registration")
                        : source === "eq_snapshot"
                        ? t("admin.rowiverse.contributions.source.eqSnapshot")
                        : source}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{count.toLocaleString()}</p>
                    <p className="text-xs text-[var(--rowi-muted)]">
                      {(
                        (count / stats.totalContributions) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Top Countries */}
        {stats && (
          <section className="rowi-card">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t("admin.rowiverse.contributions.topCountries")}
            </h3>

            <div className="space-y-2">
              {stats.byCountry.slice(0, 10).map((item, idx) => (
                <div
                  key={item.country}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--rowi-muted)]/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--rowi-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--rowi-primary)]">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{item.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-[var(--rowi-muted)]/20 overflow-hidden">
                      <div
                        className="h-full bg-[var(--rowi-primary)] rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (item.count / stats.byCountry[0].count) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16 text-right">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Activity Timeline */}
      {stats?.lastContribution && (
        <section className="rowi-card">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t("admin.rowiverse.contributions.recentActivity")}
          </h3>

          <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--rowi-success)]/10 border border-[var(--rowi-success)]/30">
            <div className="w-3 h-3 rounded-full bg-[var(--rowi-success)] animate-pulse" />
            <div>
              <p className="font-medium">
                {t("admin.rowiverse.contributions.lastContributionReceived")}
              </p>
              <p className="text-sm text-[var(--rowi-muted)]">
                {new Date(stats.lastContribution).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="rowi-card bg-gradient-to-r from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {t("admin.rowiverse.contributions.growRowiverse")}
            </h3>
            <p className="text-sm text-[var(--rowi-muted)] mt-1">
              {t("admin.rowiverse.contributions.growDescription")}
            </p>
          </div>
          <a
            href="/hub/admin/communities"
            className="px-6 py-3 rounded-lg bg-[var(--rowi-primary)] text-white hover:bg-[var(--rowi-primary)]/90 transition-colors"
          >
            {t("admin.rowiverse.contributions.importCommunity")}
          </a>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "success" | "warning" | "info";
}) {
  const colorClasses = {
    primary:
      "bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] border-[var(--rowi-primary)]/30",
    success:
      "bg-[var(--rowi-success)]/10 text-[var(--rowi-success)] border-[var(--rowi-success)]/30",
    warning:
      "bg-[var(--rowi-warning)]/10 text-[var(--rowi-warning)] border-[var(--rowi-warning)]/30",
    info: "bg-[var(--rowi-info)]/10 text-[var(--rowi-info)] border-[var(--rowi-info)]/30",
  };

  return (
    <div
      className={`p-4 rounded-lg border ${colorClasses[color]} transition-all hover:scale-105`}
    >
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}
