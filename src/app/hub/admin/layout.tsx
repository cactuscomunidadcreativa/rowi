"use client";
import { ReactNode, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import UserStatusBar from "@/components/shared/UserStatusBar";
import { defaultTokens, tokensToCSS } from "@/lib/theme/tokens";

/**
 * =========================================================
 * 🧩 HubAdminLayout v2
 * Incluye:
 * - Sidebar lateral
 * - Barra superior de usuario (rol, plan, IA)
 * - Área principal flexible
 * - Inyección de variables CSS del tema
 * =========================================================
 */
export default function HubAdminLayout({ children }: { children: ReactNode }) {
  // Inyectar variables CSS del tema por defecto
  useEffect(() => {
    const css = tokensToCSS(defaultTokens);
    const styleId = "rowi-admin-theme-vars";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `:root {\n  ${css}\n}`;

    return () => {
      // Cleanup on unmount
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-[var(--rowi-background)] text-[var(--rowi-foreground)] transition-colors duration-300">
      {/* Sidebar lateral fijo */}
      <aside className="flex-none w-64 border-r border-[var(--rowi-border)] bg-[var(--rowi-card)]/70 backdrop-blur-sm">
        <Sidebar />
      </aside>

      {/* Contenido principal */}
      <section className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Barra superior del usuario */}
        <header className="sticky top-0 z-30 bg-[var(--rowi-card)]/80 backdrop-blur-md border-b border-[var(--rowi-primary)]/20">
          <UserStatusBar />
        </header>

        {/* Área de contenido scrollable */}
        <main className="flex-1 overflow-y-auto p-6 bg-[var(--rowi-background)]">
          {children}
        </main>
      </section>
    </div>
  );
}
