"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Menu, X, ChevronDown, Settings, User, UserPlus, LogOut, LayoutDashboard, Users, Heart, Satellite, Bot, BarChart3, CalendarCheck, Sparkles, Briefcase, FileText, DollarSign, GraduationCap, Shield, FlaskConical, Bell, Check, ExternalLink, MessageCircle, Handshake, Rss, Target, Users2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";
import { useI18n } from "@/lib/i18n/I18nProvider";
import useSWR from "swr";
import ContextSwitcher from "./ContextSwitcher";
import { useUserContext } from "@/contexts/UserContextProvider";

// Fetcher para SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/* =========================================================
   🌍 Traducciones del Navbar autenticado
========================================================= */
const translations = {
  es: {
    nav: {
      dashboard: "Dashboard",
      community: "Comunidad",
      affinity: "Afinidad",
      benchmark: "Benchmark",
      eco: "ECO",
      rowicoach: "Rowi Coach",
      weekflow: "WeekFlow",
      signin: "Iniciar sesion",
      signout: "Cerrar sesion",
      profile: "Mi perfil",
      viewProfile: "Ver perfil",
      editProfile: "Editar perfil",
      invites: "Invitaciones",
      settings: "Configuracion",
      myRowi: "Mi Rowi",
      sixSeconds: "Six Seconds",
      rowiLevel: "Nivel Rowi",
      // Social
      social: "Social",
      feed: "Actividad",
      connections: "Conexiones",
      messages: "Mensajes",
      goals: "Causas Nobles",
      // Nuevos links por rol
      team: "Mi Equipo",
      reports: "Reportes",
      hr: "Recursos Humanos",
      coaching: "Coaching",
      clients: "Clientes",
      finance: "Finanzas",
      admin: "Admin",
      research: "Investigación",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      community: "Community",
      affinity: "Affinity",
      benchmark: "Benchmark",
      eco: "ECO",
      rowicoach: "Rowi Coach",
      weekflow: "WeekFlow",
      signin: "Sign in",
      signout: "Sign out",
      profile: "My profile",
      viewProfile: "View profile",
      editProfile: "Edit profile",
      invites: "Invitations",
      settings: "Settings",
      myRowi: "My Rowi",
      sixSeconds: "Six Seconds",
      rowiLevel: "Rowi Level",
      // Social
      social: "Social",
      feed: "Activity",
      connections: "Connections",
      messages: "Messages",
      goals: "Noble Goals",
      // New role-based links
      team: "My Team",
      reports: "Reports",
      hr: "Human Resources",
      coaching: "Coaching",
      clients: "Clients",
      finance: "Finance",
      admin: "Admin",
      research: "Research",
    },
  },
};

// Emojis y colores para los stages del avatar
const AVATAR_STAGE_CONFIG: Record<string, { emoji: string; color: string }> = {
  EGG: { emoji: "🥚", color: "#94a3b8" },
  HATCHING: { emoji: "🐣", color: "#fbbf24" },
  BABY: { emoji: "🐥", color: "#fb923c" },
  YOUNG: { emoji: "🦉", color: "#3b82f6" },
  ADULT: { emoji: "🦅", color: "#8b5cf6" },
  WISE: { emoji: "🪶", color: "#10b981" },
};

// Colores para niveles Six Seconds
const SIX_SECONDS_COLORS: Record<number, string> = {
  1: "#ef4444", // Desafio - rojo
  2: "#f59e0b", // Emergente - naranja
  3: "#3b82f6", // Funcional - azul
  4: "#8b5cf6", // Diestro - morado
  5: "#10b981", // Experto - verde
};

/* =========================================================
   🔗 Links principales del navbar (base)
========================================================= */
const BASE_LINKS = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard, roles: ["*"] },
  { href: "/community", key: "community", icon: Users, roles: ["*"] },
  { href: "/weekflow", key: "weekflow", icon: CalendarCheck, roles: ["*"] },
  { href: "/affinity", key: "affinity", icon: Heart, roles: ["*"] },
  { href: "/benchmark", key: "benchmark", icon: BarChart3, roles: ["*"] },
  { href: "/eco", key: "eco", icon: Satellite, roles: ["*"] },
  { href: "/rowi", key: "rowicoach", icon: Bot, roles: ["*"] },
];

// Social sub-links for the dropdown
const SOCIAL_LINKS = [
  { href: "/social/feed", key: "feed", icon: Rss },
  { href: "/social/connections", key: "connections", icon: Handshake },
  { href: "/social/messages", key: "messages", icon: MessageCircle },
  { href: "/social/goals", key: "goals", icon: Target },
];

