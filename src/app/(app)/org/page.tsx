"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Brain,
  Heart,
  TrendingUp,
  AlertTriangle,
  Globe,
  Briefcase,
  ArrowRight,
  Shield,
  Loader2,
  Plus,
  Activity,
  Sparkles,
  Calendar,
  ClipboardCheck,
  Network,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Summary = {
  scope: "personal" | "tenant";
  isSuperAdmin: boolean;
  tenant: { id: string; name: string; slug: string | null } | null;
  activeContextFilter?: { tenantId: string; scopedFrom: number } | null;
  summary: {
    people: { employees: number; activeEmployees: number; members: number; withSEI: number };
    hr: { pendingLeaves: number; openReviews: number };
    eq: { avgOverall: number | null; avgK: number | null; avgC: number | null; avgG: number | null };
    workspaces: {
      total: number;
      active: number;
      orphanMembers?: number;
      recent: Array<{
        id: string;
        name: string;
        description: string | null;
        workspaceType: string | null;
        projectStatus: string | null;
        createdAt: string;
        _count: { communityMembers: number };
      }>;
    };
    diversity: {
      brainStyles: Array<{ style: string; count: number }>;
      countries: Array<{ country: string; count: number }>;
    };
    alerts: { open: number; critical: number };
    activity: { snapshotsLast30Days: number };
    hubs: {
      total: number;
      recent: Array<{
        id: string;
        name: string;
        slug: string | null;
        description: string | null;
        _count: {
          memberships: number;
          organizations: number;
          organizationLinks: number;
        };
      }>;
    };
    communities: {
      total: number;
      recent: Array<{
        id: string;
        name: string;
        slug: string | null;
        description: string | null;
        type: string | null;
        createdAt: string;
      }>;
    };
    affinity: { profiles: number; snapshots: number };
  } | null;
};

