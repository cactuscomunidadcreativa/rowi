"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/react";

/* =========================================================
   🌙☀️ Rowi Theme Toggle — con traducciones integradas
========================================================= */
export default function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("rowi.theme") as "dark" | "light") || "dark";
    applyTheme(stored);
  }, []);

  function applyTheme(next: "dark" | "light") {
    setTheme(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.setAttribute("data-theme", next);
    localStorage.setItem("rowi.theme", next);
    // Evento global por si otros componentes necesitan reaccionar
    window.dispatchEvent(new CustomEvent("rowi:theme-changed", { detail: next }));
  }

  const label =
    theme === "dark"
      ? t("theme.light") || "☀️ Modo claro"
      : t("theme.dark") || "🌙 Modo oscuro";

  return (
    <button
      onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
      title={t("theme.toggle") || "Cambiar tema"}
      className={`inline-flex items-center gap-2 rounded-md border border-white/20 
                  bg-white/10 px-3 py-1.5 text-xs hover:border-white/40 transition-colors`}
    >
      <span>{label}</span>
    </button>
  );
}