/* =========================================================
   🔗 Links adicionales por rol
========================================================= */
const ROLE_LINKS = [
  // Team/Manager views
  { href: "/team", key: "team", icon: Users, roles: ["TEAM_LEADER", "MANAGER", "ADMIN", "OWNER"] },
  { href: "/reports", key: "reports", icon: FileText, roles: ["MANAGER", "ADMIN", "OWNER", "REGION_LEADER"] },

  // HR views
  { href: "/hr", key: "hr", icon: Briefcase, roles: ["HR", "ADMIN", "OWNER"] },

  // Coach views
  { href: "/coaching", key: "coaching", icon: GraduationCap, roles: ["COACH", "MENTOR", "CONSULTANT"] },

  // Consultant views
  { href: "/clients", key: "clients", icon: Briefcase, roles: ["CONSULTANT"] },

  // Finance views
  { href: "/finance", key: "finance", icon: DollarSign, roles: ["FINANCIAL", "BILLING", "ADMIN", "OWNER"] },

  // Research views (Academic Researcher)
  { href: "/research", key: "research", icon: FlaskConical, roles: ["RESEARCHER", "ACADEMIC", "ADMIN", "SUPERADMIN"] },

  // Admin views
  { href: "/admin", key: "admin", icon: Shield, roles: ["ADMIN", "SUPERADMIN", "OWNER"] },
];

