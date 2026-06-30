// src/app/hub/admin/gamification/page.tsx
// ============================================================
// Dashboard de Gamificación - Panel de administración
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
  Users,
  TrendingUp,
  Award,
  Crown,
  Target,
  Zap,
  Medal,
  BarChart3,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  achievements: { total: number; activeUsers: number };
  levels: { total: number; avgLevel: number; maxReached: number };
  rewards: { total: number; claimed: number };
  leaderboard: { topUsers: number; totalPoints: number };
}

export default function GamificationDashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [achievementsRes, levelsRes] = await Promise.all([
        fetch("/api/admin/gamification/achievements?stats=true"),
        fetch("/api/admin/gamification/levels"),
      ]);

      const achievementsData = await achievementsRes.json();
      const levelsData = await levelsRes.json();

      setStats({
        achievements: achievementsData.data?.stats || {},
        levels: levelsData.data?.stats || {},
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const modules = [
    {
      id: "achievements",
      title: t("admin.gamification.achievements", "Achievements"),
      description: t(
        "admin.gamification.achievementsDesc",
        "Crea y gestiona logros para motivar a los usuarios",
      ),
      icon: Trophy,
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500/10",
      iconColor: "text-yellow-500",
      href: "/hub/admin/gamification/achievements",
      stat: stats?.achievements?.totalAchievements || 0,
      statLabel: t(
        "admin.gamification.stats.totalAchievements",
        "Logros Totales",
      ),
    },
    {
      id: "levels",
      title: t("admin.gamification.levels", "Niveles"),
      description: t(
        "admin.gamification.levelsDesc",
        "Define la progresión y títulos de cada nivel",
      ),
      icon: Crown,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
      href: "/hub/admin/gamification/levels",
      stat: stats?.levels?.totalLevels || 0,
      statLabel: t("admin.gamification.levels", "Niveles"),
    },
    {
      id: "streaks",
      title: t("admin.gamification.streaks", "Rachas"),
      description: t(
        "admin.gamification.streaksDesc",
        "Configura multiplicadores y bonificaciones por rachas",
      ),
      icon: Flame,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-500",
      href: "/hub/admin/gamification/streaks",
      stat: stats?.levels?.totalUsers || 0,
      statLabel: t("admin.gamification.stats.activeStreaks", "Rachas Activas"),
    },
    {
      id: "leaderboards",
      title: t("admin.gamification.leaderboards", "Leaderboards"),
      description: t(
        "admin.gamification.leaderboardsDesc",
        "Visualiza rankings y competencias",
      ),
      icon: BarChart3,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
      href: "/hub/admin/gamification/leaderboards",
      stat: stats?.achievements?.usersWithAchievements || 0,
      statLabel: t(
        "admin.gamification.stats.usersWithAchievements",
        "Usuarios con Logros",
      ),
    },
    {
      id: "rewards",
      title: t("admin.gamification.rewards", "Recompensas"),
      description: t(
        "admin.gamification.rewardsDesc",
        "Crea recompensas canjeables con puntos",
      ),
      icon: Gift,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
      href: "/hub/admin/gamification/rewards",
      stat: 8,
      statLabel: t(
        "admin.gamification.stats.totalRewardsClaimed",
        "Recompensas Canjeadas",
      ),
    },
  ];

  const quickStats = [
    {
      label: t(
        "admin.gamification.stats.totalAchievements",
        "Logros Totales",
      ),
      value: stats?.achievements?.totalAchievements || 0,
      icon: Trophy,
      color: "text-yellow-500",
    },
    {
      label: t(
        "admin.gamification.stats.usersWithAchievements",
        "Usuarios con Logros",
      ),
      value: stats?.achievements?.usersWithAchievements || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: t("admin.gamification.stats.avgLevel", "Nivel Promedio"),
      value: stats?.levels?.avgLevel || 1,
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      label: t(
        "admin.gamification.stats.maxReached",
        "Nivel Máximo Alcanzado",
      ),
      value: stats?.levels?.maxLevelReached || 1,
      icon: Crown,
      color: "text-amber-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t("common.loading", "Cargando...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("admin.gamification.title", "Gamificación")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t(
              "admin.gamification.subtitle",
              "Gestiona logros, niveles, rachas y recompensas",
            )}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => router.push(module.href)}
            className="group text-left bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${module.bgColor}`}>
                <module.icon className={`w-6 h-6 ${module.iconColor}`} />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-gray-900 dark:text-white group-hover:translate-x-1 transition-all" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {module.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{module.description}</p>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700/50">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{module.stat}</span>
              <span className="text-xs text-gray-500">{module.statLabel}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          {t("admin.gamification.recentActivity", "Actividad Reciente")}
        </h3>
        <div className="space-y-3">
          {[
            { user: "María G.", action: t("admin.gamification.action.completed", "completó"), achievement: t("admin.gamification.demo.firstChat", "Primera Conversación"), icon: Trophy, color: "text-yellow-500" },
            { user: "Carlos R.", action: t("admin.gamification.action.reached", "alcanzó"), achievement: t("admin.gamification.demo.level3", "Nivel 3: Practicante EQ"), icon: Crown, color: "text-purple-500" },
            { user: "Ana L.", action: t("admin.gamification.action.streakOf", "racha de"), achievement: t("admin.gamification.demo.sevenDays", "7 días consecutivos"), icon: Flame, color: "text-orange-500" },
            { user: "Pedro M.", action: t("admin.gamification.action.claimed", "canjeó"), achievement: t("admin.gamification.demo.eqBadge", "Badge: Explorador EQ"), icon: Gift, color: "text-green-500" },
          ].map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/30 hover:bg-gray-100 dark:bg-gray-700/50 transition-colors"
            >
              <activity.icon className={`w-5 h-5 ${activity.color}`} />
              <span className="text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-white">{activity.user}</span>{" "}
                {activity.action}{" "}
                <span className="text-gray-500 dark:text-gray-400">{activity.achievement}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
