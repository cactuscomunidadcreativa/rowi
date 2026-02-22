"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Building2,
  Network,
  Layers3,
  HeartHandshake,
  Bot,
  Gauge,
  TrendingUp,
  Activity,
  RefreshCcw,
  Shield,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
  AdminBadge,
} from "@/components/admin/AdminPage";
import { useRowiSEIToast } from "@/components/shared/RowiSEIToast";

/* =========================================================
   Rowi Admin — Dashboard Principal (scope-aware)
========================================================= */

interface DashboardStats {
  users: number;
  tenants: number;
  hubs: number;
  superhubs: number;
  communities: number;
  agents: number;
  tokenUsage: number;
}

interface ScopeInfo {
  type: string;
  id: string | null;
  label: string;
}

export default function AdminDashboard() {
  const { t, ready } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    tenants: 0,
    hubs: 0,
    superhubs: 0,
    communities: 0,
    agents: 0,
    tokenUsage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [scopeInfo, setScopeInfo] = useState<ScopeInfo | null>(null);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard/stats");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error");

      setStats(data.stats);
      setIsSuperAdmin(data.isSuperAdmin);
      setScopeInfo(data.scope);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadStats();
  }, [ready]);

  // Build quick links based on scope
  const allLinks = [
    { href: "/hub/admin/users", icon: Users, labelKey: "admin.nav.users", count: stats.users, color: "from-blue-500 to-blue-600", superOnly: false },
    { href: "/hub/admin/tenants", icon: Building2, labelKey: "admin.nav.tenants", count: stats.tenants, color: "from-green-500 to-green-600", superOnly: true },
    { href: "/hub/admin/hubs", icon: Network, labelKey: "admin.nav.hubs", count: stats.hubs, color: "from-purple-500 to-purple-600", superOnly: false },
    { href: "/hub/admin/superhubs", icon: Layers3, labelKey: "admin.nav.superhubs", count: stats.superhubs, color: "from-orange-500 to-orange-600", superOnly: true },
    { href: "/hub/admin/communities", icon: HeartHandshake, labelKey: "admin.nav.communities", count: stats.communities, color: "from-pink-500 to-pink-600", superOnly: false },
    { href: "/hub/admin/agents", icon: Bot, labelKey: "admin.nav.agents", count: stats.agents, color: "from-cyan-500 to-cyan-600", superOnly: false },
  ];

  const quickLinks = isSuperAdmin ? allLinks : allLinks.filter((l) => !l.superOnly);

  function handleTestSEI() {
    if (typeof RowiSEIToast !== "undefined") {
      RowiSEIToast.show(
        "ky",
        t("admin.dashboard.seiTitle"),
        t("admin.dashboard.seiMessage")
      );
    } else {
      toast.success(t("admin.dashboard.seiTitle"));
    }
  }

  return (
    <AdminPage
      titleKey="admin.dashboard.title"
      descriptionKey="admin.dashboard.description"
      icon={LayoutDashboard}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          {scopeInfo && scopeInfo.type !== "rowiverse" && (
            <AdminBadge variant="info">
              <Shield className="w-3 h-3 mr-1 inline" />
              {scopeInfo.label}
            </AdminBadge>
          )}
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadStats} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block">
              <AdminCard compact className="group hover:scale-[1.02] transition-transform cursor-pointer h-full">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <link.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
                      {link.count.toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--rowi-muted)] truncate">
                      {t(link.labelKey)}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-[var(--rowi-primary)]" />
                  </div>
                </div>
              </AdminCard>
            </Link>
          ))}
        </div>

        {/* Token Usage & Activity */}
        <div className={`grid grid-cols-1 ${isSuperAdmin ? "md:grid-cols-2" : ""} gap-4`}>
          {/* Token Usage Summary */}
          <AdminCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center flex-shrink-0">
                <Gauge className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                  {t("admin.dashboard.tokenUsage")}
                </h3>
                <p className="text-xs text-[var(--rowi-muted)]">
                  {isSuperAdmin ? t("admin.dashboard.totalTokens") : t("admin.dashboard.totalTokens")}
                </p>
              </div>
            </div>

            <div className="text-center py-6">
              <p className="text-4xl font-bold bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] bg-clip-text text-transparent">
                {stats.tokenUsage.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--rowi-muted)] mt-1">
                {t("admin.dashboard.tokensUsed")}
              </p>
            </div>

            <Link href="/hub/admin/tokens" className="block">
              <AdminButton variant="secondary" size="sm" className="w-full">
                {t("admin.dashboard.viewDetails")}
              </AdminButton>
            </Link>
          </AdminCard>

          {/* System Health — SuperAdmin only */}
          {isSuperAdmin && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.dashboard.systemStatus")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.dashboard.allSystems")}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--rowi-muted)]">API</span>
                  <AdminBadge variant="success">{t("admin.dashboard.operational")}</AdminBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--rowi-muted)]">Database</span>
                  <AdminBadge variant="success">{t("admin.dashboard.operational")}</AdminBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--rowi-muted)]">AI Services</span>
                  <AdminBadge variant="success">{t("admin.dashboard.operational")}</AdminBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--rowi-muted)]">Auth</span>
                  <AdminBadge variant="success">{t("admin.dashboard.operational")}</AdminBadge>
                </div>
              </div>

              <Link href="/hub/admin/system-health" className="block mt-4">
                <AdminButton variant="secondary" size="sm" className="w-full">
                  {t("admin.dashboard.viewDetails")}
                </AdminButton>
              </Link>
            </AdminCard>
          )}
        </div>

        {/* Quick Actions */}
        <AdminCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {t("admin.dashboard.quickActions")}
              </h3>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.dashboard.commonTasks")}
              </p>
            </div>
          </div>

          <div className={`grid grid-cols-2 ${isSuperAdmin ? "md:grid-cols-4" : "md:grid-cols-3"} gap-3`}>
            <Link href="/hub/admin/users" className="block">
              <AdminButton variant="secondary" size="sm" icon={Users} className="w-full">
                {t("admin.dashboard.addUser")}
              </AdminButton>
            </Link>
            {isSuperAdmin && (
              <Link href="/hub/admin/tenants" className="block">
                <AdminButton variant="secondary" size="sm" icon={Building2} className="w-full">
                  {t("admin.dashboard.newTenant")}
                </AdminButton>
              </Link>
            )}
            <Link href="/hub/admin/communities" className="block">
              <AdminButton variant="secondary" size="sm" icon={HeartHandshake} className="w-full">
                {t("admin.dashboard.newCommunity")}
              </AdminButton>
            </Link>
            <Link href="/hub/admin/branding" className="block">
              <AdminButton variant="secondary" size="sm" icon={LayoutDashboard} className="w-full">
                {t("admin.dashboard.customizeBrand")}
              </AdminButton>
            </Link>
          </div>
        </AdminCard>
      </div>
    </AdminPage>
  );
}
