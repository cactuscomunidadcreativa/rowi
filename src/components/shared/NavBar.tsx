"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Menu, X, ChevronDown, Settings, User, UserPlus, LogOut, LayoutDashboard, Users, Heart, Satellite, Bot, BarChart3, CalendarCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";
import { useI18n } from "@/lib/i18n/I18nProvider";
import useSWR from "swr";

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
   🔗 Links principales del navbar
========================================================= */
const LINKS = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/community", key: "community", icon: Users },
  { href: "/weekflow", key: "weekflow", icon: CalendarCheck },
  { href: "/affinity", key: "affinity", icon: Heart },
  { href: "/benchmark", key: "benchmark", icon: BarChart3 },
  { href: "/eco", key: "eco", icon: Satellite },
  { href: "/rowi", key: "rowicoach", icon: Bot },
];

export default function NavBar() {
  const pathname = usePathname();
  const { data } = useSession();
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations]?.nav || translations.es.nav;

  const isLogged = !!data?.user?.email;
  const userInitial = (data?.user?.name || data?.user?.email || "U")
    .slice(0, 1)
    .toUpperCase();
  const userName = data?.user?.name || data?.user?.email || "";

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
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="mx-auto max-w-6xl h-16 px-4 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/rowi-logo.png" alt="Rowi" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-lg rowi-gradient-text hidden sm:block">Rowi</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => {
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
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />

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
            <nav className="px-4 py-4 space-y-1">
              {LINKS.map((l) => {
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
