// src/app/hub/admin/gamification/achievements/page.tsx
// ============================================================
// Gestión de Achievements - Panel de administración
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  Trophy,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Loader2,
  ArrowLeft,
  Star,
  Zap,
  Users,
  MessageSquare,
  Flame,
  Award,
  Heart,
  BookOpen,
  Sparkles,
  Check,
  X,
} from "lucide-react";

interface Achievement {
  id: string;
  slug: string;
  name: string;
  nameEN?: string;
  description: string;
  descriptionEN?: string;
  icon?: string;
  color: string;
  category: string;
  requirement: string;
  threshold: number;
  points: number;
  rarity: string;
  isActive: boolean;
  completedCount?: number;
}

const categoryIcons: Record<string, any> = {
  GENERAL: Star,
  CHAT: MessageSquare,
  EQ: Zap,
  COMMUNITY: Users,
  LEARNING: BookOpen,
  SOCIAL: Heart,
  STREAK: Flame,
  SPECIAL: Sparkles,
};

const rarityColors: Record<string, string> = {
  COMMON: "bg-gray-500",
  UNCOMMON: "bg-green-500",
  RARE: "bg-blue-500",
  EPIC: "bg-purple-500",
  LEGENDARY: "bg-amber-500",
};

const t = {
  es: {
    title: "Achievements",
    subtitle: "Gestiona logros y recompensas para los usuarios",
    search: "Buscar logros...",
    addNew: "Nuevo Logro",
    filters: {
      all: "Todos",
      general: "General",
      chat: "Chat",
      eq: "EQ",
      community: "Comunidad",
      learning: "Aprendizaje",
      social: "Social",
      streak: "Rachas",
      special: "Especial",
    },
    columns: {
      achievement: "Logro",
      category: "Categoría",
      requirement: "Requisito",
      points: "Puntos",
      rarity: "Rareza",
      users: "Usuarios",
      status: "Estado",
      actions: "Acciones",
    },
    rarity: {
      COMMON: "Común",
      UNCOMMON: "Poco común",
      RARE: "Raro",
      EPIC: "Épico",
      LEGENDARY: "Legendario",
    },
    active: "Activo",
    inactive: "Inactivo",
    edit: "Editar",
    delete: "Eliminar",
    back: "Volver",
    loading: "Cargando...",
    noResults: "No se encontraron logros",
  },
  en: {
    title: "Achievements",
    subtitle: "Manage achievements and rewards for users",
    search: "Search achievements...",
    addNew: "New Achievement",
    filters: {
      all: "All",
      general: "General",
      chat: "Chat",
      eq: "EQ",
      community: "Community",
      learning: "Learning",
      social: "Social",
      streak: "Streaks",
      special: "Special",
    },
    columns: {
      achievement: "Achievement",
      category: "Category",
      requirement: "Requirement",
      points: "Points",
      rarity: "Rarity",
      users: "Users",
      status: "Status",
      actions: "Actions",
    },
    rarity: {
      COMMON: "Common",
      UNCOMMON: "Uncommon",
      RARE: "Rare",
      EPIC: "Epic",
      LEGENDARY: "Legendary",
    },
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    delete: "Delete",
    back: "Back",
    loading: "Loading...",
    noResults: "No achievements found",
  },
};

export default function AchievementsPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stats, setStats] = useState<any>(null);

  const lang = locale === "en" ? "en" : "es";
  const labels = t[lang];

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    try {
      const res = await fetch("/api/admin/gamification/achievements?stats=true");
      const data = await res.json();

      if (data.ok) {
        setAchievements(data.data.achievements);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(achievement: Achievement) {
    try {
      const res = await fetch("/api/admin/gamification/achievements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: achievement.id,
          isActive: !achievement.isActive,
        }),
      });

      if (res.ok) {
        loadAchievements();
      }
    } catch (error) {
      console.error("Error toggling achievement:", error);
    }
  }

  const filteredAchievements = achievements.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || a.category === categoryFilter.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { key: "all", label: labels.filters.all },
    { key: "general", label: labels.filters.general },
    { key: "chat", label: labels.filters.chat },
    { key: "eq", label: labels.filters.eq },
    { key: "community", label: labels.filters.community },
    { key: "learning", label: labels.filters.learning },
    { key: "social", label: labels.filters.social },
    { key: "streak", label: labels.filters.streak },
    { key: "special", label: labels.filters.special },
  ];

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/hub/admin/gamification")}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{labels.title}</h1>
              <p className="text-gray-400 text-sm">{labels.subtitle}</p>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          {labels.addNew}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Total Logros
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.totalAchievements || 0}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users className="w-4 h-4 text-blue-500" />
            Usuarios con Logros
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.usersWithAchievements || 0}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Zap className="w-4 h-4 text-purple-500" />
            Categorías
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.categories?.length || 0}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Award className="w-4 h-4 text-green-500" />
            Logros Activos
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {achievements.filter((a) => a.isActive).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder={labels.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.key
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  {labels.columns.achievement}
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  {labels.columns.category}
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  {labels.columns.points}
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  {labels.columns.rarity}
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  {labels.columns.users}
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  {labels.columns.status}
                </th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">
                  {labels.columns.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAchievements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {labels.noResults}
                  </td>
                </tr>
              ) : (
                filteredAchievements.map((achievement) => {
                  const CategoryIcon =
                    categoryIcons[achievement.category] || Trophy;

                  return (
                    <tr
                      key={achievement.id}
                      className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${achievement.color}20` }}
                          >
                            <Trophy
                              className="w-5 h-5"
                              style={{ color: achievement.color }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {achievement.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300">
                            {achievement.category}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white font-medium">
                          {achievement.points}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium text-white ${
                            rarityColors[achievement.rarity]
                          }`}
                        >
                          {labels.rarity[achievement.rarity as keyof typeof labels.rarity]}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300">
                          {achievement.completedCount || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleActive(achievement)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                            achievement.isActive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {achievement.isActive ? (
                            <>
                              <Check className="w-3 h-3" />
                              {labels.active}
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              {labels.inactive}
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
                            <Edit className="w-4 h-4 text-gray-400" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
