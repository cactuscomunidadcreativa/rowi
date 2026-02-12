"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  Target,
  Plus,
  Search,
  Users,
  Calendar,
  Compass,
  Heart,
  X,
  Loader2,
  TrendingUp,
  Leaf,
  BookOpen,
  Globe,
  Sparkles,
  Brain,
  Palette,
  Activity,
} from "lucide-react";

/* =========================================================
   🎯 Página de Noble Goals

   Tabs: Mis Goals | Explorar | Comunidad
   Crear goal con formulario modal
========================================================= */

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; labelKey: string }> = {
  bienestar: { icon: Heart, color: "text-pink-500 bg-pink-50 dark:bg-pink-900/20", labelKey: "social.goals.categories.wellness" },
  educacion: { icon: BookOpen, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20", labelKey: "social.goals.categories.education" },
  comunidad: { icon: Users, color: "text-green-500 bg-green-50 dark:bg-green-900/20", labelKey: "social.goals.categories.community" },
  medio_ambiente: { icon: Leaf, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20", labelKey: "social.goals.categories.environment" },
  liderazgo: { icon: TrendingUp, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20", labelKey: "social.goals.categories.leadership" },
  relaciones: { icon: Globe, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20", labelKey: "social.goals.categories.relationships" },
  salud: { icon: Activity, color: "text-red-500 bg-red-50 dark:bg-red-900/20", labelKey: "social.goals.categories.health" },
  creatividad: { icon: Palette, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20", labelKey: "social.goals.categories.creativity" },
};

type TabType = "mine" | "explore" | "community";

interface NobleGoal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  icon: string | null;
  color: string | null;
  visibility: string;
  status: string;
  targetDate: string | null;
  progress: number;
  participantCount: number;
  createdAt: string;
  author: { id: string; name: string; image: string | null; headline: string | null };
  participants: Array<{ user: { id: string; name: string; image: string | null } }>;
  _count: { participants: number; updates: number };
}

export default function GoalsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>("explore");
  const [goals, setGoals] = useState<NobleGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter: activeTab });
      if (selectedCategory) params.set("category", selectedCategory);
      const res = await fetch(`/api/social/goals?${params}`);
      const data = await res.json();
      if (data.ok) setGoals(data.goals);
    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const joinGoal = async (goalId: string) => {
    try {
      const res = await fetch(`/api/social/goals/${goalId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) fetchGoals();
    } catch (err) {
      console.error("Error joining goal:", err);
    }
  };

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: "mine", label: t("social.goals.tabs.mine"), icon: Target },
    { key: "explore", label: t("social.goals.tabs.explore"), icon: Compass },
    { key: "community", label: t("social.goals.tabs.community"), icon: Users },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-[var(--rowi-g2)]" />
            {t("social.goals.title")}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t("social.goals.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("social.goals.create")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-[var(--rowi-g2)] text-[var(--rowi-g2)]"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setSelectedCategory("")}
          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
            !selectedCategory
              ? "bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)] ring-1 ring-[var(--rowi-g2)]/30"
              : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {t("social.goals.categories.all")}
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(selectedCategory === key ? "" : key)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
              selectedCategory === key
                ? "bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)] ring-1 ring-[var(--rowi-g2)]/30"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <cfg.icon className="w-3 h-3" />
            {t(cfg.labelKey)}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">
            {activeTab === "mine" ? t("social.goals.empty.mine") : t("social.goals.empty.explore")}
          </p>
          <p className="text-sm mt-1">
            {activeTab === "mine"
              ? t("social.goals.empty.mine.desc")
              : t("social.goals.empty.community")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onJoin={() => joinGoal(goal.id)}
              onClick={() => router.push(`/social/goals/${goal.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateGoalModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              setActiveTab("mine");
              fetchGoals();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   🃏 Goal Card
========================================================= */
function GoalCard({
  goal,
  onJoin,
  onClick,
}: {
  goal: NobleGoal;
  onJoin: () => void;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const catConfig = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.bienestar;
  const CatIcon = catConfig.icon;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="p-4">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${catConfig.color}`}>
            <CatIcon className="w-3 h-3" />
            {t(catConfig.labelKey)}
          </span>
          {goal.status === "completed" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600">
              ✓ {t("social.goals.status.completed")}
            </span>
          )}
        </div>

        {/* Title & desc */}
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
          {goal.title}
        </h3>
        {goal.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {goal.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{t("social.goals.progress")}</span>
            <span>{goal.progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          {goal.author.image ? (
            <img src={goal.author.image} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold">
              {goal.author.name?.charAt(0) || "?"}
            </div>
          )}
          <span className="text-xs text-gray-500 truncate">{goal.author.name}</span>
        </div>

        {/* Participants & date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Avatars stack */}
            <div className="flex -space-x-1.5">
              {goal.participants.slice(0, 3).map((p) => (
                <div
                  key={p.user.id}
                  className="w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 bg-gray-200 dark:bg-zinc-700 overflow-hidden"
                >
                  {p.user.image ? (
                    <img src={p.user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">
                      {p.user.name?.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-1">
              {goal.participantCount} {t("social.goals.participants")}
            </span>
          </div>
          {goal.targetDate && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(goal.targetDate).toLocaleDateString("es", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   ➕ Create Goal Modal
========================================================= */
function CreateGoalModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("bienestar");
  const [visibility, setVisibility] = useState("public");
  const [targetDate, setTargetDate] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/social/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          visibility,
          targetDate: targetDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) onCreated();
    } catch (err) {
      console.error("Error creating goal:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--rowi-g2)]" />
            {t("social.goals.form.title")}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              {t("social.goals.form.title")} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("social.goals.form.title")}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/30"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              {t("social.goals.form.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("social.goals.form.description")}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/30"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              {t("social.goals.form.category")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === key
                      ? "bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)] ring-1 ring-[var(--rowi-g2)]/30"
                      : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <cfg.icon className="w-4 h-4" />
                  {t(cfg.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              {t("social.goals.form.visibility")}
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
            >
              <option value="public">{t("social.goals.form.visibility.public")}</option>
              <option value="community">{t("social.goals.form.visibility.community")}</option>
              <option value="private">{t("social.goals.form.visibility.private")}</option>
            </select>
          </div>

          {/* Target date */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              {t("social.goals.form.targetDate")}
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t("social.goals.form.cancel")}
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || creating}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t("social.goals.form.create")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
