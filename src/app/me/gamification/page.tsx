// src/app/me/gamification/page.tsx
// ============================================================
// Mi Gamificación - Panel de usuario para ver su progreso
// Nivel, puntos, racha, achievements, rewards
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  Trophy,
  Star,
  Flame,
  Gift,
  ChevronRight,
  Loader2,
  Zap,
  Crown,
  Award,
  TrendingUp,
} from "lucide-react";

interface GamificationData {
  user: { id: string; name: string; image: string | null };
  level: {
    current: number;
    title: string;
    titleEN: string;
    color: string;
    icon: string;
    totalPoints: number;
    pointsToNextLevel: number | null;
    progress: number;
    multiplier: number;
  };
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string | null;
    multiplier: number;
  };
  achievements: {
    completed: number;
    total: number;
    recent: Array<{
      slug: string;
      name: string;
      nameEN: string;
      icon: string;
      color: string;
      rarity: string;
      points: number;
      completedAt: string;
    }>;
    inProgress: Array<{
      slug: string;
      name: string;
      nameEN: string;
      icon: string;
      progress: number;
    }>;
  };
  recentPoints: Array<{
    amount: number;
    reason: string;
    description: string;
    createdAt: string;
  }>;
  claimedRewards: Array<{
    slug: string;
    name: string;
    nameEN: string;
    icon: string;
    color: string;
    type: string;
    claimedAt: string;
    status: string;
  }>;
}

const rarityColors: Record<string, string> = {
  COMMON: "from-gray-500 to-gray-600",
  UNCOMMON: "from-green-500 to-emerald-600",
  RARE: "from-blue-500 to-cyan-600",
  EPIC: "from-purple-500 to-violet-600",
  LEGENDARY: "from-amber-500 to-orange-600",
};

