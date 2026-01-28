"use client";

import { useState, useEffect } from "react";

const LANGS = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
  { code: "it", label: "IT" },
] as const;

export default function LangToggle() {
  const [lang, setLang] = useState<"es" | "en" | "pt" | "it">("es");

  useEffect(() => {
    // 🌍 Detectar idioma actual
    const stored =
      (localStorage.getItem("rowi.lang") as any) ||
      navigator.language.slice(0, 2) ||
      "es";
    const safe = LANGS.some((l) => l.code === stored) ? stored : "es";
    setLang(safe as any);
    document.documentElement.setAttribute("lang", safe);
    document.documentElement.setAttribute("data-lang", safe);
  }, []);

  function applyLang(next: "es" | "en" | "pt" | "it") {
    if (next === lang) return;
    setLang(next);
    localStorage.setItem("rowi.lang", next);
    document.documentElement.setAttribute("lang", next);
    document.documentElement.setAttribute("data-lang", next);

    // 🔁 Avisar a toda la app sin recargar
    window.dispatchEvent(new CustomEvent("rowi:lang-changed", { detail: next }));
  }

  return (
    <div className="flex items-center gap-1 text-xs relative z-[60]">
      <select
        value={lang}
        onChange={(e) => applyLang(e.target.value as any)}
        title="Cambiar idioma"
        className="
          rounded-md border border-gray-300 dark:border-gray-700
          bg-white/80 dark:bg-gray-900/80
          px-2 py-[4px]
          text-[12px] font-medium
          text-gray-700 dark:text-gray-100
          hover:border-blue-400 dark:hover:border-blue-500
          focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500
          transition-all duration-150
          shadow-sm cursor-pointer
        "
      >
        {LANGS.map((l) => (
          <option
            key={l.code}
            value={l.code}
            className="bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100"
          >
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}