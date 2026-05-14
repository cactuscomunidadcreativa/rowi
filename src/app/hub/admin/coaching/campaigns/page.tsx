"use client";

import { CalendarCheck } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type CampaignRow = {
  id: string;
  name: string;
  assessmentType: string;
  scheduledAt: string;
  dueAt: string | null;
  status: string;
  sentCount: number;
  responseCount: number;
  cycleId: string | null;
  createdAt: string;
  community?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string | null; email: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600",
  active: "bg-emerald-500/10 text-emerald-600",
  completed: "bg-violet-500/10 text-violet-600",
  cancelled: "bg-red-500/10 text-red-600",
};

const columns: Column<CampaignRow>[] = [
  { key: "name", labelKey: "admin.coaching.col.name", fallback: "Name" },
  {
    key: "community",
    labelKey: "admin.coaching.col.community",
    fallback: "Community",
    render: (r) => r.community?.name || "—",
  },
  {
    key: "assessmentType",
    labelKey: "admin.coaching.col.assessmentType",
    fallback: "Type",
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
    key: "scheduledAt",
    labelKey: "admin.coaching.col.scheduled",
    fallback: "Scheduled",
    render: (r) => new Date(r.scheduledAt).toLocaleDateString(),
  },
  {
    key: "responseRate",
    labelKey: "admin.coaching.col.responseRate",
    fallback: "Response",
    render: (r) =>
      r.sentCount > 0
        ? `${r.responseCount} / ${r.sentCount} (${Math.round(
            (r.responseCount / r.sentCount) * 100,
          )}%)`
        : "—",
  },
];

export default function CoachingCampaignsAdminPage() {
  return (
    <AdminPage
      titleKey="admin.coaching.campaigns.title"
      descriptionKey="admin.coaching.campaigns.description"
      icon={CalendarCheck}
    >
      <EntityTable<CampaignRow>
        endpoint="/api/admin/coaching/campaigns"
        columns={columns}
        searchPlaceholderKey="admin.coaching.campaigns.search"
      />
    </AdminPage>
  );
}
