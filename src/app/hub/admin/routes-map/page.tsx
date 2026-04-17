"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Map,
  LayoutDashboard,
  Users,
  Briefcase,
  Heart,
  BarChart3,
  Bot,
  Building2,
  Globe,
  CalendarCheck,
  Satellite,
  GraduationCap,
  FlaskConical,
  Shield,
  ExternalLink,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Route = { href: string; label: string; description?: string; icon: any };

export default function RoutesMapPage() {
  const { t } = useI18n();

  const SECTIONS: Array<{ title: string; icon: any; routes: Route[] }> = [
    {
      title: t("admin.routesMap.userApp", "User App (authenticated)"),
      icon: LayoutDashboard,
      routes: [
        { href: "/dashboard", label: "/dashboard", description: t("admin.routesMap.dashboard", "Personal EQ dashboard"), icon: LayoutDashboard },
        { href: "/workspace", label: "/workspace", description: t("admin.routesMap.workspaceList", "List of workspaces"), icon: Briefcase },
        { href: "/workspace/new", label: "/workspace/new", description: t("admin.routesMap.workspaceNew", "Create new workspace"), icon: Briefcase },
        { href: "/community", label: "/community", description: t("admin.routesMap.community", "Social community"), icon: Users },
        { href: "/weekflow", label: "/weekflow", description: t("admin.routesMap.weekflow", "Weekly flow + tasks"), icon: CalendarCheck },
        { href: "/affinity", label: "/affinity", description: t("admin.routesMap.affinity", "Brain affinity"), icon: Heart },
        { href: "/benchmark", label: "/benchmark", description: t("admin.routesMap.benchmark", "Benchmark insights"), icon: BarChart3 },
        { href: "/eco", label: "/eco", description: t("admin.routesMap.eco", "Emotional communication optimizer"), icon: Satellite },
        { href: "/rowi", label: "/rowi", description: t("admin.routesMap.rowi", "Rowi AI Coach (personal)"), icon: Bot },
        { href: "/research", label: "/research", description: t("admin.routesMap.research", "Research center"), icon: FlaskConical },
      ],
    },
    {
      title: t("admin.routesMap.workspaceModules", "Workspace modules (per workspace)"),
      icon: Briefcase,
      routes: [
        { href: "/workspace", label: "/workspace/[id]/dashboard", description: t("admin.routesMap.wsDashboard", "Group EQ dashboard"), icon: LayoutDashboard },
        { href: "/workspace", label: "/workspace/[id]/members", description: t("admin.routesMap.wsMembers", "Members + CSV upload + invitations"), icon: Users },
        { href: "/workspace", label: "/workspace/[id]/benchmark", description: t("admin.routesMap.wsBenchmark", "Group benchmark vs global"), icon: BarChart3 },
        { href: "/workspace", label: "/workspace/[id]/affinity", description: t("admin.routesMap.wsAffinity", "Brain style distribution"), icon: Heart },
        { href: "/workspace", label: "/workspace/[id]/coach", description: t("admin.routesMap.wsCoach", "AI coach with workspace context"), icon: Bot },
        { href: "/workspace", label: "/workspace/[id]/people", description: t("admin.routesMap.wsPeople", "1v1 member comparator"), icon: Users },
        { href: "/workspace", label: "/workspace/[id]/teams", description: t("admin.routesMap.wsTeams", "Sub-groups analytics"), icon: Users },
        { href: "/workspace", label: "/workspace/[id]/selection", description: t("admin.routesMap.wsSelection", "Personnel selection ranking"), icon: Users },
        { href: "/workspace", label: "/workspace/[id]/evolution", description: t("admin.routesMap.wsEvolution", "Longitudinal tracking"), icon: BarChart3 },
        { href: "/workspace", label: "/workspace/[id]/world", description: t("admin.routesMap.wsWorld", "Geographic distribution"), icon: Globe },
        { href: "/workspace", label: "/workspace/[id]/notes", description: t("admin.routesMap.wsNotes", "Private coach journal"), icon: BarChart3 },
        { href: "/workspace", label: "/workspace/[id]/plans", description: t("admin.routesMap.wsPlans", "Development plans per member"), icon: BarChart3 },
        { href: "/workspace", label: "/workspace/[id]/insights", description: t("admin.routesMap.wsInsights", "AI-generated insights"), icon: BarChart3 },
        { href: "/workspace", label: "/workspace/[id]/campaigns", description: t("admin.routesMap.wsCampaigns", "SEI re-assessment cycles"), icon: CalendarCheck },
        { href: "/workspace", label: "/workspace/[id]/alerts", description: t("admin.routesMap.wsAlerts", "Smart anomaly alerts"), icon: BarChart3 },
        { href: "/workspace", label: "/workspace/[id]/client-portal", description: t("admin.routesMap.wsClient", "Readonly client portal"), icon: Globe },
        { href: "/workspace", label: "/workspace/[id]/reports", description: t("admin.routesMap.wsReports", "Export reports"), icon: BarChart3 },
        { href: "/workspace", label: "/workspace/[id]/settings", description: t("admin.routesMap.wsSettings", "Workspace config"), icon: Shield },
      ],
    },
    {
      title: t("admin.routesMap.quickRedirects", "Quick redirects (by role)"),
      icon: ExternalLink,
      routes: [
        { href: "/coaching", label: "/coaching", description: "→ /workspace?type=COACHING", icon: Bot },
        { href: "/clients", label: "/clients", description: "→ /workspace?type=CONSULTING", icon: Briefcase },
        { href: "/hr", label: "/hr", description: "→ /workspace?type=HR_COHORT", icon: Building2 },
        { href: "/team", label: "/team", description: "→ /workspace?type=TEAM_UNIT", icon: Users },
        { href: "/reports", label: "/reports", description: "→ /hub/admin", icon: BarChart3 },
        { href: "/finance", label: "/finance", description: "→ /hub/admin/accounting/accounts", icon: BarChart3 },
      ],
    },
    {
      title: t("admin.routesMap.adminHub", "Admin Hub (SUPERADMIN/ADMIN)"),
      icon: Shield,
      routes: [
        { href: "/hub/admin", label: "/hub/admin", description: t("admin.routesMap.adminDashboard", "Admin dashboard"), icon: LayoutDashboard },
        { href: "/hub/admin/users", label: "/hub/admin/users", description: t("admin.routesMap.users", "All users"), icon: Users },
        { href: "/hub/admin/user-roles", label: "/hub/admin/user-roles", description: t("admin.routesMap.userRoles", "Assign global roles"), icon: Shield },
        { href: "/hub/admin/communities", label: "/hub/admin/communities", description: t("admin.routesMap.communities", "All communities"), icon: Heart },
        { href: "/hub/admin/benchmarks", label: "/hub/admin/benchmarks", description: t("admin.routesMap.benchmarks", "Benchmarks library"), icon: BarChart3 },
        { href: "/hub/admin/tp", label: "/hub/admin/tp", description: t("admin.routesMap.tp", "TP demo (reference)"), icon: Building2 },
        { href: "/hub/admin/hr/employees", label: "/hub/admin/hr", description: t("admin.routesMap.hrAdmin", "HR admin (payroll, leaves, etc)"), icon: Building2 },
        { href: "/hub/admin/elearning", label: "/hub/admin/elearning", description: t("admin.routesMap.elearning", "E-Learning management"), icon: GraduationCap },
        { href: "/hub/admin/gamification", label: "/hub/admin/gamification", description: t("admin.routesMap.gamification", "Points, badges, streaks"), icon: BarChart3 },
        { href: "/hub/admin/tenants", label: "/hub/admin/tenants", description: t("admin.routesMap.tenants", "Multi-tenant structure"), icon: Building2 },
      ],
    },
    {
      title: t("admin.routesMap.public", "Public site"),
      icon: Globe,
      routes: [
        { href: "/", label: "/", description: t("admin.routesMap.landing", "Landing page"), icon: Globe },
        { href: "/how-it-works", label: "/how-it-works", description: t("admin.routesMap.howItWorks", "How Rowi works"), icon: Globe },
        { href: "/pricing", label: "/pricing", description: t("admin.routesMap.pricing", "Plans & pricing"), icon: Globe },
        { href: "/demo", label: "/demo", description: t("admin.routesMap.demo", "Interactive demos"), icon: Globe },
        { href: "/register", label: "/register", description: t("admin.routesMap.register", "Create account"), icon: Globe },
        { href: "/signin", label: "/signin", description: t("admin.routesMap.signin", "Sign in"), icon: Globe },
      ],
    },
  ];

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Map className="w-7 h-7 text-[var(--rowi-g2)]" />
          {t("admin.routesMap.title", "Routes Map")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("admin.routesMap.subtitle", "All available views and where to find them")}
        </p>
      </div>

      {SECTIONS.map((section, i) => {
        const SectionIcon = section.icon;
        return (
          <motion.section
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden"
          >
            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-2">
              <SectionIcon className="w-5 h-5 text-[var(--rowi-g2)]" />
              <h2 className="font-semibold">{section.title}</h2>
              <span className="ml-auto text-xs text-gray-500">
                {section.routes.length} {t("admin.routesMap.routes", "routes")}
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              {section.routes.map((r, ri) => {
                const RouteIcon = r.icon;
                return (
                  <Link
                    key={ri}
                    href={r.href}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 group"
                  >
                    <RouteIcon className="w-4 h-4 text-gray-400 group-hover:text-[var(--rowi-g2)]" />
                    <code className="text-xs font-mono text-[var(--rowi-g2)]">
                      {r.label}
                    </code>
                    {r.description && (
                      <span className="text-xs text-gray-500 ml-2 truncate flex-1">
                        — {r.description}
                      </span>
                    )}
                    <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
                  </Link>
                );
              })}
            </div>
          </motion.section>
        );
      })}
    </main>
  );
}
