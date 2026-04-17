"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import CompetenciesSpider from "@/components/charts/CompetenciesSpider";
import { PursuitsBars } from "@/components/metrics/PursuitsBars";
import { EQ_MAX, getEqLevel } from "@/domains/eq/lib/eqLevels";

export default function WorkspaceBenchmarkPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState<"overview" | "competencies" | "outcomes">("overview");

  useEffect(() => {
    fetch(`/api/workspaces/${communityId}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ total: 0, withSei: 0 }));
  }, [communityId]);

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  const tabs: Array<{ key: "overview" | "competencies" | "outcomes"; label: string }> = [
    { key: "overview", label: t("workspace.benchmark.tab.overview", "Overview") },
    { key: "competencies", label: t("workspace.modules.benchmark") },
    { key: "outcomes", label: t("workspace.benchmark.tab.outcomes", "Outcomes") },
  ];

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
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-[var(--rowi-g2)]" />
          {t("workspace.modules.benchmark")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.benchmark.subtitle", "In-depth analysis of your workspace's SEI profile")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === tb.key
                ? "border-[var(--rowi-g2)] text-[var(--rowi-g2)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {stats.withSei === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <p className="text-gray-500">{t("workspace.dashboard.noData.description", "Upload a CSV with SEI scores to see the benchmark")}</p>
        </div>
      ) : tab === "overview" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
            <h3 className="font-semibold text-lg mb-4">
              {t("workspace.dashboard.pursuits", "3 Pursuits")}
            </h3>
            <PursuitsBars
              know={stats.pursuits?.know}
              choose={stats.pursuits?.choose}
              give={stats.pursuits?.give}
              max={EQ_MAX}
            />
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
            <h3 className="font-semibold text-lg mb-4">
              {t("workspace.benchmark.eqDistribution", "EQ Distribution")}
            </h3>
            <div className="text-center py-6">
              <p className="text-5xl font-bold text-[var(--rowi-g2)]">
                {stats.avgEQ ? Math.round(stats.avgEQ) : "—"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {t("workspace.dashboard.avgEQ", "Avg EQ")} ({stats.withSei} {t("workspace.list.members")})
              </p>
            </div>
          </div>
        </motion.div>
      ) : tab === "competencies" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6"
        >
          <h3 className="font-semibold text-lg mb-4">
            {t("workspace.dashboard.competencies", "8 SEI Competencies")}
          </h3>
          <div className="h-96">
            <CompetenciesSpider comps={stats.competencies || {}} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            {Object.entries(stats.competencies || {}).map(([key, val]: any) => {
              const lvl = getEqLevel(val || 0);
              return (
                <div
                  key={key}
                  className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 text-center"
                >
                  <p className="text-xs font-medium uppercase text-gray-500">{key}</p>
                  <p className="text-lg font-bold" style={{ color: lvl.color }}>
                    {val ? Math.round(val) : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6"
        >
          <h3 className="font-semibold text-lg mb-4">
            {t("workspace.benchmark.tab.outcomes", "Outcomes")}
          </h3>
          <p className="text-sm text-gray-500">
            {t("workspace.benchmark.outcomesDesc", "Effectiveness, Relationships, Wellbeing, Quality of Life distribution")}
          </p>
        </motion.div>
      )}
    </div>
  );
}
