"use client";

import { ClipboardList } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type PurchaseOrderRow = {
  id: string;
  supplierName: string;
  supplierEmail: string | null;
  status: string;
  totalUsd: string;
  issueDate: string;
  expectedDate: string | null;
  reference: string | null;
  notes: string | null;
  tenant?: { id: string; name: string } | null;
  _count?: { items: number };
};

const columns: Column<PurchaseOrderRow>[] = [
  {
    key: "supplier",
    labelKey: "admin.accounting.purchaseOrders.supplier",
    fallback: "Supplier",
    render: (r) => (
      <div>
        <div className="font-medium">{r.supplierName}</div>
        {r.supplierEmail && (
          <div className="text-xs text-[var(--rowi-muted)]">{r.supplierEmail}</div>
        )}
      </div>
    ),
  },
  {
    key: "totalUsd",
    labelKey: "admin.accounting.purchaseOrders.total",
    fallback: "Total",
    render: (r) => `$${Number(r.totalUsd).toLocaleString()}`,
  },
  { key: "status", labelKey: "admin.accounting.purchaseOrders.status", fallback: "Status" },
  {
    key: "issueDate",
    labelKey: "admin.accounting.purchaseOrders.issueDate",
    fallback: "Issued",
    render: (r) => new Date(r.issueDate).toLocaleDateString(),
  },
  {
    key: "expectedDate",
    labelKey: "admin.accounting.purchaseOrders.expected",
    fallback: "Expected",
    render: (r) => (r.expectedDate ? new Date(r.expectedDate).toLocaleDateString() : "—"),
  },
  { key: "reference", labelKey: "admin.accounting.purchaseOrders.reference", fallback: "Ref" },
  {
    key: "items",
    labelKey: "admin.accounting.purchaseOrders.items",
    fallback: "Items",
    render: (r) => r._count?.items ?? 0,
  },
];

export default function AccountingPurchaseOrdersPage() {
  return (
    <AdminPage
      titleKey="admin.accounting.purchaseOrders.title"
      descriptionKey="admin.accounting.purchaseOrders.description"
      icon={ClipboardList}
    >
      <EntityTable<PurchaseOrderRow>
        endpoint="/api/admin/accounting/purchase-orders"
        columns={columns}
        searchPlaceholderKey="admin.accounting.purchaseOrders.search"
      />
    </AdminPage>
  );
}
