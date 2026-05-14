"use client";

import { ClipboardCheck } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type ReviewRow = {
  id: string;
  periodStart: string;
  periodEnd: string;
  score: number | null;
  emotionalScore: number | null;
  status: string | null;
  comments: string | null;
  createdAt: string;
  employee?: { id: string; position: string | null; user: { name: string | null; email: string | null } } | null;
  reviewer?: { id: string; name: string | null; email: string | null } | null;
};

const columns: Column<ReviewRow>[] = [
  {
    key: "employee",
    labelKey: "admin.hr.col.employee",
    fallback: "Employee",
    render: (r) => (
      <div>
        <div className="font-medium">{r.employee?.user?.name || "—"}</div>
        <div className="text-xs text-[var(--rowi-muted)]">{r.employee?.position || "—"}</div>
      </div>
    ),
  },
  {
    key: "reviewer",
    labelKey: "admin.hr.col.reviewer",
    fallback: "Reviewer",
    render: (r) => r.reviewer?.name || "—",
  },
  {
    key: "period",
    labelKey: "admin.hr.col.period",
    fallback: "Period",
    render: (r) =>
      `${new Date(r.periodStart).toLocaleDateString()} → ${new Date(r.periodEnd).toLocaleDateString()}`,
  },
  {
    key: "score",
    labelKey: "admin.hr.col.score",
    fallback: "Score",
    render: (r) => (r.score != null ? r.score.toFixed(1) : "—"),
  },
  {
    key: "emotionalScore",
    labelKey: "admin.hr.col.emotionalScore",
    fallback: "Emotional",
    render: (r) => (r.emotionalScore != null ? r.emotionalScore.toFixed(1) : "—"),
  },
  { key: "status", labelKey: "admin.hr.col.status", fallback: "Status" },
];

export default function HrReviewsAdminPage() {
  return (
    <AdminPage
      titleKey="admin.hr.reviews.title"
      descriptionKey="admin.hr.reviews.description"
      icon={ClipboardCheck}
    >
      <EntityTable<ReviewRow>
        endpoint="/api/admin/hr/reviews"
        columns={columns}
        searchPlaceholderKey="admin.hr.reviews.search"
      />
    </AdminPage>
  );
}
