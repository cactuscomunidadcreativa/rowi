"use client";

import { Package } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unitCostUsd: string;
  priceUsd: string;
  stockQty: number;
  reorderLevel: number | null;
  isActive: boolean;
  tenant?: { id: string; name: string } | null;
};

const columns: Column<ProductRow>[] = [
  { key: "sku", labelKey: "admin.accounting.products.sku", fallback: "SKU" },
  { key: "name", labelKey: "admin.accounting.products.name", fallback: "Name" },
  { key: "category", labelKey: "admin.accounting.products.category", fallback: "Category" },
  {
    key: "unitCostUsd",
    labelKey: "admin.accounting.products.unitCost",
    fallback: "Unit cost",
    render: (r) => `$${Number(r.unitCostUsd).toFixed(2)}`,
  },
  {
    key: "priceUsd",
    labelKey: "admin.accounting.products.price",
    fallback: "Price",
    render: (r) => `$${Number(r.priceUsd).toFixed(2)}`,
  },
  {
    key: "stockQty",
    labelKey: "admin.accounting.products.stock",
    fallback: "Stock",
    render: (r) => (
      <span
        className={
          r.reorderLevel != null && r.stockQty <= r.reorderLevel
            ? "text-red-500 font-medium"
            : "text-[var(--rowi-foreground)]"
        }
      >
        {r.stockQty}
      </span>
    ),
  },
  {
    key: "isActive",
    labelKey: "admin.accounting.products.active",
    fallback: "Active",
    render: (r) => (r.isActive ? "✓" : "—"),
  },
];

export default function AccountingProductsPage() {
  return (
    <AdminPage
      titleKey="admin.accounting.products.title"
      descriptionKey="admin.accounting.products.description"
      icon={Package}
    >
      <EntityTable<ProductRow>
        endpoint="/api/admin/accounting/products"
        columns={columns}
        searchPlaceholderKey="admin.accounting.products.search"
      />
    </AdminPage>
  );
}
