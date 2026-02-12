// src/app/hub/admin/social/feed/page.tsx
// ============================================================
// Feed Moderation - Social Admin Panel
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
  Newspaper,
  Search,
  Loader2,
  Trash2,
  Heart,
  MessageSquare,
  Filter,
  RefreshCcw,
  ArrowLeft,
  AlertTriangle,
  Eye,
  Award,
  TrendingUp,
  Share2,
  Target,
} from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PostType = "all" | "post" | "achievement" | "level_up" | "noble_goal" | "share";

const POST_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  post: { label: "Post", icon: Newspaper, color: "text-violet-500" },
  achievement: { label: "Achievement", icon: Award, color: "text-yellow-500" },
  level_up: { label: "Level Up", icon: TrendingUp, color: "text-green-500" },
  noble_goal: { label: "Noble Goal", icon: Target, color: "text-emerald-500" },
  share: { label: "Share", icon: Share2, color: "text-blue-500" },
};

export default function FeedModerationPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [typeFilter, setTypeFilter] = useState<PostType>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const apiUrl = typeFilter === "all"
    ? "/api/social/feed?limit=50"
    : `/api/social/feed?limit=50&type=${typeFilter}`;

  const { data, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const posts = data?.items || [];

  const handleDelete = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/social/feed/${postId}`, { method: "DELETE" });
      const result = await res.json();
      if (result.ok) {
        toast.success(t("admin.social.feed.deleted", "Post deleted successfully"));
        mutate();
      } else {
        toast.error(result.error || t("admin.social.feed.deleteError", "Error deleting post"));
      }
    } catch {
      toast.error(t("admin.social.feed.deleteError", "Error deleting post"));
    } finally {
      setDeleteConfirm(null);
    }
  }, [mutate, t]);

  const typeFilters: { key: PostType; label: string }[] = [
    { key: "all", label: t("admin.social.feed.allTypes", "All Types") },
    { key: "post", label: t("admin.social.feed.typePost", "Posts") },
    { key: "achievement", label: t("admin.social.feed.typeAchievement", "Achievements") },
    { key: "level_up", label: t("admin.social.feed.typeLevelUp", "Level Ups") },
    { key: "noble_goal", label: t("admin.social.feed.typeNobleGoal", "Noble Goals") },
    { key: "share", label: t("admin.social.feed.typeShare", "Shares") },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
          <Newspaper className="w-7 h-7 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            {t("admin.social.feed.title", "Feed Moderation")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t("admin.social.feed.subtitle", "Review and moderate social feed posts")}
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-violet-500 mb-2">
            <Newspaper className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.feed.stats.totalPosts", "Total Posts")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.total ?? "--"}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-pink-500 mb-2">
            <Heart className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.feed.stats.totalReactions", "Total Reactions")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {posts.reduce((sum: number, p: any) => sum + (p.reactionCount || p._count?.reactions || 0), 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.feed.stats.totalComments", "Total Comments")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {posts.reduce((sum: number, p: any) => sum + (p.commentCount || p._count?.comments || 0), 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.feed.stats.flagged", "Flagged")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {typeFilters.map((tf) => (
          <button
            key={tf.key}
            onClick={() => setTypeFilter(tf.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              typeFilter === tf.key
                ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30"
                : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50">
          <Newspaper className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {t("admin.social.noData", "No data available")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post: any) => {
            const typeConfig = POST_TYPE_CONFIG[post.type] || POST_TYPE_CONFIG.post;
            const TypeIcon = typeConfig.icon;
            return (
              <div
                key={post.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Author and content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {post.author?.image ? (
                        <img
                          src={post.author.image}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-600 dark:text-violet-400">
                          {post.author?.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {post.author?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color} bg-gray-100 dark:bg-gray-800`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeConfig.label}
                      </span>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                      {post.content}
                    </p>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-pink-500" />
                        {post.reactionCount || post._count?.reactions || 0} {t("admin.social.feed.reactions", "reactions")}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                        {post.commentCount || post._count?.comments || 0} {t("admin.social.feed.comments", "comments")}
                      </span>
                      {post.visibility && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {post.visibility}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {deleteConfirm === post.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500 font-medium">
                          {t("admin.social.feed.confirmDelete", "Confirm?")}
                        </span>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
                        >
                          {t("admin.social.feed.yes", "Yes")}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          {t("admin.social.feed.no", "No")}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(post.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title={t("admin.social.feed.delete", "Delete post")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
