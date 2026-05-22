"use client";

import Providers from "../components/shared/Providers";
import ThemeToggle from "../components/shared/ThemeToggle";
import NavBar from "../components/shared/NavBar";
import RowiCoach from "../components/rowi/RowiCoach";
import { Toaster } from "sonner";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {/* 🔹 Barra de navegación global */}
      <NavBar />

      {/* 🌙 Botón de cambio de tema (visible solo en mobile) */}
      <div className="fixed right-3 z-40 md:hidden" style={{ top: "calc(0.75rem + var(--banner-height, 0px))" }}>
        <ThemeToggle />
      </div>

      {/* 🔹 Contenido principal — padding-top compensa banner pre-launch + navbar fixed */}
      <div className="min-h-screen transition-colors bg-[var(--rowi-bg)] text-[var(--rowi-fg)]">
        <main
          className="mx-auto max-w-6xl px-4 pb-6"
          style={{ paddingTop: "calc(4rem + var(--banner-height, 0px) + 1.5rem)" }}
        >
          {children}
        </main>
      </div>

      {/* 💬 Chat flotante Rowi Coach (disponible globalmente) */}
      <RowiCoach />

      {/* 🔔 Notificaciones globales Rowi */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: "0.75rem",
            background: "var(--rowi-card)",
            color: "var(--rowi-fg)",
            border: "1px solid var(--rowi-card-border)",
            fontFamily: "'Poppins', sans-serif",
          },
          classNames: {
            success: "bg-[var(--rowi-g2)] text-white",
            error: "bg-[var(--rowi-g1)] text-white",
            info: "bg-[var(--rowi-g2)] text-white",
          },
        }}
      />
    </Providers>
  );
}