export default function MyGamificationPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GamificationData | null>(null);

  // Traducciones con fallback
  const txt = {
    loading: t("gamification.loading", locale === "en" ? "Loading your progress..." : "Cargando tu progreso..."),
    errorLoad: t("gamification.errorLoad", locale === "en" ? "Could not load your gamification info" : "No se pudo cargar tu información de gamificación"),
    level: t("gamification.level", locale === "en" ? "Level" : "Nivel"),
    totalPoints: t("gamification.totalPoints", locale === "en" ? "total points" : "puntos totales"),
    progressToLevel: t("gamification.progressToLevel", locale === "en" ? "Progress to level" : "Progreso al nivel"),
    levelMultiplier: t("gamification.levelMultiplier", locale === "en" ? "level" : "nivel"),
    streakMultiplier: t("gamification.streakMultiplier", locale === "en" ? "streak" : "racha"),
    streakDays: t("gamification.streakDays", locale === "en" ? "streak days" : "días de racha"),
    best: t("gamification.best", locale === "en" ? "Best" : "Mejor"),
    days: t("gamification.days", locale === "en" ? "days" : "días"),
    achievementsUnlocked: t("gamification.achievementsUnlocked", locale === "en" ? "achievements unlocked" : "logros desbloqueados"),
    totalMultiplier: t("gamification.totalMultiplier", locale === "en" ? "total multiplier" : "multiplicador total"),
    rewardsClaimed: t("gamification.rewardsClaimed", locale === "en" ? "rewards claimed" : "rewards canjeados"),
    myAchievements: t("gamification.myAchievements", locale === "en" ? "My Achievements" : "Mis Logros"),
    viewAll: t("gamification.viewAll", locale === "en" ? "View all" : "Ver todos"),
    noAchievements: t("gamification.noAchievements", locale === "en" ? "You haven't unlocked any achievements yet" : "Aún no has desbloqueado logros"),
    keepUsing: t("gamification.keepUsing", locale === "en" ? "Keep using Rowi to earn achievements!" : "¡Sigue usando Rowi para ganar achievements!"),
    recent: t("gamification.recent", locale === "en" ? "Recent" : "Recientes"),
    inProgress: t("gamification.inProgress", locale === "en" ? "In progress" : "En progreso"),
    pointsHistory: t("gamification.pointsHistory", locale === "en" ? "Points History" : "Historial de Puntos"),
    noPoints: t("gamification.noPoints", locale === "en" ? "You don't have any points yet" : "Aún no tienes puntos registrados"),
    rewardsStore: t("gamification.rewardsStore", locale === "en" ? "Rewards Store" : "Tienda de Rewards"),
    redeemPoints: t("gamification.redeemPoints", locale === "en" ? "Redeem your points" : "Canjea tus puntos"),
    leaderboard: t("gamification.leaderboard", locale === "en" ? "Leaderboard" : "Leaderboard"),
    viewRankings: t("gamification.viewRankings", locale === "en" ? "View rankings" : "Ver rankings"),
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/gamification/me");
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Error loading gamification data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Helper para obtener nombre según idioma
  const getName = (item: { name: string; nameEN?: string }) => {
    return locale === "en" && item.nameEN ? item.nameEN : item.name;
  };

  const getTitle = () => {
    if (!data) return "";
    return locale === "en" && data.level.titleEN ? data.level.titleEN : data.level.title;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{txt.loading}</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>{txt.errorLoad}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header with Level */}
      <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-2xl border border-violet-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
              style={{ backgroundColor: data.level.color + "40" }}
            >
              {data.level.current}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{getTitle()}</h1>
              <p className="text-gray-400">{txt.level} {data.level.current}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {data.level.totalPoints.toLocaleString()}
            </div>
            <div className="text-sm text-violet-300">{txt.totalPoints}</div>
          </div>
        </div>

        {/* Progress bar */}
        {data.level.pointsToNextLevel && (
          <div>
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{txt.progressToLevel} {data.level.current + 1}</span>
              <span>{data.level.progress}%</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                style={{ width: `${data.level.progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{data.level.totalPoints} pts</span>
              <span>{data.level.pointsToNextLevel} pts</span>
            </div>
          </div>
        )}

        {/* Multipliers */}
        {(data.level.multiplier > 1 || data.streak.multiplier > 1) && (
          <div className="flex gap-3 mt-4">
            {data.level.multiplier > 1 && (
              <div className="px-3 py-1 bg-violet-500/20 rounded-full text-sm text-violet-300 flex items-center gap-1">
                <Crown className="w-4 h-4" />
                x{data.level.multiplier} {txt.levelMultiplier}
              </div>
            )}
            {data.streak.multiplier > 1 && (
              <div className="px-3 py-1 bg-amber-500/20 rounded-full text-sm text-amber-300 flex items-center gap-1">
                <Flame className="w-4 h-4" />
                x{data.streak.multiplier} {txt.streakMultiplier}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 text-center">
          <Flame className="w-8 h-8 mx-auto mb-2 text-orange-400" />
          <div className="text-2xl font-bold text-white">{data.streak.current}</div>
          <div className="text-xs text-gray-400">{txt.streakDays}</div>
          <div className="text-xs text-gray-500 mt-1">
            {txt.best}: {data.streak.longest} {txt.days}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-400" />
          <div className="text-2xl font-bold text-white">
            {data.achievements.completed}
            <span className="text-lg text-gray-500">/{data.achievements.total}</span>
          </div>
          <div className="text-xs text-gray-400">{txt.achievementsUnlocked}</div>
        </div>

        {/* Level Multiplier */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 text-center">
          <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
          <div className="text-2xl font-bold text-white">
            x{(data.level.multiplier * data.streak.multiplier).toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">{txt.totalMultiplier}</div>
        </div>

        {/* Rewards */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 text-center">
          <Gift className="w-8 h-8 mx-auto mb-2 text-pink-400" />
          <div className="text-2xl font-bold text-white">{data.claimedRewards.length}</div>
          <div className="text-xs text-gray-400">{txt.rewardsClaimed}</div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-white">{txt.myAchievements}</h2>
          </div>
          <button
            onClick={() => router.push("/me/gamification/achievements")}
            className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            {txt.viewAll} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {data.achievements.recent.length === 0 && data.achievements.inProgress.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{txt.noAchievements}</p>
            <p className="text-sm mt-1">{txt.keepUsing}</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Recent Achievements */}
            {data.achievements.recent.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">{txt.recent}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.achievements.recent.map((ach) => (
                    <div
                      key={ach.slug}
                      className={`p-3 rounded-xl bg-gradient-to-br ${rarityColors[ach.rarity] || rarityColors.COMMON} bg-opacity-20`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{ach.icon}</div>
                        <div>
                          <div className="font-medium text-white text-sm">{getName(ach)}</div>
                          <div className="text-xs text-gray-400">+{ach.points} pts</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress */}
            {data.achievements.inProgress.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">{txt.inProgress}</h3>
                <div className="space-y-2">
                  {data.achievements.inProgress.slice(0, 3).map((ach) => (
                    <div key={ach.slug} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl">
                      <div className="text-xl opacity-50">{ach.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-300 text-sm">{getName(ach)}</div>
                        <div className="h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-violet-500"
                            style={{ width: `${ach.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{ach.progress}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Points History */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="font-semibold text-white">{txt.pointsHistory}</h2>
          </div>
        </div>

        {data.recentPoints.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{txt.noPoints}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {data.recentPoints.map((point, idx) => (
              <div key={idx} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-white">{point.description}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(point.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className={`font-bold ${point.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {point.amount >= 0 ? "+" : ""}{point.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => router.push("/me/gamification/rewards")}
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 rounded-xl border border-pink-500/30 transition-colors text-left"
        >
          <Gift className="w-8 h-8 text-pink-400" />
          <div>
            <h4 className="font-medium text-white">{txt.rewardsStore}</h4>
            <p className="text-sm text-gray-400">{txt.redeemPoints}</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/me/gamification/leaderboard")}
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 rounded-xl border border-amber-500/30 transition-colors text-left"
        >
          <Award className="w-8 h-8 text-amber-400" />
          <div>
            <h4 className="font-medium text-white">{txt.leaderboard}</h4>
            <p className="text-sm text-gray-400">{txt.viewRankings}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
