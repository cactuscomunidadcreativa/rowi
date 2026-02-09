"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import { Shield, Lock } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

const translations = {
  es: {
    loading: "Cargando...",
    restricted: "Acceso Restringido",
    restrictedDesc: "El Demo de Benchmark de Teleperformance está disponible exclusivamente para socios autorizados de Six Seconds.",
    currentEmail: "Email actual",
    notSignedIn: "No autenticado",
    required: "Requerido: email @6seconds.org",
    backToAdmin: "Volver a Admin",
  },
  en: {
    loading: "Loading...",
    restricted: "Access Restricted",
    restrictedDesc: "The Teleperformance Benchmark Demo is exclusively available to authorized Six Seconds partners.",
    currentEmail: "Current email",
    notSignedIn: "Not signed in",
    required: "Required: @6seconds.org email",
    backToAdmin: "Back to Admin",
  },
};

export default function TPLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--rowi-muted)]">{t.loading}</p>
        </div>
      </div>
    );
  }

  const email = session?.user?.email || "";
  const isAuthorized =
    email.endsWith("@6seconds.org") ||
    email.endsWith("@cactuscomunidadcreativa.com") ||
    email === "eduardo@cactuscomunidadcreativa.com";

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">{t.restricted}</h2>
          <p className="text-[var(--rowi-muted)] mb-2">{t.restrictedDesc}</p>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">
            {t.currentEmail}: <span className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">{email || t.notSignedIn}</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--rowi-muted)] mb-6">
            <Shield className="w-4 h-4 text-purple-500" />
            <span>{t.required}</span>
          </div>
          <Link
            href="/hub/admin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {t.backToAdmin}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
