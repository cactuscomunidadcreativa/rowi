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
  Calendar, CalendarCheck, ClipboardCheck, Clock, CheckSquare, ListTodo, Ticket,
  GraduationCap, BookOpen, Users2,
  Zap, Workflow,
  Settings2, Bell, Database, SlidersHorizontal,
  Blocks, PanelLeft, Palette,
  ChevronDown, ChevronRight, HeartHandshake, Languages,
  LucideIcon, LayoutDashboard, Wrench, GitCompareArrows, Award, Sparkles,
  Link2, Earth, Upload, Settings, Trophy, Medal, Star, Flame,
  Heart, UserCheck, Mail, Share2, Gift, Crown, BadgeCheck,
  Shield, GitBranch, ToggleRight, KeyRound,
  Handshake, Rss, MessageCircle, Boxes,
  AlertTriangle, Theater,
} from "lucide-react";

/* =========================================================
   🌐 Rowi Hub Admin Sidebar — Reorganizado & Bilingüe
   ---------------------------------------------------------
   - Estructura optimizada por frecuencia de uso
   - Secciones core primero, avanzadas después
   - Soporte completo ES/EN
   - Nuevas secciones: Gamificación, EQ Upload
========================================================= */

import { ADMIN_SECTIONS, type NavItem, type NavSection } from "./adminNavData";
import AdminCommandPalette from "./AdminCommandPalette";

/** Días que un badge "NEW" permanece visible desde `newSince`. */
const BADGE_NEW_TTL_DAYS = 30;

/**
 * Texto del badge a mostrar para un item, aplicando la caducidad del "NEW".
 * Devuelve null si el badge "NEW" ya expiró. Badges no-"NEW" pasan tal cual.
 */
function resolveBadge(item: NavItem): string | null {
  if (!item.badge) return null;
  if (item.badge !== "NEW") return item.badge;
  if (!item.newSince) return null; // "NEW" sin fecha = no se muestra (ya no es nuevo)
  const since = new Date(item.newSince + "T00:00:00Z").getTime();
  if (Number.isNaN(since)) return null;
  const ageDays = (Date.now() - since) / 86_400_000;
  return ageDays <= BADGE_NEW_TTL_DAYS ? "NEW" : null;
}

import { useAdminUser } from "./AdminUserContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { isPlatformAdmin, loading: userLoading, can } = useAdminUser();

  const sections: NavSection[] = ADMIN_SECTIONS;

  // Ordenar secciones por prioridad
  // Filter platform-admin-only sections + items based on the caller's scope.
  // While we're still loading the user we show everything (avoid layout flicker
  // for SuperAdmins who would see items pop in mid-paint).
  // Una entrada es visible si: (mientras carga, todo) O es platform admin, Y
  // — si declara `capability` — el usuario la tiene. superOnly sigue valiendo.
  const showByScope = (superOnly?: boolean) =>
    userLoading || isPlatformAdmin || !superOnly;
  const showByCap = (capability?: string) =>
    userLoading || !capability || isPlatformAdmin || can(capability);

  const visibleSections = sections
    .filter((s) => showByScope(s.superOnly) && showByCap(s.capability))
    .map((s) => ({
      ...s,
      items: s.items.filter(
        (it) => showByScope(it.superOnly) && showByCap(it.capability),
      ),
    }))
    .filter((s) => s.items.length > 0);

  const sortedSections = visibleSections.sort(
    (a, b) => (b.priority || 0) - (a.priority || 0),
  );

  return (
    <aside className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* Logo + buscador ⌘K (entrada principal de navegación) */}
      <div className="p-4 border-b border-gray-200 dark:border-zinc-700 space-y-3">
        <Link href="/hub/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-heading text-lg font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
            Rowi Admin
          </span>
        </Link>
        <AdminCommandPalette />
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
      <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
        <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
          Rowi © {new Date().getFullYear()}
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
            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
            : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
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
          ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-medium border-l-2 border-violet-500 ml-0 pl-2.5"
          : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200"
        }
      `}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{t(item.labelKey)}</span>
      {resolveBadge(item) && (
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--rowi-g2)] text-white font-bold">
          {resolveBadge(item)}
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
            ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-medium"
            : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200"
          }
        `}
      >
        <span className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isActive ? "text-violet-600 dark:text-violet-400" : ""}`} />
          <span className="truncate">{t(item.labelKey)}</span>
          {resolveBadge(item) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--rowi-g2)] text-white font-bold">
              {resolveBadge(item)}
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
