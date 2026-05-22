"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import ConsentGate from "@/components/shared/ConsentGate";
import { UserContextProvider } from "@/contexts/UserContextProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { lang } = useI18n();

  // Mientras carga la sesión, mostrar loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="animate-pulse text-gray-500">{lang === "es" ? "Cargando..." : lang === "pt" ? "Carregando..." : lang === "it" ? "Caricamento..." : "Loading..."}</div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (status === "unauthenticated") {
    redirect("/signin");
  }

  // NavBar y padding-top del navbar se montan en ClientWrapper (global). Aquí
  // solo envolvemos en UserContextProvider + ConsentGate para las páginas (app).
  return (
    <UserContextProvider>
      <ConsentGate>{children}</ConsentGate>
    </UserContextProvider>
  );
}
