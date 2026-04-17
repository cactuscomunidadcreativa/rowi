"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function WorkspaceEvolutionPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();

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
          <TrendingUp className="w-7 h-7 text-green-500" />
          {t("workspace.modules.evolution")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.evolution.subtitle", "Track EQ growth over time across re-assessments")}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-900 p-6"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-200 mb-1">
              {t("workspace.evolution.requiresCycles", "Requires assessment cycles")}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              {t("workspace.evolution.explain", "To track evolution, create Assessment Campaigns to re-evaluate members periodically. The module compares pre vs post scores.")}
            </p>
            <Link
              href={`/workspace/${communityId}/campaigns`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 dark:text-green-400"
            >
              → {t("workspace.modules.campaigns")}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
