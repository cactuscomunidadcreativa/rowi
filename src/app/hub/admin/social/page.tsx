// src/app/hub/admin/social/page.tsx
// ============================================================
// Social System Dashboard - Admin Panel
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/useI18n";
import useSWR from "swr";
import {
  Users,
  Newspaper,
  Target,
  MessageCircle,
  ShieldAlert,
  Activity,
  ArrowRight,
  Loader2,
  Zap,
  Link2,
  MessagesSquare,
  Flag,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SocialDashboardPage() {
  const router = useRouter();
  const { t } = useI18n();

  // Fetch data from social APIs
  const { data: connectionsData, isLoading: loadingConnections } = useSWR(
    "/api/social/connections",
    fetcher,
    { revalidateOnFocus: false }
  );
  const { data: feedData, isLoading: loadingFeed } = useSWR(
    "/api/social/feed?limit=5",
    fetcher,
    { revalidateOnFocus: false }
  );
  const { data: goalsData, isLoading: loadingGoals } = useSWR(
    "/api/social/goals?filter=explore",
    fetcher,
    { revalidateOnFocus: false }
  );
  const { data: threadsData, isLoading: loadingThreads } = useSWR(
    "/api/social/messages/threads",
    fetcher,
    { revalidateOnFocus: false }
  );

  const isLoading = loadingConnections || loadingFeed || loadingGoals || loadingThreads;

  const statCards = [
    {
      key: "totalConnections",
      label: t("admin.social.stats.totalConnections", "Total Connections"),
      value: connectionsData?.total ?? "--",
      icon: Link2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      key: "postsToday",
      label: t("admin.social.stats.postsToday", "Posts Today"),
      value: feedData?.total ?? "--",
      icon: Newspaper,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      gradient: "from-violet-500 to-fuchsia-500",
    },
    {
      key: "activeGoals",
      label: t("admin.social.stats.activeGoals", "Active Goals"),
      value: goalsData?.total ?? "--",
      icon: Target,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      key: "totalMessages",
      label: t("admin.social.stats.totalMessages", "Total Messages"),
      value: threadsData?.threads?.length ?? "--",
      icon: MessageCircle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      key: "flaggedContent",
      label: t("admin.social.stats.flaggedContent", "Flagged Content"),
      value: 0,
      icon: ShieldAlert,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      gradient: "from-red-500 to-pink-500",
    },
    {
      key: "activeUsers",
      label: t("admin.social.stats.activeUsers", "Active Users"),
      value: connectionsData?.counts
        ? (connectionsData.counts.active || 0)
        : "--",
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  const modules = [
    {
      id: "connections",
      title: t("admin.social.modules.connections", "Connections"),
      description: t("admin.social.modules.connectionsDesc", "Manage user connections, requests and blocks"),
      icon: Link2,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
      href: "/hub/admin/social/connections",
    },
    {
      id: "feed",
      title: t("admin.social.modules.feed", "Feed"),
      description: t("admin.social.modules.feedDesc", "Moderate posts, reactions and comments"),
      icon: Newspaper,
      color: "from-violet-500 to-fuchsia-500",
      bgColor: "bg-violet-500/10",
      iconColor: "text-violet-500",
      href: "/hub/admin/social/feed",
    },
    {
      id: "goals",
      title: t("admin.social.modules.goals", "Noble Goals"),
      description: t("admin.social.modules.goalsDesc", "Manage causes, participants and progress"),
      icon: Target,
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      href: "/hub/admin/social/goals",
    },
    {
      id: "forums",
      title: t("admin.social.modules.forums", "Forums"),
      description: t("admin.social.modules.forumsDesc", "Moderate community discussions and threads"),
      icon: MessagesSquare,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-500",
      href: "/hub/admin/social/forums",
    },
    {
      id: "moderation",
      title: t("admin.social.modules.moderation", "Moderation"),
      description: t("admin.social.modules.moderationDesc", "Review flagged content and reports"),
      icon: ShieldAlert,
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-500/10",
      iconColor: "text-red-500",
      href: "/hub/admin/social/moderation",
    },
  ];

  const recentActivity = [
    {
      user: "Laura M.",
      action: t("admin.social.activity.newConnection", "connected with"),
      detail: "Carlos R.",
      icon: Link2,
      color: "text-blue-500",
      time: t("admin.social.activity.minutesAgo", "5 min ago"),
    },
    {
      user: "Ana G.",
      action: t("admin.social.activity.newPost", "published a post"),
      detail: "",
      icon: Newspaper,
      color: "text-violet-500",
      time: t("admin.social.activity.minutesAgo", "12 min ago"),
    },
    {
      user: "Pedro S.",
      action: t("admin.social.activity.joinedGoal", "joined a noble goal"),
      detail: "",
      icon: Target,
      color: "text-emerald-500",
      time: t("admin.social.activity.minutesAgo", "25 min ago"),
    },
    {
      user: "Maria T.",
      action: t("admin.social.activity.sentMessage", "sent a message"),
      detail: "",
      icon: MessageCircle,
      color: "text-amber-500",
      time: t("admin.social.activity.hourAgo", "1h ago"),
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
          <Users className="w-8 h-8 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            {t("admin.social.title", "Social System")}
          </h1>
          <p className="text-gray-400 dark:text-gray-400 text-gray-600">
            {t("admin.social.subtitle", "Manage connections, feed, goals, forums and moderation")}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.key}
            className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? (
                <span className="inline-block w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                stat.value
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => router.push(mod.href)}
            className="group text-left bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50 hover:border-violet-300 dark:hover:border-gray-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${mod.bgColor}`}>
                <mod.icon className={`w-6 h-6 ${mod.iconColor}`} />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {mod.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mod.description}
            </p>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-500" />
          {t("admin.social.recentActivity", "Recent Activity")}
        </h3>
        <div className="space-y-3">
          {recentActivity.map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              <activity.icon className={`w-5 h-5 ${activity.color}`} />
              <span className="text-gray-700 dark:text-gray-300 flex-1">
                <span className="font-medium text-gray-900 dark:text-white">{activity.user}</span>{" "}
                {activity.action}{" "}
                {activity.detail && (
                  <span className="text-gray-500 dark:text-gray-400">{activity.detail}</span>
                )}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
