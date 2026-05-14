"use client";

import { BarChart3 } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type ProductivityRow = {
  id: string;
  taskName: string | null;
  hoursSpent: number | null;
  focusLevel: number | null;
  emotionTag: string | null;
  productivityIndex: number | null;
  date: string;
  notes: string | null;
  employee?: { id: string; position: string | null; user: { name: string | null; email: string | null } } | null;
};

const columns: Column<ProductivityRow>[] = [
  {
    key: "employee",
    labelKey: "admin.hr.col.employee",
    fallback: "Employee",
    render: (r) => r.employee?.user?.name || "—",
  },
  {
    key: "date",
    labelKey: "admin.hr.col.date",
    fallback: "Date",
    render: (r) => new Date(r.date).toLocaleDateString(),
  },
  { key: "taskName", labelKey: "admin.hr.col.task", fallback: "Task" },
  {
    key: "hoursSpent",
    labelKey: "admin.hr.col.hours",
    fallback: "Hours",
    render: (r) => (r.hoursSpent != null ? r.hoursSpent.toFixed(1) : "—"),
  },
  {
    key: "focusLevel",
    labelKey: "admin.hr.col.focus",
    fallback: "Focus",
    render: (r) => (r.focusLevel != null ? r.focusLevel.toFixed(2) : "—"),
  },
  {
    key: "productivityIndex",
    labelKey: "admin.hr.col.index",
    fallback: "Index",
    render: (r) => (r.productivityIndex != null ? r.productivityIndex.toFixed(2) : "—"),
  },
  { key: "emotionTag", labelKey: "admin.hr.col.emotionTag", fallback: "Emotion" },
];

export default function HrProductivityAdminPage() {
  return (
    <AdminPage
      titleKey="admin.hr.productivity.title"
      descriptionKey="admin.hr.productivity.description"
      icon={BarChart3}
    >
      <EntityTable<ProductivityRow>
        endpoint="/api/admin/hr/productivity"
        columns={columns}
        searchPlaceholderKey="admin.hr.productivity.search"
      />
    </AdminPage>
  );
}
