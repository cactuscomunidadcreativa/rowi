"use client";

import { AlertTriangle } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type AlertRow = {
  id: string;
  severity: string;
  type: string;
  title: string;
  message: string;
  actionSuggestion: string | null;
  resolvedAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
  community?: { id: string; name: string } | null;
  resolvedBy?: { id: string; name: string | null } | null;
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600",
  warning: "bg-amber-500/10 text-amber-600",
  critical: "bg-red-500/10 text-red-600",
};

const columns: Column<AlertRow>[] = [
  {
    key: "createdAt",
    labelKey: "admin.coaching.col.date",
    fallback: "Date",
    render: (r) => new Date(r.createdAt).toLocaleString(),
  },
  {
    key: "severity",
    labelKey: "admin.coaching.col.severity",
    fallback: "Severity",
    render: (r) => (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
          SEVERITY_COLORS[r.severity] || "bg-gray-500/10 text-gray-600"
        }`}
      >
        {r.severity}
      </span>
    ),
  },
  { key: "type", labelKey: "admin.coaching.col.type", fallback: "Type" },
  {
    key: "community",
    labelKey: "admin.coaching.col.community",
    fallback: "Community",
    render: (r) => r.community?.name || "—",
  },
  { key: "title", labelKey: "admin.coaching.col.title", fallback: "Title" },
  {
    key: "message",
    labelKey: "admin.coaching.col.message",
    fallback: "Message",
    render: (r) => <span className="line-clamp-2 text-xs max-w-md block">{r.message}</span>,
    className: "max-w-md",
  },
  {
    key: "resolved",
    labelKey: "admin.coaching.col.resolved",
    fallback: "Resolved",
    render: (r) =>
      r.resolvedAt
        ? `✓ ${r.resolvedBy?.name || ""}`
        : r.dismissedAt
          ? "Dismissed"
          : "—",
  },
];

export default function CoachingAlertsAdminPage() {
  return (
    <AdminPage
      titleKey="admin.coaching.alerts.title"
      descriptionKey="admin.coaching.alerts.description"
      icon={AlertTriangle}
    >
      <EntityTable<AlertRow>
        endpoint="/api/admin/coaching/alerts"
        columns={columns}
        searchPlaceholderKey="admin.coaching.alerts.search"
      />
    </AdminPage>
  );
}
