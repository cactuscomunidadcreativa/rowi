"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  Users,
  CreditCard,
  DollarSign,
  Clock,
  Zap,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Target,
  Gift,
  BarChart3,
  Activity,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   📊 Rowi Admin — Sales Dashboard
   ---------------------------------------------------------
   Overview of sales metrics, subscriptions, and revenue
========================================================= */

interface DashboardData {
  period: string;
  startDate: string;
  endDate: string;
  users: {
    total: number;
    new: number;
    active: number;
    inTrial: number;
    expiringTrials: number;
    byStatus: Array<{ status: string; count: number }>;
    byPlan: Array<{ planId: string; planName: string; priceUsd: number; count: number }>;
  };
  subscriptions: {
    active: number;
    new: number;
    cancelled: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  revenue: {
    totalCents: number;
    totalUsd: number;
    paymentsCount: number;
  };
  sei: {
    pending: number;
    completedInPeriod: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  acquisition: {
    bySource: Array<{ source: string; count: number }>;
    conversions: number;
    conversionRate: number;
  };
  coupons: {
    usedInPeriod: number;
    topCoupons: Array<{ couponId: string; count: number }>;
  };
}

const PERIODS = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "1y", label: "1 año" },
];

export default function SalesDashboardPage() {
  const { t, ready } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales/dashboard?period=${period}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.ok) {
        setData(json);
      } else {
        throw new Error(json.error);
      }
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadDashboard();
  }, [ready, period]);

  return (
    <AdminPage
      titleKey="admin.salesDashboard.title"
      descriptionKey="admin.salesDashboard.description"
      icon={TrendingUp}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-[var(--rowi-surface)] border border-[var(--rowi-border)] rounded-lg overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  period === p.value
                    ? "bg-[var(--rowi-primary)] text-white"
                    : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-background)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <AdminButton
            variant="secondary"
            icon={RefreshCcw}
            onClick={loadDashboard}
            size="sm"
          >
            {t("admin.common.refresh")}
          </AdminButton>
        </div>
      }
    >
      {data && (
        <div className="space-y-6">
          {/* Main Metrics */}
          <AdminGrid cols={4}>
            <MetricCard
              icon={Users}
              label={t("admin.salesDashboard.totalUsers")}
              value={data.users.total}
              subValue={`+${data.users.new} ${t("admin.salesDashboard.new")}`}
              trend="up"
              color="primary"
            />
            <MetricCard
              icon={CreditCard}
              label={t("admin.salesDashboard.activeSubscriptions")}
              value={data.subscriptions.active}
              subValue={`+${data.subscriptions.new} ${t("admin.salesDashboard.new")}`}
              trend="up"
              color="success"
            />
            <MetricCard
              icon={DollarSign}
              label={t("admin.salesDashboard.revenue")}
              value={`$${data.revenue.totalUsd.toLocaleString()}`}
              subValue={`${data.revenue.paymentsCount} ${t("admin.salesDashboard.payments")}`}
              trend="up"
              color="warning"
            />
            <MetricCard
              icon={Percent}
              label={t("admin.salesDashboard.conversionRate")}
              value={`${data.acquisition.conversionRate.toFixed(1)}%`}
              subValue={`${data.acquisition.conversions} ${t("admin.salesDashboard.conversions")}`}
              trend={data.acquisition.conversionRate > 5 ? "up" : "down"}
              color="info"
            />
          </AdminGrid>

          {/* Trial & SEI Metrics */}
          <AdminGrid cols={4}>
            <MetricCard
              icon={Clock}
              label={t("admin.salesDashboard.usersInTrial")}
              value={data.users.inTrial}
              subValue={`${data.users.expiringTrials} ${t("admin.salesDashboard.expiringSoon")}`}
              color="warning"
            />
            <MetricCard
              icon={Activity}
              label={t("admin.salesDashboard.activeUsers")}
              value={data.users.active}
              color="success"
            />
            <MetricCard
              icon={Zap}
              label={t("admin.salesDashboard.pendingSei")}
              value={data.sei.pending}
              subValue={`${data.sei.completedInPeriod} ${t("admin.salesDashboard.completedInPeriod")}`}
              color="info"
            />
            <MetricCard
              icon={Gift}
              label={t("admin.salesDashboard.couponsUsed")}
              value={data.coupons.usedInPeriod}
              color="primary"
            />
          </AdminGrid>

          {/* Details Grid */}
          <AdminGrid cols={3}>
            {/* Users by Status */}
            <AdminCard>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--rowi-primary)]" />
                {t("admin.salesDashboard.usersByStatus")}
              </h3>
              <div className="space-y-2">
                {data.users.byStatus.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[var(--rowi-muted)]">
                      {formatStatus(item.status)}
                    </span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </AdminCard>

            {/* Users by Plan */}
            <AdminCard>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--rowi-primary)]" />
                {t("admin.salesDashboard.usersByPlan")}
              </h3>
              <div className="space-y-2">
                {data.users.byPlan.map((item) => (
                  <div
                    key={item.planId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[var(--rowi-muted)]">
                      {item.planName}
                    </span>
                    <span className="font-medium">
                      {item.count}
                      <span className="text-[var(--rowi-muted)] text-xs ml-1">
                        (${item.priceUsd})
                      </span>
                    </span>
                  </div>
                ))}
                {data.users.byPlan.length === 0 && (
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.salesDashboard.noData")}
                  </p>
                )}
              </div>
            </AdminCard>

            {/* Acquisition Sources */}
            <AdminCard>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--rowi-primary)]" />
                {t("admin.salesDashboard.acquisitionSources")}
              </h3>
              <div className="space-y-2">
                {data.acquisition.bySource.map((item) => (
                  <div
                    key={item.source}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[var(--rowi-muted)]">
                      {item.source}
                    </span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
                {data.acquisition.bySource.length === 0 && (
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.salesDashboard.noData")}
                  </p>
                )}
              </div>
            </AdminCard>
          </AdminGrid>

          {/* Subscriptions & SEI Details */}
          <AdminGrid cols={2}>
            {/* Subscriptions by Status */}
            <AdminCard>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--rowi-primary)]" />
                {t("admin.salesDashboard.subscriptionsByStatus")}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-500">
                    {data.subscriptions.active}
                  </p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.salesDashboard.active")}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-500/10">
                  <p className="text-2xl font-bold text-blue-500">
                    {data.subscriptions.new}
                  </p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.salesDashboard.new")}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-500">
                    {data.subscriptions.cancelled}
                  </p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.salesDashboard.cancelled")}
                  </p>
                </div>
              </div>
            </AdminCard>

            {/* SEI Status */}
            <AdminCard>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--rowi-primary)]" />
                {t("admin.salesDashboard.seiStatus")}
              </h3>
              <div className="space-y-2">
                {data.sei.byStatus.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[var(--rowi-muted)]">
                      {formatStatus(item.status)}
                    </span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </AdminCard>
          </AdminGrid>
        </div>
      )}
    </AdminPage>
  );
}

