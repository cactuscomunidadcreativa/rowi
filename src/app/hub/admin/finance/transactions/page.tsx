"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  RefreshCcw,
  Search,
  Loader2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Download,
  CreditCard,
  Building2,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Transaction {
  id: string;
  type: "income" | "expense" | "transfer";
  description: string;
  amount: number;
  currency: string;
  category: string;
  account: string;
  reference?: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: "1", type: "income", description: "Pago factura INV-2024-001", amount: 4500, currency: "USD", category: "Ventas", account: "Cuenta Principal", reference: "TRX-001", date: new Date(Date.now() - 86400000 * 2).toISOString(), status: "completed" },
  { id: "2", type: "expense", description: "Suscripción AWS", amount: 850, currency: "USD", category: "Tecnología", account: "Cuenta Principal", reference: "TRX-002", date: new Date(Date.now() - 86400000 * 3).toISOString(), status: "completed" },
  { id: "3", type: "income", description: "Pago factura INV-2024-005", amount: 3500, currency: "USD", category: "Ventas", account: "Cuenta Principal", reference: "TRX-003", date: new Date(Date.now() - 86400000 * 5).toISOString(), status: "completed" },
  { id: "4", type: "expense", description: "Nómina Enero", amount: 12500, currency: "USD", category: "Salarios", account: "Cuenta Nómina", reference: "TRX-004", date: new Date(Date.now() - 86400000 * 7).toISOString(), status: "completed" },
  { id: "5", type: "transfer", description: "Transferencia a cuenta de reserva", amount: 5000, currency: "USD", category: "Transferencia", account: "Cuenta Principal → Reserva", reference: "TRX-005", date: new Date(Date.now() - 86400000 * 10).toISOString(), status: "completed" },
  { id: "6", type: "expense", description: "Marketing Digital", amount: 2200, currency: "USD", category: "Marketing", account: "Cuenta Principal", reference: "TRX-006", date: new Date(Date.now() - 86400000 * 12).toISOString(), status: "completed" },
  { id: "7", type: "income", description: "Consultoría especial", amount: 1800, currency: "USD", category: "Servicios", account: "Cuenta Principal", reference: "TRX-007", date: new Date(Date.now() - 86400000 * 15).toISOString(), status: "pending" },
];

const TYPE_CONFIG = {
  income: { label: "Ingreso", color: "text-green-500", bg: "bg-green-500/10", icon: ArrowDownLeft },
  expense: { label: "Gasto", color: "text-red-500", bg: "bg-red-500/10", icon: ArrowUpRight },
  transfer: { label: "Transferencia", color: "text-blue-500", bg: "bg-blue-500/10", icon: ArrowLeftRight },
};

export default function TransactionsPage() {
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || DEFAULT_TRANSACTIONS);
      } else {
        setTransactions(DEFAULT_TRANSACTIONS);
      }
    } catch {
      setTransactions(DEFAULT_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: transactions.length,
    income: transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
    expenses: transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    balance: transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0) - transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <ArrowLeftRight className="w-7 h-7 text-purple-500" />
            {t("admin.finance.transactions.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.finance.transactions.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadTransactions()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" />
            {t("admin.finance.transactions.export")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><ArrowLeftRight className="w-4 h-4" /><span className="text-xs">{t("admin.finance.transactions.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><ArrowDownLeft className="w-4 h-4" /><span className="text-xs">{t("admin.finance.transactions.stats.income")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.income.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2"><ArrowUpRight className="w-4 h-4" /><span className="text-xs">{t("admin.finance.transactions.stats.expenses")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.expenses.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Wallet className="w-4 h-4" /><span className="text-xs">{t("admin.finance.transactions.stats.balance")}</span></div>
          <p className={`text-2xl font-bold ${stats.balance >= 0 ? "text-green-500" : "text-red-500"}`}>${stats.balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.finance.transactions.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.finance.transactions.allTypes")}</option>
          <option value="income">{t("admin.finance.transactions.typeIncome")}</option>
          <option value="expense">{t("admin.finance.transactions.typeExpense")}</option>
          <option value="transfer">{t("admin.finance.transactions.typeTransfer")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => {
            const typeInfo = TYPE_CONFIG[transaction.type];
            const TypeIcon = typeInfo.icon;
            return (
              <div key={transaction.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${typeInfo.bg} flex items-center justify-center`}>
                    <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--rowi-foreground)] truncate">{transaction.description}</p>
                      {transaction.reference && (
                        <span className="text-xs text-[var(--rowi-muted)] bg-[var(--rowi-muted)]/10 px-2 py-0.5 rounded">{transaction.reference}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--rowi-muted)]">
                      <span>{transaction.category}</span>
                      <span>•</span>
                      <span>{transaction.account}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === "income" ? "text-green-500" : transaction.type === "expense" ? "text-red-500" : "text-blue-500"}`}>
                      {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}${transaction.amount.toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded ${transaction.status === "completed" ? "bg-green-500/10 text-green-500" : transaction.status === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"}`}>
                      {transaction.status === "completed" ? t("admin.finance.transactions.completed") : transaction.status === "pending" ? t("admin.finance.transactions.pending") : t("admin.finance.transactions.failed")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
