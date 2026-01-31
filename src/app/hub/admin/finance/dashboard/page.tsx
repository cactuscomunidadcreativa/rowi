"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  RefreshCcw,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Receipt,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface FinanceMetric {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down";
  prefix?: string;
  suffix?: string;
}

interface MonthlyFinance {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

const DEFAULT_METRICS: FinanceMetric[] = [
  { label: "Ingresos Totales", value: 125400, change: 15.2, trend: "up", prefix: "$" },
  { label: "Gastos Totales", value: 78200, change: 8.5, trend: "up", prefix: "$" },
  { label: "Beneficio Neto", value: 47200, change: 28.3, trend: "up", prefix: "$" },
  { label: "Facturas Pendientes", value: 12500, change: -15.0, trend: "down", prefix: "$" },
  { label: "Margen de Beneficio", value: 37.6, change: 5.2, trend: "up", suffix: "%" },
  { label: "Flujo de Caja", value: 34800, change: 12.1, trend: "up", prefix: "$" },
];

const DEFAULT_MONTHLY: MonthlyFinance[] = [
  { month: "Jul", income: 18500, expenses: 12300, profit: 6200 },
  { month: "Ago", income: 19200, expenses: 11800, profit: 7400 },
  { month: "Sep", income: 21000, expenses: 13200, profit: 7800 },
  { month: "Oct", income: 20500, expenses: 12900, profit: 7600 },
  { month: "Nov", income: 22800, expenses: 14100, profit: 8700 },
  { month: "Dic", income: 23400, expenses: 13900, profit: 9500 },
];

export default function FinanceDashboardPage() {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<FinanceMetric[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6m");

  useEffect(() => {
    loadDashboard();
  }, [period]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/finance/dashboard?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || DEFAULT_METRICS);
        setMonthlyData(data.monthlyData || DEFAULT_MONTHLY);
      } else {
        setMetrics(DEFAULT_METRICS);
        setMonthlyData(DEFAULT_MONTHLY);
      }
    } catch {
      setMetrics(DEFAULT_METRICS);
      setMonthlyData(DEFAULT_MONTHLY);
    } finally {
      setLoading(false);
    }
  }

  const maxValue = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expenses)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Wallet className="w-7 h-7 text-emerald-500" />
            {t("admin.finance.dashboard.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.finance.dashboard.description")}</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
            <option value="1m">1 {t("admin.finance.dashboard.month")}</option>
            <option value="3m">3 {t("admin.finance.dashboard.months")}</option>
            <option value="6m">6 {t("admin.finance.dashboard.months")}</option>
            <option value="1y">1 {t("admin.finance.dashboard.year")}</option>
          </select>
          <button onClick={() => loadDashboard()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" />
            {t("admin.finance.dashboard.export")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : (
        <>
          {/* KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
                <p className="text-xs text-[var(--rowi-muted)] mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
                  {metric.prefix}{metric.value.toLocaleString()}{metric.suffix}
                </p>
                <div className={`flex items-center gap-1 mt-1 text-xs ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {metric.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(metric.change)}%
                </div>
              </div>
            ))}
          </div>

          {/* Income vs Expenses Chart */}
          <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
            <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              {t("admin.finance.dashboard.incomeVsExpenses")}
            </h3>
            <div className="flex items-end gap-6 h-48">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end" style={{ height: "100%" }}>
                    <div className="flex-1 bg-emerald-500/80 rounded-t-lg" style={{ height: `${(data.income / maxValue) * 100}%` }} />
                    <div className="flex-1 bg-red-500/80 rounded-t-lg" style={{ height: `${(data.expenses / maxValue) * 100}%` }} />
                  </div>
                  <span className="text-xs text-[var(--rowi-muted)]">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs text-[var(--rowi-muted)]">{t("admin.finance.dashboard.income")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-xs text-[var(--rowi-muted)]">{t("admin.finance.dashboard.expenses")}</span>
              </div>
            </div>
          </div>

          {/* Profit Chart */}
          <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
            <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-blue-500" />
              {t("admin.finance.dashboard.profitEvolution")}
            </h3>
            <div className="space-y-3">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--rowi-muted)] w-8">{data.month}</span>
                  <div className="flex-1 h-6 bg-[var(--rowi-muted)]/10 rounded-lg overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(data.profit / Math.max(...monthlyData.map(d => d.profit))) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-[var(--rowi-foreground)] w-20 text-right">${data.profit.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Table */}
          <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
            <div className="p-5 border-b border-[var(--rowi-border)]">
              <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.finance.dashboard.summary")}</h3>
            </div>
            <table className="w-full">
              <thead className="bg-[var(--rowi-muted)]/5">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.finance.dashboard.month")}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.finance.dashboard.income")}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.finance.dashboard.expenses")}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.finance.dashboard.profit")}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.finance.dashboard.margin")}</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data) => (
                  <tr key={data.month} className="border-b border-[var(--rowi-border)] last:border-b-0">
                    <td className="px-5 py-3 text-[var(--rowi-foreground)]">{data.month}</td>
                    <td className="px-5 py-3 text-right text-green-500">${data.income.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-red-500">${data.expenses.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-[var(--rowi-foreground)] font-medium">${data.profit.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-blue-500">{((data.profit / data.income) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
