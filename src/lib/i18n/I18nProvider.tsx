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
  ready: boolean;
};

const I18nContext = createContext<I18nContextType>({
  lang: "es",
  t: (key) => key,
  setLang: () => {},
  loading: false,
  ready: false,
});

/** Convierte una key tipo "nav.dashboard" → "Dashboard" como último fallback */
function humanizeKey(key: string): string {
  return key
    .split(".")
    .pop()!
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  const [dict, setDict] = useState<Translations>(localDicts.es);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
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
    const detectedLang =
      stored || (supportedLangs.includes(browserLang as Lang) ? browserLang : "es");
    const safe: Lang = supportedLangs.includes(detectedLang as Lang)
      ? (detectedLang as Lang)
      : "es";

    // Aplicar inmediatamente el diccionario local
    setDict(localDicts[safe]);
    setLangState(safe);
    setReady(true);
    document.documentElement.setAttribute("data-lang", safe);

    // Luego intentar cargar desde API
    loadFromAPI(safe);
  }, []);

  /* =========================================================
     🛰️ Sincronizar con eventos externos (legacy compatibility)
     ---------------------------------------------------------
     Si algún wrapper antiguo dispara `rowi:lang-changed`,
     adoptamos el cambio sin escribir doble el localStorage.
  ========================================================== */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      const supportedLangs: Lang[] = ["es", "en", "pt", "it"];
      if (detail && supportedLangs.includes(detail as Lang) && detail !== lang) {
        const next = detail as Lang;
        setDict(localDicts[next]);
        setLangState(next);
        document.documentElement.setAttribute("data-lang", next);
        loadFromAPI(next);
      }
    };
    window.addEventListener("rowi:lang-changed", handler);
    return () => window.removeEventListener("rowi:lang-changed", handler);
  }, [lang]);

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
        setDict((prev) => ({ ...prev, ...apiDict }));
      }
    } catch (err) {
      console.warn("⚠️ No se pudieron cargar traducciones de API, usando locales");
    }
  }

  /* =========================================================
     🔄 Cambiar idioma (única función que escribe en localStorage)
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

    // Notificar globalmente (wrappers legacy escuchan esto)
    window.dispatchEvent(new CustomEvent("rowi:lang-changed", { detail: next }));

    // Luego intentar cargar desde API
    await loadFromAPI(next);
    setLoading(false);
  }

  /* =========================================================
     🔠 Función traductora con fallback en cadena
     ---------------------------------------------------------
     1. Buscar en el diccionario del idioma actual (local + API)
     2. Si no existe, buscar en otros idiomas (es → en → pt → it)
     3. Si tampoco, usar el fallback que pasó el caller
     4. Como último recurso, humanizar la key (nav.dashboard → Dashboard)
  ========================================================== */
  function t(key: string, fallback?: string) {
    if (!key) return fallback || "";

    // 1. Diccionario actual
    if (dict[key]) return dict[key];

    // 2. Fallback a otros idiomas (en orden de preferencia)
    const fallbackLangs: Lang[] =
      lang === "es" ? ["en", "pt", "it"] : ["es", "en", "pt", "it"];
    for (const l of fallbackLangs) {
      if (l === lang) continue;
      const otherDict = localDicts[l];
      if (otherDict && otherDict[key]) return otherDict[key];
    }

    // 3. Caller fallback
    if (fallback) return fallback;

    // 4. Último recurso: humanizar la key
    return humanizeKey(key);
  }

  return (
    <I18nContext.Provider value={{ lang, t, setLang, loading, ready }}>
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
