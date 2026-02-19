"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";

// Importar traducciones locales como fallback
import esLocale from "./locales/es.json";
import enLocale from "./locales/en.json";
import ptLocale from "./locales/pt.json";
import itLocale from "./locales/it.json";

type Lang = "es" | "en" | "pt" | "it";
type Translations = Record<string, string>;

// Diccionarios locales como fallback
const localDicts: Record<Lang, Translations> = {
  es: esLocale as Translations,
  en: enLocale as Translations,
  pt: ptLocale as Translations,
  it: itLocale as Translations,
};

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
  const [lang, setLangState] = useState<Lang>("es");
  const [dict, setDict] = useState<Translations>(localDicts.es);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  /* =========================================================
     🌐 Inicializar idioma guardado o del navegador
  ========================================================== */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const stored = localStorage.getItem("rowi.lang") as Lang | null;
    const browserLang = navigator.language.slice(0, 2);
    const supportedLangs: Lang[] = ["es", "en", "pt", "it"];
    const detectedLang = stored || (supportedLangs.includes(browserLang as Lang) ? browserLang : "es");
    const safe: Lang = supportedLangs.includes(detectedLang as Lang) ? (detectedLang as Lang) : "es";

    // Aplicar inmediatamente el diccionario local
    setDict(localDicts[safe]);
    setLangState(safe);
    document.documentElement.setAttribute("data-lang", safe);

    // Luego intentar cargar desde API
    loadFromAPI(safe);
  }, []);

  /* =========================================================
     📦 Cargar traducciones adicionales desde API
  ========================================================== */
  async function loadFromAPI(targetLang: Lang) {
    try {
      const tenant =
        document.documentElement.getAttribute("data-tenant") || "six-seconds-global";
      const res = await fetch(
        `/api/hub/translations?format=list&lang=${targetLang}&tenantId=${tenant}`
      );
      const data = await res.json();

      if (data?.ok && Array.isArray(data.rows) && data.rows.length > 0) {
        const apiDict: Translations = {};
        for (const r of data.rows) {
          const full = r.ns ? `${r.ns}.${r.key}` : r.key;
          apiDict[full] = r[targetLang] || r.es || r.en || full;
        }
        // Combinar: local como base, API sobrescribe
        setDict(prev => ({ ...prev, ...apiDict }));
      }
    } catch (err) {
      console.warn("⚠️ No se pudieron cargar traducciones de API, usando locales");
    }
  }

  /* =========================================================
     🔄 Cambiar idioma
  ========================================================== */
  async function setLang(next: Lang) {
    if (next === lang) return;
    setLoading(true);

    // Aplicar inmediatamente el diccionario local
    const localDict = localDicts[next];
    setDict(localDict);
    setLangState(next);
    document.documentElement.setAttribute("data-lang", next);
    localStorage.setItem("rowi.lang", next);

    // Notificar globalmente
    window.dispatchEvent(
      new CustomEvent("rowi:lang-changed", { detail: next })
    );

    // Luego intentar cargar desde API
    await loadFromAPI(next);
    setLoading(false);
  }

  /* =========================================================
     🔠 Función traductora
  ========================================================== */
  function t(key: string, fallback?: string) {
    return dict[key] || fallback || key;
  }

  return (
    <I18nContext.Provider value={{ lang, t, setLang, loading }}>
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