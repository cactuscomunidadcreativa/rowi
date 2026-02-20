"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Globe, Sun, Moon, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";

const navItems = [
  { labelKey: "nav.home", href: "/" },
  { labelKey: "nav.howItWorks", href: "/how-it-works" },
  { labelKey: "nav.demo", href: "/demo" },
  {
    labelKey: "nav.forYou",
    href: "/for-you",
    children: [
      { labelKey: "nav.forYouPersonal", href: "/for-you" },
      { labelKey: "nav.forOrganizations", href: "/for-organizations" },
    ]
  },
  {
    labelKey: "nav.product",
    href: "#",
    children: [
      { labelKey: "nav.productRowi", href: "/product/rowi" },
      { labelKey: "nav.productAffinity", href: "/product/affinity" },
      { labelKey: "nav.productInsights", href: "/product/insights" },
      { labelKey: "nav.productIntegrations", href: "/product/integrations" },
    ]
  },
  { labelKey: "nav.pricing", href: "/pricing" },
  { labelKey: "nav.contact", href: "/contact" },
];

export default function PublicNavbar() {
  const { t, lang, setLang } = useI18n();
  const { resolvedMode, setMode } = useTheme();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isLoggedIn = status === "authenticated" && !!session?.user;

  const toggleTheme = () => {
    setMode(resolvedMode === "dark" ? "light" : "dark");
  };

  return (
    <header className="fixed left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-zinc-800" style={{ top: "var(--banner-height, 0px)" }}>
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/rowi-logo.png" alt="Rowi" width={40} height={40} className="rounded-lg" />
          <span className="font-bold text-xl rowi-gradient-text">Rowi</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <div key={item.href} className="relative" onMouseEnter={() => item.children && setOpenDropdown(item.href)} onMouseLeave={() => setOpenDropdown(null)}>
              <Link
                href={item.children ? "#" : item.href}
                className={"px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 " + (pathname === item.href ? "text-[var(--rowi-g2)]" : "text-gray-600 dark:text-gray-400 hover:text-[var(--rowi-g2)]")}
                onClick={(e) => item.children && e.preventDefault()}
              >
                {t(item.labelKey, item.labelKey)}
                {item.children && <ChevronDown className="w-4 h-4" />}
              </Link>
              
              {/* Dropdown */}
              <AnimatePresence>
                {item.children && openDropdown === item.href && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-800 py-2 overflow-hidden"
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-[var(--rowi-g2)] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        {t(child.labelKey, child.labelKey)}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label={resolvedMode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {resolvedMode === "dark" ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-sm"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{lang.toUpperCase()}</span>
          </button>

          {/* Auth Buttons */}
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rowi-btn-primary px-4 py-2 text-sm flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              {t("nav.dashboard", "Dashboard")}
            </Link>
          ) : (
            <>
              <Link href="/hub/login" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[var(--rowi-g2)] transition-colors">
                {t("nav.login", "Iniciar sesión")}
              </Link>
              <Link href="/register" className="rowi-btn-primary px-4 py-2 text-sm hidden sm:block">
                {t("nav.register", "Comenzar gratis")}
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.children ? "#" : item.href}
                    onClick={() => !item.children && setMobileMenuOpen(false)}
                    className={"block px-4 py-3 rounded-lg font-medium " + (pathname === item.href ? "text-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10" : "text-gray-600 dark:text-gray-400")}
                  >
                    {t(item.labelKey, item.labelKey)}
                  </Link>
                  {item.children && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--rowi-g2)]"
                        >
                          {t(child.labelKey, child.labelKey)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-center rowi-btn-primary"
                  >
                    {t("nav.dashboard", "Dashboard")}
                  </Link>
                ) : (
                  <Link href="/hub/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                    {t("nav.login", "Iniciar sesión")}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
