"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Brain,
  Sparkles,
  TrendingUp,
  Loader2,
  Compass,
  BarChart3,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import CompetenciesSpider from "@/components/charts/CompetenciesSpider";
import { PursuitsBars } from "@/components/metrics/PursuitsBars";
import { EQ_MAX, getEqLevel } from "@/domains/eq/lib/eqLevels";

type Stats = {
  total: number;
  withSei: number;
  avgEQ: number | null;
  pursuits: { know: number | null; choose: number | null; give: number | null } | null;
  competencies: Record<string, number | null> | null;
  brainStyles: Record<string, number>;
  countries: Record<string, number>;
  roles: Record<string, number>;
};

export default function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workspaces/${communityId}/stats`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      }
    }
    load();
  }, [communityId]);

  if (error) {
    return (
      <div className="min-h-screen p-6 max-w-6xl mx-auto">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  const eqLevel = stats.avgEQ ? getEqLevel(stats.avgEQ) : null;

  return (
    <div className="min-h-screen py-6 px-4 max-w-6xl mx-auto space-y-6">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2">
          <LayoutDashboard className="w-7 h-7 text-[var(--rowi-g2)]" />
          {t("workspace.modules.dashboard")}
        </h1>
        <p className="text-sm text-gray-500">
          {stats.total} {t("workspace.list.members")} • {stats.withSei} {t("workspace.members.withSEI", "with SEI")}
        </p>
      </div>

      {stats.withSei === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-1">
            {t("workspace.dashboard.noData.title", "No SEI data yet")}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {t("workspace.dashboard.noData.description", "Upload a CSV with SEI scores to see the dashboard")}
          </p>
          <Link
            href={`/workspace/${communityId}/members/upload`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl text-sm font-semibold"
          >
            {t("workspace.members.uploadCsv", "Upload CSV")}
          </Link>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {t("workspace.dashboard.avgEQ", "Avg EQ")}
              </p>
              <p className="text-3xl font-bold text-[var(--rowi-g2)]">
                {stats.avgEQ ? Math.round(stats.avgEQ) : "—"}
              </p>
              {eqLevel && (
                <p className="text-xs mt-1" style={{ color: eqLevel.color }}>
                  {eqLevel.label}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {t("workspace.list.members")}
              </p>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.withSei} {t("workspace.members.withSEI", "with SEI")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {t("workspace.dashboard.countries", "Countries")}
              </p>
              <p className="text-3xl font-bold">
                {Object.keys(stats.countries).length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {t("workspace.dashboard.brainStyles", "Brain Styles")}
              </p>
              <p className="text-3xl font-bold">
                {Object.keys(stats.brainStyles).length}
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pursuits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6"
            >
              <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <Compass className="w-5 h-5 text-[var(--rowi-g2)]" />
                {t("workspace.dashboard.pursuits", "3 Pursuits (SEI)")}
              </h2>
              <PursuitsBars
                know={stats.pursuits?.know ?? null}
                choose={stats.pursuits?.choose ?? null}
                give={stats.pursuits?.give ?? null}
                max={EQ_MAX}
              />
            </motion.div>

            {/* Competencies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6"
            >
              <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[var(--rowi-g2)]" />
                {t("workspace.dashboard.competencies", "8 Competencies")}
              </h2>
              <div className="h-64">
                <CompetenciesSpider comps={stats.competencies || {}} />
              </div>
            </motion.div>
          </div>

          {/* Brain Styles */}
          {Object.keys(stats.brainStyles).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6"
            >
              <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-500" />
                {t("workspace.dashboard.brainStyles", "Brain Styles")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.brainStyles)
                  .sort((a, b) => b[1] - a[1])
                  .map(([style, count]) => (
                    <div
                      key={style}
                      className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center"
                    >
                      <p className="text-xs text-purple-700 dark:text-purple-400 uppercase font-medium mb-1">
                        {style}
                      </p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                        {count}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-500">
                        {Math.round((count / stats.withSei) * 100)}%
                      </p>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
