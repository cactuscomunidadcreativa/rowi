"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   🌐 Idiomas disponibles
   ---------------------------------------------------------
   Estos idiomas tienen archivos de traducción en:
   /src/lib/i18n/locales/{code}.json

   Para agregar más idiomas, usa el admin de traducciones:
   /hub/admin/translations -> "Agregar Idioma"
========================================================= */
const AVAILABLE_LANGS = [
  { code: "es", label: "ES", name: "Español" },
  { code: "en", label: "EN", name: "English" },
  { code: "pt", label: "PT", name: "Português" },
  { code: "it", label: "IT", name: "Italiano" },
] as const;

export type SupportedLang = "es" | "en" | "pt" | "it" | "fr" | "de";

export default function LangToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-1 text-xs relative z-[60]">
      <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as SupportedLang)}
        title={lang === "es" ? "Cambiar idioma" : "Change language"}
        className="
          rounded-md border border-gray-300 dark:border-zinc-700
          bg-white/80 dark:bg-zinc-900/80
          px-2 py-[4px]
          text-[12px] font-medium
          text-gray-700 dark:text-gray-100
          hover:border-[var(--rowi-g2)] dark:hover:border-[var(--rowi-g2)]
          focus:ring-1 focus:ring-[var(--rowi-g2)] dark:focus:ring-[var(--rowi-g2)]
          focus:outline-none
          transition-all duration-150
          shadow-sm cursor-pointer
        "
      >
        {AVAILABLE_LANGS.map((l) => (
          <option
            key={l.code}
            value={l.code}
            className="bg-white text-gray-800 dark:bg-zinc-900 dark:text-gray-100"
          >
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
   📋 Exportar lista de idiomas para uso en otros componentes
========================================================= */
export { AVAILABLE_LANGS };
