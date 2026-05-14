"use client";

import { Wallet } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { EntityTable, type Column } from "@/components/admin/EntityTable";

type PayoutRow = {
  id: string;
  amountUsd: string;
  description: string | null;
  reference: string | null;
  status: string;
  method: string | null;
  issuedAt: string;
  paidAt: string | null;
  user?: { id: string; name: string | null; email: string | null } | null;
  tenant?: { id: string; name: string } | null;
};

const columns: Column<PayoutRow>[] = [
  {
    key: "user",
    labelKey: "admin.accounting.payouts.recipient",
    fallback: "Recipient",
    render: (r) => r.user?.name || r.user?.email || "—",
  },
  {
    key: "amountUsd",
    labelKey: "admin.accounting.payouts.amount",
    fallback: "Amount",
    render: (r) => `$${Number(r.amountUsd).toLocaleString()}`,
  },
  { key: "method", labelKey: "admin.accounting.payouts.method", fallback: "Method" },
  { key: "status", labelKey: "admin.accounting.payouts.status", fallback: "Status" },
  {
    key: "issuedAt",
    labelKey: "admin.accounting.payouts.issued",
    fallback: "Issued",
    render: (r) => new Date(r.issuedAt).toLocaleDateString(),
  },
  {
    key: "paidAt",
    labelKey: "admin.accounting.payouts.paid",
    fallback: "Paid",
    render: (r) => (r.paidAt ? new Date(r.paidAt).toLocaleDateString() : "—"),
  },
  { key: "reference", labelKey: "admin.accounting.payouts.reference", fallback: "Reference" },
];

export default function AccountingPayoutsPage() {
  return (
    <AdminPage
      titleKey="admin.accounting.payouts.title"
      descriptionKey="admin.accounting.payouts.description"
      icon={Wallet}
    >
      <EntityTable<PayoutRow>
        endpoint="/api/admin/accounting/payouts"
        columns={columns}
        searchPlaceholderKey="admin.accounting.payouts.search"
      />
    </AdminPage>
  );
}
