"use client";

import { BookOpen } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  parent?: { id: string; code: string; name: string } | null;
  _count?: { transactions: number; children: number };
};

const TYPE_COLORS: Record<string, string> = {
  ASSET: "bg-emerald-500/10 text-emerald-600",
  LIABILITY: "bg-orange-500/10 text-orange-600",
  EQUITY: "bg-violet-500/10 text-violet-600",
  REVENUE: "bg-blue-500/10 text-blue-600",
  EXPENSE: "bg-red-500/10 text-red-600",
};

const columns: Column<AccountRow>[] = [
  { key: "code", labelKey: "admin.accounting.accounts.code", fallback: "Code" },
  { key: "name", labelKey: "admin.accounting.accounts.name", fallback: "Name" },
  {
    key: "type",
    labelKey: "admin.accounting.accounts.type",
    fallback: "Type",
    render: (r) => (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
          TYPE_COLORS[r.type] || "bg-gray-500/10 text-gray-600"
        }`}
      >
        {r.type}
      </span>
    ),
  },
  {
    key: "parent",
    labelKey: "admin.accounting.accounts.parent",
    fallback: "Parent",
    render: (r) => (r.parent ? `${r.parent.code} — ${r.parent.name}` : "—"),
  },
  {
    key: "transactions",
    labelKey: "admin.accounting.accounts.transactionsCount",
    fallback: "Transactions",
    render: (r) => r._count?.transactions ?? 0,
  },
  {
    key: "children",
    labelKey: "admin.accounting.accounts.childrenCount",
    fallback: "Children",
    render: (r) => r._count?.children ?? 0,
  },
];

export default function AccountingAccountsPage() {
  return (
    <AdminPage
      titleKey="admin.accounting.accounts.title"
      descriptionKey="admin.accounting.accounts.description"
      icon={BookOpen}
    >
      <EntityTable<AccountRow>
        endpoint="/api/admin/accounting/accounts"
        columns={columns}
        searchPlaceholderKey="admin.accounting.accounts.search"
      />
    </AdminPage>
  );
}
