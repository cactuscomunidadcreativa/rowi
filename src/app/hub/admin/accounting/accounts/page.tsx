"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Landmark,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Eye,
  Edit2,
  CreditCard,
  Building2,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Account {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  category: string;
  balance: number;
  currency: string;
  isActive: boolean;
  lastTransaction?: string;
  description?: string;
}

const DEFAULT_ACCOUNTS: Account[] = [
  { id: "1", code: "1000", name: "Caja General", type: "asset", category: "Efectivo", balance: 25400, currency: "USD", isActive: true, lastTransaction: new Date(Date.now() - 86400000 * 1).toISOString(), description: "Cuenta principal de efectivo" },
  { id: "2", code: "1100", name: "Banco Principal", type: "asset", category: "Bancos", balance: 145200, currency: "USD", isActive: true, lastTransaction: new Date(Date.now() - 86400000 * 1).toISOString(), description: "Cuenta corriente principal" },
  { id: "3", code: "1200", name: "Cuentas por Cobrar", type: "asset", category: "Créditos", balance: 38500, currency: "USD", isActive: true, lastTransaction: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "4", code: "2000", name: "Proveedores", type: "liability", category: "Pasivo Corriente", balance: 22300, currency: "USD", isActive: true, lastTransaction: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "5", code: "2100", name: "Impuestos por Pagar", type: "liability", category: "Pasivo Corriente", balance: 8900, currency: "USD", isActive: true, lastTransaction: new Date(Date.now() - 86400000 * 15).toISOString() },
  { id: "6", code: "3000", name: "Capital Social", type: "equity", category: "Patrimonio", balance: 100000, currency: "USD", isActive: true },
  { id: "7", code: "4000", name: "Ingresos por Servicios", type: "revenue", category: "Ingresos Operativos", balance: 185400, currency: "USD", isActive: true, lastTransaction: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "8", code: "5000", name: "Gastos de Personal", type: "expense", category: "Gastos Operativos", balance: 62500, currency: "USD", isActive: true, lastTransaction: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "9", code: "5100", name: "Gastos Administrativos", type: "expense", category: "Gastos Operativos", balance: 18200, currency: "USD", isActive: true, lastTransaction: new Date(Date.now() - 86400000 * 4).toISOString() },
];

const TYPE_CONFIG = {
  asset: { label: "Activo", color: "bg-blue-500/20 text-blue-500", icon: Wallet },
  liability: { label: "Pasivo", color: "bg-red-500/20 text-red-500", icon: CreditCard },
  equity: { label: "Patrimonio", color: "bg-purple-500/20 text-purple-500", icon: Building2 },
  revenue: { label: "Ingreso", color: "bg-green-500/20 text-green-500", icon: TrendingUp },
  expense: { label: "Gasto", color: "bg-amber-500/20 text-amber-500", icon: TrendingDown },
};

export default function AccountsPage() {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounting/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || DEFAULT_ACCOUNTS);
      } else {
        setAccounts(DEFAULT_ACCOUNTS);
      }
    } catch {
      setAccounts(DEFAULT_ACCOUNTS);
    } finally {
      setLoading(false);
    }
  }

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search);
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: accounts.length,
    assets: accounts.filter((a) => a.type === "asset").reduce((sum, a) => sum + a.balance, 0),
    liabilities: accounts.filter((a) => a.type === "liability").reduce((sum, a) => sum + a.balance, 0),
    equity: accounts.filter((a) => a.type === "equity").reduce((sum, a) => sum + a.balance, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Landmark className="w-7 h-7 text-blue-500" />
            {t("admin.accounting.accounts.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.accounting.accounts.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadAccounts()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.accounting.accounts.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><Landmark className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.accounts.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Wallet className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.accounts.stats.assets")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.assets.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2"><CreditCard className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.accounts.stats.liabilities")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.liabilities.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2"><Building2 className="w-4 h-4" /><span className="text-xs">{t("admin.accounting.accounts.stats.equity")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.equity.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.accounting.accounts.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.accounting.accounts.allTypes")}</option>
          <option value="asset">{t("admin.accounting.accounts.typeAsset")}</option>
          <option value="liability">{t("admin.accounting.accounts.typeLiability")}</option>
          <option value="equity">{t("admin.accounting.accounts.typeEquity")}</option>
          <option value="revenue">{t("admin.accounting.accounts.typeRevenue")}</option>
          <option value="expense">{t("admin.accounting.accounts.typeExpense")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.accounts.code")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.accounts.name")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.accounts.type")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.accounts.category")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.accounting.accounts.balance")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => {
                const typeInfo = TYPE_CONFIG[account.type];
                const TypeIcon = typeInfo.icon;
                return (
                  <tr key={account.id} className="border-b border-[var(--rowi-border)] last:border-b-0 hover:bg-[var(--rowi-muted)]/5">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-[var(--rowi-foreground)]">{account.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--rowi-foreground)]">{account.name}</p>
                      {account.description && <p className="text-xs text-[var(--rowi-muted)]">{account.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}>
                        <TypeIcon className="w-3 h-3" />{typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--rowi-muted)]">{account.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${account.type === "asset" || account.type === "expense" ? "text-[var(--rowi-foreground)]" : account.type === "revenue" ? "text-green-500" : "text-red-500"}`}>
                        ${account.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><Eye className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
                        <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><Edit2 className="w-4 h-4 text-[var(--rowi-muted)]" /></button>
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
