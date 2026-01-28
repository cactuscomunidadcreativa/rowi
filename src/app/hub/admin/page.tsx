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
   🌟 Rowi Admin — Dashboard Principal
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
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
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  async function loadStats() {
    setLoading(true);
    try {
      const [users, tenants, hubs, superhubs, communities, agents, usage] = await Promise.all([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/tenants").then((r) => r.json()),
        fetch("/api/hub/hubs").then((r) => r.json()),
        fetch("/api/hub/superhubs").then((r) => r.json()),
        fetch("/api/hub/communities").then((r) => r.json()),
        fetch("/api/admin/agents").then((r) => r.json()),
        fetch("/api/hub/usage/list").then((r) => r.json()),
      ]);

      setStats({
        users: Array.isArray(users) ? users.length : users?.users?.length || 0,
        tenants: Array.isArray(tenants) ? tenants.length : tenants?.tenants?.length || 0,
        hubs: Array.isArray(hubs) ? hubs.length : hubs?.hubs?.length || 0,
        superhubs: Array.isArray(superhubs) ? superhubs.length : superhubs?.superHubs?.length || 0,
        communities: Array.isArray(communities) ? communities.length : 0,
        agents: Array.isArray(agents) ? agents.length : agents?.agents?.length || 0,
        tokenUsage: Array.isArray(usage) ? usage.reduce((sum: number, u: any) => sum + (u.tokensInput || 0) + (u.tokensOutput || 0), 0) : 0,
      });
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadStats();
  }, [ready]);

  const quickLinks = [
    { href: "/hub/admin/users", icon: Users, labelKey: "admin.nav.users", count: stats.users, color: "from-blue-500 to-blue-600" },
    { href: "/hub/admin/tenants", icon: Building2, labelKey: "admin.nav.tenants", count: stats.tenants, color: "from-green-500 to-green-600" },
    { href: "/hub/admin/hubs", icon: Network, labelKey: "admin.nav.hubs", count: stats.hubs, color: "from-purple-500 to-purple-600" },
    { href: "/hub/admin/superhubs", icon: Layers3, labelKey: "admin.nav.superhubs", count: stats.superhubs, color: "from-orange-500 to-orange-600" },
    { href: "/hub/admin/communities", icon: HeartHandshake, labelKey: "admin.nav.communities", count: stats.communities, color: "from-pink-500 to-pink-600" },
    { href: "/hub/admin/agents", icon: Bot, labelKey: "admin.nav.agents", count: stats.agents, color: "from-cyan-500 to-cyan-600" },
  ];

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
        <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadStats} size="sm">
          {t("admin.common.refresh")}
        </AdminButton>
      }
    >
      {/* Quick Stats */}
      <AdminGrid cols={3} className="mb-6">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <AdminCard compact className="group hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-lg`}>
                  <link.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-[var(--rowi-foreground)]">
                    {link.count.toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t(link.labelKey)}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrendingUp className="w-5 h-5 text-[var(--rowi-primary)]" />
                </div>
              </div>
            </AdminCard>
          </Link>
        ))}
      </AdminGrid>

      {/* Token Usage & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Usage Summary */}
        <AdminCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {t("admin.dashboard.tokenUsage")}
              </h3>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.dashboard.totalTokens")}
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

          <Link href="/hub/admin/tokens">
            <AdminButton variant="secondary" size="sm" className="w-full">
              {t("admin.dashboard.viewDetails")}
            </AdminButton>
          </Link>
        </AdminCard>

        {/* System Health */}
        <AdminCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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

          <Link href="/hub/admin/system-health">
            <AdminButton variant="secondary" size="sm" className="w-full mt-4">
              {t("admin.dashboard.viewDetails")}
            </AdminButton>
          </Link>
        </AdminCard>
      </div>

      {/* Quick Actions */}
      <AdminCard className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/hub/admin/users">
            <AdminButton variant="secondary" size="sm" icon={Users} className="w-full">
              {t("admin.dashboard.addUser")}
            </AdminButton>
          </Link>
          <Link href="/hub/admin/tenants">
            <AdminButton variant="secondary" size="sm" icon={Building2} className="w-full">
              {t("admin.dashboard.newTenant")}
            </AdminButton>
          </Link>
          <Link href="/hub/admin/communities">
            <AdminButton variant="secondary" size="sm" icon={HeartHandshake} className="w-full">
              {t("admin.dashboard.newCommunity")}
            </AdminButton>
          </Link>
          <Link href="/hub/admin/branding">
            <AdminButton variant="secondary" size="sm" icon={LayoutDashboard} className="w-full">
              {t("admin.dashboard.customizeBrand")}
            </AdminButton>
          </Link>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
