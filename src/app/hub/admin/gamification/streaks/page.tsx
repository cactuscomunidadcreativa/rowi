// src/app/hub/admin/gamification/streaks/page.tsx
// ============================================================
// Gestión de Streaks - Panel de administración
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  Flame,
  Loader2,
  ArrowLeft,
  Users,
  TrendingUp,
  Calendar,
  Zap,
  Trophy,
  Target,
} from "lucide-react";

interface StreakConfig {
  days: number;
  multiplier: number;
  bonus: number;
  name: string;
}

interface UserStreak {
  id: string;
  userId: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  multiplier: number;
}

export default function StreaksPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [topStreaks, setTopStreaks] = useState<UserStreak[]>([]);

  // Configuración de multiplicadores por racha
  const streakTiers: StreakConfig[] = [
    { days: 3, multiplier: 1.1, bonus: 5, name: t("gamStreaks.tierName3", "Inicio de Racha") },
    { days: 7, multiplier: 1.25, bonus: 15, name: t("gamStreaks.tierName7", "Semana Completa") },
    { days: 14, multiplier: 1.4, bonus: 30, name: t("gamStreaks.tierName14", "Quincena Activa") },
    { days: 30, multiplier: 1.6, bonus: 75, name: t("gamStreaks.tierName30", "Mes Imparable") },
    { days: 60, multiplier: 1.8, bonus: 150, name: t("gamStreaks.tierName60", "Dedicación Total") },
    { days: 100, multiplier: 2.0, bonus: 300, name: t("gamStreaks.tierName100", "Leyenda Constante") },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/gamification/leaderboard?type=streak&limit=20");
      const data = await res.json();

      if (data.ok) {
        setTopStreaks(
          data.data.leaderboard.map((entry: any) => ({
            id: entry.userId,
            userId: entry.userId,
            name: entry.name,
            currentStreak: entry.score,
            longestStreak: entry.longestStreak || entry.score,
            lastActivityDate: null,
            multiplier: 1.0,
          }))
        );
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error loading streaks:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t("gamStreaks.loading", "Cargando rachas...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/hub/admin/gamification")}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("gamStreaks.title", "Rachas")}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t("gamStreaks.subtitle", "Configura multiplicadores y bonificaciones")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <Users className="w-4 h-4 text-blue-500" />
            {t("gamStreaks.statsUsersWithStreak", "Usuarios con Racha")}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {topStreaks.filter((s) => s.currentStreak > 0).length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            {t("gamStreaks.statsAvgStreak", "Racha Promedio")}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats?.averageStreak || 0} {t("gamStreaks.statsDays", "días")}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <Trophy className="w-4 h-4 text-amber-500" />
            {t("gamStreaks.statsHighestStreak", "Racha Más Alta")}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {topStreaks[0]?.currentStreak || 0} {t("gamStreaks.statsDays", "días")}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <Calendar className="w-4 h-4 text-purple-500" />
            {t("gamStreaks.statsStreaks7Days", "Rachas +7 días")}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {topStreaks.filter((s) => s.currentStreak >= 7).length}
          </p>
        </div>
      </div>

      {/* Streak Tiers */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          {t("gamStreaks.tiersTitle", "Niveles de Racha y Multiplicadores")}
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {streakTiers.map((tier, idx) => (
            <div
              key={tier.days}
              className="relative bg-gray-100 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-600/30"
            >
              {/* Fire intensity increases with tier */}
              <div
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${
                    idx < 2
                      ? "#F59E0B, #D97706"
                      : idx < 4
                      ? "#EF4444, #DC2626"
                      : "#9333EA, #7C3AED"
                  })`,
                }}
              >
                <Flame className="w-4 h-4 text-gray-900 dark:text-white" />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{tier.days}+ {t("gamStreaks.tiersDays", "días")}</p>
              <p className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                x{tier.multiplier}
              </p>
              <p className="text-xs text-gray-500">{tier.name}</p>
              <p className="text-xs text-amber-400 mt-1">+{tier.bonus} {t("gamStreaks.tiersBonus", "pts bonus")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Streaks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Streaks */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            {t("gamStreaks.topStreaksTitle", "Top Rachas Actuales")}
          </h3>

          <div className="space-y-3">
            {topStreaks.slice(0, 10).map((streak, idx) => (
              <div
                key={streak.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/30"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx === 0
                      ? "bg-amber-500 text-gray-900 dark:text-white"
                      : idx === 1
                      ? "bg-gray-400 text-gray-900 dark:text-white"
                      : idx === 2
                      ? "bg-amber-700 text-gray-900 dark:text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{streak.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Flame
                    className={`w-4 h-4 ${
                      streak.currentStreak >= 30
                        ? "text-red-500"
                        : streak.currentStreak >= 7
                        ? "text-orange-500"
                        : "text-amber-500"
                    }`}
                  />
                  <span className="font-bold text-gray-900 dark:text-white">
                    {streak.currentStreak}
                  </span>
                  <span className="text-xs text-gray-500">{t("gamStreaks.topStreaksDays", "días")}</span>
                </div>
              </div>
            ))}

            {topStreaks.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                {t("gamStreaks.topStreaksNoData", "No hay rachas activas aún")}
              </p>
            )}
          </div>
        </div>

        {/* Streak Distribution */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            {t("gamStreaks.distributionTitle", "Distribución de Rachas")}
          </h3>

          <div className="space-y-4">
            {[
              { label: t("gamStreaks.distributionNoStreak", "Sin racha (0 días)"), min: 0, max: 0, color: "bg-gray-500" },
              { label: t("gamStreaks.distributionStarting", "Inicio (1-2 días)"), min: 1, max: 2, color: "bg-amber-500" },
              { label: t("gamStreaks.distributionInProgress", "En progreso (3-6 días)"), min: 3, max: 6, color: "bg-orange-500" },
              { label: t("gamStreaks.distributionWeekPlus", "Semana+ (7-29 días)"), min: 7, max: 29, color: "bg-red-500" },
              { label: t("gamStreaks.distributionMonthPlus", "Mes+ (30+ días)"), min: 30, max: Infinity, color: "bg-purple-500" },
            ].map((range) => {
              const count = topStreaks.filter(
                (s) => s.currentStreak >= range.min && s.currentStreak <= range.max
              ).length;
              const total = topStreaks.length || 1;
              const percent = Math.round((count / total) * 100);

              return (
                <div key={range.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{range.label}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{count} {t("gamStreaks.distributionUsers", "usuarios")}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${range.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
