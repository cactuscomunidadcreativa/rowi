// src/app/hub/admin/gamification/leaderboards/page.tsx
// ============================================================
// Leaderboards - Panel de administración
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  BarChart3,
  Loader2,
  ArrowLeft,
  Trophy,
  Flame,
  Award,
  Crown,
  Medal,
  Users,
  TrendingUp,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image?: string;
  country?: string;
  score: number;
  level?: number;
  title?: string;
  longestStreak?: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("points");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<any>(null);

  const tabs = [
    { id: "points", label: t("gamLeaderboards.tabs.points", "Puntos"), icon: Trophy },
    { id: "streak", label: t("gamLeaderboards.tabs.streak", "Rachas"), icon: Flame },
    { id: "achievements", label: t("gamLeaderboards.tabs.achievements", "Logros"), icon: Award },
  ];

  useEffect(() => {
    loadLeaderboard(activeTab);
  }, [activeTab]);

  async function loadLeaderboard(type: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/gamification/leaderboard?type=${type}&limit=50`);
      const data = await res.json();

      if (data.ok) {
        setLeaderboard(data.data.leaderboard);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-gray-500 font-medium">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30";
    if (rank === 2) return "bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/30";
    if (rank === 3) return "bg-gradient-to-r from-amber-700/20 to-orange-600/20 border-amber-700/30";
    return "bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/30";
  };

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
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <BarChart3 className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("gamLeaderboards.title", "Leaderboards")}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t("gamLeaderboards.subtitle", "Rankings y competencias de usuarios")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <Users className="w-4 h-4 text-blue-500" />
            {t("gamLeaderboards.stats.totalUsers", "Usuarios Totales")}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats?.totalUsers || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <Trophy className="w-4 h-4 text-yellow-500" />
            {t("gamLeaderboards.stats.globalPoints", "Puntos Globales")}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {(stats?.totalPointsGlobal || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <Award className="w-4 h-4 text-purple-500" />
            {t("gamLeaderboards.stats.achievementsUnlocked", "Logros Desbloqueados")}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats?.totalAchievementsUnlocked || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            {t("gamLeaderboards.stats.avgStreak", "Racha Promedio")}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats?.averageStreak || 0} {t("gamLeaderboards.stats.days", "días")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700/50 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                : "bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {t("gamLeaderboards.noData", "No hay datos en el leaderboard aún")}
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {/* Top 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              {leaderboard.slice(0, 3).map((entry, idx) => (
                <div
                  key={entry.userId}
                  className={`p-4 rounded-xl border ${getRankBg(entry.rank)} ${
                    idx === 0 ? "md:order-2 md:scale-105" : idx === 1 ? "md:order-1" : "md:order-3"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {entry.name}
                      </p>
                      {entry.title && (
                        <p className="text-xs text-gray-500">{entry.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {activeTab === "points" && t("gamLeaderboards.table.points", "Puntos")}
                      {activeTab === "streak" && t("gamLeaderboards.table.days", "Días")}
                      {activeTab === "achievements" && t("gamLeaderboards.table.achievements", "Logros")}
                    </span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rest of the list */}
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm">
                    <th className="pb-3 pl-4">{t("gamLeaderboards.table.rank", "Rank")}</th>
                    <th className="pb-3">{t("gamLeaderboards.table.user", "Usuario")}</th>
                    <th className="pb-3 text-right pr-4">
                      {activeTab === "points" && t("gamLeaderboards.table.points", "Puntos")}
                      {activeTab === "streak" && t("gamLeaderboards.table.streak", "Racha")}
                      {activeTab === "achievements" && t("gamLeaderboards.table.achievements", "Logros")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(3).map((entry) => (
                    <tr
                      key={entry.userId}
                      className="border-t border-gray-200 dark:border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="py-3 pl-4">
                        <span className="text-gray-500 font-medium">
                          {entry.rank}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white">
                            {entry.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{entry.name}</p>
                            {entry.level && (
                              <p className="text-xs text-gray-500">
                                {t("gamLeaderboards.table.level", "Nivel")} {entry.level}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right pr-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {entry.score.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
