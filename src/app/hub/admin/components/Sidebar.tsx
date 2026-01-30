"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  Globe2, Layers3, Network, Building2, Building, Users, FolderKanban, ShieldCheck, Gauge,
  Puzzle, MessageSquareCode, BookOpenCheck, Bot,
  Brain, LineChart, FileText, BarChart3, TrendingUp, Target, Activity,
  Coins, Scale, Receipt, FileSpreadsheet, ClipboardList, ShoppingCart, Wallet,
  CreditCard, Briefcase, Package, ChartPie, HardDrive,
  Calendar, ClipboardCheck, Clock,
  GraduationCap, BookOpen, Users2,
  Zap, Workflow,
  Settings2, Bell, Database, SlidersHorizontal,
  Blocks, PanelLeft, Palette,
  ChevronDown, ChevronRight, HeartHandshake, Languages,
  LucideIcon, LayoutDashboard, Wrench, GitCompareArrows, Award, Sparkles,
  Link2, Earth, Upload, Settings, Trophy, Medal, Star, Flame,
  Heart, UserCheck, Mail, Share2, Gift, Crown, BadgeCheck,
  Shield, GitBranch, ToggleRight, KeyRound,
} from "lucide-react";

/* =========================================================
   🌐 Rowi Hub Admin Sidebar — Reorganizado & Bilingüe
   ---------------------------------------------------------
   - Estructura optimizada por frecuencia de uso
   - Secciones core primero, avanzadas después
   - Soporte completo ES/EN
   - Nuevas secciones: Gamificación, EQ Upload
========================================================= */

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavItem[];
}