// =========================================================
// Helper Components
// =========================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = "primary",
}: {
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down";
  color?: "primary" | "success" | "warning" | "info" | "error";
}) {
  const colorClasses = {
    primary: "bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]",
    success: "bg-green-500/10 text-green-500",
    warning: "bg-amber-500/10 text-amber-500",
    info: "bg-blue-500/10 text-blue-500",
    error: "bg-red-500/10 text-red-500",
  };

  return (
    <AdminCard className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className={`flex items-center text-xs ${
              trend === "up" ? "text-green-500" : "text-red-500"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
          {value}
        </p>
        <p className="text-xs text-[var(--rowi-muted)]">{label}</p>
        {subValue && (
          <p className="text-[10px] text-[var(--rowi-muted)] mt-1">
            {subValue}
          </p>
        )}
      </div>
    </AdminCard>
  );
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    REGISTERED: "Registrado",
    PAYMENT_PENDING: "Pago Pendiente",
    ONBOARDING: "Onboarding",
    PENDING_SEI: "Pendiente SEI",
    ACTIVE: "Activo",
    SUSPENDED: "Suspendido",
    TRIAL_EXPIRED: "Trial Expirado",
    CANCELLED: "Cancelado",
    PENDING: "Pendiente",
    SENT: "Enviado",
    IN_PROGRESS: "En Progreso",
    COMPLETED: "Completado",
    EXPIRED: "Expirado",
  };
  return statusMap[status] || status;
}
