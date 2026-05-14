"use client";

import { Calendar } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type PayrollRow = {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  notes: string | null;
  tenant?: { id: string; name: string } | null;
  _count?: { items: number };
};

const columns: Column<PayrollRow>[] = [
  { key: "period", labelKey: "admin.accounting.payroll.period", fallback: "Period" },
  {
    key: "range",
    labelKey: "admin.accounting.payroll.range",
    fallback: "Range",
    render: (r) =>
      `${new Date(r.periodStart).toLocaleDateString()} → ${new Date(r.periodEnd).toLocaleDateString()}`,
  },
  { key: "status", labelKey: "admin.accounting.payroll.status", fallback: "Status" },
  {
    key: "tenant",
    labelKey: "admin.accounting.payroll.tenant",
    fallback: "Tenant",
    render: (r) => r.tenant?.name || "—",
  },
  {
    key: "items",
    labelKey: "admin.accounting.payroll.items",
    fallback: "Items",
    render: (r) => r._count?.items ?? 0,
  },
  { key: "notes", labelKey: "admin.accounting.payroll.notes", fallback: "Notes" },
];

export default function AccountingPayrollPage() {
  return (
    <AdminPage
      titleKey="admin.accounting.payroll.title"
      descriptionKey="admin.accounting.payroll.description"
      icon={Calendar}
    >
      <EntityTable<PayrollRow>
        endpoint="/api/admin/accounting/payroll"
        columns={columns}
        searchPlaceholderKey="admin.accounting.payroll.search"
      />
    </AdminPage>
  );
}
