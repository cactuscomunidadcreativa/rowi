"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  Calendar,
  ClipboardCheck,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Summary = {
  employees: { total: number; active: number };
  leaves: { pending: number };
  reviews: { open: number; dueSoon: number };
  time: { hoursThisWeek: number };
  productivity: { avgIndex: number | null; avgFocus: number | null };
  hrWorkspaces: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    _count: { communityMembers: number };
  }>;
};

export default function HrLandingPage() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/hr/summary");
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Error");
        setSummary(data.summary);
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

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  const metrics = [
    {
      key: "employees",
      labelKey: "hr.metrics.employees",
      value: summary.employees.total,
      sub: t("hr.metrics.activeCount", "active") +
        ": " + summary.employees.active,
      icon: Users,
      gradient: "from-blue-500 to-cyan-600",
      href: "/hub/admin/hr/employees",
    },
    {
      key: "leaves",
      labelKey: "hr.metrics.pendingLeaves",
      value: summary.leaves.pending,
      sub: t("hr.metrics.requiresAction", "Requires action"),
      icon: Calendar,
      gradient: "from-amber-500 to-orange-600",
      href: "/hub/admin/hr/leaves",
      highlight: summary.leaves.pending > 0,
    },
    {
      key: "reviews",
      labelKey: "hr.metrics.openReviews",
      value: summary.reviews.open,
      sub: `${summary.reviews.dueSoon} ${t("hr.metrics.dueSoon", "due in 14d")}`,
      icon: ClipboardCheck,
      gradient: "from-violet-500 to-purple-600",
      href: "/hub/admin/hr/reviews",
      highlight: summary.reviews.dueSoon > 0,
    },
    {
      key: "time",
      labelKey: "hr.metrics.hoursThisWeek",
      value: summary.time.hoursThisWeek,
      sub: t("hr.metrics.lastSevenDays", "Last 7 days"),
      icon: Clock,
      gradient: "from-emerald-500 to-green-600",
      href: "/hub/admin/hr/time",
    },
    {
      key: "productivity",
      labelKey: "hr.metrics.avgProductivity",
      value: summary.productivity.avgIndex ?? "—",
      sub: summary.productivity.avgFocus != null
        ? `${t("hr.metrics.focus", "Focus")} ${summary.productivity.avgFocus}`
        : t("hr.metrics.noData", "No data"),
      icon: TrendingUp,
      gradient: "from-rose-500 to-pink-600",
      href: "/hub/admin/hr/productivity",
    },
  ];

  return (
    <div className="min-h-screen py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-[var(--rowi-g2)]" />
            <span className="rowi-gradient-text">{t("hr.title", "Recursos humanos")}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t("hr.subtitle", "Métricas, equipos y bienestar emocional en un solo lugar.")}
          </p>
        </div>
        <Link
          href="/workspace/new?template=hr"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {t("hr.newCohort", "Nuevo cohort HR")}
        </Link>
      </motion.div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={m.href}
                className={`block bg-white dark:bg-zinc-900 rounded-2xl border p-5 hover:border-[var(--rowi-g2)] hover:shadow-lg transition-all group ${
                  m.highlight
                    ? "border-amber-300 dark:border-amber-700"
                    : "border-gray-200 dark:border-zinc-800"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-r ${m.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                </p>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                  {t(m.labelKey)}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                  {m.sub}
                </p>
                {m.highlight && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {t("hr.metrics.needsAttention", "Needs attention")}
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* HR workspaces */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t("hr.workspacesTitle", "Cohorts HR")}
        </h2>
        <Link
          href="/workspace?type=HR_COHORT"
          className="text-sm text-[var(--rowi-g2)] hover:underline inline-flex items-center gap-1"
        >
          {t("hr.viewAll", "Ver todos")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {summary.hrWorkspaces.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700 p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-1">
            {t("hr.empty.title", "Aún no hay cohorts HR")}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t(
              "hr.empty.description",
              "Crea un cohort HR para agrupar empleados y medir su bienestar emocional colectivo.",
            )}
          </p>
          <Link
            href="/workspace/new?template=hr"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {t("hr.empty.cta", "Crear primer cohort")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summary.hrWorkspaces.map((ws, i) => (
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
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(ws.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-[var(--rowi-g2)] transition-colors">
                  {ws.name}
                </h3>
                {ws.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {ws.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {ws._count.communityMembers} {t("workspace.list.members")}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
