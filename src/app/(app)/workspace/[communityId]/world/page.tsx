"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function WorkspaceWorldPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/workspaces/${communityId}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats({ countries: {} }));
  }, [communityId]);

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  const countries = stats.countries || {};
  const total = Object.values(countries).reduce((a: any, b: any) => a + b, 0) as number;
  const sorted = Object.entries(countries).sort((a, b) => (b[1] as number) - (a[1] as number));

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
          <Globe className="w-7 h-7 text-blue-500" />
          {t("workspace.modules.world")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.world.subtitle", "Geographic distribution and global context")}
        </p>
      </div>

      {total === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <p className="text-gray-500">{t("workspace.dashboard.noData.description")}</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
              <p className="text-xs text-gray-500 uppercase">{t("workspace.dashboard.countries")}</p>
              <p className="text-3xl font-bold">{sorted.length}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
              <p className="text-xs text-gray-500 uppercase">{t("workspace.list.members")}</p>
              <p className="text-3xl font-bold">{total}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
              <p className="text-xs text-gray-500 uppercase">
                {t("workspace.world.topCountry", "Top country")}
              </p>
              <p className="text-xl font-bold">{sorted[0]?.[0] || "—"}</p>
              <p className="text-xs text-gray-500">{sorted[0]?.[1] as number} {t("workspace.list.members")}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
              <p className="text-xs text-gray-500 uppercase">{t("workspace.dashboard.avgEQ")}</p>
              <p className="text-3xl font-bold text-[var(--rowi-g2)]">
                {stats.avgEQ ? Math.round(stats.avgEQ) : "—"}
              </p>
            </div>
          </div>

          {/* Countries list */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
            <h3 className="font-semibold text-lg mb-4">
              {t("workspace.world.distribution", "Distribution by country")}
            </h3>
            <div className="space-y-2">
              {sorted.map(([country, count]: [string, any], i) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <motion.div
                    key={country}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="font-medium">{country}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
