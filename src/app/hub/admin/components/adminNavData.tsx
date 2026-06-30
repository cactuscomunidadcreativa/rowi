/**
 * Estructura de navegación del Admin (data pura, compartida).
 *
 * Fuente única de verdad del menú admin: la consume el Sidebar (árbol) y el
 * buscador ⌘K (índice plano vía flattenAdminNav). Mantener aquí cualquier
 * cambio de rutas/secciones → el buscador queda sincronizado solo.
 */
import {
  Globe2, Layers3, Network, Building2, Building, Users, FolderKanban, ShieldCheck, Gauge,
  Puzzle, MessageSquareCode, BookOpenCheck, Bot,
  Brain, LineChart, FileText, BarChart3, TrendingUp, Target, Activity,
  Coins, Scale, Receipt, FileSpreadsheet, ClipboardList, ShoppingCart, Wallet,
  CreditCard, Briefcase, Package, ChartPie,
  Calendar, CalendarCheck, ClipboardCheck, Clock, Ticket,
  GraduationCap, BookOpen, Users2,
  Zap, Workflow,
  Settings2, Bell, Database,
  Blocks, PanelLeft, Palette,
  HeartHandshake, Languages,
  LucideIcon, LayoutDashboard, Wrench, GitCompareArrows, Award, Sparkles,
  Link2, Earth, Upload, Settings, Trophy, Medal, Star, Flame,
  Heart, UserCheck, Mail, Gift, Crown,
  Shield, GitBranch, KeyRound,
  Handshake, Rss, MessageCircle, Boxes,
  AlertTriangle, Theater, CheckSquare,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  badge?: string;
  /** Fecha (YYYY-MM-DD) desde la que el badge "NEW" es válido (caduca por TTL). */
  newSince?: string;
  children?: NavItem[];
  /** True si solo se muestra a admins de plataforma (rowiverse/superhub). */
  superOnly?: boolean;
  /** Si se define, se muestra cuando el usuario tiene esta capability. */
  capability?: string;
}

export interface NavSection {
  titleKey: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Dominio de nivel superior (auditoría: 8 dominios). Para agrupar/buscar. */
  domainKey?: string;
  priority?: number; // legacy: mayor = más arriba
  superOnly?: boolean;
  capability?: string;
}

