"use client";

import { Calendar } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type LeaveRow = {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
  employee?: { id: string; position: string | null; user: { name: string | null; email: string | null } } | null;
  approver?: { id: string; name: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-emerald-500/10 text-emerald-600",
  PENDING: "bg-amber-500/10 text-amber-600",
  REJECTED: "bg-red-500/10 text-red-600",
};

const columns: Column<LeaveRow>[] = [
  {
    key: "employee",
    labelKey: "admin.hr.col.employee",
    fallback: "Employee",
    render: (r) => r.employee?.user?.name || "—",
  },
  { key: "type", labelKey: "admin.hr.col.leaveType", fallback: "Type" },
  {
    key: "status",
    labelKey: "admin.hr.col.status",
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
    key: "startDate",
    labelKey: "admin.hr.col.start",
    fallback: "Start",
    render: (r) => new Date(r.startDate).toLocaleDateString(),
  },
  {
    key: "endDate",
    labelKey: "admin.hr.col.end",
    fallback: "End",
    render: (r) => new Date(r.endDate).toLocaleDateString(),
  },
  { key: "reason", labelKey: "admin.hr.col.reason", fallback: "Reason" },
  {
    key: "approver",
    labelKey: "admin.hr.col.approver",
    fallback: "Approver",
    render: (r) => r.approver?.name || "—",
  },
];

export default function HrLeavesAdminPage() {
  return (
    <AdminPage
      titleKey="admin.hr.leaves.title"
      descriptionKey="admin.hr.leaves.description"
      icon={Calendar}
    >
      <EntityTable<LeaveRow>
        endpoint="/api/admin/hr/leaves"
        columns={columns}
        searchPlaceholderKey="admin.hr.leaves.search"
      />
    </AdminPage>
  );
}
