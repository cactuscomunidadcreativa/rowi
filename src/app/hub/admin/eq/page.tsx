"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  Brain, Users, TrendingUp, BarChart3, RefreshCw,
  Target, Heart, Zap, Globe2
} from "lucide-react";

/**
 * =========================================================
 * 🧠 EQ Dashboard — Panel de Inteligencia Emocional Global
 * =========================================================
 * Muestra métricas globales de EQ de todos los usuarios de ROWI
 */

interface EqStats {
  totalSnapshots: number;
  totalUsers: number;
  avgKnow: number;
  avgChoose: number;
  avgGive: number;
  avgTotal: number;
  recentSnapshots: number;
  topCountries: { country: string; count: number }[];
}

export default function EqAdminPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<EqStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/eq/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--rowi-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-3">
            <Brain className="w-8 h-8 text-[var(--rowi-primary)]" />
            {t("admin.eq.title")}
          </h1>
          <p className="text-sm text-[var(--rowi-muted)] mt-1">
            {t("admin.eq.subtitle")}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-card)] border border-[var(--rowi-border)] hover:bg-[var(--rowi-border)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t("admin.eq.refresh")}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Snapshots */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
                {stats?.totalSnapshots?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-[var(--rowi-muted)]">
                {t("admin.eq.totalSnapshots")}
              </p>
            </div>
          </div>
        </div>

        {/* Users con EQ */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
                {stats?.totalUsers?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-[var(--rowi-muted)]">
                {t("admin.eq.usersWithEq")}
              </p>
            </div>
          </div>
        </div>

        {/* Promedio Global */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/20">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
                {stats?.avgTotal?.toFixed(1) || "—"}
              </p>
              <p className="text-sm text-[var(--rowi-muted)]">
                {t("admin.eq.avgTotal")}
              </p>
            </div>
          </div>
        </div>

        {/* Recientes (30 días) */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-500/20">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
                {stats?.recentSnapshots?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-[var(--rowi-muted)]">
                {t("admin.eq.recentSnapshots")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KCG Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Know Yourself */}
        <div className="p-6 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="font-semibold text-[var(--rowi-foreground)]">
              {t("admin.eq.knowYourself")}
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-yellow-400">
              {stats?.avgKnow?.toFixed(1) || "—"}
            </span>
            <span className="text-sm text-[var(--rowi-muted)] mb-1">/100</span>
          </div>
          <div className="mt-3 h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
              style={{ width: `${stats?.avgKnow || 0}%` }}
            />
          </div>
        </div>

        {/* Choose Yourself */}
        <div className="p-6 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Zap className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-semibold text-[var(--rowi-foreground)]">
              {t("admin.eq.chooseYourself")}
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-red-400">
              {stats?.avgChoose?.toFixed(1) || "—"}
            </span>
            <span className="text-sm text-[var(--rowi-muted)] mb-1">/100</span>
          </div>
          <div className="mt-3 h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full"
              style={{ width: `${stats?.avgChoose || 0}%` }}
            />
          </div>
        </div>

        {/* Give Yourself */}
        <div className="p-6 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Heart className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-[var(--rowi-foreground)]">
              {t("admin.eq.giveYourself")}
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-blue-400">
              {stats?.avgGive?.toFixed(1) || "—"}
            </span>
            <span className="text-sm text-[var(--rowi-muted)] mb-1">/100</span>
          </div>
          <div className="mt-3 h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"
              style={{ width: `${stats?.avgGive || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Countries */}
      {stats?.topCountries && stats.topCountries.length > 0 && (
        <div className="p-6 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
          <div className="flex items-center gap-3 mb-4">
            <Globe2 className="w-5 h-5 text-[var(--rowi-primary)]" />
            <h3 className="font-semibold text-[var(--rowi-foreground)]">
              {t("admin.eq.topCountries")}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.topCountries.slice(0, 5).map((item, i) => (
              <div
                key={item.country}
                className="p-4 rounded-lg bg-[var(--rowi-background)] text-center"
              >
                <p className="text-lg font-bold text-[var(--rowi-foreground)]">
                  {item.count.toLocaleString()}
                </p>
                <p className="text-sm text-[var(--rowi-muted)]">{item.country || "Unknown"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
