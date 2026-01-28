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
      <div className="fixed top-3 right-3 z-40 md:hidden">
        <ThemeToggle />
      </div>

      {/* 🔹 Contenido principal */}
      <div
        className="min-h-screen transition-colors 
                   bg-[var(--rowi-bg)] text-[var(--rowi-fg)] 
                   dark:bg-[var(--rowi-bg-night)] dark:text-[var(--rowi-fg-night)]"
      >
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
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
            success:
              "bg-[var(--rowi-blue-day)] text-white dark:bg-[var(--rowi-blue-night)]",
            error:
              "bg-[var(--rowi-pink-day)] text-white dark:bg-[var(--rowi-pink-night)]",
            info:
              "bg-[var(--rowi-blue-day)] text-white dark:bg-[var(--rowi-blue-night)]",
          },
        }}
      />
    </Providers>
  );
}