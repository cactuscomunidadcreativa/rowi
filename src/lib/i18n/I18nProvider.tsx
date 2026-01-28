"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Lang = "es" | "en" | "pt" | "it";
type Translations = Record<string, string>;

type I18nContextType = {
  lang: Lang;
  t: (key: string, fallback?: string) => string;
  setLang: (lang: Lang) => void;
  loading: boolean;
};

const I18nContext = createContext<I18nContextType>({
  lang: "es",
  t: (key) => key,
  setLang: () => {},
  loading: false,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");
  const [dict, setDict] = useState<Translations>({});
  const [loading, setLoading] = useState(false);

  /* =========================================================
     🌐 Inicializar idioma guardado o del navegador
  ========================================================== */
  useEffect(() => {
    const stored =
      (localStorage.getItem("rowi.lang") as Lang) ||
      (navigator.language.slice(0, 2) as Lang) ||
      "es";
    const safe: Lang = ["es", "en", "pt", "it"].includes(stored)
      ? stored
      : "es";
    applyLang(safe);
  }, []);

  /* =========================================================
     📦 Cargar diccionario desde la API principal
  ========================================================== */
  async function applyLang(next: Lang) {
    if (next === lang) return;
    setLoading(true);
    try {
      const tenant =
        document.documentElement.getAttribute("data-tenant") || "rowi-master";
      const res = await fetch(
        `/api/hub/translations?format=list&lang=${next}&tenantId=${tenant}`
      );
      const data = await res.json();

      if (data?.ok && Array.isArray(data.rows)) {
        const rows = data.rows;
        const dict: Translations = {};

        for (const r of rows) {
          const full = r.ns ? `${r.ns}.${r.key}` : r.key;
          dict[full] =
            r[next] || r.es || r.en || r.pt || r.it || full;
        }

        setDict(dict);
        setLang(next);
        document.documentElement.setAttribute("data-lang", next);
        localStorage.setItem("rowi.lang", next);

        // 🔁 Notificar globalmente al sistema
        window.dispatchEvent(
          new CustomEvent("rowi:lang-changed", { detail: next })
        );
      }
    } catch (err) {
      console.error("❌ Error cargando traducciones:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     🔠 Función traductora
  ========================================================== */
  function t(key: string, fallback?: string) {
    return dict[key] || fallback || key;
  }

  return (
    <I18nContext.Provider value={{ lang, t, setLang: applyLang, loading }}>
      {children}
    </I18nContext.Provider>
  );
}

/* =========================================================
   🧩 Hook de consumo rápido
========================================================= */
export function useI18n() {
  return useContext(I18nContext);
}