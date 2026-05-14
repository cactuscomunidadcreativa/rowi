"use client";

import { ShoppingCart } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type SalesOrderRow = {
  id: string;
  clientName: string;
  clientEmail: string | null;
  status: string;
  totalUsd: string;
  issueDate: string;
  deliveryDate: string | null;
  reference: string | null;
  notes: string | null;
  tenant?: { id: string; name: string } | null;
  _count?: { items: number };
};

const columns: Column<SalesOrderRow>[] = [
  {
    key: "client",
    labelKey: "admin.accounting.salesOrders.client",
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
    labelKey: "admin.accounting.salesOrders.total",
    fallback: "Total",
    render: (r) => `$${Number(r.totalUsd).toLocaleString()}`,
  },
  { key: "status", labelKey: "admin.accounting.salesOrders.status", fallback: "Status" },
  {
    key: "issueDate",
    labelKey: "admin.accounting.salesOrders.issueDate",
    fallback: "Issued",
    render: (r) => new Date(r.issueDate).toLocaleDateString(),
  },
  {
    key: "deliveryDate",
    labelKey: "admin.accounting.salesOrders.delivery",
    fallback: "Delivery",
    render: (r) => (r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString() : "—"),
  },
  { key: "reference", labelKey: "admin.accounting.salesOrders.reference", fallback: "Ref" },
  {
    key: "items",
    labelKey: "admin.accounting.salesOrders.items",
    fallback: "Items",
    render: (r) => r._count?.items ?? 0,
  },
];

export default function AccountingSalesOrdersPage() {
  return (
    <AdminPage
      titleKey="admin.accounting.salesOrders.title"
      descriptionKey="admin.accounting.salesOrders.description"
      icon={ShoppingCart}
    >
      <EntityTable<SalesOrderRow>
        endpoint="/api/admin/accounting/sales-orders"
        columns={columns}
        searchPlaceholderKey="admin.accounting.salesOrders.search"
      />
    </AdminPage>
  );
}
