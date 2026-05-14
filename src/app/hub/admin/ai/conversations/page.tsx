"use client";

import { Bot } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type ChatRow = {
  id: string;
  role: string;
  content: string;
  intent: string | null;
  locale: string | null;
  sentiment: string | null;
  confidence: number | null;
  contextType: string | null;
  contextId: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string | null } | null;
  peer?: { id: string; name: string | null; email: string | null } | null;
};

const ROLE_COLORS: Record<string, string> = {
  user: "bg-blue-500/10 text-blue-600",
  assistant: "bg-emerald-500/10 text-emerald-600",
  system: "bg-gray-500/10 text-gray-600",
};

const columns: Column<ChatRow>[] = [
  {
    key: "createdAt",
    labelKey: "admin.ai.conversations.col.time",
    fallback: "Time",
    render: (r) => new Date(r.createdAt).toLocaleString(),
  },
  {
    key: "user",
    labelKey: "admin.ai.conversations.col.user",
    fallback: "User",
    render: (r) => (
      <div>
        <div className="font-medium">{r.user?.name || "—"}</div>
        <div className="text-xs text-[var(--rowi-muted)]">{r.user?.email || "—"}</div>
      </div>
    ),
  },
  {
    key: "role",
    labelKey: "admin.ai.conversations.col.role",
    fallback: "Role",
    render: (r) => (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
          ROLE_COLORS[r.role] || "bg-gray-500/10 text-gray-600"
        }`}
      >
        {r.role}
      </span>
    ),
  },
  {
    key: "content",
    labelKey: "admin.ai.conversations.col.content",
    fallback: "Content",
    render: (r) => (
      <span className="line-clamp-2 text-xs max-w-md block">{r.content}</span>
    ),
    className: "max-w-md",
  },
  { key: "intent", labelKey: "admin.ai.conversations.col.intent", fallback: "Intent" },
  {
    key: "sentiment",
    labelKey: "admin.ai.conversations.col.sentiment",
    fallback: "Sentiment",
  },
  {
    key: "contextType",
    labelKey: "admin.ai.conversations.col.context",
    fallback: "Context",
  },
  { key: "locale", labelKey: "admin.ai.conversations.col.locale", fallback: "Locale" },
];

export default function AiConversationsAdminPage() {
  return (
    <AdminPage
      titleKey="admin.ai.conversations.title"
      descriptionKey="admin.ai.conversations.description"
      icon={Bot}
    >
      <EntityTable<ChatRow>
        endpoint="/api/admin/ai/conversations"
        columns={columns}
        searchPlaceholderKey="admin.ai.conversations.search"
      />
    </AdminPage>
  );
}
