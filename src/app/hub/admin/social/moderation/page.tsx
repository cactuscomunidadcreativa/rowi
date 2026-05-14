"use client";

import { useState } from "react";
import { ShieldAlert, Trash2, Pin } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/useI18n";
import { AdminPage, AdminBadge } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type PostRow = {
  id: string;
  content: string;
  mediaUrl: string | null;
  tags: string[];
  emotionTag: string | null;
  visibility: string | null;
  isPinned: boolean;
  replyCount: number;
  createdAt: string;
  community?: { id: string; name: string } | null;
  author?: { id: string; name: string | null; email: string | null } | null;
  _count?: { replies: number };
};

export default function ModerationQueuePage() {
  const { t } = useI18n();
  const [reloadKey, setReloadKey] = useState(0);

  async function handleDelete(post: PostRow) {
    const ok = window.confirm(
      t(
        "admin.social.moderation.confirmDelete",
        "Delete this post? This cannot be undone.",
      ),
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/social/moderation/${post.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error");
      toast.success(t("admin.social.moderation.deleted", "Post deleted"));
      setReloadKey((k) => k + 1);
    } catch {
      toast.error(t("common.error", "Error"));
    }
  }

  const columns: Column<PostRow>[] = [
    {
      key: "createdAt",
      labelKey: "admin.social.moderation.col.date",
      fallback: "Date",
      render: (r) => new Date(r.createdAt).toLocaleString(),
    },
    {
      key: "community",
      labelKey: "admin.social.moderation.col.community",
      fallback: "Community",
      render: (r) => r.community?.name || "—",
    },
    {
      key: "author",
      labelKey: "admin.social.moderation.col.author",
      fallback: "Author",
      render: (r) => (
        <div>
          <div className="font-medium">{r.author?.name || "—"}</div>
          <div className="text-xs text-[var(--rowi-muted)]">{r.author?.email}</div>
        </div>
      ),
    },
    {
      key: "content",
      labelKey: "admin.social.moderation.col.content",
      fallback: "Content",
      render: (r) => (
        <div className="max-w-md">
          <div className="text-xs leading-relaxed max-h-16 overflow-hidden">
            {r.content.length > 240 ? r.content.slice(0, 240) + "…" : r.content}
          </div>
          {r.mediaUrl && (
            <span className="text-[10px] text-[var(--rowi-muted)] mt-1 inline-block">
              📎 {r.mediaUrl.split("/").pop()}
            </span>
          )}
        </div>
      ),
      className: "max-w-md",
    },
    {
      key: "emotionTag",
      labelKey: "admin.social.moderation.col.emotion",
      fallback: "Emotion",
    },
    {
      key: "flags",
      labelKey: "admin.social.moderation.col.flags",
      fallback: "Flags",
      render: (r) => (
        <div className="flex items-center gap-1">
          {r.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
          {r.replyCount > 0 && (
            <AdminBadge variant="info">{r.replyCount} 💬</AdminBadge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      labelKey: "admin.social.moderation.col.actions",
      fallback: "Actions",
      render: (r) => (
        <button
          onClick={() => handleDelete(r)}
          className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
          title={t("actions.delete", "Delete")}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <AdminPage
      titleKey="admin.social.moderation.title"
      descriptionKey="admin.social.moderation.subtitle"
      icon={ShieldAlert}
    >
      <EntityTable<PostRow>
        key={reloadKey}
        endpoint="/api/admin/social/moderation"
        columns={columns}
        searchPlaceholderKey="admin.social.moderation.search"
      />
    </AdminPage>
  );
}
