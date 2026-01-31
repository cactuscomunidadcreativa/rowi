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
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface AccountingInvoice {
  id: string;
  number: string;
  type: "receivable" | "payable";
  entityName: string;
  entityTaxId?: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  accountCode: string;
  accountName: string;
  items: number;
}

const DEFAULT_INVOICES: AccountingInvoice[] = [
  { id: "1", number: "FAC-2024-001", type: "receivable", entityName: "TechCorp S.A.", entityTaxId: "RFC123456", amount: 4500, tax: 720, total: 5220, currency: "USD", status: "paid", issueDate: new Date(Date.now() - 86400000 * 40).toISOString(), dueDate: new Date(Date.now() - 86400000 * 10).toISOString(), paidDate: new Date(Date.now() - 86400000 * 15).toISOString(), accountCode: "1200", accountName: "Cuentas por Cobrar", items: 3 },
  { id: "2", number: "FAC-2024-002", type: "receivable", entityName: "Innovatech", entityTaxId: "RFC789012", amount: 2800, tax: 448, total: 3248, currency: "USD", status: "pending", issueDate: new Date(Date.now() - 86400000 * 15).toISOString(), dueDate: new Date(Date.now() + 86400000 * 15).toISOString(), accountCode: "1200", accountName: "Cuentas por Cobrar", items: 2 },
  { id: "3", number: "PROV-2024-001", type: "payable", entityName: "AWS Services", entityTaxId: "EIN-123", amount: 850, tax: 0, total: 850, currency: "USD", status: "paid", issueDate: new Date(Date.now() - 86400000 * 30).toISOString(), dueDate: new Date(Date.now() - 86400000 * 15).toISOString(), paidDate: new Date(Date.now() - 86400000 * 20).toISOString(), accountCode: "2000", accountName: "Proveedores", items: 1 },
  { id: "4", number: "FAC-2024-003", type: "receivable", entityName: "HR Solutions", entityTaxId: "RFC345678", amount: 1500, tax: 240, total: 1740, currency: "USD", status: "overdue", issueDate: new Date(Date.now() - 86400000 * 35).toISOString(), dueDate: new Date(Date.now() - 86400000 * 5).toISOString(), accountCode: "1200", accountName: "Cuentas por Cobrar", items: 1 },
  { id: "5", number: "PROV-2024-002", type: "payable", entityName: "Office Supplies Co", amount: 450, tax: 72, total: 522, currency: "USD", status: "pending", issueDate: new Date(Date.now() - 86400000 * 10).toISOString(), dueDate: new Date(Date.now() + 86400000 * 20).toISOString(), accountCode: "2000", accountName: "Proveedores", items: 5 },
  { id: "6", number: "FAC-2024-004", type: "receivable", entityName: "Global Retail", entityTaxId: "RFC901234", amount: 6200, tax: 992, total: 7192, currency: "USD", status: "draft", issueDate: new Date().toISOString(), dueDate: new Date(Date.now() + 86400000 * 30).toISOString(), accountCode: "1200", accountName: "Cuentas por Cobrar", items: 5 },
];

const STATUS_CONFIG = {
  draft: { label: "Borrador", color: "bg-gray-500/20 text-gray-500", icon: FileText },
  pending: { label: "Pendiente", color: "bg-blue-500/20 text-blue-500", icon: Clock },
  paid: { label: "Pagada", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  overdue: { label: "Vencida", color: "bg-red-500/20 text-red-500", icon: AlertCircle },
  cancelled: { label: "Cancelada", color: "bg-gray-500/20 text-gray-500", icon: XCircle },
};

const TYPE_CONFIG = {
  receivable: { label: "Por Cobrar", color: "text-green-500", icon: ArrowDownLeft },
  payable: { label: "Por Pagar", color: "text-red-500", icon: ArrowUpRight },
};

export default function AccountingInvoicesPage() {
  const { t } = useI18n();
  const [invoices, setInvoices] = useState<AccountingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounting/invoices");
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
    const matchesSearch = inv.number.toLowerCase().includes(search.toLowerCase()) || inv.entityName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || inv.type === typeFilter;
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    receivable: invoices.filter((inv) => inv.type === "receivable" && inv.status !== "paid" && inv.status !== "cancelled").reduce((sum, inv) => sum + inv.total, 0),
    payable: invoices.filter((inv) => inv.type === "payable" && inv.status !== "paid" && inv.status !== "cancelled").reduce((sum, inv) => sum + inv.total, 0),
    overdue: invoices.filter((inv) => inv.status === "overdue").reduce((sum, inv) => sum + inv.total, 0),
    paidThisMonth: invoices.filter((inv) => inv.status === "paid" && inv.paidDate && new Date(inv.paidDate) > new Date(Date.now() - 86400000 * 30)).reduce((sum, inv) => sum + inv.total, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-500" />
            {t("admin.accounting.invoices.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.accounting.invoices.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadInvoices()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.accounting.invoices.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><ArrowDownLeft className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.invoices.stats.receivable")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.receivable.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2"><ArrowUpRight className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.invoices.stats.payable")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.payable.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><AlertCircle className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.invoices.stats.overdue")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.overdue.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.invoices.stats.paidMonth")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.paidThisMonth.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.accounting.invoices.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.accounting.invoices.allTypes")}</option>
          <option value="receivable">{t("admin.accounting.invoices.typeReceivable")}</option>
          <option value="payable">{t("admin.accounting.invoices.typePayable")}</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.accounting.invoices.allStatus")}</option>
          <option value="draft">{t("admin.accounting.invoices.statusDraft")}</option>
          <option value="pending">{t("admin.accounting.invoices.statusPending")}</option>
          <option value="paid">{t("admin.accounting.invoices.statusPaid")}</option>
          <option value="overdue">{t("admin.accounting.invoices.statusOverdue")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.invoices.number")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.invoices.type")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.invoices.entity")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.invoices.total")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.invoices.status")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.invoices.dueDate")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const statusInfo = STATUS_CONFIG[invoice.status];
                const typeInfo = TYPE_CONFIG[invoice.type];
                const StatusIcon = statusInfo.icon;
                const TypeIcon = typeInfo.icon;
                return (
                  <tr key={invoice.id} className="border-b border-[var(--rowi-border)] last:border-b-0 hover:bg-[var(--rowi-muted)]/5">
                    <td className="px-4 py-3">
                      <p className="font-mono text-sm font-medium text-[var(--rowi-foreground)]">{invoice.number}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{invoice.items} items</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${typeInfo.color}`}>
                        <TypeIcon className="w-3 h-3" />{typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--rowi-foreground)]">{invoice.entityName}</p>
                      {invoice.entityTaxId && <p className="text-xs text-[var(--rowi-muted)]">{invoice.entityTaxId}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-[var(--rowi-foreground)]">${invoice.total.toLocaleString()}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">IVA: ${invoice.tax.toLocaleString()}</p>
                    </td>
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
