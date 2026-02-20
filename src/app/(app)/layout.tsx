"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import NavBar from "@/components/shared/NavBar";
import { UserContextProvider } from "@/contexts/UserContextProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  // Mientras carga la sesión, mostrar loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (status === "unauthenticated") {
    redirect("/auth/login");
  }

  return (
    <UserContextProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 transition-colors">
        <NavBar />
        <main className="flex-1" style={{ paddingTop: "calc(4rem + var(--banner-height, 0px))" }}>{children}</main>
      </div>
    </UserContextProvider>
  );
}
