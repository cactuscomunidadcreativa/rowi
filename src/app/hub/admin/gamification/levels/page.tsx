// src/app/hub/admin/gamification/levels/page.tsx
// ============================================================
// Gestión de Niveles - Panel de administración
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  Crown,
  Plus,
  Edit,
  Loader2,
  ArrowLeft,
  Star,
  Users,
  TrendingUp,
  Zap,
  Sparkles,
} from "lucide-react";

interface LevelDefinition {
  id: string;
  level: number;
  minPoints: number;
  maxPoints: number | null;
  title: string;
  titleEN?: string;
  description?: string;
  icon?: string;
  color: string;
  badge?: string;
  multiplier: number;
  userCount?: number;
}

const t = {
  es: {
    title: "Niveles",
    subtitle: "Define la progresión y títulos de cada nivel",
    newLevel: "Nuevo Nivel",
    loading: "Cargando niveles...",
    stats: {
      totalLevels: "Total Niveles",
      totalUsers: "Usuarios Totales",
      avgLevel: "Nivel Promedio",
      maxReached: "Máximo Alcanzado",
      level: "Nivel",
    },
    card: {
      points: "pts",
      multiplier: "puntos",
      users: "Usuarios",
      ofTotal: "del total",
    },
    chart: {
      title: "Progresión de Niveles",
      levelAbbr: "Nv.",
    },
    modal: {
      editTitle: "Editar Nivel",
      titleES: "Título (ES)",
      titleEN: "Título (EN)",
      minPoints: "Puntos Mínimos",
      multiplier: "Multiplicador",
      color: "Color",
      cancel: "Cancelar",
      save: "Guardar",
    },
  },
  en: {
    title: "Levels",
    subtitle: "Define progression and titles for each level",
    newLevel: "New Level",
    loading: "Loading levels...",
    stats: {
      totalLevels: "Total Levels",
      totalUsers: "Total Users",
      avgLevel: "Average Level",
      maxReached: "Max Reached",
      level: "Level",
    },
    card: {
      points: "pts",
      multiplier: "points",
      users: "Users",
      ofTotal: "of total",
    },
    chart: {
      title: "Level Progression",
      levelAbbr: "Lv.",
    },
    modal: {
      editTitle: "Edit Level",
      titleES: "Title (ES)",
      titleEN: "Title (EN)",
      minPoints: "Min Points",
      multiplier: "Multiplier",
      color: "Color",
      cancel: "Cancel",
      save: "Save",
    },
  },
};

export default function LevelsPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const labels = t[lang];
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<LevelDefinition[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [editingLevel, setEditingLevel] = useState<LevelDefinition | null>(null);

  useEffect(() => {
    loadLevels();
  }, []);

  async function loadLevels() {
    try {
      const res = await fetch("/api/admin/gamification/levels");
      const data = await res.json();

      if (data.ok) {
        setLevels(data.data.levels);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error loading levels:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateLevel(levelData: Partial<LevelDefinition>) {
    try {
      const res = await fetch("/api/admin/gamification/levels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(levelData),
      });

      if (res.ok) {
        setEditingLevel(null);
        loadLevels();
      }
    } catch (error) {
      console.error("Error updating level:", error);
    }
  }

  const totalUsers = levels.reduce((sum, l) => sum + (l.userCount || 0), 0);

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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Crown className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{labels.title}</h1>
              <p className="text-gray-400 text-sm">
                {labels.subtitle}
              </p>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          {labels.newLevel}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Crown className="w-4 h-4 text-purple-500" />
            {labels.stats.totalLevels}
          </div>
          <p className="text-2xl font-bold text-white mt-1">{levels.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users className="w-4 h-4 text-blue-500" />
            {labels.stats.totalUsers}
          </div>
          <p className="text-2xl font-bold text-white mt-1">{totalUsers}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            {labels.stats.avgLevel}
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.avgLevel || 1}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Star className="w-4 h-4 text-amber-500" />
            {labels.stats.maxReached}
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {labels.stats.level} {stats?.maxLevelReached || 1}
          </p>
        </div>
      </div>

      {/* Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {levels.map((level) => {
          const userPercent = totalUsers > 0
            ? Math.round(((level.userCount || 0) / totalUsers) * 100)
            : 0;

          return (
            <div
              key={level.id}
              className="group relative bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 hover:border-gray-600 transition-all"
            >
              {/* Edit Button */}
              <button
                onClick={() => setEditingLevel(level)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="w-4 h-4 text-gray-400" />
              </button>

              {/* Level Number */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${level.color}20` }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: level.color }}
                >
                  {level.level}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-white mb-1">{level.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{level.titleEN}</p>

              {/* Points Range */}
              <div className="text-sm text-gray-400 mb-3">
                <span className="font-medium text-white">
                  {level.minPoints.toLocaleString()}
                </span>
                {level.maxPoints ? (
                  <>
                    {" - "}
                    <span className="font-medium text-white">
                      {level.maxPoints.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500"> +</span>
                )}
                <span className="text-gray-500"> pts</span>
              </div>

              {/* Multiplier */}
              {level.multiplier > 1 && (
                <div className="flex items-center gap-1 text-sm text-amber-400 mb-3">
                  <Zap className="w-4 h-4" />
                  <span>x{level.multiplier} {labels.card.multiplier}</span>
                </div>
              )}

              {/* User Count */}
              <div className="pt-3 border-t border-gray-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{labels.card.users}</span>
                  <span className="text-white font-medium">
                    {level.userCount || 0}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${userPercent}%`,
                      backgroundColor: level.color,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{userPercent}% {labels.card.ofTotal}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Level Progression Chart */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          {labels.chart.title}
        </h3>
        <div className="relative h-24">
          <div className="absolute inset-0 flex items-end justify-between gap-1">
            {levels.map((level) => {
              const height = totalUsers > 0
                ? Math.max(10, ((level.userCount || 0) / totalUsers) * 100)
                : 10;

              return (
                <div key={level.id} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t transition-all duration-500"
                    style={{
                      height: `${height}%`,
                      backgroundColor: level.color,
                      opacity: 0.8,
                    }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {labels.chart.levelAbbr}{level.level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingLevel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              {labels.modal.editTitle} {editingLevel.level}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {labels.modal.titleES}
                </label>
                <input
                  type="text"
                  value={editingLevel.title}
                  onChange={(e) =>
                    setEditingLevel({ ...editingLevel, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {labels.modal.titleEN}
                </label>
                <input
                  type="text"
                  value={editingLevel.titleEN || ""}
                  onChange={(e) =>
                    setEditingLevel({ ...editingLevel, titleEN: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    {labels.modal.minPoints}
                  </label>
                  <input
                    type="number"
                    value={editingLevel.minPoints}
                    onChange={(e) =>
                      setEditingLevel({
                        ...editingLevel,
                        minPoints: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    {labels.modal.multiplier}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingLevel.multiplier}
                    onChange={(e) =>
                      setEditingLevel({
                        ...editingLevel,
                        multiplier: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">{labels.modal.color}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editingLevel.color}
                    onChange={(e) =>
                      setEditingLevel({ ...editingLevel, color: e.target.value })
                    }
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingLevel.color}
                    onChange={(e) =>
                      setEditingLevel({ ...editingLevel, color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingLevel(null)}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                {labels.modal.cancel}
              </button>
              <button
                onClick={() => updateLevel(editingLevel)}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                {labels.modal.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
