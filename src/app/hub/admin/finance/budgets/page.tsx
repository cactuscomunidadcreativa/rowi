"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PiggyBank,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Calendar,
  Edit2,
  Target,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Budget {
  id: string;
  name: string;
  description: string;
  category: string;
  allocated: number;
  spent: number;
  currency: string;
  period: "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate: string;
  status: "on_track" | "warning" | "over_budget" | "completed";
}

const DEFAULT_BUDGETS: Budget[] = [
  { id: "1", name: "Marketing Digital", description: "Campañas de publicidad online", category: "Marketing", allocated: 15000, spent: 8500, currency: "USD", period: "monthly", startDate: new Date(Date.now() - 86400000 * 15).toISOString(), endDate: new Date(Date.now() + 86400000 * 15).toISOString(), status: "on_track" },
  { id: "2", name: "Tecnología", description: "Software y herramientas", category: "Operaciones", allocated: 5000, spent: 4200, currency: "USD", period: "monthly", startDate: new Date(Date.now() - 86400000 * 15).toISOString(), endDate: new Date(Date.now() + 86400000 * 15).toISOString(), status: "warning" },
  { id: "3", name: "Capacitación Q1", description: "Cursos y certificaciones", category: "RRHH", allocated: 10000, spent: 12500, currency: "USD", period: "quarterly", startDate: new Date(Date.now() - 86400000 * 60).toISOString(), endDate: new Date(Date.now() + 86400000 * 30).toISOString(), status: "over_budget" },
  { id: "4", name: "Viajes de Negocios", description: "Viajes y representación", category: "Ventas", allocated: 8000, spent: 3200, currency: "USD", period: "monthly", startDate: new Date(Date.now() - 86400000 * 15).toISOString(), endDate: new Date(Date.now() + 86400000 * 15).toISOString(), status: "on_track" },
  { id: "5", name: "Eventos 2024", description: "Conferencias y networking", category: "Marketing", allocated: 25000, spent: 25000, currency: "USD", period: "yearly", startDate: new Date(Date.now() - 86400000 * 180).toISOString(), endDate: new Date(Date.now() - 86400000 * 30).toISOString(), status: "completed" },
];

const STATUS_CONFIG = {
  on_track: { label: "En presupuesto", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  warning: { label: "Alerta", color: "bg-amber-500/20 text-amber-500", icon: AlertTriangle },
  over_budget: { label: "Excedido", color: "bg-red-500/20 text-red-500", icon: AlertTriangle },
  completed: { label: "Completado", color: "bg-blue-500/20 text-blue-500", icon: CheckCircle },
};

const PERIOD_LABELS: Record<string, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  yearly: "Anual",
};

export default function BudgetsPage() {
  const { t } = useI18n();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadBudgets();
  }, []);

  async function loadBudgets() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance/budgets");
      if (res.ok) {
        const data = await res.json();
        setBudgets(data.budgets || DEFAULT_BUDGETS);
      } else {
        setBudgets(DEFAULT_BUDGETS);
      }
    } catch {
      setBudgets(DEFAULT_BUDGETS);
    } finally {
      setLoading(false);
    }
  }

  const filteredBudgets = budgets.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: budgets.length,
    totalAllocated: budgets.reduce((sum, b) => sum + b.allocated, 0),
    totalSpent: budgets.reduce((sum, b) => sum + b.spent, 0),
    overBudget: budgets.filter((b) => b.status === "over_budget").length,
  };

  const getProgressColor = (spent: number, allocated: number) => {
    const percentage = (spent / allocated) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <PiggyBank className="w-7 h-7 text-pink-500" />
            {t("admin.finance.budgets.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.finance.budgets.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadBudgets()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.finance.budgets.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><PiggyBank className="w-4 h-4" /><span className="text-xs">{t("admin.finance.budgets.stats.total")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Target className="w-4 h-4" /><span className="text-xs">{t("admin.finance.budgets.stats.allocated")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.totalAllocated.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><DollarSign className="w-4 h-4" /><span className="text-xs">{t("admin.finance.budgets.stats.spent")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">${stats.totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2"><AlertTriangle className="w-4 h-4" /><span className="text-xs">{t("admin.finance.budgets.stats.overBudget")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.overBudget}</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.finance.budgets.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBudgets.map((budget) => {
            const statusInfo = STATUS_CONFIG[budget.status];
            const StatusIcon = statusInfo.icon;
            const percentage = Math.min((budget.spent / budget.allocated) * 100, 100);
            const remaining = budget.allocated - budget.spent;
            return (
              <div key={budget.id} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">{budget.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />{statusInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--rowi-muted)]">{budget.description}</p>
                  </div>
                  <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10">
                    <MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)] mb-4">
                  <span className="px-2 py-0.5 rounded bg-[var(--rowi-muted)]/10">{budget.category}</span>
                  <span>•</span>
                  <span>{PERIOD_LABELS[budget.period]}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(budget.endDate).toLocaleDateString()}</span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[var(--rowi-muted)]">{t("admin.finance.budgets.spent")}</span>
                    <span className="font-medium text-[var(--rowi-foreground)]">${budget.spent.toLocaleString()} / ${budget.allocated.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-[var(--rowi-muted)]/20 rounded-full overflow-hidden">
                    <div className={`h-full ${getProgressColor(budget.spent, budget.allocated)} transition-all`} style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-[var(--rowi-muted)]">{percentage.toFixed(0)}% {t("admin.finance.budgets.used")}</span>
                    <span className={remaining >= 0 ? "text-green-500" : "text-red-500"}>
                      {remaining >= 0 ? `$${remaining.toLocaleString()} ${t("admin.finance.budgets.remaining")}` : `$${Math.abs(remaining).toLocaleString()} ${t("admin.finance.budgets.over")}`}
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
