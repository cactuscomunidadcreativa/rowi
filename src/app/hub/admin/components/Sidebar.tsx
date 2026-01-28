"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  Globe2, Layers3, Network, Building2, Building, Users, FolderKanban, ShieldCheck, Gauge,
  Puzzle, MessageSquareCode, BookOpenCheck, Bot,
  Brain, LineChart, FileText, BarChart3,
  Coins, Scale, Receipt, FileSpreadsheet, ClipboardList, ShoppingCart, Wallet,
  CreditCard, Briefcase, Package, ChartPie, HardDrive,
  Calendar, ClipboardCheck, Clock,
  GraduationCap, BookOpen, Users2,
  Zap, Workflow,
  Settings2, Bell, Database, SlidersHorizontal,
  Blocks, PanelLeft, Palette,
  ChevronDown, ChevronRight, HeartHandshake, Languages,
  LucideIcon, LayoutDashboard, Wrench,
} from "lucide-react";

/* =========================================================
   🌐 Rowi Hub Admin Sidebar — Reorganized & i18n Ready
   ---------------------------------------------------------
   - Estructura mejorada con grupos lógicos
   - Branding/Theme incluido
   - Todas las labels usan claves de traducción
   - Animaciones suaves
========================================================= */

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  children?: NavItem[];
}