export const ADMIN_SECTIONS: NavSection[] = [
  {
    titleKey: "admin.nav.main",
    icon: LayoutDashboard,
    priority: 100,
    items: [
      { href: "/hub/admin", labelKey: "admin.nav.dashboard", icon: LayoutDashboard },
      { href: "/hub/admin/ceo", labelKey: "admin.nav.ceo", icon: Activity },
      { href: "/hub/admin/inventory", labelKey: "admin.nav.inventory", icon: Boxes },
      { href: "/hub/admin/routes-map", labelKey: "admin.nav.routesMap", icon: Network },
      { href: "/hub/admin/user-roles", labelKey: "admin.nav.userRoles", icon: Shield },
      { href: "/hub/admin/users", labelKey: "admin.nav.users", icon: Users },
      { href: "/hub/admin/communities", labelKey: "admin.nav.communities", icon: HeartHandshake },
    ],
  },
  {
    titleKey: "admin.nav.workspaces",
    icon: Briefcase,
    priority: 97,
    items: [
      { href: "/hub/admin/workspaces", labelKey: "admin.nav.workspacesAll", icon: Briefcase },
      { href: "/workspace/new", labelKey: "admin.nav.workspaceNew", icon: Sparkles },
      { href: "/hub/admin/workspaces?type=COACHING", labelKey: "admin.nav.workspaceCoaching", icon: Target },
      { href: "/hub/admin/workspaces?type=SELECTION", labelKey: "admin.nav.workspaceSelection", icon: UserCheck },
      { href: "/hub/admin/hiring", labelKey: "admin.nav.hiring", icon: Target, capability: "consultant.hiring" },
      { href: "/hub/admin/workspaces?type=TEAM_UNIT", labelKey: "admin.nav.workspaceTeam", icon: Users2 },
      { href: "/hub/admin/workspaces?type=HR_COHORT", labelKey: "admin.nav.workspaceHr", icon: Building2 },
      { href: "/hub/admin/workspaces?type=CONSULTING", labelKey: "admin.nav.workspaceConsulting", icon: Briefcase },
      { href: "/hub/admin/workspaces?type=MENTORING", labelKey: "admin.nav.workspaceMentoring", icon: HeartHandshake },
    ],
  },
  {
    titleKey: "admin.nav.tpDemo",
    icon: Building2,
    priority: 96,
    capability: "tp.dashboard",
    items: [
      { href: "/hub/admin/tp", labelKey: "admin.nav.tpHub", icon: Building2, badge: "HUB" },
      {
        href: "/hub/admin/tp/dashboard",
        labelKey: "admin.nav.tpDashboard",
        icon: LayoutDashboard,
        children: [
          { href: "/hub/admin/tp/dashboard", labelKey: "admin.nav.tpEQDashboard", icon: LayoutDashboard },
          { href: "/hub/admin/tp/benchmark", labelKey: "admin.nav.tpBenchmark", icon: BarChart3 },
        ],
      },
      { href: "/hub/admin/tp/affinity", labelKey: "admin.nav.tpAffinity", icon: Heart },
      { href: "/hub/admin/tp/eco", labelKey: "admin.nav.tpECO", icon: MessageSquareCode },
      { href: "/hub/admin/tp/coach", labelKey: "admin.nav.tpCoach", icon: Bot },
      { href: "/hub/admin/tp/community", labelKey: "admin.nav.tpCommunity", icon: HeartHandshake },
      { href: "/hub/admin/tp/onboarding", labelKey: "admin.nav.tpOnboarding", icon: GraduationCap },
      { href: "/hub/admin/tp/people", labelKey: "admin.nav.tpPeople", icon: GitCompareArrows },
      { href: "/hub/admin/tp/teams", labelKey: "admin.nav.tpTeams", icon: Users2 },
      { href: "/hub/admin/tp/selection", labelKey: "admin.nav.tpSelection", icon: UserCheck },
      { href: "/hub/admin/tp/evolution", labelKey: "admin.nav.tpEvolution", icon: TrendingUp },
      { href: "/hub/admin/tp/roi", labelKey: "admin.nav.tpROI", icon: Target },
      { href: "/hub/admin/tp/world", labelKey: "admin.nav.tpWorld", icon: Globe2 },
      { href: "/hub/admin/tp/alerts", labelKey: "admin.nav.tpAlerts", icon: Bell },
      { href: "/hub/admin/tp/data-quality", labelKey: "admin.nav.tpDataQuality", icon: Database },
    ],
  },
  {
    titleKey: "admin.nav.eq",
    icon: Brain,
    priority: 95,
    items: [
      { href: "/hub/admin/eq", labelKey: "admin.nav.eqPanel", icon: LayoutDashboard },
      { href: "/hub/admin/eq/dashboard", labelKey: "admin.nav.eqDashboard", icon: LineChart },
      { href: "/hub/admin/eq-upload", labelKey: "admin.nav.eqUpload", icon: Upload },
      { href: "/hub/admin/eq/snapshots", labelKey: "admin.nav.eqSnapshots", icon: Brain },
      { href: "/hub/admin/eq/progress", labelKey: "admin.nav.eqProgress", icon: BarChart3 },
      { href: "/hub/admin/eq/insights", labelKey: "admin.nav.eqInsights", icon: FileText },
      { href: "/hub/admin/emotions", labelKey: "admin.nav.emotions", icon: Heart },
      { href: "/hub/admin/vital-signs/benchmarks", labelKey: "admin.nav.vsBenchmark", icon: BarChart3, superOnly: true },
      { href: "/hub/admin/vital-signs/cross-instrument", labelKey: "admin.nav.vsSeiCross", icon: GitCompareArrows, superOnly: true },
      { href: "/hub/admin/vital-signs/report", labelKey: "admin.nav.vsConsultantReport", icon: FileText, capability: "consultant.cross" },
      { href: "/hub/admin/eco", labelKey: "admin.nav.ecoEvents", icon: Heart },
    ],
  },
  {
    titleKey: "admin.nav.social",
    icon: Users2,
    priority: 91,
    items: [
      { href: "/hub/admin/social", labelKey: "admin.nav.socialDashboard", icon: LayoutDashboard },
      { href: "/hub/admin/social/connections", labelKey: "admin.nav.socialConnections", icon: Handshake },
      { href: "/hub/admin/social/feed", labelKey: "admin.nav.socialFeed", icon: Rss },
      { href: "/hub/admin/social/goals", labelKey: "admin.nav.socialGoals", icon: Target },
      { href: "/social/messages", labelKey: "admin.nav.socialMessages", icon: MessageCircle },
      { href: "/hub/admin/social/forums", labelKey: "admin.nav.socialForums", icon: MessageSquareCode },
      { href: "/hub/admin/social/moderation", labelKey: "admin.nav.socialModeration", icon: ShieldCheck },
    ],
  },
  {
    titleKey: "admin.nav.gamification",
    icon: Trophy,
    priority: 90,
    items: [
      { href: "/hub/admin/gamification", labelKey: "admin.nav.gamificationDashboard", icon: Trophy },
      { href: "/hub/admin/gamification/achievements", labelKey: "admin.nav.achievements", icon: Medal },
      { href: "/hub/admin/gamification/levels", labelKey: "admin.nav.levels", icon: Star },
      { href: "/hub/admin/gamification/streaks", labelKey: "admin.nav.streaks", icon: Flame },
      { href: "/hub/admin/gamification/leaderboards", labelKey: "admin.nav.leaderboards", icon: Crown },
      { href: "/hub/admin/gamification/rewards", labelKey: "admin.nav.rewards", icon: Gift },
    ],
  },
  {
    titleKey: "admin.nav.productivity",
    icon: CheckSquare,
    priority: 89,
    items: [
      { href: "/hub/admin/tasks", labelKey: "admin.nav.tasksDashboard", icon: CheckSquare, superOnly: true },
      { href: "/hub/admin/tasks/settings", labelKey: "admin.nav.tasksSettings", icon: Settings, superOnly: true },
      { href: "/hub/admin/weekflow", labelKey: "admin.nav.weekflow", icon: Workflow },
      { href: "/hub/admin/weekflow/settings", labelKey: "admin.nav.weekflowSettings", icon: Settings },
    ],
  },
  {
    titleKey: "admin.nav.elearning",
    icon: BookOpen,
    priority: 88,
    items: [
      { href: "/hub/admin/elearning", labelKey: "admin.nav.elearningDashboard", icon: BookOpen },
      { href: "/hub/admin/elearning/microlearning", labelKey: "admin.nav.microlearning", icon: Zap },
      { href: "/hub/admin/elearning/courses", labelKey: "admin.nav.courses", icon: GraduationCap },
      { href: "/hub/admin/elearning/quizzes", labelKey: "admin.nav.quizzes", icon: Target },
      { href: "/hub/admin/elearning/certificates", labelKey: "admin.nav.certificates", icon: Award },
    ],
  },
  {
    titleKey: "admin.nav.research",
    icon: Target,
    priority: 87,
    items: [
      { href: "/research", labelKey: "admin.nav.researchCenter", icon: Target },
    ],
  },
  {
    titleKey: "admin.nav.sixSeconds",
    icon: Award,
    priority: 85,
    items: [
      { href: "/hub/admin/sei-links", labelKey: "admin.nav.seiLinks", icon: Link2 },
      {
        href: "/hub/admin/benchmarks",
        labelKey: "admin.nav.benchmarks",
        icon: Activity,
        children: [
          { href: "/hub/admin/benchmarks", labelKey: "admin.nav.benchmarksDashboard", icon: LayoutDashboard },
          { href: "/hub/admin/benchmarks/upload", labelKey: "admin.nav.uploadBenchmark", icon: Upload },
          { href: "/hub/admin/benchmarks/compare", labelKey: "admin.nav.compareBenchmarks", icon: GitCompareArrows },
        ],
      },
    ],
  },
  {
    titleKey: "admin.nav.people",
    icon: Users,
    priority: 80,
    items: [
      { href: "/hub/admin/users", labelKey: "admin.nav.users", icon: Users },
      { href: "/hub/admin/roles", labelKey: "admin.nav.roles", icon: ShieldCheck },
      { href: "/hub/admin/memberships", labelKey: "admin.nav.memberships", icon: FolderKanban },
      {
        href: "/hub/admin/communities",
        labelKey: "admin.nav.communities",
        icon: HeartHandshake,
        children: [
          { href: "/hub/admin/communities", labelKey: "admin.nav.communityPanel", icon: Users },
          { href: "/hub/admin/communities/import", labelKey: "admin.nav.importCsv", icon: FileSpreadsheet },
          { href: "/hub/admin/communities/members", labelKey: "admin.nav.members", icon: Users2 },
        ],
      },
      { href: "/hub/admin/members", labelKey: "admin.nav.hubMembers", icon: Users2 },
      { href: "/hub/admin/invites", labelKey: "admin.nav.invites", icon: Mail },
      { href: "/hub/admin/plans", labelKey: "admin.nav.plans", icon: Gauge },
      { href: "/hub/admin/permissions", labelKey: "admin.nav.permissions", icon: Shield },
    ],
  },
  {
    titleKey: "admin.nav.coaching",
    icon: Target,
    priority: 78,
    items: [
      { href: "/hub/admin/coaching", labelKey: "admin.nav.coachNotes", icon: FileText },
      { href: "/hub/admin/coaching/plans", labelKey: "admin.nav.developmentPlans", icon: Target },
      { href: "/hub/admin/coaching/campaigns", labelKey: "admin.nav.assessmentCampaigns", icon: CalendarCheck },
      { href: "/hub/admin/coaching/alerts", labelKey: "admin.nav.smartAlerts", icon: Bell },
      { href: "/hub/admin/coaching/clients", labelKey: "admin.nav.clientAccess", icon: KeyRound },
    ],
  },
  {
    titleKey: "admin.nav.rowiverse",
    icon: Earth,
    priority: 75,
    superOnly: true,
    items: [
      { href: "/hub/admin/rowiverse", labelKey: "admin.nav.rowiverseMap", icon: Globe2 },
      { href: "/hub/admin/rowiverse/contributions", labelKey: "admin.nav.contributions", icon: Upload },
      { href: "/hub/admin/affinity", labelKey: "admin.nav.affinity", icon: Heart },
    ],
  },
  {
    titleKey: "admin.nav.aiAutomation",
    icon: Bot,
    priority: 70,
    superOnly: true,
    items: [
      { href: "/hub/admin/agents", labelKey: "admin.nav.agents", icon: Bot },
      { href: "/hub/admin/knowledge-layer", labelKey: "admin.nav.knowledgeLayer", icon: Brain },
      { href: "/hub/admin/knowledge", labelKey: "admin.nav.knowledgeBase", icon: BookOpenCheck },
      { href: "/hub/admin/scenarios", labelKey: "admin.nav.scenarios", icon: Theater, badge: "NEW", newSince: "2026-06-29" },
      { href: "/hub/admin/insights", labelKey: "admin.nav.insights", icon: Sparkles },
      { href: "/hub/admin/ai/conversations", labelKey: "admin.nav.aiConversations", icon: MessageCircle },
      { href: "/hub/admin/ai/prompts", labelKey: "admin.nav.prompts", icon: MessageSquareCode },
      { href: "/hub/admin/ai/learning", labelKey: "admin.nav.learning", icon: BookOpenCheck },
      { href: "/hub/admin/automation", labelKey: "admin.nav.automationPanel", icon: Workflow },
    ],
  },
  {
    titleKey: "admin.nav.sales",
    icon: CreditCard,
    priority: 65,
    superOnly: true,
    items: [
      { href: "/hub/admin/sales/dashboard", labelKey: "admin.nav.salesDashboard", icon: TrendingUp },
      { href: "/hub/admin/sales/subscriptions", labelKey: "admin.nav.subscriptions", icon: CreditCard },
      { href: "/hub/admin/sales/coupons", labelKey: "admin.nav.coupons", icon: Ticket },
      { href: "/hub/admin/sales/opportunities", labelKey: "admin.nav.opportunities", icon: Briefcase },
      { href: "/hub/admin/sales/clients", labelKey: "admin.nav.clients", icon: Users2 },
      { href: "/hub/admin/sales/products", labelKey: "admin.nav.products", icon: Package },
      { href: "/hub/admin/sales/reports", labelKey: "admin.nav.salesReports", icon: ChartPie },
    ],
  },
  {
    titleKey: "admin.nav.structure",
    icon: Globe2,
    priority: 60,
    superOnly: true,
    items: [
      { href: "/hub/admin/superhubs", labelKey: "admin.nav.superhubs", icon: Layers3 },
      { href: "/hub/admin/hubs", labelKey: "admin.nav.hubs", icon: Network },
      { href: "/hub/admin/tenants", labelKey: "admin.nav.tenants", icon: Building2 },
      {
        href: "/hub/admin/organizations",
        labelKey: "admin.nav.organizations",
        icon: Building,
        children: [
          { href: "/hub/admin/organizations", labelKey: "admin.nav.organizationsList", icon: Building },
          { href: "/hub/admin/organizations/hierarchy", labelKey: "admin.nav.organizationsHierarchy", icon: GitBranch },
        ],
      },
    ],
  },
  {
    titleKey: "admin.nav.branding",
    icon: Palette,
    priority: 55,
    items: [
      { href: "/hub/admin/branding", labelKey: "admin.nav.brandingTheme", icon: Palette },
      { href: "/hub/admin/platform-config", labelKey: "admin.nav.platformConfig", icon: Settings },
      { href: "/hub/admin/translations", labelKey: "admin.nav.translations", icon: Languages },
    ],
  },
  {
    titleKey: "admin.nav.publicSite",
    icon: Globe2,
    priority: 50,
    superOnly: true,
    items: [
      { href: "/hub/admin/landing-builder", labelKey: "admin.nav.landingBuilder", icon: Sparkles },
      { href: "/hub/admin/cms", labelKey: "admin.nav.cms", icon: FileText },
      {
        href: "/hub/admin/builder",
        labelKey: "admin.nav.cmsAdvanced",
        icon: Blocks,
        children: [
          { href: "/hub/admin/builder", labelKey: "admin.nav.cmsBuilder", icon: Wrench },
          { href: "/hub/admin/pages", labelKey: "admin.nav.cmsPages", icon: FileText },
          { href: "/hub/admin/layouts", labelKey: "admin.nav.cmsLayouts", icon: PanelLeft },
          { href: "/hub/admin/components", labelKey: "admin.nav.cmsComponents", icon: Puzzle },
        ],
      },
      {
        href: "/hub/admin/public-pages",
        labelKey: "admin.nav.publicPages",
        icon: PanelLeft,
        children: [
          { href: "/hub/admin/public-pages", labelKey: "admin.nav.allPages", icon: FileText },
          { href: "/", labelKey: "admin.nav.pageHome", icon: LayoutDashboard },
          { href: "/pricing", labelKey: "admin.nav.pagePricing", icon: CreditCard },
          { href: "/product/rowi", labelKey: "admin.nav.productRowi", icon: Bot },
          { href: "/product/affinity", labelKey: "admin.nav.productAffinity", icon: HeartHandshake },
        ],
      },
    ],
  },
  {
    titleKey: "admin.nav.education",
    icon: GraduationCap,
    priority: 45,
    items: [
      { href: "/hub/admin/education/courses", labelKey: "admin.nav.courses", icon: BookOpen },
      { href: "/hub/admin/education/enrollments", labelKey: "admin.nav.enrollments", icon: ClipboardList },
      { href: "/hub/admin/education/quizzes", labelKey: "admin.nav.quizzes", icon: FileText },
      { href: "/hub/admin/education/certificates", labelKey: "admin.nav.certificates", icon: Award },
      { href: "/hub/admin/education/study-groups", labelKey: "admin.nav.studyGroups", icon: Users },
    ],
  },
  {
    titleKey: "admin.nav.finance",
    icon: Coins,
    priority: 40,
    items: [
      { href: "/hub/admin/accounting/accounts", labelKey: "admin.nav.accounts", icon: Scale },
      { href: "/hub/admin/accounting/transactions", labelKey: "admin.nav.transactions", icon: Receipt },
      { href: "/hub/admin/accounting/invoices", labelKey: "admin.nav.invoices", icon: FileSpreadsheet },
      { href: "/hub/admin/accounting/purchase-orders", labelKey: "admin.nav.purchaseOrders", icon: ClipboardList },
      { href: "/hub/admin/accounting/sales-orders", labelKey: "admin.nav.salesOrders", icon: ShoppingCart },
      { href: "/hub/admin/accounting/payouts", labelKey: "admin.nav.payouts", icon: Wallet },
      { href: "/hub/admin/accounting/payroll", labelKey: "admin.nav.payroll", icon: Calendar },
      { href: "/hub/admin/accounting/products", labelKey: "admin.nav.products", icon: Package },
      {
        href: "/hub/admin/finance/dashboard",
        labelKey: "admin.nav.financeOps",
        icon: Wallet,
        children: [
          { href: "/hub/admin/finance/dashboard", labelKey: "admin.nav.financeDashboard", icon: LayoutDashboard },
          { href: "/hub/admin/finance/budgets", labelKey: "admin.nav.financeBudgets", icon: Coins },
          { href: "/hub/admin/finance/expenses", labelKey: "admin.nav.financeExpenses", icon: Receipt },
          { href: "/hub/admin/finance/invoices", labelKey: "admin.nav.financeInvoices", icon: FileSpreadsheet },
          { href: "/hub/admin/finance/transactions", labelKey: "admin.nav.financeTransactions", icon: Activity },
        ],
      },
    ],
  },
  {
    titleKey: "admin.nav.hr",
    icon: Briefcase,
    priority: 35,
    items: [
      { href: "/hub/admin/hr/employees", labelKey: "admin.nav.employees", icon: Users },
      { href: "/hub/admin/hr/org-chart", labelKey: "admin.nav.orgChart", icon: Network },
      { href: "/hub/admin/hr/reviews", labelKey: "admin.nav.reviews", icon: ClipboardCheck },
      { href: "/hub/admin/hr/leaves", labelKey: "admin.nav.leaves", icon: Calendar },
      { href: "/hub/admin/hr/time", labelKey: "admin.nav.timeTracking", icon: Clock },
      { href: "/hub/admin/hr/productivity", labelKey: "admin.nav.productivity", icon: BarChart3 },
      { href: "/hub/admin/hr/vital-signs", labelKey: "admin.nav.hrVitalSigns", icon: Activity },
      { href: "/hub/admin/community-members/orphans", labelKey: "admin.nav.orphans", icon: AlertTriangle },
      { href: "/weekflow", labelKey: "admin.nav.weekflow", icon: Workflow },
    ],
  },
  {
    titleKey: "admin.nav.system",
    icon: Wrench,
    priority: 10,
    items: [
      { href: "/hub/admin/settings", labelKey: "admin.nav.settings", icon: Settings2 },
      { href: "/hub/admin/notifications", labelKey: "admin.nav.notifications", icon: Bell },
      { href: "/hub/admin/tokens", labelKey: "admin.nav.tokens", icon: Gauge },
      { href: "/hub/admin/usage", labelKey: "admin.nav.usage", icon: BarChart3 },
      { href: "/hub/admin/reports", labelKey: "admin.nav.reports", icon: FileText },
      { href: "/hub/admin/integrations", labelKey: "admin.nav.integrations", icon: Network },
      { href: "/hub/admin/database", labelKey: "admin.nav.database", icon: Database },
      { href: "/hub/admin/announcements", labelKey: "admin.nav.announcements", icon: Bell },
      { href: "/hub/admin/logs", labelKey: "admin.nav.logs", icon: FileText },
      { href: "/hub/admin/audit", labelKey: "admin.nav.audit", icon: ShieldCheck },
      { href: "/hub/admin/mfa", labelKey: "admin.nav.mfa", icon: KeyRound },
      { href: "/hub/admin/system-health", labelKey: "admin.nav.systemHealth", icon: Activity },
    ],
  },
];

/** Una entrada plana del índice de búsqueda (⌘K). */
export interface FlatNavEntry {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  /** titleKey de la sección a la que pertenece (para el subtítulo del resultado). */
  sectionKey: string;
  superOnly?: boolean;
  capability?: string;
}

/**
 * Aplana ADMIN_SECTIONS a una lista de destinos (incluye children), deduplicada
 * por href. Hereda superOnly/capability de la sección si el item no los define.
 */
export function flattenAdminNav(): FlatNavEntry[] {
  const out: FlatNavEntry[] = [];
  const seen = new Set<string>();
  for (const section of ADMIN_SECTIONS) {
    const push = (item: NavItem) => {
      const key = item.href;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({
          href: item.href,
          labelKey: item.labelKey,
          icon: item.icon,
          sectionKey: section.titleKey,
          superOnly: item.superOnly ?? section.superOnly,
          capability: item.capability ?? section.capability,
        });
      }
      item.children?.forEach(push);
    };
    section.items.forEach(push);
  }
  return out;
}
