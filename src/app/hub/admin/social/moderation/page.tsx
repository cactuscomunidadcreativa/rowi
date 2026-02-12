// src/app/hub/admin/social/moderation/page.tsx
// ============================================================
// Content Moderation Queue - Social Admin Panel
// ============================================================

"use client";

import { useI18n } from "@/lib/i18n/useI18n";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowLeft,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Construction,
  BarChart3,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ModerationQueuePage() {
  const router = useRouter();
  const { t } = useI18n();

  // Placeholder data for flagged content stats
  const stats = {
    pending: 0,
    reviewed: 0,
    dismissed: 0,
    totalReports: 0,
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
        <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            {t("admin.social.moderation.title", "Content Moderation")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t("admin.social.moderation.subtitle", "Review flagged content and user reports")}
          </p>
        </div>
      </div>

      {/* Stats about flagged content */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.moderation.stats.pending", "Pending Review")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.moderation.stats.reviewed", "Reviewed")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.reviewed}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.moderation.stats.dismissed", "Dismissed")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.dismissed}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <Flag className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.moderation.stats.totalReports", "Total Reports")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReports}</p>
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-12">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 mb-6">
            <Construction className="w-16 h-16 text-violet-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {t("admin.social.moderation.comingSoon", "Coming Soon")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t(
              "admin.social.moderation.comingSoonDesc",
              "The content moderation queue is under development. This feature will allow you to review flagged posts, handle user reports, and manage content violations."
            )}
          </p>

          <div className="w-full space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 text-left">
              <Flag className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("admin.social.moderation.feature.flagging", "Content Flagging")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("admin.social.moderation.feature.flaggingDesc", "Users can report inappropriate content")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 text-left">
              <BarChart3 className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("admin.social.moderation.feature.analytics", "Moderation Analytics")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("admin.social.moderation.feature.analyticsDesc", "Track moderation metrics and response times")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 text-left">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("admin.social.moderation.feature.automod", "Auto-Moderation")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("admin.social.moderation.feature.automodDesc", "AI-powered content filtering and detection")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state with noData key */}
      <div className="text-center py-8 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50">
        <ShieldAlert className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t("admin.social.noData", "No data available")}
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          {t("admin.social.moderation.noFlaggedContent", "No flagged content to review at this time")}
        </p>
      </div>
    </div>
  );
}
