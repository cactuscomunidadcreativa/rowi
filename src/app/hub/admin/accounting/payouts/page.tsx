"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Download,
  Eye,
  Calendar,
  Building2,
  CreditCard,
  ArrowUpRight,
  Send,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Payout {
  id: string;
  reference: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  amount: number;
  currency: string;
  type: "supplier" | "refund" | "commission" | "other";
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  scheduledDate: string;
  processedDate?: string;
  description: string;
}

const DEFAULT_PAYOUTS: Payout[] = [
  { id: "1", reference: "PAY-2024-001", recipientName: "Tech Supplies Inc", recipientAccount: "****4521", recipientBank: "Bank of America", amount: 2900, currency: "USD", type: "supplier", status: "completed", scheduledDate: new Date(Date.now() - 86400000 * 10).toISOString(), processedDate: new Date(Date.now() - 86400000 * 9).toISOString(), description: "Pago PO-2024-001" },
  { id: "2", reference: "PAY-2024-002", recipientName: "Office Depot", recipientAccount: "****7832", recipientBank: "Chase", amount: 986, currency: "USD", type: "supplier", status: "processing", scheduledDate: new Date(Date.now() - 86400000 * 2).toISOString(), description: "Pago PO-2024-002" },
  { id: "3", reference: "PAY-2024-003", recipientName: "Juan García", recipientAccount: "****1234", recipientBank: "Santander", amount: 150, currency: "USD", type: "refund", status: "completed", scheduledDate: new Date(Date.now() - 86400000 * 5).toISOString(), processedDate: new Date(Date.now() - 86400000 * 4).toISOString(), description: "Reembolso cliente" },
  { id: "4", reference: "PAY-2024-004", recipientName: "Marketing Agency", recipientAccount: "****9087", recipientBank: "BBVA", amount: 5220, currency: "USD", type: "supplier", status: "pending", scheduledDate: new Date(Date.now() + 86400000 * 5).toISOString(), description: "Pago servicios marketing" },
  { id: "5", reference: "PAY-2024-005", recipientName: "Sales Partner Co", recipientAccount: "****5678", recipientBank: "Wells Fargo", amount: 1250, currency: "USD", type: "commission", status: "pending", scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString(), description: "Comisión ventas Q1" },
  { id: "6", reference: "PAY-2024-006", recipientName: "Cloud Services Ltd", recipientAccount: "****3456", recipientBank: "Citibank", amount: 450, currency: "USD", type: "supplier", status: "failed", scheduledDate: new Date(Date.now() - 86400000 * 3).toISOString(), description: "Pago rechazado - cuenta inválida" },
];

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-amber-500/20 text-amber-500", icon: Clock },
  processing: { label: "Procesando", color: "bg-blue-500/20 text-blue-500", icon: Send },
  completed: { label: "Completado", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  failed: { label: "Fallido", color: "bg-red-500/20 text-red-500", icon: XCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-500/20 text-gray-500", icon: XCircle },
};

const TYPE_CONFIG = {
  supplier: { label: "Proveedor", color: "text-blue-500" },
  refund: { label: "Reembolso", color: "text-purple-500" },
  commission: { label: "Comisión", color: "text-green-500" },
  other: { label: "Otro", color: "text-gray-500" },
};

export default function PayoutsPage() {
  const { t } = useI18n();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadPayouts();
  }, []);

  async function loadPayouts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounting/payouts");
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || DEFAULT_PAYOUTS);
      } else {
        setPayouts(DEFAULT_PAYOUTS);
      }
    } catch {
      setPayouts(DEFAULT_PAYOUTS);
    } finally {
      setLoading(false);
    }
  }

  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch = p.reference.toLowerCase().includes(search.toLowerCase()) || p.recipientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: payouts.length,
    pending: payouts.filter((p) => p.status === "pending" || p.status === "processing").length,
    pendingAmount: payouts.filter((p) => p.status === "pending" || p.status === "processing").reduce((sum, p) => sum + p.amount, 0),
    completed: payouts.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Banknote className="w-7 h-7 text-green-500" />
            {t("admin.accounting.payouts.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.accounting.payouts.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadPayouts()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.accounting.payouts.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><Banknote className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.payouts.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.payouts.stats.pending")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.pending}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><ArrowUpRight className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.payouts.stats.pendingAmount")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.payouts.stats.completed")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.completed.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.accounting.payouts.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.accounting.payouts.allStatus")}</option>
          <option value="pending">{t("admin.accounting.payouts.statusPending")}</option>
          <option value="processing">{t("admin.accounting.payouts.statusProcessing")}</option>
          <option value="completed">{t("admin.accounting.payouts.statusCompleted")}</option>
          <option value="failed">{t("admin.accounting.payouts.statusFailed")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="space-y-3">
          {filteredPayouts.map((payout) => {
            const statusInfo = STATUS_CONFIG[payout.status];
            const typeInfo = TYPE_CONFIG[payout.type];
            const StatusIcon = statusInfo.icon;
            return (
              <div key={payout.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-[var(--rowi-foreground)]">{payout.reference}</span>
                        <span className={`text-xs ${typeInfo.color}`}>{typeInfo.label}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />{statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--rowi-foreground)] mt-1">{payout.recipientName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--rowi-muted)]">
                        <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{payout.recipientAccount} • {payout.recipientBank}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(payout.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-[var(--rowi-muted)] mt-1">{payout.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[var(--rowi-foreground)]">${payout.amount.toLocaleString()}</p>
                    <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10 mt-2">
                      <MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" />
                    </button>
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
