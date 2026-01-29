"use client";

import { useEffect, useState } from "react";
import WorldMap from "./components/WorldMap";
import {
  Globe2, Heart, Users, TrendingUp, Database, Building2,
  UserPlus, Brain, RefreshCw, BarChart3
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Summary {
  benchmarkBase: number;
  benchmarksInDB: number;
  totalRowiers: number;
  totalUsers: number;
  newUsers: number;
  newUsersLabel: string;
  totalCommunities: number;
  totalSnapshots: number;
  totalCountries: number;
  topEmotions: { tag: string; count: number }[];
}

interface CountryData {
  code: string;
  name: string;
  benchmarks: number;
  users: number;
  newUsers: number;
  communities: number;
  eqSnapshots: number;
  avgEQ: number | null;
  total: number;
  coordinates: [number, number];
}

export default function RowiVersePage() {
  const { lang } = useI18n();
  const [data, setData] = useState<{
    summary: Summary;
    mapData: CountryData[];
    countries: Record<string, any>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/hub/rowiverse/insights", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Error loading RowiVerse data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const t = {
    es: {
      title: "RowiVerse Global",
      subtitle: "Ecosistema emocional mundial — comunidades, usuarios y benchmarks activos",
      contributions: "Ver Contribuciones",
      refresh: "Actualizar",
      loading: "Cargando datos...",
      totalRowiers: "Total Rowiers",
      benchmarkBase: "Base Benchmark",
      newRowiers: "Nuevos Rowiers",
      lastMonths: "Últimos 3 meses",
      communities: "Comunidades",
      eqSnapshots: "Evaluaciones SEI",
      countries: "Países",
      activeUsers: "Usuarios Activos",
      legend: "Leyenda",
      benchmarks: "Benchmarks (Six Seconds)",
      users: "Usuarios Rowi",
      newUsers: "Usuarios Nuevos",
      orgs: "Organizaciones",
      topCountries: "Top Países por Rowiers",
      topEmotions: "Emociones Predominantes",
    },
    en: {
      title: "RowiVerse Global",
      subtitle: "Global emotional ecosystem — communities, users and active benchmarks",
      contributions: "View Contributions",
      refresh: "Refresh",
      loading: "Loading data...",
      totalRowiers: "Total Rowiers",
      benchmarkBase: "Benchmark Base",
      newRowiers: "New Rowiers",
      lastMonths: "Last 3 months",
      communities: "Communities",
      eqSnapshots: "SEI Assessments",
      countries: "Countries",
      activeUsers: "Active Users",
      legend: "Legend",
      benchmarks: "Benchmarks (Six Seconds)",
      users: "Rowi Users",
      newUsers: "New Users",
      orgs: "Organizations",
      topCountries: "Top Countries by Rowiers",
      topEmotions: "Top Emotions",
    },
  };

  const text = t[lang as keyof typeof t] || t.es;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--rowi-primary)] mx-auto mb-3" />
          <p className="text-[var(--rowi-muted)]">{text.loading}</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--rowi-border)] pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--rowi-primary)] flex items-center gap-2">
            <Globe2 className="w-7 h-7" /> {text.title}
          </h1>
          <p className="text-[var(--rowi-muted)] text-sm mt-1">{text.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--rowi-card)] border border-[var(--rowi-border)] hover:bg-[var(--rowi-border)] transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {text.refresh}
          </button>
          <a
            href="/hub/admin/rowiverse/contributions"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] hover:bg-[var(--rowi-primary)]/20 transition-colors text-sm font-medium"
          >
            <TrendingUp className="w-4 h-4" />
            {text.contributions}
          </a>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Database className="w-5 h-5" />}
          label={text.totalRowiers}
          value={formatNumber(summary?.totalRowiers || 0)}
          color="purple"
          subtext={`${formatNumber(summary?.benchmarkBase || 0)} base`}
        />
        <StatCard
          icon={<UserPlus className="w-5 h-5" />}
          label={text.newRowiers}
          value={formatNumber(summary?.newUsers || 0)}
          color="green"
          subtext={text.lastMonths}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label={text.activeUsers}
          value={formatNumber(summary?.totalUsers || 0)}
          color="blue"
        />
        <StatCard
          icon={<Building2 className="w-5 h-5" />}
          label={text.communities}
          value={formatNumber(summary?.totalCommunities || 0)}
          color="orange"
        />
        <StatCard
          icon={<Brain className="w-5 h-5" />}
          label={text.eqSnapshots}
          value={formatNumber(summary?.totalSnapshots || 0)}
          color="pink"
        />
        <StatCard
          icon={<Globe2 className="w-5 h-5" />}
          label={text.countries}
          value={summary?.totalCountries || 0}
          color="teal"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
        <span className="text-sm font-medium text-[var(--rowi-muted)]">{text.legend}:</span>
        <LegendItem color="#8b5cf6" label={text.benchmarks} />
        <LegendItem color="#3b82f6" label={text.users} />
        <LegendItem color="#10b981" label={text.newUsers} />
        <LegendItem color="#f59e0b" label={text.orgs} />
      </div>

      {/* Map */}
      <WorldMap
        data={data?.countries || {}}
        mapData={data?.mapData || []}
      />

      {/* Bottom Section: Top Countries + Emotions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div className="rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)] p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--rowi-primary)]" />
            {text.topCountries}
          </h3>
          <div className="space-y-2">
            {(data?.mapData || []).slice(0, 10).map((country, i) => (
              <div
                key={country.code}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--rowi-border)]/50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-[var(--rowi-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--rowi-primary)]">
                  {i + 1}
                </span>
                <span className="flex-1 font-medium truncate">{country.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  {country.benchmarks > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {formatNumber(country.benchmarks)} bench
                    </span>
                  )}
                  {country.users > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {formatNumber(country.users)} users
                    </span>
                  )}
                  {country.newUsers > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      +{country.newUsers} new
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Emotions */}
        <div className="rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)] p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            {text.topEmotions}
          </h3>
          <div className="space-y-2">
            {(summary?.topEmotions || []).map((emotion) => (
              <div
                key={emotion.tag}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--rowi-border)]/50 transition-colors"
              >
                <span className="text-2xl">{getEmotionEmoji(emotion.tag)}</span>
                <span className="flex-1 font-medium capitalize">{emotion.tag}</span>
                <span className="text-sm text-[var(--rowi-muted)]">
                  {formatNumber(emotion.count)}
                </span>
              </div>
            ))}
            {(!summary?.topEmotions || summary.topEmotions.length === 0) && (
              <p className="text-sm text-[var(--rowi-muted)] text-center py-4">
                {lang === "es" ? "Sin datos de emociones" : "No emotion data"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subtext?: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    teal: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  };

  return (
    <div className="flex items-center gap-3 bg-[var(--rowi-card)] border border-[var(--rowi-border)] rounded-xl p-4">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      <div>
        <p className="text-xs uppercase text-[var(--rowi-muted)]">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {subtext && <p className="text-xs text-[var(--rowi-muted)]">{subtext}</p>}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function getEmotionEmoji(emotion: string): string {
  const emojis: Record<string, string> = {
    joy: "😊",
    happiness: "😄",
    love: "❤️",
    gratitude: "🙏",
    hope: "🌟",
    calm: "😌",
    peace: "☮️",
    excitement: "🎉",
    curiosity: "🤔",
    surprise: "😮",
    sadness: "😢",
    fear: "😰",
    anger: "😠",
    anxiety: "😟",
    frustration: "😤",
    neutral: "😐",
  };
  return emojis[emotion.toLowerCase()] || "💭";
}
