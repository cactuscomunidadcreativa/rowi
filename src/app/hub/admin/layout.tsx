"use client";
import { ReactNode, useEffect, useState, useRef, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import UserStatusBar from "@/components/shared/UserStatusBar";
import { defaultTokens, tokensToCSS } from "@/lib/theme/tokens";

/**
 * =========================================================
 * 🧩 HubAdminLayout v2
 * Incluye:
 * - Sidebar lateral
 * - Barra superior de usuario (rol, plan, IA) con auto-hide
 * - Área principal flexible
 * - Inyección de variables CSS del tema
 * =========================================================
 */
export default function HubAdminLayout({ children }: { children: ReactNode }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

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

  // Handler para scroll con auto-hide
  const handleScroll = useCallback(() => {
    if (!mainRef.current) return;
    const currentScrollY = mainRef.current.scrollTop;
    const scrollingDown = currentScrollY > lastScrollY.current;
    const scrolledPastThreshold = currentScrollY > 60;

    if (scrollingDown && scrolledPastThreshold && !isHovering) {
      setIsHeaderVisible(false);
    } else if (!scrollingDown || currentScrollY < 60) {
      setIsHeaderVisible(true);
    }
    lastScrollY.current = currentScrollY;
  }, [isHovering]);

  // Configurar listener de scroll
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    mainEl.addEventListener("scroll", onScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", onScroll);
  }, [handleScroll]);

  return (
    <div className="flex w-full pt-16 bg-[var(--rowi-background)] text-[var(--rowi-foreground)] transition-colors duration-300">
      {/* Sidebar lateral fijo - posición fixed, debajo del NavBar global (top-16 = 64px) */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-[var(--rowi-border)] bg-[var(--rowi-card)]/70 backdrop-blur-sm z-40 overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Contenido principal - con margin-left para compensar sidebar fijo */}
      <section className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] ml-64">
        {/* Barra superior del usuario con auto-hide - sticky relativo al contenedor */}
        <header
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`
            sticky top-16 z-30
            bg-[var(--rowi-card)]/80 backdrop-blur-md
            border-b border-[var(--rowi-primary)]/20
            transition-transform duration-300 ease-in-out
            ${isHeaderVisible || isHovering ? "translate-y-0" : "-translate-y-full"}
          `}
        >
          <UserStatusBar />
        </header>

        {/* Área de contenido scrollable */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto p-6 bg-[var(--rowi-background)]"
        >
          {children}
        </main>
      </section>
    </div>
  );
}