interface NavSection {
  titleKey: string;
  icon: LucideIcon;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const sections: NavSection[] = [
    // 🏠 PRINCIPAL
    {
      titleKey: "admin.nav.main",
      icon: LayoutDashboard,
      items: [
        { href: "/hub/admin", labelKey: "admin.nav.dashboard", icon: LayoutDashboard },
        { href: "/hub/admin/branding", labelKey: "admin.nav.branding", icon: Palette },
      ],
    },
    // 🏛️ ESTRUCTURA (Ecosistema)
    {
      titleKey: "admin.nav.structure",
      icon: Globe2,
      items: [
        { href: "/hub/admin/superhubs", labelKey: "admin.nav.superhubs", icon: Layers3 },
        { href: "/hub/admin/hubs", labelKey: "admin.nav.hubs", icon: Network },
        { href: "/hub/admin/tenants", labelKey: "admin.nav.tenants", icon: Building2 },
        { href: "/hub/admin/organizations", labelKey: "admin.nav.organizations", icon: Building },
      ],
    },
    // 👥 PERSONAS
    {
      titleKey: "admin.nav.people",
      icon: Users,
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
        { href: "/hub/admin/plans", labelKey: "admin.nav.plans", icon: Gauge },
      ],
    },
    // 🤖 IA & AUTOMATIZACIÓN
    {
      titleKey: "admin.nav.aiAutomation",
      icon: Bot,
      items: [
        { href: "/hub/admin/agents", labelKey: "admin.nav.agents", icon: Bot },
        { href: "/hub/admin/ai/prompts", labelKey: "admin.nav.prompts", icon: MessageSquareCode },
        { href: "/hub/admin/ai/learning", labelKey: "admin.nav.learning", icon: BookOpenCheck },
        { href: "/hub/admin/automation", labelKey: "admin.nav.automationPanel", icon: Workflow },
      ],
    },
    // 💓 EQ (Inteligencia Emocional)
    {
      titleKey: "admin.nav.eq",
      icon: Brain,
      items: [
        { href: "/hub/eq/dashboard", labelKey: "admin.nav.eqDashboard", icon: LineChart },
        { href: "/hub/eq/progress", labelKey: "admin.nav.eqProgress", icon: BarChart3 },
        { href: "/hub/eq/snapshots", labelKey: "admin.nav.eqSnapshots", icon: Brain },
        { href: "/hub/eq/insights", labelKey: "admin.nav.eqInsights", icon: FileText },
      ],
    },
    // 💰 FINANZAS & CONTABILIDAD
    {
      titleKey: "admin.nav.finance",
      icon: Coins,
      items: [
        { href: "/hub/admin/accounting/accounts", labelKey: "admin.nav.accounts", icon: Scale },
        { href: "/hub/admin/accounting/transactions", labelKey: "admin.nav.transactions", icon: Receipt },
        { href: "/hub/admin/accounting/invoices", labelKey: "admin.nav.invoices", icon: FileSpreadsheet },
        { href: "/hub/admin/accounting/purchase-orders", labelKey: "admin.nav.purchaseOrders", icon: ClipboardList },
        { href: "/hub/admin/accounting/sales-orders", labelKey: "admin.nav.salesOrders", icon: ShoppingCart },
        { href: "/hub/admin/accounting/payouts", labelKey: "admin.nav.payouts", icon: Wallet },
        { href: "/hub/admin/accounting/payroll", labelKey: "admin.nav.payroll", icon: Calendar },
        { href: "/hub/admin/accounting/assets", labelKey: "admin.nav.assets", icon: HardDrive },
        { href: "/hub/admin/accounting/cost-centers", labelKey: "admin.nav.costCenters", icon: Building },
      ],
    },
    // 🧩 VENTAS & CRM
    {
      titleKey: "admin.nav.sales",
      icon: CreditCard,
      items: [
        { href: "/hub/admin/sales/opportunities", labelKey: "admin.nav.opportunities", icon: Briefcase },
        { href: "/hub/admin/sales/subscriptions", labelKey: "admin.nav.subscriptions", icon: CreditCard },
        { href: "/hub/admin/sales/clients", labelKey: "admin.nav.clients", icon: Users2 },
        { href: "/hub/admin/sales/products", labelKey: "admin.nav.products", icon: Package },
        { href: "/hub/admin/sales/reports", labelKey: "admin.nav.salesReports", icon: ChartPie },
      ],
    },
    // 👔 RRHH
    {
      titleKey: "admin.nav.hr",
      icon: Users,
      items: [
        { href: "/hub/admin/hr/employees", labelKey: "admin.nav.employees", icon: Users },
        { href: "/hub/admin/hr/reviews", labelKey: "admin.nav.reviews", icon: ClipboardCheck },
        { href: "/hub/admin/hr/leaves", labelKey: "admin.nav.leaves", icon: Calendar },
        { href: "/hub/admin/hr/time", labelKey: "admin.nav.timeTracking", icon: Clock },
        { href: "/hub/admin/hr/productivity", labelKey: "admin.nav.productivity", icon: BarChart3 },
      ],
    },
    // 🎓 EDUCACIÓN
    {
      titleKey: "admin.nav.education",
      icon: GraduationCap,
      items: [
        { href: "/hub/admin/education/courses", labelKey: "admin.nav.courses", icon: BookOpen },
        { href: "/hub/admin/education/enrollments", labelKey: "admin.nav.enrollments", icon: ClipboardList },
        { href: "/hub/admin/education/quizzes", labelKey: "admin.nav.quizzes", icon: FileText },
        { href: "/hub/admin/education/certificates", labelKey: "admin.nav.certificates", icon: FileSpreadsheet },
        { href: "/hub/admin/education/study-groups", labelKey: "admin.nav.studyGroups", icon: Users },
      ],
    },
    // 🎨 CONTENIDO & UI
    {
      titleKey: "admin.nav.content",
      icon: PanelLeft,
      items: [
        { href: "/hub/admin/pages", labelKey: "admin.nav.pages", icon: FileText },
        { href: "/hub/admin/layouts", labelKey: "admin.nav.layouts", icon: Blocks },
        { href: "/hub/admin/components", labelKey: "admin.nav.components", icon: Puzzle },
      ],
    },
    // ⚙️ SISTEMA & CONFIGURACIÓN
    {
      titleKey: "admin.nav.system",
      icon: Wrench,
      items: [
        { href: "/hub/admin/settings", labelKey: "admin.nav.settings", icon: Settings2 },
        { href: "/hub/admin/translations", labelKey: "admin.nav.translations", icon: Languages },
        { href: "/hub/admin/tokens", labelKey: "admin.nav.tokens", icon: Gauge },
        { href: "/hub/admin/integrations", labelKey: "admin.nav.integrations", icon: Network },
        { href: "/hub/admin/database", labelKey: "admin.nav.database", icon: Database },
        { href: "/hub/admin/announcements", labelKey: "admin.nav.announcements", icon: Bell },
        { href: "/hub/admin/logs", labelKey: "admin.nav.logs", icon: FileText },
        { href: "/hub/admin/audit", labelKey: "admin.nav.audit", icon: ShieldCheck },
        { href: "/hub/admin/insights", labelKey: "admin.nav.insights", icon: LineChart },
        { href: "/hub/admin/reports", labelKey: "admin.nav.reports", icon: FileText },
        { href: "/hub/admin/system-health", labelKey: "admin.nav.systemHealth", icon: Gauge },
      ],
    },
  ];

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
        {sections.map((section, i) => (
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
  const [open, setOpen] = useState(false);

  const isActive = section.items.some(
    (item) =>
      pathname === item.href ||
      pathname?.startsWith(item.href + "/") ||
      item.children?.some((c) => pathname?.startsWith(c.href))
  );

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

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
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  const activeChild = item.children?.some((c) => pathname?.startsWith(c.href));

  useEffect(() => {
    if (activeChild) setOpen(true);
  }, [activeChild]);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center justify-between w-full px-3 py-1.5 text-sm rounded-md
          transition-colors duration-200
          ${open || activeChild
            ? "text-[var(--rowi-primary)]"
            : "text-[var(--rowi-muted)] hover:bg-[var(--rowi-border)]"
          }
        `}
      >
        <span className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="truncate">{t(item.labelKey)}</span>
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
