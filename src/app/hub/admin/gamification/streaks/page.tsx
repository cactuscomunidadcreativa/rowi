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

const t = {
  es: {
    title: "Rachas",
    subtitle: "Configura multiplicadores y bonificaciones",
    loading: "Cargando rachas...",
    stats: {
      usersWithStreak: "Usuarios con Racha",
      avgStreak: "Racha Promedio",
      highestStreak: "Racha Más Alta",
      streaks7Days: "Rachas +7 días",
      days: "días",
    },
    tiers: {
      title: "Niveles de Racha y Multiplicadores",
      days: "días",
      bonus: "pts bonus",
      tierNames: {
        3: "Inicio de Racha",
        7: "Semana Completa",
        14: "Quincena Activa",
        30: "Mes Imparable",
        60: "Dedicación Total",
        100: "Leyenda Constante",
      },
    },
    topStreaks: {
      title: "Top Rachas Actuales",
      days: "días",
      noData: "No hay rachas activas aún",
    },
    distribution: {
      title: "Distribución de Rachas",
      noStreak: "Sin racha (0 días)",
      starting: "Inicio (1-2 días)",
      inProgress: "En progreso (3-6 días)",
      weekPlus: "Semana+ (7-29 días)",
      monthPlus: "Mes+ (30+ días)",
      users: "usuarios",
    },
  },
  en: {
    title: "Streaks",
    subtitle: "Configure multipliers and bonuses",
    loading: "Loading streaks...",
    stats: {
      usersWithStreak: "Users with Streak",
      avgStreak: "Average Streak",
      highestStreak: "Highest Streak",
      streaks7Days: "Streaks 7+ days",
      days: "days",
    },
    tiers: {
      title: "Streak Tiers and Multipliers",
      days: "days",
      bonus: "pts bonus",
      tierNames: {
        3: "Streak Start",
        7: "Full Week",
        14: "Active Fortnight",
        30: "Unstoppable Month",
        60: "Total Dedication",
        100: "Constant Legend",
      },
    },
    topStreaks: {
      title: "Top Current Streaks",
      days: "days",
      noData: "No active streaks yet",
    },
    distribution: {
      title: "Streak Distribution",
      noStreak: "No streak (0 days)",
      starting: "Starting (1-2 days)",
      inProgress: "In progress (3-6 days)",
      weekPlus: "Week+ (7-29 days)",
      monthPlus: "Month+ (30+ days)",
      users: "users",
    },
  },
};

export default function StreaksPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const labels = t[lang];
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [topStreaks, setTopStreaks] = useState<UserStreak[]>([]);

  // Configuración de multiplicadores por racha
  const streakTiers: StreakConfig[] = [
    { days: 3, multiplier: 1.1, bonus: 5, name: labels.tiers.tierNames[3] },
    { days: 7, multiplier: 1.25, bonus: 15, name: labels.tiers.tierNames[7] },
    { days: 14, multiplier: 1.4, bonus: 30, name: labels.tiers.tierNames[14] },
    { days: 30, multiplier: 1.6, bonus: 75, name: labels.tiers.tierNames[30] },
    { days: 60, multiplier: 1.8, bonus: 150, name: labels.tiers.tierNames[60] },
    { days: 100, multiplier: 2.0, bonus: 300, name: labels.tiers.tierNames[100] },
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
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{labels.loading}</span>
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
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{labels.title}</h1>
            <p className="text-gray-400 text-sm">
              {labels.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users className="w-4 h-4 text-blue-500" />
            {labels.stats.usersWithStreak}
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {topStreaks.filter((s) => s.currentStreak > 0).length}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            {labels.stats.avgStreak}
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.averageStreak || 0} {labels.stats.days}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Trophy className="w-4 h-4 text-amber-500" />
            {labels.stats.highestStreak}
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {topStreaks[0]?.currentStreak || 0} {labels.stats.days}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Calendar className="w-4 h-4 text-purple-500" />
            {labels.stats.streaks7Days}
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {topStreaks.filter((s) => s.currentStreak >= 7).length}
          </p>
        </div>
      </div>

      {/* Streak Tiers */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          {labels.tiers.title}
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {streakTiers.map((tier, idx) => (
            <div
              key={tier.days}
              className="relative bg-gray-700/30 rounded-xl p-4 border border-gray-600/30"
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
                <Flame className="w-4 h-4 text-white" />
              </div>

              <p className="text-sm text-gray-400 mb-1">{tier.days}+ {labels.tiers.days}</p>
              <p className="font-semibold text-white text-lg mb-2">
                x{tier.multiplier}
              </p>
              <p className="text-xs text-gray-500">{tier.name}</p>
              <p className="text-xs text-amber-400 mt-1">+{tier.bonus} {labels.tiers.bonus}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Streaks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Streaks */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            {labels.topStreaks.title}
          </h3>

          <div className="space-y-3">
            {topStreaks.slice(0, 10).map((streak, idx) => (
              <div
                key={streak.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx === 0
                      ? "bg-amber-500 text-white"
                      : idx === 1
                      ? "bg-gray-400 text-white"
                      : idx === 2
                      ? "bg-amber-700 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{streak.name}</p>
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
                  <span className="font-bold text-white">
                    {streak.currentStreak}
                  </span>
                  <span className="text-xs text-gray-500">{labels.topStreaks.days}</span>
                </div>
              </div>
            ))}

            {topStreaks.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                {labels.topStreaks.noData}
              </p>
            )}
          </div>
        </div>

        {/* Streak Distribution */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            {labels.distribution.title}
          </h3>

          <div className="space-y-4">
            {[
              { label: labels.distribution.noStreak, min: 0, max: 0, color: "bg-gray-500" },
              { label: labels.distribution.starting, min: 1, max: 2, color: "bg-amber-500" },
              { label: labels.distribution.inProgress, min: 3, max: 6, color: "bg-orange-500" },
              { label: labels.distribution.weekPlus, min: 7, max: 29, color: "bg-red-500" },
              { label: labels.distribution.monthPlus, min: 30, max: Infinity, color: "bg-purple-500" },
            ].map((range) => {
              const count = topStreaks.filter(
                (s) => s.currentStreak >= range.min && s.currentStreak <= range.max
              ).length;
              const total = topStreaks.length || 1;
              const percent = Math.round((count / total) * 100);

              return (
                <div key={range.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">{range.label}</span>
                    <span className="text-white font-medium">{count} {labels.distribution.users}</span>
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
