"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  Globe2,
  TrendingUp,
  MapPin,
  Calendar,
  FileSpreadsheet,
  UserPlus,
  BarChart3,
  RefreshCw,
  ArrowLeft,
  Database,
  Users,
  Activity,
  Sparkles,
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

type TFn = (key: string, fallback: string) => string;

export default function RowiverseContributionsPage() {
  const { t } = useI18n();

  const [stats, setStats] = useState<ContributionStats | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkInfo | null>(null);
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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--rowi-primary)] mx-auto mb-3" />
          <p className="text-[var(--rowi-muted)]">{t("rowiverseContrib.loading", "Cargando datos...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--rowi-border)] pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-[var(--rowi-primary)]" />
            {t("rowiverseContrib.title", "Contribuciones RowiVerse")}
          </h1>
          <p className="text-[var(--rowi-muted)] text-sm mt-1">
            {t(
              "rowiverseContrib.description",
              "Seguimiento de aportes al ecosistema global de inteligencia emocional",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--rowi-surface)] border border-[var(--rowi-border)] hover:bg-[var(--rowi-background)] transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("rowiverseContrib.refresh", "Actualizar")}
          </button>
          <a
            href="/hub/admin/rowiverse"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] hover:bg-[var(--rowi-primary)]/20 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("rowiverseContrib.backToGlobal", "Volver al Mapa")}
          </a>
        </div>
      </header>

      {/* Benchmark Hero Card */}
      {benchmark && (
        <div className="rounded-2xl bg-gradient-to-r from-[var(--rowi-primary)]/10 via-purple-500/5 to-[var(--rowi-primary)]/10 border border-[var(--rowi-border)] p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--rowi-primary)]/20 flex items-center justify-center">
                <Globe2 className="w-7 h-7 text-[var(--rowi-primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--rowi-foreground)]">{benchmark.name}</h2>
                <p className="text-sm text-[var(--rowi-muted)]">
                  {t(
                    "rowiverseContrib.benchmarkDescription",
                    "Base de datos global de inteligencia emocional Six Seconds",
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[var(--rowi-primary)]">
                  {formatNumber(benchmark.totalRows)}
                </span>
              </div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("rowiverseContrib.totalDataPoints", "puntos de datos totales")}
              </p>
              {benchmark.lastEnrichedAt && (
                <p className="text-xs text-[var(--rowi-muted)] mt-1 flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" />
                  {t("rowiverseContrib.lastEnriched", "Última actualización")}:{" "}
                  {new Date(benchmark.lastEnrichedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Database className="w-5 h-5" />}
            value={formatNumber(stats.totalContributions)}
            label={t("rowiverseContrib.totalContributions", "Total Contribuciones")}
            color="purple"
          />
          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            value={stats.byCountry.length.toString()}
            label={t("rowiverseContrib.countriesRepresented", "Países Representados")}
            color="green"
          />
          <StatCard
            icon={<FileSpreadsheet className="w-5 h-5" />}
            value={formatNumber(stats.bySource["csv_upload"] || 0)}
            label={t("rowiverseContrib.csvUploads", "Cargas CSV")}
            color="orange"
          />
          <StatCard
            icon={<UserPlus className="w-5 h-5" />}
            value={formatNumber(stats.bySource["registration"] || 0)}
            label={t("rowiverseContrib.registrations", "Registros de Usuario")}
            color="blue"
          />
        </div>
      )}

      {/* Two Column Layout */}
      {stats ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* By Source */}
          <div className="rounded-xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--rowi-primary)]" />
              {t("rowiverseContrib.bySource", "Por Fuente de Datos")}
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.bySource).map(([source, count]) => {
                const sourceInfo = getSourceInfo(source, t);
                const percentage = ((count / stats.totalContributions) * 100).toFixed(1);

                return (
                  <div
                    key={source}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--rowi-background)] hover:bg-[var(--rowi-border)]/50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${sourceInfo.color}15` }}
                    >
                      {sourceInfo.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{sourceInfo.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--rowi-border)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, parseFloat(percentage))}%`,
                              backgroundColor: sourceInfo.color,
                            }}
                          />
                        </div>
                        <span className="text-xs text-[var(--rowi-muted)]">{percentage}%</span>
                      </div>
                    </div>
                    <p className="font-bold text-lg">{formatNumber(count)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Countries */}
          <div className="rounded-xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              {t("rowiverseContrib.topCountries", "Top Países Contribuyentes")}
            </h3>
            <div className="space-y-2">
              {stats.byCountry.slice(0, 8).map((item, idx) => (
                <div
                  key={item.country}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--rowi-background)] transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-[var(--rowi-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--rowi-primary)]">
                    {idx + 1}
                  </span>
                  <span className="flex-1 font-medium text-sm truncate">{item.country}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-[var(--rowi-border)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--rowi-primary)] rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (item.count / stats.byCountry[0].count) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-14 text-right">{formatNumber(item.count)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] p-12 text-center">
          <Database className="w-12 h-12 text-[var(--rowi-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--rowi-foreground)] mb-2">
            {t("rowiverseContrib.noData", "Sin datos de contribuciones")}
          </h3>
          <p className="text-sm text-[var(--rowi-muted)]">
            {t(
              "rowiverseContrib.noDataDesc",
              "Las contribuciones aparecerán aquí cuando se agreguen datos al RowiVerse",
            )}
          </p>
        </div>
      )}

      {/* Recent Activity */}
      {stats?.lastContribution && (
        <div className="rounded-xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500" />
            {t("rowiverseContrib.recentActivity", "Actividad Reciente")}
          </h3>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <div>
              <p className="font-medium text-sm">
                {t("rowiverseContrib.lastContributionReceived", "Última contribución recibida")}
              </p>
              <p className="text-xs text-[var(--rowi-muted)]">
                {new Date(stats.lastContribution).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-xl bg-gradient-to-r from-[var(--rowi-primary)]/10 to-purple-500/10 border border-[var(--rowi-border)] p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--rowi-primary)]/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[var(--rowi-primary)]" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {t("rowiverseContrib.growRowiverse", "Haz Crecer el RowiVerse")}
              </h3>
              <p className="text-sm text-[var(--rowi-muted)]">
                {t(
                  "rowiverseContrib.growDescription",
                  "Importa nuevas comunidades y enriquece el ecosistema global de IE",
                )}
              </p>
            </div>
          </div>
          <a
            href="/hub/admin/communities"
            className="px-6 py-3 rounded-lg bg-[var(--rowi-primary)] text-white hover:bg-[var(--rowi-primary)]/90 transition-colors font-medium whitespace-nowrap"
          >
            {t("rowiverseContrib.importCommunity", "Importar Comunidad")}
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: "bg-[var(--rowi-secondary)]/10 text-[var(--rowi-secondary)]",
    green: "bg-[var(--rowi-success)]/10 text-[var(--rowi-success)]",
    orange: "bg-[var(--rowi-warning)]/10 text-[var(--rowi-warning)]",
    blue: "bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]",
  };

  return (
    <div className="flex items-center gap-3 bg-[var(--rowi-surface)] border border-[var(--rowi-border)] rounded-xl p-4 hover:border-[var(--rowi-borderHover)] transition-colors">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-[var(--rowi-foreground)]">{value}</p>
        <p className="text-xs text-[var(--rowi-muted)]">{label}</p>
      </div>
    </div>
  );
}

function getSourceInfo(source: string, t: TFn) {
  const sources: Record<string, { emoji: string; label: string; color: string }> = {
    csv_upload: { emoji: "📄", label: t("rowiverseContrib.source.csv", "Carga CSV"), color: "#f59e0b" },
    registration: {
      emoji: "👤",
      label: t("rowiverseContrib.source.registration", "Registro de Usuario"),
      color: "#3b82f6",
    },
    eq_snapshot: {
      emoji: "📊",
      label: t("rowiverseContrib.source.eqSnapshot", "Evaluación EQ"),
      color: "#8b5cf6",
    },
  };
  return sources[source] || { emoji: "📝", label: source, color: "#6b7280" };
}
