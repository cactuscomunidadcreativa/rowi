"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Receipt,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Upload,
  Eye,
  Calendar,
  Tag,
  User,
  Building2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  submittedBy: string;
  submittedByEmail: string;
  status: "pending" | "approved" | "rejected" | "reimbursed";
  date: string;
  receiptUrl?: string;
  notes?: string;
}

const DEFAULT_EXPENSES: Expense[] = [
  { id: "1", description: "Viaje a conferencia Tech Summit", amount: 1250, currency: "USD", category: "Viajes", submittedBy: "Juan García", submittedByEmail: "juan@example.com", status: "approved", date: new Date(Date.now() - 86400000 * 5).toISOString(), receiptUrl: "#", notes: "Incluye vuelo y hotel" },
  { id: "2", description: "Software de diseño anual", amount: 599, currency: "USD", category: "Software", submittedBy: "María López", submittedByEmail: "maria@example.com", status: "reimbursed", date: new Date(Date.now() - 86400000 * 10).toISOString(), receiptUrl: "#" },
  { id: "3", description: "Material de oficina", amount: 185, currency: "USD", category: "Suministros", submittedBy: "Carlos Ruiz", submittedByEmail: "carlos@example.com", status: "pending", date: new Date(Date.now() - 86400000 * 2).toISOString(), receiptUrl: "#" },
  { id: "4", description: "Almuerzo con cliente", amount: 95, currency: "USD", category: "Comidas", submittedBy: "Ana Martínez", submittedByEmail: "ana@example.com", status: "approved", date: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "5", description: "Curso de certificación", amount: 450, currency: "USD", category: "Capacitación", submittedBy: "Pedro Sánchez", submittedByEmail: "pedro@example.com", status: "rejected", date: new Date(Date.now() - 86400000 * 15).toISOString(), notes: "No aprobado - presupuesto agotado" },
];

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-amber-500/20 text-amber-500", icon: Clock },
  approved: { label: "Aprobado", color: "bg-blue-500/20 text-blue-500", icon: CheckCircle },
  rejected: { label: "Rechazado", color: "bg-red-500/20 text-red-500", icon: XCircle },
  reimbursed: { label: "Reembolsado", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Viajes": "bg-blue-500/20 text-blue-500",
  "Software": "bg-purple-500/20 text-purple-500",
  "Suministros": "bg-amber-500/20 text-amber-500",
  "Comidas": "bg-green-500/20 text-green-500",
  "Capacitación": "bg-pink-500/20 text-pink-500",
};

export default function ExpensesPage() {
  const { t } = useI18n();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance/expenses");
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || DEFAULT_EXPENSES);
      } else {
        setExpenses(DEFAULT_EXPENSES);
      }
    } catch {
      setExpenses(DEFAULT_EXPENSES);
    } finally {
      setLoading(false);
    }
  }

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.submittedBy.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: expenses.length,
    pending: expenses.filter((e) => e.status === "pending").length,
    pendingAmount: expenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0),
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
  };

  const approveExpense = (id: string) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status: "approved" as const } : e)));
    toast.success(t("admin.finance.expenses.approved"));
  };

  const rejectExpense = (id: string) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status: "rejected" as const } : e)));
    toast.success(t("admin.finance.expenses.rejected"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Receipt className="w-7 h-7 text-amber-500" />
            {t("admin.finance.expenses.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.finance.expenses.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadExpenses()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.finance.expenses.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><Receipt className="w-4 h-4" /><span className="text-xs">{t("admin.finance.expenses.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.finance.expenses.stats.pending")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.pending}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.finance.expenses.stats.pendingAmount")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.finance.expenses.stats.totalAmount")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.finance.expenses.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.finance.expenses.allStatus")}</option>
          <option value="pending">{t("admin.finance.expenses.statusPending")}</option>
          <option value="approved">{t("admin.finance.expenses.statusApproved")}</option>
          <option value="rejected">{t("admin.finance.expenses.statusRejected")}</option>
          <option value="reimbursed">{t("admin.finance.expenses.statusReimbursed")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => {
            const statusInfo = STATUS_CONFIG[expense.status];
            const StatusIcon = statusInfo.icon;
            return (
              <div key={expense.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">{expense.description}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[expense.category] || "bg-gray-500/20 text-gray-500"}`}>
                        {expense.category}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />{statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--rowi-muted)]">
                      <span className="flex items-center gap-1"><User className="w-4 h-4" />{expense.submittedBy}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(expense.date).toLocaleDateString()}</span>
                      {expense.receiptUrl && (
                        <button className="flex items-center gap-1 text-[var(--rowi-primary)] hover:underline">
                          <Eye className="w-4 h-4" />{t("admin.finance.expenses.viewReceipt")}
                        </button>
                      )}
                    </div>
                    {expense.notes && (
                      <p className="text-xs text-[var(--rowi-muted)] mt-2 italic">{expense.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${expense.amount.toLocaleString()}</p>
                    {expense.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => approveExpense(expense.id)} className="px-3 py-1 text-xs rounded-lg bg-green-500 text-white hover:opacity-90">
                          {t("admin.finance.expenses.approve")}
                        </button>
                        <button onClick={() => rejectExpense(expense.id)} className="px-3 py-1 text-xs rounded-lg bg-red-500 text-white hover:opacity-90">
                          {t("admin.finance.expenses.reject")}
                        </button>
                      </div>
                    )}
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
