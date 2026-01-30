// src/app/me/gamification/achievements/page.tsx
// ============================================================
// Mis Achievements - Todos los logros del usuario (traducible)
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  ArrowLeft,
  Trophy,
  Loader2,
  Lock,
  Check,
  Star,
} from "lucide-react";

interface Achievement {
  id: string;
  slug: string;
  name: string;
  nameEN: string;
  description: string;
  descriptionEN: string;
  icon: string;
  color: string;
  category: string;
  rarity: string;
  points: number;
  isSecret: boolean;
  completed?: boolean;
  progress?: number;
  completedAt?: string;
}

const rarityColors: Record<string, { bg: string; border: string; text: string }> = {
  COMMON: { bg: "from-gray-500/20 to-gray-600/20", border: "border-gray-500/30", text: "text-gray-400" },
  UNCOMMON: { bg: "from-green-500/20 to-emerald-600/20", border: "border-green-500/30", text: "text-green-400" },
  RARE: { bg: "from-blue-500/20 to-cyan-600/20", border: "border-blue-500/30", text: "text-blue-400" },
  EPIC: { bg: "from-purple-500/20 to-violet-600/20", border: "border-purple-500/30", text: "text-purple-400" },
  LEGENDARY: { bg: "from-amber-500/20 to-orange-600/20", border: "border-amber-500/30", text: "text-amber-400" },
};