interface NavSection {
  titleKey: string;
  icon: LucideIcon;
  items: NavItem[];
  priority?: number; // Mayor = más arriba
}

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const sections: NavSection[] = [
    // ═══════════════════════════════════════════════════════
    // 🏠 PRINCIPAL - Lo más usado
    // ═══════════════════════════════════════════════════════
    {
      titleKey: "admin.nav.main",
      icon: LayoutDashboard,
      priority: 100,
      items: [
        { href: "/hub/admin", labelKey: "admin.nav.dashboard", icon: LayoutDashboard },
        { href: "/hub/admin/users", labelKey: "admin.nav.users", icon: Users },
        { href: "/hub/admin/communities", labelKey: "admin.nav.communities", icon: HeartHandshake },
      ],
    },

    // ═══════════════════════════════════════════════════════
    // 💓 INTELIGENCIA EMOCIONAL (Core del producto)
    // ═══════════════════════════════════════════════════════
    {
      titleKey: "admin.nav.eq",
      icon: Brain,
      priority: 95,
      items: [
        { href: "/hub/eq/dashboard", labelKey: "admin.nav.eqDashboard", icon: LineChart },
        { href: "/hub/admin/eq-upload", labelKey: "admin.nav.eqUpload", icon: Upload, badge: "NEW" },
        { href: "/hub/eq/snapshots", labelKey: "admin.nav.eqSnapshots", icon: Brain },
        { href: "/hub/eq/progress", labelKey: "admin.nav.eqProgress", icon: BarChart3 },
        { href: "/hub/eq/insights", labelKey: "admin.nav.eqInsights", icon: FileText },
      ],
    },

    // ═══════════════════════════════════════════════════════
    // 🏆 GAMIFICACIÓN
    // ═══════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════
    // 📚 E-LEARNING
    // ═══════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════
    // 🎯 SIX SECONDS & SEI
    // ═══════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════
    // 👥 PERSONAS & ACCESOS
    // ═══════════════════════════════════════════════════════
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
        { href: "/hub/admin/invites", labelKey: "admin.nav.invites", icon: Mail },
        { href: "/hub/admin/plans", labelKey: "admin.nav.plans", icon: Gauge },
        {
          href: "/hub/admin/permissions",
          labelKey: "admin.nav.permissions",
          icon: Shield,
          badge: "NEW",
          children: [
            { href: "/hub/admin/permissions", labelKey: "admin.nav.permissionsFeatures", icon: ToggleRight },
            { href: "/hub/admin/permissions/roles", labelKey: "admin.nav.permissionsRoles", icon: KeyRound },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════════════
    // 🌐 ROWIVERSE
    // ═══════════════════════════════════════════════════════
    {
      titleKey: "admin.nav.rowiverse",
      icon: Earth,
      priority: 75,
      items: [
        { href: "/hub/admin/rowiverse", labelKey: "admin.nav.rowiverseMap", icon: Globe2 },
        { href: "/hub/admin/rowiverse/contributions", labelKey: "admin.nav.contributions", icon: Upload },
        { href: "/hub/admin/affinity", labelKey: "admin.nav.affinity", icon: Heart },
      ],
    },

    // ═══════════════════════════════════════════════════════
    // 🤖 IA & AUTOMATIZACIÓN
    // ═══════════════════════════════════════════════════════
    {
      titleKey: "admin.nav.aiAutomation",
      icon: Bot,
      priority: 70,
      items: [
        { href: "/hub/admin/agents", labelKey: "admin.nav.agents", icon: Bot },
        { href: "/hub/admin/ai/prompts", labelKey: "admin.nav.prompts", icon: MessageSquareCode },
        { href: "/hub/admin/ai/learning", labelKey: "admin.nav.learning", icon: BookOpenCheck },
        { href: "/hub/admin/automation", labelKey: "admin.nav.automationPanel", icon: Workflow },
      ],
    },

    // ═══════════════════════════════════════════════════════
    // 💰 VENTAS & SUSCRIPCIONES
    // ═══════════════════════════════════════════════════════
    {
      titleKey: "admin.nav.sales",
      icon: CreditCard,
      priority: 65,
      items: [
        { href: "/hub/admin/sales/dashboard", labelKey: "admin.nav.salesDashboard", icon: TrendingUp },
        { href: "/hub/admin/sales/subscriptions", labelKey: "admin.nav.subscriptions", icon: CreditCard },
        { href: "/hub/admin/sales/opportunities", labelKey: "admin.nav.opportunities", icon: Briefcase },
        { href: "/hub/admin/sales/clients", labelKey: "admin.nav.clients", icon: Users2 },
        { href: "/hub/admin/sales/products", labelKey: "admin.nav.products", icon: Package },
        { href: "/hub/admin/sales/reports", labelKey: "admin.nav.salesReports", icon: ChartPie },
      ],
    },

    // ═══════════════════════════════════════════════════════
    // 🏛️ ESTRUCTURA (Ecosistema Multi-tenant)
    // ═══════════════════════════════════════════════════════
    {
      titleKey: "admin.nav.structure",
      icon: Globe2,
      priority: 60,
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
            { href: "/hub/admin/organizations/hierarchy", labelKey: "admin.nav.organizationsHierarchy", icon: GitBranch, badge: "NEW" },
          ],
        },
      ],
    },

    // ═══════════════════════════════════════════════════════
    // 🎨 BRANDING & APARIENCIA
    // ═══════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════
    // 🌐 SITIO PÚBLICO & CMS
    // ═══════════════════════════════════════════════════════
    {
      titleKey: "admin.nav.publicSite",
      icon: Globe2,
      priority: 50,
      items: [
        { href: "/hub/admin/landing-builder", labelKey: "admin.nav.landingBuilder", icon: Sparkles },
        { href: "/hub/admin/cms", labelKey: "admin.nav.cms", icon: FileText },
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

    // ═══════════════════════════════════════════════════════
    // 🎓 EDUCACIÓN
    // ═══════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════
    // 💰 FINANZAS & CONTABILIDAD
    // ═══════════════════════════════════════════════════════
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
      ],
    },

    // ═══════════════════════════════════════════════════════
    // 👔 RRHH
    // ═══════════════════════════════════════════════════════
    {
      titleKey: "admin.nav.hr",
      icon: Briefcase,
      priority: 35,
      items: [
        { href: "/hub/admin/hr/employees", labelKey: "admin.nav.employees", icon: Users },
        { href: "/hub/admin/hr/reviews", labelKey: "admin.nav.reviews", icon: ClipboardCheck },
        { href: "/hub/admin/hr/leaves", labelKey: "admin.nav.leaves", icon: Calendar },
        { href: "/hub/admin/hr/time", labelKey: "admin.nav.timeTracking", icon: Clock },
        { href: "/hub/admin/hr/productivity", labelKey: "admin.nav.productivity", icon: BarChart3 },
      ],
    },

    // ═══════════════════════════════════════════════════════
    // ⚙️ SISTEMA & CONFIGURACIÓN
    // ═══════════════════════════════════════════════════════
    {
      titleKey: "admin.nav.system",
      icon: Wrench,
      priority: 10,
      items: [
        { href: "/hub/admin/settings", labelKey: "admin.nav.settings", icon: Settings2 },
        { href: "/hub/admin/tokens", labelKey: "admin.nav.tokens", icon: Gauge },
        { href: "/hub/admin/integrations", labelKey: "admin.nav.integrations", icon: Network },
        { href: "/hub/admin/database", labelKey: "admin.nav.database", icon: Database },
        { href: "/hub/admin/announcements", labelKey: "admin.nav.announcements", icon: Bell },
        { href: "/hub/admin/logs", labelKey: "admin.nav.logs", icon: FileText },
        { href: "/hub/admin/audit", labelKey: "admin.nav.audit", icon: ShieldCheck },
        { href: "/hub/admin/system-health", labelKey: "admin.nav.systemHealth", icon: Activity },
      ],
    },
  ];

  // Ordenar secciones por prioridad
  const sortedSections = [...sections].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return (
    <aside className="h-full flex flex-col bg-[var(--rowi-card)]">
      {/* Logo */}
      <div className="p-4 border-b border-[var(--rowi-border)]">
        <Link href="/hub/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-heading text-lg font-bold bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] bg-clip-text text-transparent">
            Rowi Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {sortedSections.map((section, i) => (
          <SidebarSection
            key={i}
            section={section}
            pathname={pathname}
            t={t}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--rowi-border)]">
        <p className="text-xs text-[var(--rowi-muted)] text-center">
          Rowi SIA © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}

/* =========================================================
   🔹 SidebarSection — Sección colapsable
========================================================= */

interface SidebarSectionProps {
  section: NavSection;
  pathname: string | null;
  t: (key: string) => string;
}

function SidebarSection({ section, pathname, t }: SidebarSectionProps) {
  const TitleIcon = section.icon;

  // Check if any item in section is active (including nested children)
  // IMPORTANT: Only consider routes under /hub/admin/ as valid for active state
  const isActive = useMemo(() => {
    // Only match if we're in the admin area
    if (!pathname?.startsWith("/hub/admin")) return false;

    return section.items.some((item) => {
      // Skip items that don't start with /hub/admin (external links like /, /pricing)
      if (!item.href.startsWith("/hub/admin")) return false;

      // Exact match
      if (pathname === item.href) return true;

      // Prefix match (but not for dashboard which is just /hub/admin)
      if (item.href !== "/hub/admin" && pathname?.startsWith(item.href + "/")) return true;

      // For dashboard, only exact match
      if (item.href === "/hub/admin" && pathname === "/hub/admin") return true;

      // Check nested children for active state (only admin routes)
      const childActive = item.children?.some((c) => {
        // Skip non-admin routes
        if (!c.href.startsWith("/hub/admin")) return false;
        if (pathname === c.href) return true;
        if (pathname?.startsWith(c.href + "/")) return true;
        return false;
      });

      return childActive;
    });
  }, [section.items, pathname]);

  // Auto-expand when section contains active route, collapse otherwise
  const [open, setOpen] = useState(isActive);

  // Force update when pathname changes - always sync with isActive
  useEffect(() => {
    setOpen(isActive);
  }, [pathname, isActive]);

  return (
    <div className="rounded-lg">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg
          transition-colors duration-200
          ${open
            ? "bg-gradient-to-r from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10 text-[var(--rowi-primary)]"
            : "text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)]"
          }
        `}
      >
        <span className="flex items-center gap-2">
          <TitleIcon className="w-4 h-4" />
          <span className="truncate">{t(section.titleKey)}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="py-1 pl-2 space-y-0.5">
              {section.items.map((item) =>
                item.children ? (
                  <NestedGroup key={item.href} item={item} pathname={pathname} t={t} />
                ) : (
                  <SidebarLink key={item.href} item={item} pathname={pathname} t={t} />
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   🔹 SidebarLink — Link individual
========================================================= */

interface SidebarLinkProps {
  item: NavItem;
  pathname: string | null;
  t: (key: string) => string;
}

function SidebarLink({ item, pathname, t }: SidebarLinkProps) {
  const active = pathname === item.href || pathname?.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-2 px-3 py-1.5 text-sm rounded-md
        transition-colors duration-200
        ${active
          ? "bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] font-medium border-l-2 border-[var(--rowi-primary)] ml-0 pl-2.5"
          : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-border)] hover:text-[var(--rowi-foreground)]"
        }
      `}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{t(item.labelKey)}</span>
      {item.badge && (
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* =========================================================
   🔹 NestedGroup — Grupo anidado (ej: Comunidades)
========================================================= */

interface NestedGroupProps {
  item: NavItem;
  pathname: string | null;
  t: (key: string) => string;
}

function NestedGroup({ item, pathname, t }: NestedGroupProps) {
  const Icon = item.icon;

  // Check if any child is active (exact match or starts with for nested pages)
  // IMPORTANT: Only consider routes under /hub/admin/ as valid for active state
  const isActive = useMemo(() => {
    // Only match if we're in the admin area
    if (!pathname?.startsWith("/hub/admin")) return false;

    const activeChild = item.children?.some((c) => {
      // Skip non-admin routes (like /, /pricing, /product/*)
      if (!c.href.startsWith("/hub/admin")) return false;
      if (pathname === c.href) return true;
      if (pathname?.startsWith(c.href + "/")) return true;
      return false;
    });

    // Also check if the parent href matches (only if it's an admin route)
    const parentActive = item.href.startsWith("/hub/admin") &&
      (pathname === item.href || pathname?.startsWith(item.href + "/"));

    return activeChild || parentActive;
  }, [item.href, item.children, pathname]);

  // Auto-expand when active, auto-collapse when not
  const [open, setOpen] = useState(isActive);

  // Force sync with isActive when pathname changes
  useEffect(() => {
    setOpen(isActive);
  }, [pathname, isActive]);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center justify-between w-full px-3 py-1.5 text-sm rounded-md
          transition-colors duration-200
          ${isActive
            ? "bg-[var(--rowi-primary)]/5 text-[var(--rowi-primary)] font-medium"
            : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-border)] hover:text-[var(--rowi-foreground)]"
          }
        `}
      >
        <span className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isActive ? "text-[var(--rowi-primary)]" : ""}`} />
          <span className="truncate">{t(item.labelKey)}</span>
          {item.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold">
              {item.badge}
            </span>
          )}
        </span>
        <ChevronRight
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && item.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden ml-4 space-y-0.5 py-1"
          >
            {item.children.map((child) => (
              <SidebarLink key={child.href} item={child} pathname={pathname} t={t} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
