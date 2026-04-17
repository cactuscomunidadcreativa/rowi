"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Loader2, TrendingUp, TrendingDown, Brain } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function WorkspaceInsightsPage({
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
      .then(setStats);
  }, [communityId]);

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  // Generate insights from stats
  const insights: Array<{ type: "positive" | "opportunity" | "neutral"; text: string; icon: any }> = [];

  if (stats.competencies) {
    const comps = stats.competencies;
    const topComp = Object.entries(comps)
      .filter(([_, v]) => typeof v === "number")
      .sort((a: any, b: any) => b[1] - a[1])[0];
    const bottomComp = Object.entries(comps)
      .filter(([_, v]) => typeof v === "number")
      .sort((a: any, b: any) => a[1] - b[1])[0];

    if (topComp) {
      insights.push({
        type: "positive",
        text: t("workspace.insights.topCompetency", `Strongest competency: ${topComp[0]} (${Math.round(topComp[1] as number)})`).replace("{}", topComp[0]),
        icon: TrendingUp,
      });
    }
    if (bottomComp) {
      insights.push({
        type: "opportunity",
        text: t("workspace.insights.bottomCompetency", `Growth area: ${bottomComp[0]} (${Math.round(bottomComp[1] as number)})`).replace("{}", bottomComp[0]),
        icon: TrendingDown,
      });
    }
  }

  if (stats.brainStyles && Object.keys(stats.brainStyles).length > 0) {
    const dominant = Object.entries(stats.brainStyles).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    insights.push({
      type: "neutral",
      text: t("workspace.insights.dominantBrain", `Dominant brain style: ${dominant[0]}`).replace("{}", dominant[0]),
      icon: Brain,
    });
  }

  if (stats.avgEQ) {
    if (stats.avgEQ >= 108) {
      insights.push({
        type: "positive",
        text: t("workspace.insights.highEQ", "Overall EQ is high - great foundation"),
        icon: TrendingUp,
      });
    } else if (stats.avgEQ < 92) {
      insights.push({
        type: "opportunity",
        text: t("workspace.insights.lowEQ", "Overall EQ has room for growth - consider training programs"),
        icon: TrendingDown,
      });
    }
  }

  return (
    <div className="min-h-screen py-6 px-4 max-w-4xl mx-auto space-y-6">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-cyan-500" />
          {t("workspace.modules.insights")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("workspace.insights.subtitle", "AI-generated insights from your workspace data")}
        </p>
      </div>

      {insights.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <p className="text-gray-500">{t("workspace.insights.noData", "Upload member data to unlock insights")}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {insights.map((ins, i) => {
            const Icon = ins.icon;
            const colors =
              ins.type === "positive"
                ? "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-900 text-green-900 dark:text-green-200"
                : ins.type === "opportunity"
                ? "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200"
                : "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-gradient-to-br ${colors} rounded-2xl border p-5 flex items-start gap-3`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{ins.text}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
