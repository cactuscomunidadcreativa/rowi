"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Microscope, FileSearch, Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n/react";
import ConsentGate from "@/components/shared/ConsentGate";

const NAV = [
  { href: "/research/cases", labelKey: "research.nav.cases", icon: FileSearch },
  { href: "/research/calibration", labelKey: "research.nav.calibration", icon: Activity },
];

export default function ResearchLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--rowi-card-border)] bg-[var(--rowi-card)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
              <Microscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--rowi-foreground)]">
                {t("research.title", "Research Lens · ROWIIA")}
              </h1>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("research.subtitle", "Refinamiento del modelo Emotional Budgeting. Acceso auditado.")}
              </p>
            </div>
          </div>
          <nav className="flex gap-2">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname?.startsWith(n.href);
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                      : "bg-[var(--rowi-card-elev)] text-[var(--rowi-foreground)] hover:opacity-80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(n.labelKey, n.href)}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto">
        <ConsentGate>{children}</ConsentGate>
      </main>
    </div>
  );
}