export default function MyAchievementsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "locked">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Traducciones
  const txt = {
    loading: t("achievements.loading", locale === "en" ? "Loading achievements..." : "Cargando logros..."),
    myAchievements: t("achievements.myAchievements", locale === "en" ? "My Achievements" : "Mis Logros"),
    ofCompleted: t("achievements.ofCompleted", locale === "en" ? "of" : "de"),
    completed: t("achievements.completed", locale === "en" ? "Completed" : "Completados"),
    toUnlock: t("achievements.toUnlock", locale === "en" ? "To unlock" : "Por desbloquear"),
    pointsEarned: t("achievements.pointsEarned", locale === "en" ? "Points earned" : "Puntos ganados"),
    all: t("achievements.all", locale === "en" ? "All" : "Todos"),
    locked: t("achievements.locked", locale === "en" ? "Locked" : "Bloqueados"),
    allCategories: t("achievements.allCategories", locale === "en" ? "All categories" : "Todas las categorías"),
    noResults: t("achievements.noResults", locale === "en" ? "No achievements match the filter" : "No hay logros que coincidan con el filtro"),
    completedOn: t("achievements.completedOn", locale === "en" ? "Completed on" : "Completado el"),
    secretAchievement: t("achievements.secretAchievement", locale === "en" ? "Secret achievement" : "Logro secreto"),
    // Categorías
    catChat: t("achievements.cat.chat", locale === "en" ? "Conversations" : "Conversaciones"),
    catStreak: t("achievements.cat.streak", locale === "en" ? "Streaks" : "Rachas"),
    catEq: t("achievements.cat.eq", locale === "en" ? "Emotional Intelligence" : "Inteligencia Emocional"),
    catLearning: t("achievements.cat.learning", locale === "en" ? "Learning" : "Aprendizaje"),
    catCommunity: t("achievements.cat.community", locale === "en" ? "Community" : "Comunidad"),
    catSocial: t("achievements.cat.social", locale === "en" ? "Social" : "Social"),
    catGeneral: t("achievements.cat.general", locale === "en" ? "General" : "General"),
    // Rarezas
    rarCommon: t("achievements.rar.common", locale === "en" ? "Common" : "Común"),
    rarUncommon: t("achievements.rar.uncommon", locale === "en" ? "Uncommon" : "Poco común"),
    rarRare: t("achievements.rar.rare", locale === "en" ? "Rare" : "Raro"),
    rarEpic: t("achievements.rar.epic", locale === "en" ? "Epic" : "Épico"),
    rarLegendary: t("achievements.rar.legendary", locale === "en" ? "Legendary" : "Legendario"),
  };

  const categoryLabels: Record<string, string> = {
    CHAT: txt.catChat,
    STREAK: txt.catStreak,
    EQ: txt.catEq,
    LEARNING: txt.catLearning,
    COMMUNITY: txt.catCommunity,
    SOCIAL: txt.catSocial,
    GENERAL: txt.catGeneral,
  };

  const rarityLabels: Record<string, string> = {
    COMMON: txt.rarCommon,
    UNCOMMON: txt.rarUncommon,
    RARE: txt.rarRare,
    EPIC: txt.rarEpic,
    LEGENDARY: txt.rarLegendary,
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    try {
      const [allRes, userRes] = await Promise.all([
        fetch("/api/admin/gamification/achievements"),
        fetch("/api/gamification/me"),
      ]);

      const [allJson, userJson] = await Promise.all([allRes.json(), userRes.json()]);

      if (allJson.ok && userJson.ok) {
        const allAchievements = allJson.data.achievements || [];
        const userCompleted = userJson.data.achievements.recent || [];
        const userInProgress = userJson.data.achievements.inProgress || [];

        const completedSlugs = new Set(userCompleted.map((a: any) => a.slug));
        const progressMap = new Map(userInProgress.map((a: any) => [a.slug, a.progress]));

        const merged = allAchievements.map((ach: Achievement) => ({
          ...ach,
          completed: completedSlugs.has(ach.slug),
          progress: progressMap.get(ach.slug) || 0,
          completedAt: userCompleted.find((a: any) => a.slug === ach.slug)?.completedAt,
        }));

        setAchievements(merged);
      }
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  }

  const getName = (ach: Achievement) => locale === "en" && ach.nameEN ? ach.nameEN : ach.name;
  const getDesc = (ach: Achievement) => locale === "en" && ach.descriptionEN ? ach.descriptionEN : ach.description;

  const filteredAchievements = achievements.filter((ach) => {
    if (filter === "completed" && !ach.completed) return false;
    if (filter === "locked" && ach.completed) return false;
    if (categoryFilter !== "all" && ach.category !== categoryFilter) return false;
    return true;
  });

  const categories = ["all", ...new Set(achievements.map((a) => a.category))];

  const stats = {
    total: achievements.length,
    completed: achievements.filter((a) => a.completed).length,
    totalPoints: achievements.filter((a) => a.completed).reduce((sum, a) => sum + a.points, 0),
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

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/me/gamification")}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{txt.myAchievements}</h1>
            <p className="text-gray-400 text-sm">
              {stats.completed} {txt.ofCompleted} {stats.total} {txt.completed.toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.completed}</div>
          <div className="text-xs text-gray-400">{txt.completed}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total - stats.completed}</div>
          <div className="text-xs text-gray-400">{txt.toUnlock}</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.totalPoints}</div>
          <div className="text-xs text-gray-400">{txt.pointsEarned}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {(["all", "completed", "locked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
              }`}
            >
              {f === "all" ? txt.all : f === "completed" ? txt.completed : txt.locked}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm bg-gray-800 text-gray-300 border border-gray-700"
        >
          <option value="all">{txt.allCategories}</option>
          {categories.filter((c) => c !== "all").map((cat) => (
            <option key={cat} value={cat}>
              {categoryLabels[cat] || cat}
            </option>
          ))}
        </select>
      </div>

      {/* Achievement Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{txt.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((ach) => {
            const rarity = rarityColors[ach.rarity] || rarityColors.COMMON;
            const isLocked = !ach.completed && ach.isSecret;

            return (
              <div
                key={ach.id}
                className={`relative p-4 rounded-xl bg-gradient-to-br ${rarity.bg} border ${rarity.border} ${
                  !ach.completed ? "opacity-60" : ""
                }`}
              >
                {ach.completed && (
                  <div className="absolute top-3 right-3 p-1 bg-green-500 rounded-full">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {isLocked && (
                  <div className="absolute inset-0 bg-gray-900/50 rounded-xl flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-500" />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="text-4xl">{isLocked ? "❓" : ach.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {isLocked ? "???" : getName(ach)}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${rarity.text} bg-white/10`}>
                        {rarityLabels[ach.rarity]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {isLocked ? txt.secretAchievement : getDesc(ach)}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-amber-400 text-sm">
                        <Star className="w-4 h-4" />
                        +{ach.points} pts
                      </div>
                      <div className="text-xs text-gray-500">
                        {categoryLabels[ach.category] || ach.category}
                      </div>
                    </div>

                    {!ach.completed && ach.progress > 0 && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 transition-all"
                            style={{ width: `${ach.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{ach.progress}% {txt.completed.toLowerCase()}</div>
                      </div>
                    )}

                    {ach.completed && ach.completedAt && (
                      <div className="text-xs text-green-400 mt-2">
                        {txt.completedOn}{" "}
                        {new Date(ach.completedAt).toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
