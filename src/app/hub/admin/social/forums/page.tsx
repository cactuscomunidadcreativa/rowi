// src/app/hub/admin/social/forums/page.tsx
// ============================================================
// Forums Moderation - Social Admin Panel
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/useI18n";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
  MessagesSquare,
  Search,
  Loader2,
  Trash2,
  Pin,
  PinOff,
  MessageSquare,
  RefreshCcw,
  ArrowLeft,
  User,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ForumsModerationPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch community posts from the feed API filtered by community context
  const { data, isLoading, mutate } = useSWR(
    "/api/social/feed?limit=50&type=post",
    fetcher,
    { revalidateOnFocus: false }
  );

  const posts = data?.items || [];

  // Client-side search
  const filtered = search
    ? posts.filter((p: any) =>
        p.content?.toLowerCase().includes(search.toLowerCase()) ||
        p.author?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  const handlePin = useCallback(async (postId: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/social/feed/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentPinned }),
      });
      const result = await res.json();
      if (result.ok) {
        toast.success(
          currentPinned
            ? t("admin.social.forums.unpinned", "Post unpinned")
            : t("admin.social.forums.pinned", "Post pinned")
        );
        mutate();
      } else {
        toast.error(result.error || t("admin.social.forums.pinError", "Error updating pin status"));
      }
    } catch {
      toast.error(t("admin.social.forums.pinError", "Error updating pin status"));
    }
  }, [mutate, t]);

  const handleDelete = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/social/feed/${postId}`, { method: "DELETE" });
      const result = await res.json();
      if (result.ok) {
        toast.success(t("admin.social.forums.deleted", "Post deleted successfully"));
        mutate();
      } else {
        toast.error(result.error || t("admin.social.forums.deleteError", "Error deleting post"));
      }
    } catch {
      toast.error(t("admin.social.forums.deleteError", "Error deleting post"));
    } finally {
      setDeleteConfirm(null);
    }
  }, [mutate, t]);

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

  const stats = {
    total: posts.length,
    pinned: posts.filter((p: any) => p.pinned).length,
    totalReplies: posts.reduce((sum: number, p: any) => sum + (p.commentCount || p._count?.comments || 0), 0),
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
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
          <MessagesSquare className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            {t("admin.social.forums.title", "Forums Moderation")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t("admin.social.forums.subtitle", "Moderate community discussions, pin and manage posts")}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <MessagesSquare className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.forums.stats.total", "Total Posts")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-violet-500 mb-2">
            <Pin className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.forums.stats.pinned", "Pinned")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pinned}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">{t("admin.social.forums.stats.totalReplies", "Total Replies")}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReplies}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.social.forums.searchPlaceholder", "Search posts by content or author...")}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
        />
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50">
          <MessagesSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {t("admin.social.noData", "No data available")}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8">
                    {/* Pin icon header */}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.forums.col.author", "Author")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.forums.col.content", "Content")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.forums.col.replies", "Replies")}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.forums.col.date", "Date")}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("admin.social.forums.col.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((post: any) => {
                  const isPinned = post.pinned || false;
                  const repliesCount = post.commentCount || post._count?.comments || 0;
                  return (
                    <tr
                      key={post.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                        isPinned ? "bg-amber-50/50 dark:bg-amber-500/5" : ""
                      }`}
                    >
                      {/* Pin indicator */}
                      <td className="px-4 py-3">
                        {isPinned && (
                          <Pin className="w-4 h-4 text-amber-500" />
                        )}
                      </td>

                      {/* Author */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {post.author?.image ? (
                            <img src={post.author.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-xs font-medium text-amber-600 dark:text-amber-400">
                              {post.author?.name?.charAt(0) || "?"}
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {post.author?.name || "Unknown"}
                          </span>
                        </div>
                      </td>

                      {/* Content */}
                      <td className="px-4 py-3 max-w-md">
                        <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
                          {post.content}
                        </p>
                      </td>

                      {/* Replies */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{repliesCount}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(post.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Pin/Unpin */}
                          <button
                            onClick={() => handlePin(post.id, isPinned)}
                            className={`p-2 rounded-lg transition-colors ${
                              isPinned
                                ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                                : "text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                            title={isPinned
                              ? t("admin.social.forums.unpin", "Unpin post")
                              : t("admin.social.forums.pin", "Pin post")}
                          >
                            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                          </button>

                          {/* Delete */}
                          {deleteConfirm === post.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(post.id)}
                                className="px-2 py-1 rounded bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
                              >
                                {t("admin.social.forums.yes", "Yes")}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                              >
                                {t("admin.social.forums.no", "No")}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(post.id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              title={t("admin.social.forums.delete", "Delete post")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
