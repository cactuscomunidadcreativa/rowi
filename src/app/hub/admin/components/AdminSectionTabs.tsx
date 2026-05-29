"use client";

/**
 * 🗂️ AdminSectionTabs — barra de tabs para navegar entre las sub-páginas de
 * una misma sección del admin (p.ej. EQ, Vital Signs, Organizations) sin
 * depender del sidebar. Resalta el tab activo según la ruta actual.
 *
 * Uso:
 *   <AdminSectionTabs tabs={[
 *     { href: "/hub/admin/eq/dashboard", es: "Resumen", en: "Dashboard" },
 *     ...
 *   ]} />
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";

export interface AdminTab {
  href: string;
  es: string;
  en: string;
}

export default function AdminSectionTabs({ tabs }: { tabs: AdminTab[] }) {
  const { locale } = useI18n();
  const pathname = usePathname();
  const isEN = locale === "en";

  return (
    <nav className="flex flex-wrap items-center gap-1 mb-6 border-b border-gray-200 dark:border-zinc-800">
      {tabs.map((tab) => {
        // Activo si la ruta actual coincide exacta o es una sub-ruta del tab.
        // Para el tab "padre" (más corto) exigimos coincidencia exacta para no
        // marcarlo activo en todas las sub-rutas.
        const isParent = tabs.every((o) => o === tab || !o.href.startsWith(tab.href + "/"));
        const active = isParent
          ? pathname === tab.href
          : pathname === tab.href || pathname?.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? "border-violet-500 text-violet-600 dark:text-violet-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {isEN ? tab.en : tab.es}
          </Link>
        );
      })}
    </nav>
  );
}
