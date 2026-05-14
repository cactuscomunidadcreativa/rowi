"use client";

import { Receipt } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type TransactionRow = {
  id: string;
  type: string;
  description: string | null;
  amountUsd: string;
  currency: string;
  date: string;
  status: string;
  method: string | null;
  reference: string | null;
  account?: { id: string; code: string; name: string } | null;
  tenant?: { id: string; name: string } | null;
};

const TYPE_COLORS: Record<string, string> = {
  INCOME: "bg-emerald-500/10 text-emerald-600",
  EXPENSE: "bg-red-500/10 text-red-600",
  TRANSFER: "bg-blue-500/10 text-blue-600",
};

const columns: Column<TransactionRow>[] = [
  {
    key: "date",
    labelKey: "admin.accounting.transactions.date",
    fallback: "Date",
    render: (r) => new Date(r.date).toLocaleDateString(),
  },
  {
    key: "type",
    labelKey: "admin.accounting.transactions.type",
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
  { key: "description", labelKey: "admin.accounting.transactions.description2", fallback: "Description" },
  {
    key: "amount",
    labelKey: "admin.accounting.transactions.amount",
    fallback: "Amount",
    render: (r) => `${r.currency} ${Number(r.amountUsd).toLocaleString()}`,
  },
  {
    key: "account",
    labelKey: "admin.accounting.transactions.account",
    fallback: "Account",
    render: (r) => (r.account ? `${r.account.code} — ${r.account.name}` : "—"),
  },
  { key: "status", labelKey: "admin.accounting.transactions.status", fallback: "Status" },
  { key: "method", labelKey: "admin.accounting.transactions.method", fallback: "Method" },
  { key: "reference", labelKey: "admin.accounting.transactions.reference", fallback: "Reference" },
];

export default function AccountingTransactionsPage() {
  return (
    <AdminPage
      titleKey="admin.accounting.transactions.title"
      descriptionKey="admin.accounting.transactions.description"
      icon={Receipt}
    >
      <EntityTable<TransactionRow>
        endpoint="/api/admin/accounting/transactions"
        columns={columns}
        searchPlaceholderKey="admin.accounting.transactions.search"
      />
    </AdminPage>
  );
}
