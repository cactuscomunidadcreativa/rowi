"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Users,
  Target,
  Briefcase,
  Heart,
  Building2,
  Compass,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { WORKSPACE_TEMPLATES } from "@/lib/workspace/templates";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  workspaceType: string | null;
  projectStatus: string | null;
  targetRole: string | null;
  role: string;
  _count: { members: number; communityMembers: number };
  createdAt: string;
};

const TYPE_ICONS: Record<string, any> = {
  COACHING: Target,
  SELECTION: Target,
  TEAM_UNIT: Users,
  HR_COHORT: Building2,
  CONSULTING: Briefcase,
  MENTORING: Compass,
};

const TYPE_GRADIENTS: Record<string, string> = {
  COACHING: "from-violet-500 to-purple-600",
  SELECTION: "from-blue-500 to-cyan-600",
  TEAM_UNIT: "from-emerald-500 to-green-600",
  HR_COHORT: "from-indigo-500 to-blue-600",
  CONSULTING: "from-amber-500 to-orange-600",
  MENTORING: "from-pink-500 to-rose-600",
};

export default function WorkspaceListPage() {
  const { t, lang } = useI18n();
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/workspaces");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error");
        setWorkspaces(data.workspaces || []);
      } catch (err: any) {
        setError(err.message);
        setWorkspaces([]);
      }
    }
    load();
  }, []);

  const filtered =
    filter === "all"
      ? workspaces
      : workspaces?.filter((w) => w.workspaceType === filter);

  const statusLabel = (s: string | null) => {
    if (!s) return "";
    return t(`workspace.list.projectStatus.${s}`, s);
  };

  return (
    <div className="min-h-screen py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-[var(--rowi-g2)]" />
              <span className="rowi-gradient-text">
                {t("workspace.list.title")}
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {t("workspace.list.subtitle")}
            </p>
          </div>
          <Link
            href="/workspace/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            <Plus className="w-5 h-5" />
            {t("workspace.nav.new")}
          </Link>
        </div>

        {/* Filtros por tipo */}
        {workspaces && workspaces.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === "all"
                  ? "bg-[var(--rowi-g2)] text-white"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              {t("workspace.list.allTypes")}
            </button>
            {WORKSPACE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.type}
                onClick={() => setFilter(tpl.type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  filter === tpl.type
                    ? "bg-[var(--rowi-g2)] text-white"
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span>{tpl.icon}</span>
                {tpl.name[lang as "es" | "en" | "pt" | "it"] ?? tpl.name.en}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Loading */}
      {workspaces === null && (
        <div className="flex justify-center py-20">
          <div className="text-gray-500">{t("workspace.loading")}</div>
        </div>
      )}

      {/* Empty state */}
      {workspaces && workspaces.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-12 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-[var(--rowi-g2)]" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t("workspace.list.empty.title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {t("workspace.list.empty.description")}
          </p>
          <Link
            href="/workspace/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            {t("workspace.list.createFirst")}
          </Link>
        </motion.div>
      )}

      {/* Workspaces Grid */}
      {filtered && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ws, i) => {
            const Icon = TYPE_ICONS[ws.workspaceType || ""] || Users;
            const gradient =
              TYPE_GRADIENTS[ws.workspaceType || ""] || "from-gray-500 to-gray-600";
            return (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/workspace/${ws.id}`}
                  className="block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 hover:border-[var(--rowi-g2)] hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center text-white`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    {ws.projectStatus && (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          ws.projectStatus === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400"
                        }`}
                      >
                        {statusLabel(ws.projectStatus)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-[var(--rowi-g2)] transition-colors">
                    {ws.name}
                  </h3>
                  {ws.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                      {ws.description}
                    </p>
                  )}
                  {ws.targetRole && (
                    <p className="text-xs text-[var(--rowi-g2)] font-medium mb-3">
                      🎯 {ws.targetRole}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {ws._count.members + ws._count.communityMembers}{" "}
                      {t("workspace.list.members")}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
