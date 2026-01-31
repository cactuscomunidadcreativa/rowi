"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  RefreshCcw,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface SalesMetric {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down";
  prefix?: string;
  suffix?: string;
}

interface MonthlyData {
  month: string;
  revenue: number;
  subscriptions: number;
  churn: number;
}

const DEFAULT_METRICS: SalesMetric[] = [
  { label: "MRR", value: 12450, change: 12.5, trend: "up", prefix: "$" },
  { label: "ARR", value: 149400, change: 15.2, trend: "up", prefix: "$" },
  { label: "Nuevos clientes", value: 28, change: 8.3, trend: "up" },
  { label: "Churn rate", value: 2.4, change: -0.5, trend: "down", suffix: "%" },
  { label: "LTV", value: 890, change: 5.1, trend: "up", prefix: "$" },
  { label: "CAC", value: 125, change: -12.0, trend: "down", prefix: "$" },
];

const DEFAULT_MONTHLY_DATA: MonthlyData[] = [
  { month: "Jul", revenue: 9800, subscriptions: 145, churn: 3 },
  { month: "Ago", revenue: 10200, subscriptions: 152, churn: 4 },
  { month: "Sep", revenue: 10850, subscriptions: 161, churn: 2 },
  { month: "Oct", revenue: 11300, subscriptions: 170, churn: 5 },
  { month: "Nov", revenue: 11900, subscriptions: 182, churn: 3 },
  { month: "Dic", revenue: 12450, subscriptions: 195, churn: 4 },
];

export default function SalesReportsPage() {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<SalesMetric[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6m");

  useEffect(() => {
    loadReports();
  }, [period]);

  async function loadReports() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales/reports?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || DEFAULT_METRICS);
        setMonthlyData(data.monthlyData || DEFAULT_MONTHLY_DATA);
      } else {
        setMetrics(DEFAULT_METRICS);
        setMonthlyData(DEFAULT_MONTHLY_DATA);
      }
    } catch {
      setMetrics(DEFAULT_METRICS);
      setMonthlyData(DEFAULT_MONTHLY_DATA);
    } finally {
      setLoading(false);
    }
  }

  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-500" />
            {t("admin.sales.reports.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.sales.reports.description")}</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none">
            <option value="1m">1 mes</option>
            <option value="3m">3 meses</option>
            <option value="6m">6 meses</option>
            <option value="1y">1 año</option>
          </select>
          <button onClick={() => loadReports()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" />
            {t("admin.sales.reports.export")}
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

          {/* Revenue Chart */}
          <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
            <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              {t("admin.sales.reports.revenueChart")}
            </h3>
            <div className="flex items-end gap-4 h-48">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-[var(--rowi-muted)]/10 rounded-t-lg relative" style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}>
                    <div className="absolute inset-0 bg-indigo-500/80 rounded-t-lg" />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-[var(--rowi-foreground)]">
                      ${(data.revenue / 1000).toFixed(1)}k
                    </div>
                  </div>
                  <span className="text-xs text-[var(--rowi-muted)]">{data.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscriptions & Churn */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                {t("admin.sales.reports.subscriptionsChart")}
              </h3>
              <div className="space-y-3">
                {monthlyData.map((data) => (
                  <div key={data.month} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--rowi-muted)] w-8">{data.month}</span>
                    <div className="flex-1 h-6 bg-[var(--rowi-muted)]/10 rounded-lg overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(data.subscriptions / 200) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-[var(--rowi-foreground)] w-12 text-right">{data.subscriptions}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-5">
              <h3 className="font-semibold text-[var(--rowi-foreground)] mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                {t("admin.sales.reports.churnChart")}
              </h3>
              <div className="space-y-3">
                {monthlyData.map((data) => (
                  <div key={data.month} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--rowi-muted)] w-8">{data.month}</span>
                    <div className="flex-1 h-6 bg-[var(--rowi-muted)]/10 rounded-lg overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${(data.churn / 10) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-[var(--rowi-foreground)] w-12 text-right">{data.churn}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
            <div className="p-5 border-b border-[var(--rowi-border)]">
              <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.sales.reports.summary")}</h3>
            </div>
            <table className="w-full">
              <thead className="bg-[var(--rowi-muted)]/5">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.sales.reports.month")}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.sales.reports.revenue")}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.sales.reports.subscriptions")}</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[var(--rowi-muted)]">Churn</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-[var(--rowi-muted)]">Net</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data, i) => (
                  <tr key={data.month} className="border-b border-[var(--rowi-border)] last:border-b-0">
                    <td className="px-5 py-3 text-[var(--rowi-foreground)]">{data.month}</td>
                    <td className="px-5 py-3 text-right text-[var(--rowi-foreground)]">${data.revenue.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-[var(--rowi-foreground)]">{data.subscriptions}</td>
                    <td className="px-5 py-3 text-right text-red-500">-{data.churn}</td>
                    <td className="px-5 py-3 text-right text-green-500">+{i > 0 ? data.subscriptions - monthlyData[i - 1].subscriptions - data.churn : data.subscriptions - data.churn}</td>
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
