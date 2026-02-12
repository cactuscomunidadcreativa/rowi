// src/app/hub/admin/social/goals/page.tsx
// ============================================================
// Noble Goals Management - Social Admin Panel
// ============================================================

"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
  Target,
  Search,
  Loader2,
  Filter,
  RefreshCcw,
  ArrowLeft,
  Users,
  BarChart3,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  Calendar,
  Tag,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type StatusFilter = "all" | "active" | "completed" | "paused";
type CategoryFilter = "all" | "bienestar" | "educacion" | "comunidad" | "medio_ambiente" | "liderazgo" | "relaciones" | "salud" | "creatividad";

const CATEGORY_COLORS: Record<string, string> = {
  bienestar: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  educacion: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  comunidad: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  medio_ambiente: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  liderazgo: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  relaciones: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400",
  salud: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  creatividad: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
};

export default function GoalsAdminPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");

  const params = new URLSearchParams({ filter: "explore" });
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (categoryFilter !== "all") params.set("category", categoryFilter);

  const { data, isLoading, mutate } = useSWR(
    `/api/social/goals?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const goals = data?.goals || [];
  const categories = data?.categories || [];

  // Client-side search
  const filtered = search
    ? goals.filter((g: any) =>
        g.title?.toLowerCase().includes(search.toLowerCase()) ||
        g.author?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : goals;

  const stats = {
    total: goals.length,
    active: goals.filter((g: any) => g.status === "active").length,
    completed: goals.filter((g: any) => g.status === "completed").length,
    totalParticipants: goals.reduce((sum: number, g: any) => sum + (g._count?.participants || g.participantCount || 0), 0),
  };

  const statusFilters: { key: StatusFilter; label: string; icon: any; color: string }[] = [
    { key: "all", label: t("admin.social.goals.all", "All"), icon: Target, color: "text-gray-500" },
    { key: "active", label: t("admin.social.goals.active", "Active"), icon: PlayCircle, color: "text-green-500" },
    { key: "completed", label: t("admin.social.goals.completed", "Completed"), icon: CheckCircle, color: "text-blue-500" },
    { key: "paused", label: t("admin.social.goals.paused", "Paused"), icon: PauseCircle, color: "text-amber-500" },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
      completed: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
      paused: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      archived: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.archived}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/hub/admin/social")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
          <Target className="w-7 h-7 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            {t("admin.social.goals.title", "Noble Goals Management")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t("admin.social.goals.subtitle", "Manage causes, participants and progress tracking")}
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.goals.stats.total", "Total Goals")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <PlayCircle className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.goals.stats.active", "Active")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.goals.stats.completed", "Completed")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.goals.stats.totalParticipants", "Total Participants")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalParticipants}</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((sf) => (
            <button
              key={sf.key}
              onClick={() => setStatusFilter(sf.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === sf.key
                  ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30"
                  : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <sf.icon className={`w-3.5 h-3.5 ${sf.color}`} />
              {sf.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap sm:ml-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="all">{t("admin.social.goals.allCategories", "All Categories")}</option>
            {(categories.length > 0 ? categories : [
              "bienestar", "educacion", "comunidad", "medio_ambiente",
              "liderazgo", "relaciones", "salud", "creatividad",
            ]).map((cat: string) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.social.goals.searchPlaceholder", "Search by title or author...")}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50">
          <Target className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {t("admin.social.noData", "No data available")}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.goals.col.title", "Title")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.goals.col.author", "Author")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.goals.col.category", "Category")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.goals.col.status", "Status")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.goals.col.participants", "Participants")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.goals.col.progress", "Progress")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((goal: any) => {
                  const participantCount = goal._count?.participants || goal.participantCount || 0;
                  const updateCount = goal._count?.updates || 0;
                  // Simulated progress based on updates
                  const progress = Math.min(100, updateCount * 10);
                  return (
                    <tr
                      key={goal.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {goal.title}
                          </p>
                          {goal.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {goal.author?.image ? (
                            <img src={goal.author.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {goal.author?.name?.charAt(0) || "?"}
                            </div>
                          )}
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {goal.author?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[goal.category] || "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400"}`}>
                          {goal.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge(goal.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {participantCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                            {progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
