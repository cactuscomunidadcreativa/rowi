"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Heart,
  Bot,
  Target,
  TrendingUp,
  Globe,
  MessageSquare,
  FileText,
  Calendar,
  Bell,
  Sparkles,
  Settings,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { WORKSPACE_TEMPLATES, getTemplateByType } from "@/lib/workspace/templates";

type Workspace = {
  id: string;
  name: string;
  description: string | null;
  workspaceType: string | null;
  targetRole: string | null;
  projectStatus: string | null;
  clientOrg?: { id: string; name: string } | null;
  _count: {
    members: number;
    communityMembers: number;
    benchmarks: number;
    coachNotes: number;
    developmentPlans: number;
    campaigns: number;
    workspaceAlerts: number;
  };
};

const MODULE_CONFIG: Record<
  string,
  { icon: any; gradient: string; labelKey: string }
> = {
  dashboard: { icon: LayoutDashboard, gradient: "from-violet-500 to-purple-600", labelKey: "workspace.modules.dashboard" },
  members: { icon: Users, gradient: "from-blue-500 to-cyan-600", labelKey: "workspace.modules.members" },
  benchmark: { icon: BarChart3, gradient: "from-indigo-500 to-blue-600", labelKey: "workspace.modules.benchmark" },
  affinity: { icon: Heart, gradient: "from-pink-500 to-rose-600", labelKey: "workspace.modules.affinity" },
  coach: { icon: Bot, gradient: "from-emerald-500 to-green-600", labelKey: "workspace.modules.coach" },
  people: { icon: Users, gradient: "from-amber-500 to-orange-600", labelKey: "workspace.modules.people" },
  teams: { icon: Users, gradient: "from-teal-500 to-cyan-600", labelKey: "workspace.modules.teams" },
  selection: { icon: Target, gradient: "from-red-500 to-pink-600", labelKey: "workspace.modules.selection" },
  evolution: { icon: TrendingUp, gradient: "from-green-500 to-teal-600", labelKey: "workspace.modules.evolution" },
  world: { icon: Globe, gradient: "from-blue-500 to-indigo-600", labelKey: "workspace.modules.world" },
  notes: { icon: FileText, gradient: "from-yellow-500 to-amber-600", labelKey: "workspace.modules.notes" },
  plans: { icon: Target, gradient: "from-purple-500 to-indigo-600", labelKey: "workspace.modules.plans" },
  campaigns: { icon: Calendar, gradient: "from-rose-500 to-pink-600", labelKey: "workspace.modules.campaigns" },
  alerts: { icon: Bell, gradient: "from-orange-500 to-red-600", labelKey: "workspace.modules.alerts" },
  insights: { icon: Sparkles, gradient: "from-cyan-500 to-blue-600", labelKey: "workspace.modules.insights" },
  reports: { icon: FileText, gradient: "from-gray-500 to-slate-600", labelKey: "workspace.modules.reports" },
  "client-portal": { icon: Globe, gradient: "from-slate-500 to-zinc-600", labelKey: "workspace.modules.clientPortal" },
};

export default function WorkspaceLandingPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t, lang } = useI18n();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workspaces/${communityId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t("workspace.notFound"));
        setWorkspace(data.workspace);
        setRole(data.role);
      } catch (err: any) {
        setError(err.message);
      }
    }
    load();
  }, [communityId, t]);

  const template = workspace?.workspaceType
    ? getTemplateByType(workspace.workspaceType as any)
    : null;
  const modules = template?.modules || ["dashboard", "members"];

  if (error) {
    return (
      <div className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
        <Link
          href="/workspace"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("workspace.nav.my")}
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-700 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  const L = lang as "es" | "en" | "pt" | "it";
  const totalMembers =
    workspace._count.members + workspace._count.communityMembers;

  return (
    <div className="min-h-screen py-8 px-4 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/workspace"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.nav.my")}
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 md:p-8 mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            {template && (
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${template.gradient} flex items-center justify-center text-3xl flex-shrink-0`}
              >
                {template.icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {workspace.name}
              </h1>
              {template && (
                <p className="text-sm text-[var(--rowi-g2)] font-medium mt-1">
                  {template.name[L] ?? template.name.en}
                </p>
              )}
              {workspace.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-2xl">
                  {workspace.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                {workspace.targetRole && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    🎯 {workspace.targetRole}
                  </span>
                )}
                {workspace.clientOrg && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    🏢 {workspace.clientOrg.name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-gray-500">
                  <Users className="w-4 h-4" />
                  {totalMembers} {t("workspace.list.members")}
                </span>
              </div>
            </div>
          </div>
          <Link
            href={`/workspace/${communityId}/settings`}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label={t("workspace.modules.settings")}
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
        </div>
      </motion.div>

      {/* Modules grid */}
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        {t("workspace.landing.getStarted")}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((moduleKey, i) => {
          const config = MODULE_CONFIG[moduleKey];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <motion.div
              key={moduleKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/workspace/${communityId}/${moduleKey}`}
                className="block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 hover:border-[var(--rowi-g2)] hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-r ${config.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[var(--rowi-g2)] transition-colors">
                    {t(config.labelKey)}
                  </h3>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
