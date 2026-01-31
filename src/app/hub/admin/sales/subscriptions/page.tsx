"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  RefreshCcw,
  Plus,
  Search,
  Filter,
  Loader2,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  DollarSign,
  Calendar,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  amount: number;
  currency: string;
  interval: "month" | "year";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  { id: "1", userId: "u1", userName: "Juan García", userEmail: "juan@example.com", planName: "Pro", status: "active", amount: 29, currency: "USD", interval: "month", currentPeriodStart: new Date(Date.now() - 86400000 * 15).toISOString(), currentPeriodEnd: new Date(Date.now() + 86400000 * 15).toISOString(), createdAt: new Date(Date.now() - 86400000 * 180).toISOString() },
  { id: "2", userId: "u2", userName: "María López", userEmail: "maria@example.com", planName: "Enterprise", status: "active", amount: 99, currency: "USD", interval: "month", currentPeriodStart: new Date(Date.now() - 86400000 * 5).toISOString(), currentPeriodEnd: new Date(Date.now() + 86400000 * 25).toISOString(), createdAt: new Date(Date.now() - 86400000 * 90).toISOString() },
  { id: "3", userId: "u3", userName: "Carlos Ruiz", userEmail: "carlos@example.com", planName: "Pro", status: "trialing", amount: 29, currency: "USD", interval: "month", currentPeriodStart: new Date(Date.now() - 86400000 * 7).toISOString(), currentPeriodEnd: new Date(Date.now() + 86400000 * 7).toISOString(), createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "4", userId: "u4", userName: "Ana Martínez", userEmail: "ana@example.com", planName: "Basic", status: "past_due", amount: 9, currency: "USD", interval: "month", currentPeriodStart: new Date(Date.now() - 86400000 * 35).toISOString(), currentPeriodEnd: new Date(Date.now() - 86400000 * 5).toISOString(), createdAt: new Date(Date.now() - 86400000 * 120).toISOString() },
  { id: "5", userId: "u5", userName: "Pedro Sánchez", userEmail: "pedro@example.com", planName: "Pro", status: "canceled", amount: 290, currency: "USD", interval: "year", currentPeriodStart: new Date(Date.now() - 86400000 * 200).toISOString(), currentPeriodEnd: new Date(Date.now() + 86400000 * 165).toISOString(), createdAt: new Date(Date.now() - 86400000 * 200).toISOString() },
];

const STATUS_CONFIG = {
  active: { label: "Activa", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  canceled: { label: "Cancelada", color: "bg-red-500/20 text-red-500", icon: XCircle },
  past_due: { label: "Vencida", color: "bg-amber-500/20 text-amber-500", icon: Clock },
  trialing: { label: "Prueba", color: "bg-blue-500/20 text-blue-500", icon: Clock },
};

export default function SubscriptionsPage() {
  const { t } = useI18n();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sales/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || DEFAULT_SUBSCRIPTIONS);
      } else {
        setSubscriptions(DEFAULT_SUBSCRIPTIONS);
      }
    } catch {
      setSubscriptions(DEFAULT_SUBSCRIPTIONS);
    } finally {
      setLoading(false);
    }
  }

  const filteredSubscriptions = subscriptions.filter((s) => {
    const matchesSearch = s.userName.toLowerCase().includes(search.toLowerCase()) || s.userEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "active").length,
    mrr: subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + (s.interval === "month" ? s.amount : s.amount / 12), 0),
    trialing: subscriptions.filter((s) => s.status === "trialing").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-green-500" />
            {t("admin.sales.subscriptions.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.sales.subscriptions.description")}</p>
        </div>
        <button onClick={() => loadSubscriptions()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><Users className="w-4 h-4" /><span className="text-xs">{t("admin.sales.subscriptions.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.sales.subscriptions.stats.active")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.active}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">MRR</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.mrr.toFixed(0)}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2"><Clock className="w-4 h-4" /><span className="text-xs">{t("admin.sales.subscriptions.stats.trialing")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.trialing}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.sales.subscriptions.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
          <option value="all">{t("admin.sales.subscriptions.allStatus")}</option>
          <option value="active">{t("admin.sales.subscriptions.statusActive")}</option>
          <option value="trialing">{t("admin.sales.subscriptions.statusTrialing")}</option>
          <option value="past_due">{t("admin.sales.subscriptions.statusPastDue")}</option>
          <option value="canceled">{t("admin.sales.subscriptions.statusCanceled")}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.sales.subscriptions.customer")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.sales.subscriptions.plan")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.sales.subscriptions.status")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.sales.subscriptions.amount")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.sales.subscriptions.renewal")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => {
                const statusInfo = STATUS_CONFIG[sub.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={sub.id} className="border-b border-[var(--rowi-border)] last:border-b-0 hover:bg-[var(--rowi-muted)]/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--rowi-foreground)]">{sub.userName}</p>
                      <p className="text-xs text-[var(--rowi-muted)]">{sub.userEmail}</p>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] text-xs font-medium">{sub.planName}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}><StatusIcon className="w-3 h-3" />{statusInfo.label}</span></td>
                    <td className="px-4 py-3 text-[var(--rowi-foreground)]">${sub.amount}/{sub.interval === "month" ? "mes" : "año"}</td>
                    <td className="px-4 py-3 text-xs text-[var(--rowi-muted)]">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10"><MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" /></button></td>
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
