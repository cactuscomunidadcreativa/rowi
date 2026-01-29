"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const LANGS = [
  { code: "es", label: "ES", name: "Español" },
  { code: "en", label: "EN", name: "English" },
] as const;

export default function LangToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-1 text-xs relative z-[60]">
      <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as "es" | "en")}
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
        {LANGS.map((l) => (
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
