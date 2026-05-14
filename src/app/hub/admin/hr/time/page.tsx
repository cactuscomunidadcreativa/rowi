"use client";

import { Clock } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type TimeEntryRow = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  minutes: number | null;
  activity: string | null;
  billable: boolean;
  rateUsdHour: string | null;
  emotionTag: string | null;
  employee?: { id: string; position: string | null; user: { name: string | null; email: string | null } } | null;
};

const columns: Column<TimeEntryRow>[] = [
  {
    key: "employee",
    labelKey: "admin.hr.col.employee",
    fallback: "Employee",
    render: (r) => r.employee?.user?.name || "—",
  },
  {
    key: "startedAt",
    labelKey: "admin.hr.col.started",
    fallback: "Started",
    render: (r) => new Date(r.startedAt).toLocaleString(),
  },
  { key: "activity", labelKey: "admin.hr.col.activity", fallback: "Activity" },
  {
    key: "minutes",
    labelKey: "admin.hr.col.minutes",
    fallback: "Minutes",
    render: (r) => r.minutes ?? "—",
  },
  {
    key: "billable",
    labelKey: "admin.hr.col.billable",
    fallback: "Billable",
    render: (r) => (r.billable ? "✓" : "—"),
  },
  {
    key: "rateUsdHour",
    labelKey: "admin.hr.col.rate",
    fallback: "Rate/h",
    render: (r) => (r.rateUsdHour ? `$${Number(r.rateUsdHour).toFixed(2)}` : "—"),
  },
  { key: "emotionTag", labelKey: "admin.hr.col.emotionTag", fallback: "Emotion" },
];

export default function HrTimeAdminPage() {
  return (
    <AdminPage
      titleKey="admin.hr.time.title"
      descriptionKey="admin.hr.time.description"
      icon={Clock}
    >
      <EntityTable<TimeEntryRow>
        endpoint="/api/admin/hr/time"
        columns={columns}
        searchPlaceholderKey="admin.hr.time.search"
      />
    </AdminPage>
  );
}
