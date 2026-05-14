"use client";

import { Users } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type EmployeeRow = {
  id: string;
  position: string | null;
  department: string | null;
  status: string;
  hireDate: string | null;
  salaryUsd: string | null;
  contractType: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string | null } | null;
  tenant?: { id: string; name: string } | null;
};

const columns: Column<EmployeeRow>[] = [
  {
    key: "user",
    labelKey: "admin.hr.col.employee",
    fallback: "Employee",
    render: (r) => (
      <div>
        <div className="text-[var(--rowi-foreground)] font-medium">
          {r.user?.name || "—"}
        </div>
        <div className="text-xs text-[var(--rowi-muted)]">{r.user?.email || "—"}</div>
      </div>
    ),
  },
  { key: "position", labelKey: "admin.hr.col.position", fallback: "Position" },
  { key: "department", labelKey: "admin.hr.col.department", fallback: "Department" },
  {
    key: "status",
    labelKey: "admin.hr.col.status",
    fallback: "Status",
    render: (r) => (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]">
        {r.status}
      </span>
    ),
  },
  { key: "contractType", labelKey: "admin.hr.col.contract", fallback: "Contract" },
  {
    key: "hireDate",
    labelKey: "admin.hr.col.hireDate",
    fallback: "Hired",
    render: (r) => (r.hireDate ? new Date(r.hireDate).toLocaleDateString() : "—"),
  },
  {
    key: "salaryUsd",
    labelKey: "admin.hr.col.salary",
    fallback: "Salary",
    render: (r) => (r.salaryUsd ? `$${Number(r.salaryUsd).toLocaleString()}` : "—"),
  },
];

export default function HrEmployeesAdminPage() {
  return (
    <AdminPage
      titleKey="admin.hr.employees.title"
      descriptionKey="admin.hr.employees.description"
      icon={Users}
    >
      <EntityTable<EmployeeRow>
        endpoint="/api/admin/hr/employees"
        columns={columns}
        searchPlaceholderKey="admin.hr.employees.search"
      />
    </AdminPage>
  );
}
