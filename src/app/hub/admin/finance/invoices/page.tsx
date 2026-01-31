"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MoreVertical,
  Download,
  Send,
  Eye,
  Calendar,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  issuedDate: string;
  paidDate?: string;
  items: number;
}

const DEFAULT_INVOICES: Invoice[] = [
  { id: "1", number: "INV-2024-001", clientName: "TechCorp S.A.", clientEmail: "billing@techcorp.com", amount: 4500, currency: "USD", status: "paid", dueDate: new Date(Date.now() - 86400000 * 10).toISOString(), issuedDate: new Date(Date.now() - 86400000 * 40).toISOString(), paidDate: new Date(Date.now() - 86400000 * 15).toISOString(), items: 3 },
  { id: "2", number: "INV-2024-002", clientName: "Innovatech", clientEmail: "finance@innovatech.com", amount: 2800, currency: "USD", status: "sent", dueDate: new Date(Date.now() + 86400000 * 15).toISOString(), issuedDate: new Date(Date.now() - 86400000 * 15).toISOString(), items: 2 },
  { id: "3", number: "INV-2024-003", clientName: "HR Solutions", clientEmail: "accounts@hrsolutions.com", amount: 1500, currency: "USD", status: "overdue", dueDate: new Date(Date.now() - 86400000 * 5).toISOString(), issuedDate: new Date(Date.now() - 86400000 * 35).toISOString(), items: 1 },
  { id: "4", number: "INV-2024-004", clientName: "Global Retail", clientEmail: "billing@globalretail.com", amount: 6200, currency: "USD", status: "draft", dueDate: new Date(Date.now() + 86400000 * 30).toISOString(), issuedDate: new Date(Date.now()).toISOString(), items: 5 },
  { id: "5", number: "INV-2024-005", clientName: "FinanceGroup", clientEmail: "ap@financegroup.com", amount: 3500, currency: "USD", status: "paid", dueDate: new Date(Date.now() - 86400000 * 20).toISOString(), issuedDate: new Date(Date.now() - 86400000 * 50).toISOString(), paidDate: new Date(Date.now() - 86400000 * 25).toISOString(), items: 2 },
];

const STATUS_CONFIG = {
  draft: { label: "Borrador", color: "bg-gray-500/20 text-gray-500", icon: FileText },
  sent: { label: "Enviada", color: "bg-blue-500/20 text-blue-500", icon: Send },
  paid: { label: "Pagada", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  overdue: { label: "Vencida", color: "bg-red-500/20 text-red-500", icon: AlertCircle },
  cancelled: { label: "Cancelada", color: "bg-gray-500/20 text-gray-500", icon: XCircle },
};

export default function InvoicesPage() {
  const { t } = useI18n();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || DEFAULT_INVOICES);
      } else {
        setInvoices(DEFAULT_INVOICES);
      }
    } catch {
      setInvoices(DEFAULT_INVOICES);
    } finally {
      setLoading(false);
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.number.toLowerCase().includes(search.toLowerCase()) || inv.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter((inv) => inv.status === "sent" || inv.status === "overdue").reduce((sum, inv) => sum + inv.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-500" />
            {t("admin.finance.invoices.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.finance.invoices.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadInvoices()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.finance.invoices.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><FileText className="w-4 h-4" /><span className="text-xs">{t("admin.finance.invoices.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.finance.invoices.stats.totalAmount")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.finance.invoices.stats.paid")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.paid.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.finance.invoices.stats.pending")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.pending.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.finance.invoices.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.finance.invoices.allStatus")}</option>
          <option value="draft">{t("admin.finance.invoices.statusDraft")}</option>
          <option value="sent">{t("admin.finance.invoices.statusSent")}</option>
          <option value="paid">{t("admin.finance.invoices.statusPaid")}</option>
          <option value="overdue">{t("admin.finance.invoices.statusOverdue")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.finance.invoices.number")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.finance.invoices.client")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.finance.invoices.amount")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.finance.invoices.status")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.finance.invoices.dueDate")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const statusInfo = STATUS_CONFIG[invoice.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={invoice.id} className="border-b border-[var(--rowi-border)] last:border-b-0 hover:bg-[var(--rowi-muted)]/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--rowi-foreground)]">{invoice.number}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{invoice.items} {t("admin.finance.invoices.items")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--rowi-foreground)]">{invoice.clientName}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{invoice.clientEmail}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--rowi-foreground)]">${invoice.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />{statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--rowi-muted)]">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><Eye className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><Download className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
