"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";
import { useI18n } from "@/lib/i18n/react";

/* =========================================================
   🌍 LINKS PRINCIPALES DEL NAVBAR
   ---------------------------------------------------------
   Estos keys deben existir (o se crearán) en tu BD Prisma 
   bajo ns: "nav". Editables desde /hub/admin/translations.
========================================================= */
const LINKS = [
  { href: "/dashboard", key: "dashboard", fallback: "Dashboard" },
  { href: "/community", key: "community", fallback: "Comunidad" },
  { href: "/affinity",  key: "affinity",  fallback: "Afinidad" },
  { href: "/eco",       key: "eco",       fallback: "ECO" },
  { href: "/rowi",      key: "rowicoach", fallback: "Rowi Coach" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { data } = useSession();
  const { t, lang } = useI18n();
  const isLogged = !!data?.user?.email;
  const userInitial = (data?.user?.name || data?.user?.email || "U")
    .slice(0, 1)
    .toUpperCase();

  // 🔁 Control del menú usuario
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("#rowi-user-menu")) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <header className="rowi-header backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 shadow-sm border-b border-white/10">
      <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between gap-3">
        {/* === Marca === */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/rowi-logo.png" alt="Rowi" className="h-6 w-6" />
          <span className="font-semibold">Rowi SIA</span>
        </Link>

        {/* === Navegación principal === */}
        <nav className="hidden md:flex items-center gap-2 text-sm">
          {LINKS.map((l) => {
            const active = pathname?.startsWith(l.href);
            const label = t(`nav.${l.key}`) || l.fallback;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={active ? "rowi-link-active" : "rowi-link"}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* === Acciones derechas === */}
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />

          {!isLogged ? (
            <button onClick={() => signIn()} className="rowi-btn">
              {t("nav.signin") || "Iniciar sesión"}
            </button>
          ) : (
            <div id="rowi-user-menu" className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="rowi-chip flex items-center gap-2"
                title={t("nav.profile") || "Mi perfil"}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
                  {userInitial}
                </span>
                <span className="hidden sm:inline">
                  {data?.user?.name || data?.user?.email}
                </span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-48 rowi-card py-2 border border-white/10 shadow-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
                  <MenuLink href="/me" onClick={() => setOpen(false)}>
                    {t("nav.profile.view") || "Ver perfil"}
                  </MenuLink>
                  <MenuLink href="/settings/profile" onClick={() => setOpen(false)}>
                    {t("nav.profile.edit") || "Editar perfil"}
                  </MenuLink>
                  <MenuLink href="/settings/invites" onClick={() => setOpen(false)}>
                    {t("nav.profile.invites") || "Invitaciones"}
                  </MenuLink>
                  <hr className="my-2 border-white/20" />
                  <button
                    className="rowi-btn w-full text-left"
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                  >
                    {t("nav.signout") || "Salir"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   🔗 Subcomponente del menú
========================================================= */
function MenuLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className="block px-3 py-1.5 text-sm hover:opacity-100 transition-opacity"
      style={{ opacity: 0.9 }}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}