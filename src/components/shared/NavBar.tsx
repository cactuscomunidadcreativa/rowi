"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Menu, X, ChevronDown, Settings, User, UserPlus, LogOut, LayoutDashboard, Users, Heart, Satellite, Bot, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";
import { useI18n } from "@/lib/i18n/I18nProvider";

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
      signin: "Iniciar sesión",
      signout: "Cerrar sesión",
      profile: "Mi perfil",
      viewProfile: "Ver perfil",
      editProfile: "Editar perfil",
      invites: "Invitaciones",
      settings: "Configuración",
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
      signin: "Sign in",
      signout: "Sign out",
      profile: "My profile",
      viewProfile: "View profile",
      editProfile: "Edit profile",
      invites: "Invitations",
      settings: "Settings",
    },
  },
};

/* =========================================================
   🔗 Links principales del navbar
========================================================= */
const LINKS = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/community", key: "community", icon: Users },
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

  // Control del menú usuario
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("#rowi-user-menu")) setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-zinc-800">
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
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-medium">
                  {userInitial}
                </span>
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
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl py-2 overflow-hidden"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {data?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {data?.user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <MenuLink href="/profile/home" icon={User} onClick={() => setMenuOpen(false)}>
                        {t.viewProfile}
                      </MenuLink>
                      <MenuLink href="/settings" icon={Settings} onClick={() => setMenuOpen(false)}>
                        {t.settings}
                      </MenuLink>
                      <MenuLink href="/settings/invites" icon={UserPlus} onClick={() => setMenuOpen(false)}>
                        {t.invites}
                      </MenuLink>
                    </div>

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
