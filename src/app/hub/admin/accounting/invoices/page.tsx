"use client";

import { FileSpreadsheet } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type InvoiceRow = {
  id: string;
  number: string | null;
  type: string;
  clientName: string;
  clientEmail: string | null;
  description: string | null;
  totalUsd: string;
  taxUsd: string | null;
  status: string;
  issueDate: string;
  dueDate: string | null;
  tenant?: { id: string; name: string } | null;
  _count?: { items: number };
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-600",
  sent: "bg-blue-500/10 text-blue-600",
  paid: "bg-emerald-500/10 text-emerald-600",
  overdue: "bg-red-500/10 text-red-600",
  cancelled: "bg-orange-500/10 text-orange-600",
};

const columns: Column<InvoiceRow>[] = [
  { key: "number", labelKey: "admin.accounting.invoices.number", fallback: "Number" },
  { key: "type", labelKey: "admin.accounting.invoices.typeCol", fallback: "Type" },
  {
    key: "client",
    labelKey: "admin.accounting.invoices.entity",
    fallback: "Client",
    render: (r) => (
      <div>
        <div className="font-medium">{r.clientName}</div>
        {r.clientEmail && (
          <div className="text-xs text-[var(--rowi-muted)]">{r.clientEmail}</div>
        )}
      </div>
    ),
  },
  {
    key: "totalUsd",
    labelKey: "admin.accounting.invoices.total",
    fallback: "Total",
    render: (r) => `$${Number(r.totalUsd).toLocaleString()}`,
  },
  {
    key: "status",
    labelKey: "admin.accounting.invoices.status",
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
    key: "issueDate",
    labelKey: "admin.accounting.invoices.issueDate",
    fallback: "Issued",
    render: (r) => new Date(r.issueDate).toLocaleDateString(),
  },
  {
    key: "dueDate",
    labelKey: "admin.accounting.invoices.dueDate",
    fallback: "Due",
    render: (r) => (r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"),
  },
  {
    key: "items",
    labelKey: "admin.accounting.invoices.itemsCount",
    fallback: "Items",
    render: (r) => r._count?.items ?? 0,
  },
];

export default function AccountingInvoicesPage() {
  return (
    <AdminPage
      titleKey="admin.accounting.invoices.title"
      descriptionKey="admin.accounting.invoices.description"
      icon={FileSpreadsheet}
    >
      <EntityTable<InvoiceRow>
        endpoint="/api/admin/accounting/invoices"
        columns={columns}
        searchPlaceholderKey="admin.accounting.invoices.search"
      />
    </AdminPage>
  );
}
