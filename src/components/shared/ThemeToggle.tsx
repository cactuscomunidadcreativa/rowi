"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   🌙☀️ Rowi Theme Toggle — conectado al ThemeProvider
========================================================= */
export default function ThemeToggle() {
  const { t } = useI18n();
  const { resolvedMode, setMode } = useTheme();

  const toggleTheme = () => {
    setMode(resolvedMode === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      title={resolvedMode === "dark"
        ? (t("theme.light") || "Cambiar a modo claro")
        : (t("theme.dark") || "Cambiar a modo oscuro")}
      className="inline-flex items-center justify-center gap-2 rounded-lg p-2
                 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      aria-label={resolvedMode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {resolvedMode === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
}