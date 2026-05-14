"use client";

import { Target } from "lucide-react";
import { AdminPage, AdminBadge } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type DevPlanRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  targetDate: string | null;
  strengths: string[];
  gaps: string[];
  aiGenerated: boolean;
  createdAt: string;
  community?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string | null; email: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  completed: "bg-blue-500/10 text-blue-600",
  paused: "bg-amber-500/10 text-amber-600",
  archived: "bg-gray-500/10 text-gray-600",
};

const columns: Column<DevPlanRow>[] = [
  { key: "title", labelKey: "admin.coaching.col.title", fallback: "Title" },
  {
    key: "community",
    labelKey: "admin.coaching.col.community",
    fallback: "Community",
    render: (r) => r.community?.name || "—",
  },
  {
    key: "createdBy",
    labelKey: "admin.coaching.col.coach",
    fallback: "Coach",
    render: (r) => r.createdBy?.name || "—",
  },
  {
    key: "status",
    labelKey: "admin.coaching.col.status",
    fallback: "Status",
    render: (r) => (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
          STATUS_COLORS[r.status] || "bg-gray-500/10 text-gray-600"
        }`}
      >
        {r.status}
      </span>
    ),
  },
  {
    key: "targetDate",
    labelKey: "admin.coaching.col.target",
    fallback: "Target",
    render: (r) => (r.targetDate ? new Date(r.targetDate).toLocaleDateString() : "—"),
  },
  {
    key: "aiGenerated",
    labelKey: "admin.coaching.col.ai",
    fallback: "AI",
    render: (r) => (r.aiGenerated ? <AdminBadge variant="info">AI</AdminBadge> : "—"),
  },
  {
    key: "createdAt",
    labelKey: "admin.coaching.col.created",
    fallback: "Created",
    render: (r) => new Date(r.createdAt).toLocaleDateString(),
  },
];

export default function CoachingPlansAdminPage() {
  return (
    <AdminPage
      titleKey="admin.coaching.plans.title"
      descriptionKey="admin.coaching.plans.description"
      icon={Target}
    >
      <EntityTable<DevPlanRow>
        endpoint="/api/admin/coaching/plans"
        columns={columns}
        searchPlaceholderKey="admin.coaching.plans.search"
      />
    </AdminPage>
  );
}