export default function NavBar() {
  const pathname = usePathname();
  const { data } = useSession();
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations]?.nav || translations.es.nav;

  // Hook de contexto multi-rol
  let userContext;
  try {
    userContext = useUserContext();
  } catch {
    // Si no está dentro del provider, usar valores por defecto
    userContext = {
      currentContext: { type: "personal", id: null, name: "Dashboard", role: "USER" },
      hasMultipleContexts: false,
      isConsultant: false,
      isCoach: false,
      isAdmin: false,
    };
  }
  const { currentContext, hasMultipleContexts, isConsultant, isCoach, isAdmin } = userContext;

  const isLogged = !!data?.user?.email;
  const userInitial = (data?.user?.name || data?.user?.email || "U")
    .slice(0, 1)
    .toUpperCase();
  const userName = data?.user?.name || data?.user?.email || "";

  // Calcular links visibles basados en rol actual
  const currentRole = currentContext?.role || "USER";
  const visibleLinks = [
    ...BASE_LINKS,
    ...ROLE_LINKS.filter(link =>
      link.roles.includes(currentRole) ||
      (isAdmin && link.roles.includes("ADMIN")) ||
      (isConsultant && link.roles.includes("CONSULTANT")) ||
      (isCoach && link.roles.includes("COACH"))
    ),
  ];

  // Fetch avatar data
  const { data: avatarData } = useSWR(
    isLogged ? "/api/avatar" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  const avatar = avatarData?.data;

  // Control del menú usuario
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("avatar"); // Seccion expandida por defecto
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [socialDropdownOpen, setSocialDropdownOpen] = useState(false);
  const isSocialActive = pathname?.startsWith("/social");

  // Fetch notificaciones
  const { data: notificationsData, mutate: refreshNotifications } = useSWR(
    isLogged ? "/api/notifications?limit=10&unreadOnly=false" : null,
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 60000 } // Refresh cada minuto
  );
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  // Control de visibilidad del navbar (hide on scroll down, show on scroll up)
  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY.current;
    const scrolledPastThreshold = currentScrollY > 80; // Solo ocultar después de 80px

    if (scrollingDown && scrolledPastThreshold && !isHovering) {
      setIsVisible(false);
    } else if (!scrollingDown || currentScrollY < 80) {
      setIsVisible(true);
    }

    lastScrollY.current = currentScrollY;
    ticking.current = false;
  }, [isHovering]);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(handleScroll);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [handleScroll]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("#rowi-user-menu")) setMenuOpen(false);
      if (!target.closest?.("#rowi-notifications-menu")) setNotificationsOpen(false);
      if (!target.closest?.("#rowi-social-dropdown")) setSocialDropdownOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      refreshNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      refreshNotifications();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="mx-auto max-w-7xl h-16 px-4 flex items-center justify-between gap-4">
        {/* Logo + Context Switcher */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/rowi-logo.png" alt="Rowi" width={32} height={32} className="rounded-lg flex-shrink-0" />
            <span className="font-bold text-lg rowi-gradient-text hidden sm:block">Rowi</span>
          </Link>

          {/* Context Switcher - Solo si tiene múltiples contextos */}
          {isLogged && hasMultipleContexts && (
            <div className="hidden lg:block">
              <ContextSwitcher />
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {visibleLinks.slice(0, 7).map((l) => {
            const active = pathname?.startsWith(l.href);
            const Icon = l.icon;
            const label = t[l.key as keyof typeof t] || l.key;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10"
                    : "text-gray-600 dark:text-gray-400 hover:text-[var(--rowi-g2)] hover:bg-gray-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}

          {/* Social Dropdown */}
          {isLogged && (
            <div id="rowi-social-dropdown" className="relative">
              <button
                onClick={() => setSocialDropdownOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSocialActive
                    ? "text-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10"
                    : "text-gray-600 dark:text-gray-400 hover:text-[var(--rowi-g2)] hover:bg-gray-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Users2 className="w-4 h-4" />
                <span className="hidden lg:inline">{t.social}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${socialDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {socialDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl py-1 overflow-hidden z-50"
                  >
                    {SOCIAL_LINKS.map((sl) => {
                      const slActive = pathname?.startsWith(sl.href);
                      const SlIcon = sl.icon;
                      const slLabel = t[sl.key as keyof typeof t] || sl.key;
                      return (
                        <Link
                          key={sl.href}
                          href={sl.href}
                          onClick={() => setSocialDropdownOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            slActive
                              ? "text-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10 font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <SlIcon className="w-4 h-4" />
                          {slLabel}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />

          {/* Notifications Bell */}
          {isLogged && (
            <div id="rowi-notifications-menu" className="relative">
              <button
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                title={lang === "es" ? "Notificaciones" : "Notifications"}
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 max-h-[70vh] rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {lang === "es" ? "Notificaciones" : "Notifications"}
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400"
                        >
                          {lang === "es" ? "Marcar todo leído" : "Mark all read"}
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[50vh] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center">
                          <Bell className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-600 mb-2" />
                          <p className="text-sm text-gray-500">
                            {lang === "es" ? "Sin notificaciones" : "No notifications"}
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif: any) => (
                          <div
                            key={notif.id}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${
                              !notif.readAt ? "bg-violet-50/50 dark:bg-violet-900/10" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-full ${
                                notif.priority === "HIGH" || notif.priority === "URGENT"
                                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                              }`}>
                                <Bell className="w-3 h-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString(lang, {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {notif.actionUrl && (
                                  <Link
                                    href={notif.actionUrl}
                                    onClick={() => {
                                      markAsRead(notif.id);
                                      setNotificationsOpen(false);
                                    }}
                                    className="p-1 text-gray-400 hover:text-violet-600 rounded"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                                {!notif.readAt && (
                                  <button
                                    onClick={() => markAsRead(notif.id)}
                                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                                    title={lang === "es" ? "Marcar leído" : "Mark read"}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <Link
                      href="/settings/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="block px-4 py-2.5 text-center text-sm text-violet-600 hover:bg-gray-50 dark:hover:bg-zinc-800 border-t border-gray-200 dark:border-zinc-800"
                    >
                      {lang === "es" ? "Ver todas las notificaciones" : "View all notifications"}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isLogged ? (
            <button
              onClick={() => signIn()}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] rounded-lg hover:opacity-90 transition-opacity"
            >
              {t.signin}
            </button>
          ) : (
            <div id="rowi-user-menu" className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                title={t.profile}
              >
                {/* Avatar con emoji del stage */}
                <div className="relative">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg"
                    style={{
                      backgroundColor: avatar
                        ? `${AVATAR_STAGE_CONFIG[avatar.currentStage]?.color}20`
                        : "linear-gradient(to right, var(--rowi-g1), var(--rowi-g2))"
                    }}
                  >
                    {avatar ? AVATAR_STAGE_CONFIG[avatar.currentStage]?.emoji : userInitial}
                  </span>
                  {/* Badge de nivel Six Seconds */}
                  {avatar && (
                    <span
                      className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-white dark:border-zinc-900"
                      style={{ backgroundColor: SIX_SECONDS_COLORS[avatar.sixSecondsLevel] || "#3b82f6" }}
                    >
                      {avatar.sixSecondsLevel}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                  {userName}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl py-2 overflow-hidden"
                  >
                    {/* Seccion Avatar - Colapsable */}
                    <CollapsibleSection
                      id="avatar"
                      title={t.myRowi}
                      icon={<span className="text-lg">{avatar ? AVATAR_STAGE_CONFIG[avatar.currentStage]?.emoji : "🥚"}</span>}
                      isExpanded={expandedSection === "avatar"}
                      onToggle={() => setExpandedSection(expandedSection === "avatar" ? null : "avatar")}
                    >
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-xl"
                            style={{
                              backgroundColor: avatar
                                ? `${AVATAR_STAGE_CONFIG[avatar.currentStage]?.color}20`
                                : "#f3f4f6"
                            }}
                          >
                            {avatar ? AVATAR_STAGE_CONFIG[avatar.currentStage]?.emoji : userInitial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {avatar?.stageInfo?.name?.[lang as "es" | "en"] || "Loading..."}
                            </p>
                            <p className="text-xs text-gray-500">
                              Score: {avatar?.evolutionScore?.toFixed(1) || "0"}
                            </p>
                          </div>
                        </div>

                        {avatar && (
                          <>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div
                                className="px-2 py-1 rounded text-center"
                                style={{ backgroundColor: `${SIX_SECONDS_COLORS[avatar.sixSecondsLevel]}15` }}
                              >
                                <p className="text-[9px] uppercase text-gray-500">{t.sixSeconds}</p>
                                <p className="text-xs font-bold" style={{ color: SIX_SECONDS_COLORS[avatar.sixSecondsLevel] }}>
                                  L{avatar.sixSecondsLevel}
                                </p>
                              </div>
                              <div className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-center">
                                <p className="text-[9px] uppercase text-gray-500">{t.rowiLevel}</p>
                                <p className="text-xs font-bold text-emerald-600">L{avatar.rowiLevel}</p>
                              </div>
                            </div>

                            <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${avatar.isHatched ? avatar.progressToNext : avatar.hatchProgress}%`,
                                  backgroundColor: AVATAR_STAGE_CONFIG[avatar.currentStage]?.color
                                }}
                              />
                            </div>
                          </>
                        )}

                        <Link
                          href="/profile/avatar"
                          onClick={() => setMenuOpen(false)}
                          className="mt-2 block text-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {lang === "es" ? "Ver detalles" : "View details"} →
                        </Link>
                      </div>
                    </CollapsibleSection>

                    {/* Seccion Perfil - Colapsable */}
                    <CollapsibleSection
                      id="profile"
                      title={t.profile}
                      icon={<User className="w-4 h-4" />}
                      isExpanded={expandedSection === "profile"}
                      onToggle={() => setExpandedSection(expandedSection === "profile" ? null : "profile")}
                    >
                      <div className="py-1">
                        <MenuLink href="/profile/home" icon={User} onClick={() => setMenuOpen(false)}>
                          {t.viewProfile}
                        </MenuLink>
                        <MenuLink href="/social/feed" icon={Rss} onClick={() => setMenuOpen(false)}>
                          {t.feed}
                        </MenuLink>
                        <MenuLink href="/social/connections" icon={Handshake} onClick={() => setMenuOpen(false)}>
                          {t.connections}
                        </MenuLink>
                        <MenuLink href="/social/messages" icon={MessageCircle} onClick={() => setMenuOpen(false)}>
                          {t.messages}
                        </MenuLink>
                        <MenuLink href="/social/goals" icon={Target} onClick={() => setMenuOpen(false)}>
                          {t.goals}
                        </MenuLink>
                        <MenuLink href="/settings/invites" icon={UserPlus} onClick={() => setMenuOpen(false)}>
                          {t.invites}
                        </MenuLink>
                      </div>
                    </CollapsibleSection>

                    {/* Seccion Configuracion - Colapsable */}
                    <CollapsibleSection
                      id="settings"
                      title={t.settings}
                      icon={<Settings className="w-4 h-4" />}
                      isExpanded={expandedSection === "settings"}
                      onToggle={() => setExpandedSection(expandedSection === "settings" ? null : "settings")}
                    >
                      <div className="py-1">
                        <MenuLink href="/settings" icon={Settings} onClick={() => setMenuOpen(false)}>
                          {lang === "es" ? "General" : "General"}
                        </MenuLink>
                      </div>
                    </CollapsibleSection>

                    <div className="border-t border-gray-200 dark:border-zinc-800 py-1">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        onClick={() => {
                          setMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        {t.signout}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800"
          >
            {/* Context Switcher en Mobile */}
            {isLogged && hasMultipleContexts && (
              <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                <p className="text-xs text-gray-500 mb-2">
                  {lang === "es" ? "Contexto actual" : "Current context"}
                </p>
                <ContextSwitcher />
              </div>
            )}

            <nav className="px-4 py-4 space-y-1">
              {visibleLinks.map((l) => {
                const active = pathname?.startsWith(l.href);
                const Icon = l.icon;
                const label = t[l.key as keyof typeof t] || l.key;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      active
                        ? "text-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                );
              })}

              {/* Social section in mobile */}
              {isLogged && (
                <>
                  <div className="pt-2 pb-1 px-4">
                    <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{t.social}</p>
                  </div>
                  {SOCIAL_LINKS.map((sl) => {
                    const slActive = pathname?.startsWith(sl.href);
                    const SlIcon = sl.icon;
                    const slLabel = t[sl.key as keyof typeof t] || sl.key;
                    return (
                      <Link
                        key={sl.href}
                        href={sl.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                          slActive
                            ? "text-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <SlIcon className="w-5 h-5" />
                        {slLabel}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* =========================================================
   📦 Collapsible Section Component
========================================================= */
function CollapsibleSection({
  id,
  title,
  icon,
  children,
  isExpanded,
  onToggle,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-zinc-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden bg-gray-50 dark:bg-zinc-800/30"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   🔗 Menu Link Component
========================================================= */
function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      onClick={onClick}
    >
      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      {children}
    </Link>
  );
}
