"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  DollarSign,
  ArrowRight,
  Calendar,
  MoreVertical,
  Eye,
  FileText,
  Download,
  CheckCircle,
  Clock,
  Filter,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface JournalEntry {
  id: string;
  number: string;
  date: string;
  description: string;
  reference?: string;
  status: "posted" | "draft" | "voided";
  entries: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
}

const DEFAULT_ENTRIES: JournalEntry[] = [
  {
    id: "1", number: "AST-2024-001", date: new Date(Date.now() - 86400000 * 1).toISOString(), description: "Pago de factura cliente TechCorp", reference: "INV-001", status: "posted", createdBy: "Sistema",
    entries: [
      { accountCode: "1100", accountName: "Banco Principal", debit: 4500, credit: 0 },
      { accountCode: "1200", accountName: "Cuentas por Cobrar", debit: 0, credit: 4500 },
    ],
    totalDebit: 4500, totalCredit: 4500
  },
  {
    id: "2", number: "AST-2024-002", date: new Date(Date.now() - 86400000 * 2).toISOString(), description: "Pago nómina enero", reference: "NOM-001", status: "posted", createdBy: "Admin",
    entries: [
      { accountCode: "5000", accountName: "Gastos de Personal", debit: 12500, credit: 0 },
      { accountCode: "1100", accountName: "Banco Principal", debit: 0, credit: 12500 },
    ],
    totalDebit: 12500, totalCredit: 12500
  },
  {
    id: "3", number: "AST-2024-003", date: new Date(Date.now() - 86400000 * 3).toISOString(), description: "Factura servicios mes enero", reference: "FAC-015", status: "posted", createdBy: "Sistema",
    entries: [
      { accountCode: "1200", accountName: "Cuentas por Cobrar", debit: 8500, credit: 0 },
      { accountCode: "4000", accountName: "Ingresos por Servicios", debit: 0, credit: 8500 },
    ],
    totalDebit: 8500, totalCredit: 8500
  },
  {
    id: "4", number: "AST-2024-004", date: new Date(Date.now() - 86400000 * 5).toISOString(), description: "Pago a proveedores", reference: "PROV-023", status: "posted", createdBy: "Admin",
    entries: [
      { accountCode: "2000", accountName: "Proveedores", debit: 3200, credit: 0 },
      { accountCode: "1100", accountName: "Banco Principal", debit: 0, credit: 3200 },
    ],
    totalDebit: 3200, totalCredit: 3200
  },
  {
    id: "5", number: "AST-2024-005", date: new Date().toISOString(), description: "Registro gastos administrativos", status: "draft", createdBy: "Admin",
    entries: [
      { accountCode: "5100", accountName: "Gastos Administrativos", debit: 1500, credit: 0 },
      { accountCode: "1000", accountName: "Caja General", debit: 0, credit: 1500 },
    ],
    totalDebit: 1500, totalCredit: 1500
  },
];

const STATUS_CONFIG = {
  posted: { label: "Contabilizado", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  draft: { label: "Borrador", color: "bg-amber-500/20 text-amber-500", icon: Clock },
  voided: { label: "Anulado", color: "bg-red-500/20 text-red-500", icon: FileText },
};

export default function TransactionsPage() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounting/transactions");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || DEFAULT_ENTRIES);
      } else {
        setEntries(DEFAULT_ENTRIES);
      }
    } catch {
      setEntries(DEFAULT_ENTRIES);
    } finally {
      setLoading(false);
    }
  }

  const filteredEntries = entries.filter((e) => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.number.includes(search);
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: entries.length,
    posted: entries.filter((e) => e.status === "posted").length,
    totalDebits: entries.filter((e) => e.status === "posted").reduce((sum, e) => sum + e.totalDebit, 0),
    drafts: entries.filter((e) => e.status === "draft").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-500" />
            {t("admin.accounting.transactions.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.accounting.transactions.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadEntries()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors">
            <Download className="w-4 h-4" />
            {t("admin.accounting.transactions.export")}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.accounting.transactions.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><BookOpen className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.transactions.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.transactions.stats.posted")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.posted}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.transactions.stats.totalAmount")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.totalDebits.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.transactions.stats.drafts")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.drafts}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.accounting.transactions.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.accounting.transactions.allStatus")}</option>
          <option value="posted">{t("admin.accounting.transactions.statusPosted")}</option>
          <option value="draft">{t("admin.accounting.transactions.statusDraft")}</option>
          <option value="voided">{t("admin.accounting.transactions.statusVoided")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const statusInfo = STATUS_CONFIG[entry.status];
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === entry.id;
            return (
              <div key={entry.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
                <div className="p-4 cursor-pointer hover:bg-[var(--rowi-muted)]/5" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-[var(--rowi-foreground)]">{entry.number}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />{statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--rowi-foreground)] mt-1">{entry.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--rowi-muted)]">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(entry.date).toLocaleDateString()}</span>
                          {entry.reference && <span>Ref: {entry.reference}</span>}
                          <span>Por: {entry.createdBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[var(--rowi-foreground)]">${entry.totalDebit.toLocaleString()}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{entry.entries.length} {t("admin.accounting.transactions.lines")}</p>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-[var(--rowi-border)] bg-[var(--rowi-muted)]/5">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--rowi-border)]">
                          <th className="text-left px-4 py-2 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.transactions.account")}</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.transactions.debit")}</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.transactions.credit")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.entries.map((line, i) => (
                          <tr key={i} className="border-b border-[var(--rowi-border)] last:border-b-0">
                            <td className="px-4 py-2">
                              <span className="font-mono text-xs text-[var(--rowi-muted)]">{line.accountCode}</span>
                              <span className="ml-2 text-sm text-[var(--rowi-foreground)]">{line.accountName}</span>
                            </td>
                            <td className="px-4 py-2 text-right text-sm">{line.debit > 0 ? <span className="text-[var(--rowi-foreground)]">${line.debit.toLocaleString()}</span> : "-"}</td>
                            <td className="px-4 py-2 text-right text-sm">{line.credit > 0 ? <span className="text-[var(--rowi-foreground)]">${line.credit.toLocaleString()}</span> : "-"}</td>
                          </tr>
                        ))}
                        <tr className="bg-[var(--rowi-muted)]/10">
                          <td className="px-4 py-2 font-medium text-[var(--rowi-foreground)]">{t("admin.accounting.transactions.totals")}</td>
                          <td className="px-4 py-2 text-right font-bold text-[var(--rowi-foreground)]">${entry.totalDebit.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right font-bold text-[var(--rowi-foreground)]">${entry.totalCredit.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