export default function OrganizationHubPage() {
  const { t } = useI18n();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/org/summary");
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "Error");
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  if (data.scope === "personal" || !data.tenant || !data.summary) {
    return (
      <div className="min-h-screen py-8 px-4 max-w-3xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {t("org.noTenant.title", "Aún no perteneces a una organización")}
          </h1>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {t(
              "org.noTenant.description",
              "Crea un workspace o pide a un admin que te añada a una organización para ver su hub.",
            )}
          </p>
          <Link
            href="/workspace/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-semibold rounded-xl"
          >
            <Plus className="w-5 h-5" />
            {t("workspace.list.createFirst", "Crear primer workspace")}
          </Link>
        </div>
      </div>
    );
  }

  const s = data.summary;

  return (
    <div className="min-h-screen py-8 px-4 max-w-7xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 rounded-3xl p-8 md:p-10 text-white shadow-2xl"
      >
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Building2 className="w-64 h-64" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
              {t("org.scope.tenant", "Organización")}
            </span>
            {data.isSuperAdmin && (
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {t("org.superadminBadge", "SuperAdmin")}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{data.tenant.name}</h1>
          <p className="text-white/80 max-w-2xl">
            {t(
              "org.hero.subtitle",
              "Tu organización en Rowi — métricas en vivo, equipos y bienestar emocional unificados.",
            )}
          </p>
          {data.activeContextFilter && data.activeContextFilter.scopedFrom > 1 && (
            <p className="mt-3 text-xs text-white/90 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm">
              <span>
                {t(
                  "org.activeContextFilter",
                  "Filtrado por contexto activo",
                )}
              </span>
              <span className="opacity-70">
                ({data.activeContextFilter.scopedFrom}{" "}
                {t("org.accessibleTenants", "tenants accesibles")})
              </span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          gradient="from-blue-500 to-cyan-600"
          label={t("org.stats.people", "Personas")}
          value={s.people.members + s.people.employees}
          sub={`${s.people.withSEI} ${t("org.stats.withSEI", "con SEI")}`}
        />
        <StatCard
          icon={Brain}
          gradient="from-violet-500 to-purple-600"
          label={t("org.stats.avgEQ", "EQ promedio")}
          value={s.eq.avgOverall ?? "—"}
          sub={
            s.eq.avgK != null
              ? `K ${s.eq.avgK} · C ${s.eq.avgC} · G ${s.eq.avgG}`
              : t("org.stats.noSEI", "Sin datos SEI")
          }
        />
        <StatCard
          icon={Briefcase}
          gradient="from-emerald-500 to-green-600"
          label={t("org.stats.workspaces", "Workspaces")}
          value={s.workspaces.total}
          sub={`${s.workspaces.active} ${t("org.stats.active", "activos")}`}
        />
        <StatCard
          icon={AlertTriangle}
          gradient={
            s.alerts.critical > 0
              ? "from-red-500 to-rose-600"
              : "from-amber-500 to-orange-600"
          }
          label={t("org.stats.openAlerts", "Alertas abiertas")}
          value={s.alerts.open}
          sub={
            s.alerts.critical > 0
              ? `${s.alerts.critical} ${t("org.stats.critical", "críticas")}`
              : t("org.stats.allCalm", "Todo en calma")
          }
          highlight={s.alerts.critical > 0}
        />
      </div>

      {/* Workspaces */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[var(--rowi-g2)]" />
            {t("org.workspaces.title", "Workspaces de la organización")}
          </h2>
          <div className="flex items-center gap-2">
            <Link
              href="/workspace"
              className="text-sm text-[var(--rowi-g2)] hover:underline inline-flex items-center gap-1"
            >
              {t("hr.viewAll", "Ver todos")}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/workspace/new"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-xs font-semibold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("workspace.nav.new", "Nuevo")}
            </Link>
          </div>
        </div>
        {(s.workspaces.orphanMembers ?? 0) > 0 && (
          <div className="mb-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {s.workspaces.orphanMembers}{" "}
                {t(
                  "org.workspaces.orphanTitle",
                  "miembros sin workspace asignado",
                )}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                {t(
                  "org.workspaces.orphanHint",
                  "Estos contactos están en tu organización pero no pertenecen a ningún workspace. Crea uno y asígnalos, o muévelos desde el admin.",
                )}
              </p>
            </div>
            <Link
              href="/hub/admin/community-members/orphans"
              className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap"
            >
              {t("org.workspaces.orphanAction", "Resolver →")}
            </Link>
          </div>
        )}
        {s.workspaces.recent.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700 p-10 text-center">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              {t(
                "org.workspaces.empty",
                "Aún no hay workspaces. Crea el primero para empezar a medir.",
              )}
            </p>
            <Link
              href="/workspace/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-semibold rounded-lg"
            >
              <Plus className="w-4 h-4" />
              {t("workspace.list.createFirst", "Crear primer workspace")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {s.workspaces.recent.map((ws, i) => (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/workspace/${ws.id}`}
                  className="block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 hover:border-[var(--rowi-g2)] hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    {ws.workspaceType && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400">
                        {ws.workspaceType.replace("_", " ").toLowerCase()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mt-2 group-hover:text-[var(--rowi-g2)] transition-colors">
                    {ws.name}
                  </h3>
                  {ws.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {ws.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-zinc-800 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {ws._count.communityMembers}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Hubs section — surfaces the org unit container so users can see the
          hierarchy: tenant → hubs → workspaces → members. */}
      {s.hubs.total > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Network className="w-5 h-5 text-[var(--rowi-g2)]" />
              {t("org.hubs.title", "Hubs")}
              <span className="text-sm font-normal text-gray-500">
                · {s.hubs.total}
              </span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {s.hubs.recent.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center mb-3">
                  <Network className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {h.name}
                </h3>
                {h.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {h.description}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-3 mt-3 border-t border-gray-100 dark:border-zinc-800 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {h._count.memberships}
                  </span>
                  <span>·</span>
                  <span>
                    {h._count.organizations + h._count.organizationLinks}{" "}
                    {t("org.hubs.orgs", "orgs")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Communities (non-workspace RowiCommunity) — separated so people can
          tell apart projects (workspaces) from broader social communities. */}
      {s.communities.total > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--rowi-g2)]" />
              {t("org.communities.title", "Comunidades")}
              <span className="text-sm font-normal text-gray-500">
                · {s.communities.total}
              </span>
            </h2>
            <Link
              href="/community"
              className="text-sm text-[var(--rowi-g2)] hover:underline inline-flex items-center gap-1"
            >
              {t("hr.viewAll", "Ver todas")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {s.communities.recent.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {c.name}
                </h3>
                {c.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {c.description}
                  </p>
                )}
                {c.type && (
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-2">
                    {c.type}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Affinity quick surface — relational health is a first-class part of
          the hub, not buried in admin. */}
      <Link
        href="/affinity"
        className="block bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-200/40 dark:border-rose-700/30 rounded-2xl p-5 hover:border-[var(--rowi-g2)] transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("org.affinity.title", "Afinidad cerebral")}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {s.affinity.profiles}{" "}
              {t("org.affinity.profiles", "perfiles")} ·{" "}
              {s.affinity.snapshots}{" "}
              {t("org.affinity.snapshots", "snapshots")}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--rowi-g2)] group-hover:translate-x-1 transition-all" />
        </div>
      </Link>

      {/* HR + Activity row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/hr"
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 hover:border-[var(--rowi-g2)] hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {s.hr.pendingLeaves}
            </span>
          </div>
          <h3 className="font-semibold group-hover:text-[var(--rowi-g2)] transition-colors">
            {t("org.hr.pendingLeavesTitle", "Ausencias pendientes")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("org.hr.tapToReview", "Toca para revisar →")}
          </p>
        </Link>

        <Link
          href="/hr"
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 hover:border-[var(--rowi-g2)] hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {s.hr.openReviews}
            </span>
          </div>
          <h3 className="font-semibold group-hover:text-[var(--rowi-g2)] transition-colors">
            {t("org.hr.openReviewsTitle", "Reviews abiertas")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("org.hr.tapToReview", "Toca para revisar →")}
          </p>
        </Link>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {s.activity.snapshotsLast30Days}
            </span>
          </div>
          <h3 className="font-semibold">
            {t("org.activity.snapshotsTitle", "Snapshots últimos 30 días")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("org.activity.sampleHint", "Pulso emocional reciente")}
          </p>
        </div>
      </div>

      {/* Diversity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-pink-500" />
            {t("org.brainStyles.title", "Distribución de estilos cerebrales")}
          </h2>
          {s.diversity.brainStyles.length === 0 ? (
            <p className="text-xs text-gray-500">
              {t(
                "org.brainStyles.empty",
                "Sin datos. Importa miembros para ver el mix.",
              )}
            </p>
          ) : (
            <div className="space-y-2">
              {(() => {
                const total = s.diversity.brainStyles.reduce(
                  (acc, b) => acc + b.count,
                  0,
                );
                return s.diversity.brainStyles.map((b) => {
                  const pct = Math.round((b.count / total) * 100);
                  return (
                    <div key={b.style}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{b.style}</span>
                        <span className="text-gray-500 tabular-nums">
                          {b.count} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-500"
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-blue-500" />
            {t("org.countries.title", "Países")}
          </h2>
          {s.diversity.countries.length === 0 ? (
            <p className="text-xs text-gray-500">
              {t(
                "org.countries.empty",
                "Sin datos geográficos todavía.",
              )}
            </p>
          ) : (
            <div className="space-y-2">
              {(() => {
                const total = s.diversity.countries.reduce(
                  (acc, c) => acc + c.count,
                  0,
                );
                return s.diversity.countries.map((c) => {
                  const pct = Math.round((c.count / total) * 100);
                  return (
                    <div key={c.country}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{c.country}</span>
                        <span className="text-gray-500 tabular-nums">
                          {c.count} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </section>
      </div>

      {/* Footer CTA — superadmin nudge to global */}
      {data.isSuperAdmin && (
        <div className="bg-gradient-to-r from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[var(--rowi-g2)]" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("org.superadminCta.title", "Eres SuperAdmin")}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t(
                  "org.superadminCta.subtitle",
                  "Esto es solo tu tenant. ¿Quieres ver toda la plataforma?",
                )}
              </p>
            </div>
          </div>
          <Link
            href="/hub/admin/inventory"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-semibold rounded-lg hover:opacity-90"
          >
            {t("org.superadminCta.cta", "Ir al admin global")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  gradient,
  label,
  value,
  sub,
  highlight,
}: {
  icon: typeof Users;
  gradient: string;
  label: string;
  value: number | string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-zinc-900 rounded-2xl border p-5 ${
        highlight
          ? "border-amber-300 dark:border-amber-700"
          : "border-gray-200 dark:border-zinc-800"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center mb-3`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">{label}</p>
      {sub && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
          {sub}
        </p>
      )}
    </motion.div>
  );
}
