"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, Brain } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function WorkspaceAffinityPage({
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
      .catch(() => setStats({ brainStyles: {} }));
  }, [communityId]);

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  const brainStyles = stats.brainStyles || {};
  const totalStyles = Object.values(brainStyles).reduce((a: any, b: any) => a + b, 0) as number;

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
          <Heart className="w-7 h-7 text-pink-500" />
          {t("workspace.modules.affinity")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.affinity.subtitle", "Brain style distribution and compatibility insights")}
        </p>
      </div>

      {totalStyles === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <p className="text-gray-500">{t("workspace.dashboard.noData.description")}</p>
        </div>
      ) : (
        <>
          {/* Brain style distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6"
          >
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-500" />
              {t("workspace.affinity.brainStyles", "Brain Styles Distribution")}
            </h3>
            <div className="space-y-3">
              {Object.entries(brainStyles)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([style, count]: [string, any], i) => {
                  const pct = Math.round((count / totalStyles) * 100);
                  return (
                    <motion.div
                      key={style}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{style}</span>
                        <span className="text-sm text-gray-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>

          {/* Compatibility insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl border border-pink-200 dark:border-pink-900 p-6"
          >
            <h3 className="font-semibold text-lg mb-2">
              ✨ {t("workspace.affinity.insight.title", "Insight")}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {Object.keys(brainStyles).length === 1
                ? t("workspace.affinity.insight.homogeneous", "Your group is homogeneous in brain style - consider diversifying for varied perspectives.")
                : Object.keys(brainStyles).length >= 4
                ? t("workspace.affinity.insight.diverse", "Great diversity! Your group has multiple brain styles, ideal for innovation and problem-solving.")
                : t("workspace.affinity.insight.balanced", "Your group has a balanced mix of brain styles.")}
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
}
